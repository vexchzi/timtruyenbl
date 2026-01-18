/**
 * Góc Nhỏ Đu Danmei Crawler
 * https://gocnhodudanmei.wordpress.com/
 * 
 * Tính năng:
 * - Crawl danh sách truyện từ category (Tủ truyện hoàn, Truyện chưa hoàn...)
 * - Trích xuất: title, author, tags, description, source links
 * - Hỗ trợ pagination
 */

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://gocnhodudanmei.wordpress.com';

// Categories để crawl
const CATEGORIES = {
  TU_TRUYEN_HOAN: '/category/tu-truyen-hoan/',
  TRUYEN_CHUA_HOAN: '/category/truyen-chua-hoan/',
  GOC_XEP_CHU: '/category/goc-xep-chu/',
};

/**
 * User-Agent để tránh bị block
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createAxiosInstance() {
  return axios.create({
    timeout: 30000,
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    }
  });
}

/**
 * Parse thông tin truyện từ nội dung bài viết
 * @param {string} content - Nội dung text của bài viết
 * @returns {Object} Thông tin parsed
 */
function parseNovelInfo(content) {
  const info = {
    author: '',
    tags: [],
    chapterCount: 0,
    status: 'unknown',
    editor: '',
  };

  // Tìm tác giả
  const authorPatterns = [
    /Tác giả[:\s]*([^\n]+)/i,
    /Author[:\s]*([^\n]+)/i,
    /◆Tác giả[:\s]*([^\n]+)/i,
  ];
  for (const pattern of authorPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.author = match[1].trim().split('\n')[0].replace(/[◆\*]/g, '').trim();
      break;
    }
  }

  // Tìm thể loại/tags
  const tagPatterns = [
    /Thể loại[:\s]*([^\n]+)/i,
    /Tag[s]?[:\s]*([^\n]+)/i,
    /◆Thể loại[:\s]*([^\n]+)/i,
  ];
  for (const pattern of tagPatterns) {
    const match = content.match(pattern);
    if (match) {
      const tagStr = match[1].replace(/[◆\*]/g, '').trim();
      // Split by comma, semicolon, or " – "
      info.tags = tagStr.split(/[,;–]/).map(t => t.trim()).filter(t => t && t.length > 1);
      break;
    }
  }

  // Tìm số chương
  const chapterPatterns = [
    /Số chương[:\s]*(\d+)/i,
    /(\d+)\s*chương/i,
    /Độ dài[:\s]*(\d+)\s*chương/i,
  ];
  for (const pattern of chapterPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.chapterCount = parseInt(match[1], 10);
      break;
    }
  }

  // Tìm tình trạng
  const statusPatterns = [
    /Tình trạng[:\s]*(Hoàn|Đã hoàn|Đang ra|Drop|Chưa hoàn)/i,
  ];
  for (const pattern of statusPatterns) {
    const match = content.match(pattern);
    if (match) {
      const statusStr = match[1].toLowerCase();
      if (statusStr.includes('hoàn') && !statusStr.includes('chưa')) {
        info.status = 'completed';
      } else if (statusStr.includes('đang') || statusStr.includes('chưa')) {
        info.status = 'ongoing';
      } else if (statusStr.includes('drop')) {
        info.status = 'dropped';
      }
      break;
    }
  }

  // Tìm editor
  const editorMatch = content.match(/Editor[:\s]*([^\n]+)/i) || 
                      content.match(/Biên tập[:\s]*([^\n]+)/i);
  if (editorMatch) {
    info.editor = editorMatch[1].trim().split('\n')[0];
  }

  return info;
}

/**
 * Crawl một trang category
 * @param {string} categoryPath - Path category (e.g., '/category/tu-truyen-hoan/')
 * @param {number} page - Số trang
 * @returns {Promise<Array>} Mảng các bài viết
 */
async function crawlCategoryPage(categoryPath = CATEGORIES.TU_TRUYEN_HOAN, page = 1) {
  const url = page === 1 
    ? `${BASE_URL}${categoryPath}` 
    : `${BASE_URL}${categoryPath}page/${page}/`;
  
  console.log(`[GocNho] Crawling page ${page}: ${url}`);

  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);

    const posts = [];

    // Mỗi bài viết
    $('article').each((i, el) => {
      const $post = $(el);

      // Title
      const titleEl = $post.find('h1.entry-title a, h2.entry-title a, .entry-title a').first();
      const title = titleEl.text().trim();
      const postUrl = titleEl.attr('href');

      // Content text
      const contentText = $post.find('.entry-content').text();
      
      // Parse thông tin từ content
      const novelInfo = parseNovelInfo(contentText);

      // Tags từ WordPress
      const wpTags = [];
      $post.find('a[rel="tag"]').each((j, tagEl) => {
        wpTags.push($(tagEl).text().trim());
      });

      // Tìm source links trong content
      const sourceLinks = [];
      $post.find('.entry-content a').each((j, linkEl) => {
        const href = $(linkEl).attr('href') || '';
        const linkText = $(linkEl).text().toLowerCase();
        
        if (href.includes('wattpad.com/story/')) {
          sourceLinks.push({ type: 'wattpad', url: href });
        } else if ((href.includes('wordpress.com') || href.includes('.wp.')) && 
                   !href.includes('gocnhodudanmei')) {
          sourceLinks.push({ type: 'wordpress', url: href });
        }
      });

      // Cover image
      const coverImg = $post.find('.entry-content img').first().attr('src');

      if (title && postUrl) {
        posts.push({
          title: title.replace(/^\[.*?\]\s*/, '').trim(),
          originalTitle: title,
          postUrl,
          author: novelInfo.author,
          rawTags: [...new Set([...novelInfo.tags, ...wpTags])],
          chapterCount: novelInfo.chapterCount,
          status: novelInfo.status,
          sourceLinks,
          coverImage: coverImg || null,
          description: contentText.substring(0, 1000),
          source: 'gocnhodudanmei'
        });
      }
    });

    console.log(`[GocNho] Found ${posts.length} posts on page ${page}`);
    return posts;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`[GocNho] Page ${page} not found (404)`);
      return [];
    }
    console.error(`[GocNho] Error crawling page ${page}:`, error.message);
    return [];
  }
}

/**
 * Crawl chi tiết một bài viết để lấy thêm thông tin
 * @param {string} postUrl - URL bài viết
 * @returns {Promise<Object>} Thông tin chi tiết
 */
async function crawlPostDetail(postUrl) {
  console.log(`[GocNho] Crawling detail: ${postUrl}`);

  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(postUrl);
    const $ = cheerio.load(response.data);

    const content = $('.entry-content').text();
    const html = $('.entry-content').html() || '';

    // Parse thông tin
    const novelInfo = parseNovelInfo(content);

    // Tìm tất cả source links
    const sourceLinks = [];
    $('.entry-content a').each((i, el) => {
      const href = $(el).attr('href') || '';
      
      if (href.includes('wattpad.com/story/')) {
        sourceLinks.push({ type: 'wattpad', url: href });
      } else if ((href.includes('wordpress.com') || href.includes('.wp.')) && 
                 !href.includes('gocnhodudanmei')) {
        sourceLinks.push({ type: 'wordpress', url: href });
      }
    });

    // Cover image (tìm kỹ hơn)
    let coverImage = null;
    $('.entry-content img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('emoji') && !src.includes('icon')) {
        coverImage = src;
        return false; // break
      }
    });

    // Description đầy đủ
    const description = content
      .replace(/Tác giả[:\s]*[^\n]+/gi, '')
      .replace(/Thể loại[:\s]*[^\n]+/gi, '')
      .replace(/Số chương[:\s]*[^\n]+/gi, '')
      .replace(/Editor[:\s]*[^\n]+/gi, '')
      .replace(/Biên tập[:\s]*[^\n]+/gi, '')
      .replace(/Tình trạng[:\s]*[^\n]+/gi, '')
      .replace(/LINK ĐỌC[^\n]+/gi, '')
      .replace(/Tiếp tục đọc[^\n]+/gi, '')
      .trim()
      .substring(0, 2000);

    return {
      ...novelInfo,
      sourceLinks,
      coverImage,
      description,
      fullContent: content.substring(0, 3000),
    };

  } catch (error) {
    console.error(`[GocNho] Error crawling detail:`, error.message);
    return null;
  }
}

/**
 * Crawl nhiều trang từ một category
 * @param {string} categoryPath - Category path
 * @param {number} maxPages - Số trang tối đa
 * @param {number} delayMs - Delay giữa các request
 * @returns {Promise<Array>}
 */
async function crawlCategory(categoryPath = CATEGORIES.TU_TRUYEN_HOAN, maxPages = 50, delayMs = 2000) {
  const allPosts = [];

  for (let page = 1; page <= maxPages; page++) {
    const posts = await crawlCategoryPage(categoryPath, page);
    
    if (posts.length === 0) {
      console.log(`[GocNho] No more posts found, stopping at page ${page}`);
      break;
    }

    allPosts.push(...posts);

    if (page < maxPages) {
      console.log(`[GocNho] Waiting ${delayMs/1000}s before next page...`);
      await delay(delayMs);
    }
  }

  console.log(`[GocNho] Total posts collected: ${allPosts.length}`);
  return allPosts;
}

/**
 * Crawl tất cả categories
 * @param {number} maxPagesPerCategory - Số trang tối đa mỗi category
 * @returns {Promise<Array>}
 */
async function crawlAllCategories(maxPagesPerCategory = 30) {
  const allPosts = [];
  const categories = [
    { name: 'Tủ truyện hoàn', path: CATEGORIES.TU_TRUYEN_HOAN },
    { name: 'Truyện chưa hoàn', path: CATEGORIES.TRUYEN_CHUA_HOAN },
  ];

  for (const cat of categories) {
    console.log(`\n[GocNho] ========== Crawling: ${cat.name} ==========`);
    const posts = await crawlCategory(cat.path, maxPagesPerCategory, 2000);
    allPosts.push(...posts);
    
    console.log(`[GocNho] Completed ${cat.name}: ${posts.length} posts`);
    await delay(3000); // Delay between categories
  }

  // Remove duplicates by postUrl
  const uniquePosts = Array.from(
    new Map(allPosts.map(p => [p.postUrl, p])).values()
  );

  console.log(`\n[GocNho] Total unique posts: ${uniquePosts.length}`);
  return uniquePosts;
}

module.exports = {
  crawlCategoryPage,
  crawlPostDetail,
  crawlCategory,
  crawlAllCategories,
  parseNovelInfo,
  CATEGORIES,
  BASE_URL
};
