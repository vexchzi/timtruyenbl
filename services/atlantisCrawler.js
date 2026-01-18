/**
 * Atlantis Viễn Đông Crawler
 * URL: https://atlantisviendong.com
 * 
 * Crawl thông tin truyện đam mỹ từ Atlantis Viễn Đông
 */

const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
  },
  proxy: false
});

/**
 * Crawl chi tiết một truyện từ URL
 * @param {string} url - URL trang truyện (VD: https://atlantisviendong.com/truyen/ten-truyen)
 * @returns {Promise<Object|null>} - Thông tin truyện hoặc null nếu lỗi
 */
async function crawlNovelDetail(url) {
  try {
    console.log(`[Atlantis] Crawling: ${url}`);
    
    const response = await axiosInstance.get(url, {
      headers: { 'User-Agent': getRandomUserAgent() }
    });
    
    const $ = cheerio.load(response.data);
    
    // Lấy tiêu đề
    let title = $('h1.entry-title, h1.story-title, .novel-title h1, h1').first().text().trim();
    
    // Lấy thông tin tác giả
    let author = '';
    // Thử tìm trong các vị trí khác nhau
    const authorSelectors = [
      '.author-name',
      '.story-author',
      '.novel-author',
      'a[href*="/tac-gia/"]',
      '.info-item:contains("Tác giả") span',
      '.meta-author'
    ];
    
    for (const selector of authorSelectors) {
      const found = $(selector).first().text().trim();
      if (found) {
        author = found;
        break;
      }
    }
    
    // Lấy mô tả
    let description = '';
    const descSelectors = [
      '.story-description',
      '.novel-description',
      '.entry-content .description',
      '.summary',
      '.synopsis'
    ];
    
    for (const selector of descSelectors) {
      const found = $(selector).first().text().trim();
      if (found) {
        description = found;
        break;
      }
    }
    
    // Nếu không tìm thấy description, lấy từ entry-content
    if (!description) {
      description = $('.entry-content p').first().text().trim();
    }
    
    // Giới hạn độ dài description
    if (description && description.length > 2000) {
      description = description.substring(0, 2000) + '...';
    }
    
    // Lấy ảnh bìa
    let coverImage = '';
    const imgSelectors = [
      '.story-cover img',
      '.novel-cover img',
      '.entry-content img',
      '.wp-post-image',
      'img.cover'
    ];
    
    for (const selector of imgSelectors) {
      const found = $(selector).first().attr('src') || $(selector).first().attr('data-src');
      if (found) {
        coverImage = found;
        break;
      }
    }
    
    // Lấy tags
    const rawTags = [];
    
    // Tags từ các thẻ tag
    $('a[rel="tag"], .story-tags a, .novel-tags a, .tags a, .entry-tags a').each((i, el) => {
      const tag = $(el).text().trim();
      if (tag && tag.length < 50) {
        rawTags.push(tag);
      }
    });
    
    // Tags từ categories
    $('a[href*="/the-loai/"], .category a').each((i, el) => {
      const tag = $(el).text().trim();
      if (tag && tag.length < 50 && !rawTags.includes(tag)) {
        rawTags.push(tag);
      }
    });
    
    // Lấy trạng thái
    let status = 'unknown';
    const statusText = $('.story-status, .novel-status, .status').first().text().toLowerCase();
    if (statusText.includes('hoàn') || statusText.includes('end') || statusText.includes('full')) {
      status = 'completed';
    } else if (statusText.includes('đang') || statusText.includes('updating') || statusText.includes('ongoing')) {
      status = 'ongoing';
    }
    
    // Lấy số chapter nếu có
    let chapterCount = 0;
    const chapterText = $('.chapter-count, .total-chapters').first().text();
    const chapterMatch = chapterText.match(/(\d+)/);
    if (chapterMatch) {
      chapterCount = parseInt(chapterMatch[1], 10);
    }
    
    // Lấy lượt đọc nếu có
    let readCount = 0;
    const viewText = $('.view-count, .read-count, .views').first().text();
    const viewMatch = viewText.match(/([\d,\.]+)/);
    if (viewMatch) {
      readCount = parseInt(viewMatch[1].replace(/[,\.]/g, ''), 10) || 0;
    }
    
    if (!title) {
      console.warn(`[Atlantis] Could not extract title from ${url}`);
      return null;
    }
    
    // Thêm tag Đam Mỹ nếu chưa có
    const hasDammy = rawTags.some(t => 
      t.toLowerCase().includes('đam mỹ') || 
      t.toLowerCase().includes('bl') ||
      t.toLowerCase().includes('boy love')
    );
    if (!hasDammy) {
      rawTags.push('Đam Mỹ');
    }
    
    const result = {
      title,
      author: author || 'Unknown',
      description,
      coverImage,
      rawTags: [...new Set(rawTags)], // Remove duplicates
      originalLink: url,
      source: 'atlantis',
      status,
      chapterCount,
      readCount
    };
    
    console.log(`[Atlantis] Extracted: "${title}" - ${rawTags.length} tags`);
    return result;
    
  } catch (error) {
    console.error(`[Atlantis] Error crawling ${url}:`, error.message);
    return null;
  }
}

/**
 * Kiểm tra URL có phải từ Atlantis không
 */
function isAtlantisUrl(url) {
  return url && url.includes('atlantisviendong.com');
}

/**
 * Normalize URL Atlantis
 */
function normalizeAtlantisUrl(url) {
  if (!url) return url;
  
  // Loại bỏ query params và trailing slash
  let normalized = url.split('?')[0].split('#')[0];
  normalized = normalized.replace(/\/+$/, '');
  
  return normalized;
}

module.exports = {
  crawlNovelDetail,
  isAtlantisUrl,
  normalizeAtlantisUrl
};
