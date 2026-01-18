/**
 * Novel Routes - Định nghĩa API endpoints
 * 
 * Base path: /api
 */

const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');

/**
 * Rate limiter middleware đơn giản
 * - Giới hạn số request từ 1 IP
 * - Tránh spam API recommend (tốn tài nguyên crawl)
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 phút
const RATE_LIMIT_MAX_RECOMMEND = 10; // Max 10 recommend/phút
const RATE_LIMIT_MAX_GENERAL = 100;  // Max 100 request/phút

function rateLimiter(maxRequests) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}_${req.path}`;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      return next();
    }
    
    const record = requestCounts.get(key);
    
    // Reset nếu hết window
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + RATE_LIMIT_WINDOW;
      return next();
    }
    
    // Check limit
    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Bạn đã gửi quá nhiều request. Vui lòng đợi 1 phút.'
      });
    }
    
    record.count++;
    next();
  };
}

// Cleanup rate limit records định kỳ
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 60 * 1000);

// ============== ROUTES ==============

/**
 * @route   POST /api/recommend
 * @desc    Gợi ý truyện từ URL (Main API)
 * @access  Public
 * @body    { url: "https://wattpad.com/story/..." }
 */
router.post('/recommend', 
  rateLimiter(RATE_LIMIT_MAX_RECOMMEND),
  novelController.recommend
);

/**
 * @route   GET /api/novels
 * @desc    Lấy danh sách truyện (có filter, pagination)
 * @access  Public
 * @query   page, limit, tags, search, sort
 */
router.get('/novels',
  rateLimiter(RATE_LIMIT_MAX_GENERAL),
  novelController.getNovelsList
);

/**
 * @route   GET /api/novels/:id
 * @desc    Lấy chi tiết truyện theo ID
 * @access  Public
 */
router.get('/novels/:id',
  rateLimiter(RATE_LIMIT_MAX_GENERAL),
  novelController.getNovelById
);

/**
 * @route   GET /api/novels/:id/similar
 * @desc    Lấy truyện tương tự theo ID
 * @access  Public
 * @query   limit
 */
router.get('/novels/:id/similar',
  rateLimiter(RATE_LIMIT_MAX_GENERAL),
  novelController.getSimilarNovels
);

/**
 * @route   POST /api/novels/batch-recommend
 * @desc    Gợi ý cho nhiều URLs (advanced)
 * @access  Public
 * @body    { urls: ["url1", "url2", ...] }
 */
router.post('/novels/batch-recommend',
  rateLimiter(RATE_LIMIT_MAX_RECOMMEND),
  novelController.batchRecommend
);

/**
 * @route   GET /api/tags
 * @desc    Lấy danh sách tags
 * @access  Public
 * @query   limit
 */
router.get('/tags',
  rateLimiter(RATE_LIMIT_MAX_GENERAL),
  novelController.getTags
);

/**
 * @route   GET /api/stats
 * @desc    Lấy thống kê tổng quan
 * @access  Public
 */
router.get('/stats',
  rateLimiter(RATE_LIMIT_MAX_GENERAL),
  novelController.getStatistics
);

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @route   GET /api/image-proxy
 * @desc    Proxy ảnh để tránh CORS và cache
 * @access  Public
 * @query   url - URL ảnh gốc
 */
const axios = require('axios');

// Simple in-memory cache cho images
const imageCache = new Map();
const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ
const MAX_CACHE_SIZE = 500; // Giới hạn số ảnh cache

router.get('/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      // Chỉ cho phép http/https
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Check cache
    const cacheKey = url;
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < IMAGE_CACHE_TTL) {
      res.set('Content-Type', cached.contentType);
      res.set('Cache-Control', 'public, max-age=86400'); // Browser cache 1 ngày
      res.set('X-Cache', 'HIT');
      return res.send(cached.data);
    }

    // Fetch image
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': parsedUrl.origin
      },
      maxContentLength: 5 * 1024 * 1024, // Max 5MB
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    // Chỉ cache nếu là image
    if (contentType.startsWith('image/')) {
      // Cleanup cache nếu quá lớn
      if (imageCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = imageCache.keys().next().value;
        imageCache.delete(oldestKey);
      }
      
      imageCache.set(cacheKey, {
        data: response.data,
        contentType,
        timestamp: Date.now()
      });
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('X-Cache', 'MISS');
    res.send(response.data);

  } catch (error) {
    console.error('[ImageProxy] Error:', error.message);
    
    // Trả về placeholder image khi lỗi
    res.redirect('https://via.placeholder.com/300x400/1e293b/64748b?text=No+Image');
  }
});

module.exports = router;
