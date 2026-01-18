/**
 * Crawler Service - Module crawl dữ liệu từ Wattpad
 * 
 * Tính năng:
 * - Crawl thông tin truyện đơn lẻ
 * - Crawl danh sách truyện từ Reading List
 * - User-Agent rotation để tránh bị chặn
 * - Retry mechanism khi gặp lỗi
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Danh sách User-Agent giả lập các trình duyệt phổ biến
 * - Rotate ngẫu nhiên để tránh bị detect là bot
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

/**
 * Lấy ngẫu nhiên một User-Agent
 * @returns {string} User-Agent string
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Tạo axios instance với config mặc định
 * @returns {AxiosInstance}
 */
function createAxiosInstance() {
  return axios.create({
    timeout: 30000, // 30 seconds timeout
    proxy: false, // Disable system proxy - fix ECONNREFUSED 127.0.0.1
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    }
  });
}

/**
 * Delay helper - Tạm dừng execution
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Delay ngẫu nhiên trong khoảng min-max
 * @param {number} minMs - Minimum milliseconds
 * @param {number} maxMs - Maximum milliseconds
 * @returns {Promise<void>}
 */
function randomDelay(minMs = 3000, maxMs = 5000) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  console.log(`[Crawler] Waiting ${(ms/1000).toFixed(1)}s before next request...`);
  return delay(ms);
}

/**
 * Chuẩn hóa URL Wattpad
 * - Đảm bảo URL đúng format
 * - Loại bỏ query params không cần thiết
 * @param {string} url - URL gốc
 * @returns {string} URL đã chuẩn hóa
 */
function normalizeWattpadUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Đảm bảo là domain wattpad
    if (!urlObj.hostname.includes('wattpad.com')) {
      throw new Error('Not a Wattpad URL');
    }
    
    // Loại bỏ query params
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (error) {
    return url;
  }
}

/**
 * MAIN: Crawl thông tin truyện từ Wattpad
 * 
 * @param {string} url - URL trang truyện Wattpad
 * @returns {Promise<Object|null>} Object chứa thông tin truyện hoặc null nếu lỗi
 * 
 * @example
 * const result = await crawlWattpad('https://www.wattpad.com/story/123456');
 * // { title, author, description, coverImage, rawTags, originalLink }
 */
async function crawlWattpad(url) {
  const normalizedUrl = normalizeWattpadUrl(url);
  console.log(`[Crawler] Crawling: ${normalizedUrl}`);
  
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(normalizedUrl);
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const $ = cheerio.load(response.data);
    
    // ============== PARSE TITLE ==============
    // Wattpad thường đặt title trong nhiều vị trí, thử từng cái
    let title = '';
    
    // Helper: Kiểm tra title có hợp lệ không (không chỉ là "[EDIT]" đơn lẻ)
    const isValidTitle = (t) => {
      if (!t) return false;
      const cleaned = t.trim();
      // Chỉ reject nếu title ĐÚNG BẰNG "[EDIT]" hoặc quá ngắn
      if (cleaned === '[EDIT]' || cleaned === 'EDIT' || cleaned.length < 5) return false;
      return true;
    };
    
    // Cách 1: Title tag (thường có full title)
    const pageTitle = $('title').text();
    if (pageTitle) {
      // Title tag thường có format: "[EDIT - HOÀN] Tên truyện - Author - Wattpad"
      title = pageTitle.replace(/\s*-\s*Wattpad.*$/i, '').trim();
    }
    
    // Cách 2: Meta tag og:title
    if (!isValidTitle(title)) {
      const ogTitle = $('meta[property="og:title"]').attr('content');
      if (isValidTitle(ogTitle)) {
        title = ogTitle;
      }
    }
    
    // Cách 3: Story info title (specific selector)
    if (!isValidTitle(title)) {
      const storyTitle = $('.story-info__title').text().trim();
      if (isValidTitle(storyTitle)) {
        title = storyTitle;
      }
    }
    
    // Cách 4: JSON-LD schema
    if (!isValidTitle(title)) {
      const scriptTags = $('script[type="application/ld+json"]');
      scriptTags.each((i, el) => {
        try {
          const jsonData = JSON.parse($(el).html());
          if (jsonData.name && isValidTitle(jsonData.name)) {
            title = jsonData.name;
            return false; // break
          }
        } catch (e) {}
      });
    }
    
    // Cách 5: H1 với độ dài hợp lý
    if (!isValidTitle(title)) {
      $('h1').each((i, el) => {
        const text = $(el).text().trim();
        if (isValidTitle(text)) {
          title = text;
          return false; // break
        }
      });
    }
    
    // Clean up title - chỉ loại bỏ "- Wattpad" suffix, KHÔNG xóa [EDIT...] vì đó có thể là tên thật
    title = title ? title.replace(/\s*-\s*Wattpad.*$/i, '').trim() : '';
    
    // ============== PARSE AUTHOR ==============
    let author = '';
    
    // Cách 1: Meta tag
    author = $('meta[property="og:site_name"]').attr('content');
    
    // Cách 2: Author link trong story info
    if (!author || author === 'Wattpad') {
      author = $('.author-info__username').text().trim() ||
               $('a[href*="/user/"]').first().text().trim() ||
               $('.story-info__author a').text().trim();
    }
    
    // Cách 3: Tìm trong JSON-LD schema
    if (!author || author === 'Wattpad') {
      const scriptTags = $('script[type="application/ld+json"]');
      scriptTags.each((i, el) => {
        try {
          const jsonData = JSON.parse($(el).html());
          if (jsonData.author) {
            author = jsonData.author.name || jsonData.author;
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });
    }
    
    author = author || 'Unknown';
    
    // ============== PARSE DESCRIPTION ==============
    let description = '';
    
    // Cách 1: Meta description
    description = $('meta[property="og:description"]').attr('content') ||
                  $('meta[name="description"]').attr('content');
    
    // Cách 2: Story description element
    if (!description) {
      description = $('.story-info__description').text().trim() ||
                    $('.description-text').text().trim() ||
                    $('pre.description').text().trim();
    }
    
    // Clean up description
    description = description ? description.trim().substring(0, 5000) : '';
    
    // ============== PARSE COVER IMAGE ==============
    let coverImage = '';
    
    // Cách 1: Meta og:image
    coverImage = $('meta[property="og:image"]').attr('content');
    
    // Cách 2: Story cover element
    if (!coverImage) {
      coverImage = $('.story-cover img').attr('src') ||
                   $('img.cover').attr('src') ||
                   $('.cover-image img').attr('src');
    }
    
    // Đảm bảo URL đầy đủ
    if (coverImage && !coverImage.startsWith('http')) {
      coverImage = 'https:' + coverImage;
    }
    
    // ============== PARSE TAGS ==============
    const rawTags = [];
    
    // Cách 1: Tag links
    $('.tag-items a, .tags a, a.tag, .story-tags a').each((i, el) => {
      const tag = $(el).text().trim();
      if (tag && !tag.startsWith('#') === false) {
        // Remove # prefix if exists
        rawTags.push(tag.replace(/^#/, ''));
      } else if (tag) {
        rawTags.push(tag);
      }
    });
    
    // Cách 2: Tag elements với class khác
    if (rawTags.length === 0) {
      $('[class*="tag"]').each((i, el) => {
        const tag = $(el).text().trim();
        // Chỉ lấy text ngắn, có thể là tag
        if (tag && tag.length < 50 && !tag.includes(' ') || tag.length < 30) {
          rawTags.push(tag.replace(/^#/, ''));
        }
      });
    }
    
    // Cách 3: Tìm trong JSON-LD
    if (rawTags.length === 0) {
      const scriptTags = $('script[type="application/ld+json"]');
      scriptTags.each((i, el) => {
        try {
          const jsonData = JSON.parse($(el).html());
          if (jsonData.keywords) {
            const keywords = Array.isArray(jsonData.keywords) 
              ? jsonData.keywords 
              : jsonData.keywords.split(',');
            keywords.forEach(k => rawTags.push(k.trim()));
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });
    }
    
    // Deduplicate và filter tags rỗng
    const uniqueTags = [...new Set(rawTags.filter(t => t && t.length > 0))];
    
    // ============== PARSE ADDITIONAL INFO ==============
    // Số chapter (nếu có)
    let chapterCount = 0;
    const chapterText = $('.story-parts, .table-of-contents').text();
    const chapterMatch = chapterText.match(/(\d+)\s*(parts?|chapters?|phần|chương)/i);
    if (chapterMatch) {
      chapterCount = parseInt(chapterMatch[1], 10);
    }
    
    // Số lượt đọc (nếu có)
    let readCount = 0;
    const statsText = $('.story-stats, .reads').text();
    const readMatch = statsText.match(/([\d,.]+[KMB]?)\s*(reads?|views?|lượt đọc)/i);
    if (readMatch) {
      readCount = parseReadCount(readMatch[1]);
    }
    
    // Validate kết quả - phải có ít nhất title
    if (!title) {
      console.warn(`[Crawler] Warning: Could not extract title from ${normalizedUrl}`);
      return null;
    }
    
    const result = {
      title,
      author,
      description,
      coverImage,
      rawTags: uniqueTags,
      originalLink: normalizedUrl,
      source: 'wattpad',
      chapterCount,
      readCount
    };
    
    console.log(`[Crawler] ✅ Successfully crawled: "${title}" by ${author} (${uniqueTags.length} tags)`);
    return result;
    
  } catch (error) {
    console.error(`[Crawler] ❌ Error crawling ${normalizedUrl}:`, error.message);
    return null;
  }
}

/**
 * Parse số lượt đọc từ string (vd: "1.2M", "500K", "10,000")
 * @param {string} str - String chứa số
 * @returns {number}
 */
function parseReadCount(str) {
  if (!str) return 0;
  
  const cleaned = str.replace(/,/g, '').toUpperCase();
  const num = parseFloat(cleaned);
  
  if (cleaned.includes('B')) return num * 1000000000;
  if (cleaned.includes('M')) return num * 1000000;
  if (cleaned.includes('K')) return num * 1000;
  
  return Math.floor(num) || 0;
}

/**
 * Crawl danh sách link truyện từ Reading List
 * 
 * @param {string} readingListUrl - URL của Reading List trên Wattpad
 * @returns {Promise<string[]>} Mảng các URL truyện
 * 
 * @example
 * const links = await crawlReadingList('https://www.wattpad.com/list/123456');
 * // ['https://www.wattpad.com/story/111', 'https://www.wattpad.com/story/222', ...]
 */
async function crawlReadingList(readingListUrl) {
  console.log(`[Crawler] Crawling Reading List: ${readingListUrl}`);
  
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(readingListUrl);
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const $ = cheerio.load(response.data);
    const storyLinks = [];
    
    // Tìm tất cả link truyện trong reading list
    // Wattpad story links thường có format: /story/{id}-{slug}
    $('a[href*="/story/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        // Chuẩn hóa thành full URL
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = `https://www.wattpad.com${href}`;
        }
        
        // Chỉ lấy URL đến story, không lấy chapter links
        // Story URL: /story/123456-slug
        // Chapter URL: /123456-chapter-name
        if (fullUrl.includes('/story/') && !storyLinks.includes(fullUrl)) {
          // Normalize: loại bỏ fragment và query string
          const cleanUrl = fullUrl.split('?')[0].split('#')[0];
          if (!storyLinks.includes(cleanUrl)) {
            storyLinks.push(cleanUrl);
          }
        }
      }
    });
    
    console.log(`[Crawler] ✅ Found ${storyLinks.length} stories in reading list`);
    return storyLinks;
    
  } catch (error) {
    console.error(`[Crawler] ❌ Error crawling reading list ${readingListUrl}:`, error.message);
    return [];
  }
}

/**
 * Crawl nhiều truyện với delay giữa các request
 * 
 * @param {string[]} urls - Mảng URL truyện
 * @param {Object} options - Tùy chọn
 * @param {number} options.delayMin - Delay tối thiểu (ms)
 * @param {number} options.delayMax - Delay tối đa (ms)
 * @param {Function} options.onProgress - Callback khi crawl xong mỗi truyện
 * @returns {Promise<Object[]>} Mảng kết quả crawl (không bao gồm null)
 */
async function crawlMultiple(urls, options = {}) {
  const {
    delayMin = 3000,
    delayMax = 5000,
    onProgress = null
  } = options;
  
  const results = [];
  const total = urls.length;
  
  console.log(`[Crawler] Starting batch crawl of ${total} URLs...`);
  
  for (let i = 0; i < total; i++) {
    const url = urls[i];
    
    console.log(`\n[Crawler] Progress: ${i + 1}/${total} (${Math.round((i + 1) / total * 100)}%)`);
    
    const result = await crawlWattpad(url);
    
    if (result) {
      results.push(result);
      
      // Gọi callback nếu có
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          result,
          success: true
        });
      }
    } else {
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          url,
          success: false
        });
      }
    }
    
    // Delay trước request tiếp theo (trừ request cuối)
    if (i < total - 1) {
      await randomDelay(delayMin, delayMax);
    }
  }
  
  console.log(`\n[Crawler] ✅ Batch crawl completed: ${results.length}/${total} successful`);
  return results;
}

/**
 * Retry wrapper cho crawl function
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Số lần retry tối đa
 * @param {number} retryDelay - Delay giữa các lần retry (ms)
 */
async function withRetry(fn, maxRetries = 3, retryDelay = 5000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[Crawler] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`[Crawler] Retrying in ${retryDelay/1000}s...`);
        await delay(retryDelay);
      }
    }
  }
  
  throw lastError;
}

// Export các functions
module.exports = {
  // Main functions
  crawlWattpad,
  crawlReadingList,
  crawlMultiple,
  
  // Utilities
  delay,
  randomDelay,
  normalizeWattpadUrl,
  withRetry,
  getRandomUserAgent,
  
  // Constants
  USER_AGENTS
};
