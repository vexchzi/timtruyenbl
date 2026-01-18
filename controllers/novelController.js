/**
 * Novel Controller - Xử lý các API endpoints liên quan đến truyện
 * 
 * Endpoints:
 * - POST /api/recommend - Gợi ý truyện từ URL
 * - GET /api/novels - Lấy danh sách truyện
 * - GET /api/novels/:id - Chi tiết truyện
 * - GET /api/tags - Lấy danh sách tags
 * - GET /api/stats - Thống kê
 */

const { Novel, TagDictionary } = require('../models');
const { crawlWattpad, normalizeWattpadUrl } = require('../services/crawler');
const { crawlSinglePost: crawlWordpress } = require('../services/wordpressCrawler');
const { crawlNovelDetail: crawlAtlantis, normalizeAtlantisUrl } = require('../services/atlantisCrawler');
const { normalizeTags, normalizeTagsDetailed, normalizeString } = require('../utils/tagNormalizer');
const { findSimilarNovels, getPopularTags, getStats } = require('../services/recommender');

// Disallow Bách Hợp / GL content across the app
const BACHHOP_KEYWORDS = [
  'bach hop',
  'bhtt',
  'girl love',
  'girls love',
  'girllove',
  'gl',
  'yuri',
  'lesbian',
  '百合',
];

const NGONTINH_KEYWORDS = [
  'ngon tinh',
  'ngontinh',
  'bg',
  'nam nu',
  'nam-nu',
  'nu nam',
  'nu-nam',
  'nu x nam',
  'nam x nu',
];

function tokenizeNormalized(str) {
  const norm = normalizeString(str);
  if (!norm) return [];
  return norm.split(/\s+/).filter(Boolean);
}

function hasWholePhrase(haystackNorm, phraseNorm) {
  if (!haystackNorm || !phraseNorm) return false;
  const re = new RegExp(`(^|\\s)${phraseNorm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(\\s|$)`, 'i');
  return re.test(haystackNorm);
}

function isBachHopContent({ title = '', description = '', rawTags = [], standardTags = [] }) {
  const combinedNorm = normalizeString(`${title} ${description} ${(rawTags || []).join(' ')} ${(standardTags || []).join(' ')}`);
  const tokens = new Set(tokenizeNormalized(combinedNorm));
  const rawNorm = normalizeString((rawTags || []).join(' '));
  const stdNorm = normalizeString((standardTags || []).join(' '));

  // explicit standard tag
  if ((standardTags || []).some(t => normalizeString(t) === 'bach hop')) return true;

  for (const kw of BACHHOP_KEYWORDS) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;

    if (!kwNorm.includes(' ')) {
      if (tokens.has(kwNorm)) return true;
      continue;
    }

    if (hasWholePhrase(combinedNorm, kwNorm) || hasWholePhrase(rawNorm, kwNorm) || hasWholePhrase(stdNorm, kwNorm)) {
      return true;
    }
  }

  return false;
}

function isNgonTinhContent({ title = '', description = '', rawTags = [], standardTags = [] }) {
  const combinedNorm = normalizeString(`${title} ${description} ${(rawTags || []).join(' ')} ${(standardTags || []).join(' ')}`);
  const tokens = new Set(tokenizeNormalized(combinedNorm));
  const rawNorm = normalizeString((rawTags || []).join(' '));
  const stdNorm = normalizeString((standardTags || []).join(' '));

  // explicit standard tag
  if ((standardTags || []).some(t => normalizeString(t) === 'ngon tinh')) return true;

  for (const kw of NGONTINH_KEYWORDS) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;

    if (!kwNorm.includes(' ')) {
      if (tokens.has(kwNorm)) return true;
      continue;
    }

    if (hasWholePhrase(combinedNorm, kwNorm) || hasWholePhrase(rawNorm, kwNorm) || hasWholePhrase(stdNorm, kwNorm)) {
      return true;
    }
  }

  return false;
}

/**
 * POST /api/recommend
 * 
 * Main API: Nhận URL, crawl/lookup, gợi ý truyện tương tự
 * 
 * Body: { url: "https://wattpad.com/story/..." }
 * Response: { sourceNovel: {...}, recommendations: [...] }
 * 
 * Workflow (Crowdsourcing):
 * 1. Check URL trong DB
 * 2. Nếu CÓ: Lấy từ DB | Nếu KHÔNG: Crawl + Normalize + Lưu DB
 * 3. Tìm truyện tương tự
 * 4. Trả về kết quả
 */
async function recommend(req, res) {
  const startTime = Date.now();
  
  try {
    const { url } = req.body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        message: 'Vui lòng cung cấp URL truyện'
      });
    }

    // Detect source type
    const isWattpad = url.includes('wattpad.com');
    const isWordpress = url.includes('wordpress.com') || url.includes('.wordpress.');
    const isAtlantis = url.includes('atlantisviendong.com');

    // Validate URL format
    if (!isWattpad && !isWordpress && !isAtlantis) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL',
        message: 'Chỉ hỗ trợ URL từ Wattpad, WordPress hoặc Atlantis Viễn Đông'
      });
    }

    let normalizedUrl;
    if (isWattpad) {
      normalizedUrl = normalizeWattpadUrl(url);
    } else if (isAtlantis) {
      normalizedUrl = normalizeAtlantisUrl(url);
    } else {
      normalizedUrl = url.split('?')[0].trim();
    }
    
    const sourceName = isWattpad ? 'Wattpad' : (isAtlantis ? 'Atlantis' : 'WordPress');
    console.log(`[API] Recommend request for ${sourceName}: ${normalizedUrl}`);

    let sourceNovel = null;
    let isNewNovel = false;

    // ============== B1 & B2: Check DB hoặc Crawl ==============
    
    // Tìm trong DB trước (nhanh hơn crawl)
    sourceNovel = await Novel.findOne({ originalLink: normalizedUrl }).lean();

    if (sourceNovel) {
      console.log(`[API] Found in DB: "${sourceNovel.title}"`);
    } else {
      // Không có trong DB -> Crawl mới
      console.log(`[API] Not in DB, crawling from ${sourceName}...`);
      
      let crawledData;
      if (isWattpad) {
        crawledData = await crawlWattpad(normalizedUrl);
      } else if (isAtlantis) {
        crawledData = await crawlAtlantis(normalizedUrl);
      } else {
        crawledData = await crawlWordpress(normalizedUrl);
      }
      
      if (!crawledData) {
        return res.status(404).json({
          success: false,
          error: 'Crawl failed',
          message: 'Không thể lấy thông tin truyện. Vui lòng kiểm tra URL.'
        });
      }

      // Normalize tags
      const standardTags = await normalizeTags(crawledData.rawTags);

      // Disallow bách hợp / GL content
      if (isBachHopContent({
        title: crawledData.title,
        description: crawledData.description,
        rawTags: crawledData.rawTags,
        standardTags
      })) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported content',
          message: 'Không hỗ trợ crawl/lưu truyện thuộc thể loại Bách Hợp / GL.'
        });
      }

      if (isNgonTinhContent({
        title: crawledData.title,
        description: crawledData.description,
        rawTags: crawledData.rawTags,
        standardTags
      })) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported content',
          message: 'Không hỗ trợ crawl/lưu truyện thuộc thể loại Ngôn Tình (BG/HET).' 
        });
      }

      // Lưu vào DB (upsert để tránh race condition)
      const novelDoc = await Novel.findOneAndUpdate(
        { originalLink: normalizedUrl },
        {
          $set: {
            title: crawledData.title,
            author: crawledData.author,
            description: crawledData.description,
            coverImage: crawledData.coverImage,
            rawTags: crawledData.rawTags,
            standardTags: standardTags,
            source: crawledData.source || (isWattpad ? 'wattpad' : 'wordpress'),
            chapterCount: crawledData.chapterCount || 0,
            readCount: crawledData.readCount || 0,
            status: crawledData.status || 'unknown'
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { 
          upsert: true, 
          new: true,
          lean: true 
        }
      );

      sourceNovel = novelDoc;
      isNewNovel = true;
      console.log(`[API] Saved new novel: "${sourceNovel.title}"`);
    }

    // ============== B3: Tìm truyện tương tự ==============
    
    const recommendations = await findSimilarNovels(sourceNovel, {
      limit: 10,
      minMatchingTags: 1
    });

    // ============== B4: Trả về kết quả ==============
    
    const duration = Date.now() - startTime;
    console.log(`[API] Recommend completed in ${duration}ms`);

    return res.json({
      success: true,
      data: {
        sourceNovel: {
          _id: sourceNovel._id,
          title: sourceNovel.title,
          author: sourceNovel.author,
          description: sourceNovel.description,
          coverImage: sourceNovel.coverImage,
          originalLink: sourceNovel.originalLink,
          standardTags: sourceNovel.standardTags,
          rawTags: sourceNovel.rawTags,
          isNew: isNewNovel
        },
        recommendations,
        meta: {
          totalRecommendations: recommendations.length,
          processingTime: `${duration}ms`,
          source: isNewNovel ? 'crawled' : 'database'
        }
      }
    });

  } catch (error) {
    console.error('[API] Recommend error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
    });
  }
}

/**
 * GET /api/novels
 * 
 * Lấy danh sách truyện với filter và pagination
 * 
 * Query params:
 * - page: số trang (default: 1)
 * - limit: số item/trang (default: 20, max: 100)
 * - tags: filter theo tags (comma-separated)
 * - search: tìm kiếm theo title
 * - sort: sắp xếp (newest, oldest, popular)
 */
async function getNovelsList(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      tags,
      tag,
      search,
      source,
      noTags,
      hasTags,
      sort = 'newest'
    } = req.query;

    // Parse và validate params
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Filter by tags (comma-separated or single tag)
    const tagFilter = tags || tag;
    if (tagFilter) {
      const tagArray = tagFilter.split(',').map(t => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        query.standardTags = { $all: tagArray };
      }
    }

    // Filter novels without tags
    if (noTags === 'true' || noTags === '1') {
      query.$or = [
        { standardTags: { $exists: false } },
        { standardTags: { $size: 0 } }
      ];
    }

    // Filter novels with tags
    if (hasTags === 'true' || hasTags === '1') {
      query.standardTags = { ...query.standardTags, $exists: true, $not: { $size: 0 } };
    }

    // Filter by source
    if (source) {
      query.source = { $regex: source, $options: 'i' };
    }

    // Search by title (text search hoặc regex)
    if (search) {
      // If $or already used by noTags, use $and
      const searchCondition = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCondition }];
        delete query.$or;
      } else {
        query.$or = searchCondition;
      }
    }

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { readCount: -1 },
      title: { title: 1 }
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    // Execute query với Promise.all để parallel
    const [novels, total, sources] = await Promise.all([
      Novel.find(query)
        .select('title author coverImage originalLink standardTags rawTags description readCount chapterCount source createdAt')
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Novel.countDocuments(query),
      Novel.distinct('source')
    ]);

    return res.json({
      success: true,
      data: {
        novels,
        sources: sources.filter(Boolean).sort(),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          totalPages: Math.ceil(total / limitNum),
          hasMore: pageNum * limitNum < total
        }
      }
    });

  } catch (error) {
    console.error('[API] Get novels error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/novels/:id
 * 
 * Lấy chi tiết truyện theo ID
 */
async function getNovelById(req, res) {
  try {
    const { id } = req.params;

    const novel = await Novel.findById(id).lean();

    if (!novel) {
      return res.status(404).json({
        success: false,
        error: 'Novel not found',
        message: 'Không tìm thấy truyện'
      });
    }

    // Lấy recommendations cho truyện này
    const recommendations = await findSimilarNovels(novel, { limit: 5 });

    return res.json({
      success: true,
      data: {
        novel,
        recommendations
      }
    });

  } catch (error) {
    console.error('[API] Get novel by ID error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/novels/similar/:id
 * 
 * Lấy truyện tương tự theo ID
 */
async function getSimilarNovels(req, res) {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const novel = await Novel.findById(id).lean();

    if (!novel) {
      return res.status(404).json({
        success: false,
        error: 'Novel not found'
      });
    }

    const recommendations = await findSimilarNovels(novel, {
      limit: Math.min(50, parseInt(limit, 10) || 10)
    });

    return res.json({
      success: true,
      data: {
        source: {
          _id: novel._id,
          title: novel.title,
          standardTags: novel.standardTags
        },
        recommendations
      }
    });

  } catch (error) {
    console.error('[API] Get similar novels error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/tags
 * 
 * Lấy danh sách tags có trong database, phân loại theo category
 * Chỉ trả về tags thực sự có truyện
 */
async function getTags(req, res) {
  try {
    const { minCount = 1 } = req.query;

    // Lấy tất cả standardTags đang được sử dụng trong novels
    const usedTags = await Novel.aggregate([
      { $unwind: '$standardTags' },
      { $group: { _id: '$standardTags', count: { $sum: 1 } } },
      { $match: { count: { $gte: parseInt(minCount, 10) || 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Lấy thông tin category và description từ TagDictionary
    const tagDictEntries = await TagDictionary.find({
      standardTag: { $in: usedTags.map(t => t._id) }
    }).select('standardTag category priority description').lean();

    // Map tag -> category, description
    const tagCategoryMap = {};
    tagDictEntries.forEach(entry => {
      tagCategoryMap[entry.standardTag] = {
        category: entry.category || 'other',
        priority: entry.priority || 5,
        description: entry.description || ''
      };
    });

    // Tổ chức tags theo category
    const categorizedTags = {
      type: { name: 'Thể loại', tags: [] },
      ending: { name: 'Kết thúc', tags: [] },
      era: { name: 'Thời đại', tags: [] },
      world: { name: 'Thế giới', tags: [] },
      setting: { name: 'Bối cảnh', tags: [] },
      genre: { name: 'Phong cách', tags: [] },
      plot: { name: 'Xu hướng', tags: [] },
      relationship: { name: 'Mối quan hệ', tags: [] },
      couple: { name: 'Couple', tags: [] },
      character: { name: 'Nhân vật', tags: [] },
      content: { name: 'Nội dung', tags: [] },
      other: { name: 'Khác', tags: [] }
    };

    const bannedTags = new Set(['Bách Hợp', 'Ngôn Tình']);

    usedTags.forEach(tag => {
      if (bannedTags.has(tag._id)) return;
      const info = tagCategoryMap[tag._id] || { category: 'other', priority: 5, description: '' };
      const category = categorizedTags[info.category] || categorizedTags.other;
      
      category.tags.push({
        name: tag._id,
        count: tag.count,
        priority: info.priority,
        description: info.description || ''
      });
    });

    // Sort tags trong mỗi category theo priority và count
    Object.keys(categorizedTags).forEach(key => {
      categorizedTags[key].tags.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.count - a.count;
      });
    });

    // Lọc bỏ categories rỗng
    const filteredCategories = {};
    Object.entries(categorizedTags).forEach(([key, value]) => {
      if (value.tags.length > 0) {
        filteredCategories[key] = value;
      }
    });

    return res.json({
      success: true,
      data: {
        categories: filteredCategories,
        totalTags: usedTags.length,
        // Flat list cho backward compatibility
        popular: usedTags.slice(0, 50).map(t => ({ tag: t._id, count: t.count }))
      }
    });

  } catch (error) {
    console.error('[API] Get tags error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/stats
 * 
 * Lấy thống kê tổng quan
 */
async function getStatistics(req, res) {
  try {
    const stats = await getStats();

    // Thêm thông tin về top tags
    const topTags = await getPopularTags(10);

    return res.json({
      success: true,
      data: {
        ...stats,
        topTags
      }
    });

  } catch (error) {
    console.error('[API] Get stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/novels/batch-recommend
 * 
 * Gợi ý cho nhiều URLs cùng lúc (advanced)
 */
async function batchRecommend(req, res) {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required'
      });
    }

    // Limit batch size
    const limitedUrls = urls.slice(0, 5);

    const results = await Promise.all(
      limitedUrls.map(async (url) => {
        try {
          const normalizedUrl = normalizeWattpadUrl(url);
          let novel = await Novel.findOne({ originalLink: normalizedUrl }).lean();

          if (!novel) {
            return { url, success: false, reason: 'Not in database' };
          }

          const recommendations = await findSimilarNovels(novel, { limit: 5 });
          
          return {
            url,
            success: true,
            novel: {
              title: novel.title,
              standardTags: novel.standardTags
            },
            recommendationsCount: recommendations.length
          };
        } catch (err) {
          return { url, success: false, reason: err.message };
        }
      })
    );

    return res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('[API] Batch recommend error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  recommend,
  getNovelsList,
  getNovelById,
  getSimilarNovels,
  getTags,
  getStatistics,
  batchRecommend
};
