/**
 * WordPress Crawler - Crawl dữ liệu từ dammymoihoan.wordpress.com
 * 
 * Tính năng:
 * - Crawl danh sách truyện từ trang chủ/archive
 * - Trích xuất: title, tags, description, source links
 * - Hỗ trợ pagination
 */

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://dammymoihoan.wordpress.com';

/**
 * User-Agent để tránh bị block
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Tạo axios instance
 */
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
 * Crawl một trang archive/homepage
 * @param {number} page - Số trang (1, 2, 3...)
 * @returns {Promise<Array>} Mảng các bài viết
 */
async function crawlPage(page = 1) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}/page/${page}/`;
  console.log(`[WP Crawler] Crawling page ${page}: ${url}`);

  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);

    const posts = [];

    // Mỗi bài viết trên blog
    $('article, .post, .entry').each((i, el) => {
      const $post = $(el);

      // Title
      const titleEl = $post.find('h1 a, h2 a, .entry-title a').first();
      const title = titleEl.text().trim();
      const postUrl = titleEl.attr('href');

      // Tags
      const tags = [];
      $post.find('.tag a, a[rel="tag"], .tags a').each((j, tagEl) => {
        const tag = $(tagEl).text().trim();
        if (tag) tags.push(tag);
      });

      // Description/excerpt
      const description = $post.find('.entry-content p, .excerpt, .entry-summary p')
        .first().text().trim().substring(0, 500);

      // Thông tin bổ sung từ content
      const content = $post.find('.entry-content').text();
      
      // Tìm thể loại từ content
      const theLoaiMatch = content.match(/Thể loại[:\s]*([^\n]+)/i);
      const additionalTags = theLoaiMatch 
        ? theLoaiMatch[1].split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Tìm tác giả
      const authorMatch = content.match(/Tác giả[:\s]*([^\n]+)/i);
      const author = authorMatch ? authorMatch[1].trim() : '';

      if (title && postUrl) {
        posts.push({
          title: title.replace(/^\[.*?\]\s*/, ''), // Bỏ prefix như [Đam mỹ]
          originalTitle: title,
          postUrl,
          author,
          description,
          rawTags: [...new Set([...tags, ...additionalTags])],
          source: 'dammymoihoan'
        });
      }
    });

    console.log(`[WP Crawler] Found ${posts.length} posts on page ${page}`);
    return posts;

  } catch (error) {
    console.error(`[WP Crawler] Error crawling page ${page}:`, error.message);
    return [];
  }
}

/**
 * Crawl chi tiết một bài viết để lấy source link (Wattpad/WordPress gốc)
 * @param {string} postUrl - URL bài viết trên dammymoihoan
 * @returns {Promise<Object>} Thông tin chi tiết
 */
async function crawlPostDetail(postUrl) {
  console.log(`[WP Crawler] Crawling post: ${postUrl}`);

  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(postUrl);
    const $ = cheerio.load(response.data);

    const content = $('.entry-content').text();
    const html = $('.entry-content').html() || '';

    // Tìm source links
    const sourceLinks = [];
    
    // Tìm link Wattpad
    $('a[href*="wattpad.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/story/')) {
        sourceLinks.push({ type: 'wattpad', url: href });
      }
    });

    // Tìm link WordPress khác (truyện gốc)
    $('a[href*="wordpress.com"], a[href*=".wp."]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('dammymoihoan')) {
        sourceLinks.push({ type: 'wordpress', url: href });
      }
    });

    // Parse thông tin chi tiết hơn
    const info = {
      sourceLinks,
      fullDescription: content.substring(0, 2000),
    };

    // Tìm thể loại đầy đủ
    const theLoaiMatch = content.match(/Thể loại[:\s]*([^\n]+)/i);
    if (theLoaiMatch) {
      info.theLoai = theLoaiMatch[1].split(',').map(t => t.trim()).filter(Boolean);
    }

    // Tìm tác giả
    const authorMatch = content.match(/Tác giả[:\s]*([^\n]+)/i);
    if (authorMatch) {
      info.author = authorMatch[1].trim().split('\n')[0];
    }

    // Tìm tình trạng
    const statusMatch = content.match(/Tình trạng[:\s]*(Hoàn|Đang ra|Drop)/i);
    if (statusMatch) {
      info.status = statusMatch[1].toLowerCase().includes('hoàn') ? 'completed' : 'ongoing';
    }

    // Tìm cover image
    const coverImg = $('.entry-content img').first().attr('src');
    if (coverImg) {
      info.coverImage = coverImg;
    }

    console.log(`[WP Crawler] Found ${sourceLinks.length} source links`);
    return info;

  } catch (error) {
    console.error(`[WP Crawler] Error crawling post:`, error.message);
    return { sourceLinks: [] };
  }
}

/**
 * Crawl nhiều trang và lấy danh sách truyện
 * @param {number} maxPages - Số trang tối đa
 * @param {number} delayMs - Delay giữa các request
 * @returns {Promise<Array>}
 */
async function crawlMultiplePages(maxPages = 5, delayMs = 2000) {
  const allPosts = [];

  for (let page = 1; page <= maxPages; page++) {
    const posts = await crawlPage(page);
    
    if (posts.length === 0) {
      console.log(`[WP Crawler] No more posts found, stopping at page ${page}`);
      break;
    }

    allPosts.push(...posts);

    if (page < maxPages) {
      console.log(`[WP Crawler] Waiting ${delayMs/1000}s...`);
      await delay(delayMs);
    }
  }

  console.log(`[WP Crawler] Total posts collected: ${allPosts.length}`);
  return allPosts;
}

/**
 * Crawl tag page (ví dụ: /tag/hien-dai/)
 * @param {string} tag - Tag slug
 * @param {number} maxPages - Số trang tối đa
 */
async function crawlByTag(tag, maxPages = 3) {
  const allPosts = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 
      ? `${BASE_URL}/tag/${tag}/`
      : `${BASE_URL}/tag/${tag}/page/${page}/`;
    
    console.log(`[WP Crawler] Crawling tag "${tag}" page ${page}`);

    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get(url);
      const $ = cheerio.load(response.data);

      $('article, .post').each((i, el) => {
        const $post = $(el);
        const titleEl = $post.find('h1 a, h2 a, .entry-title a').first();
        const title = titleEl.text().trim();
        const postUrl = titleEl.attr('href');

        const tags = [];
        $post.find('a[rel="tag"]').each((j, tagEl) => {
          tags.push($(tagEl).text().trim());
        });

        if (title && postUrl) {
          allPosts.push({
            title,
            postUrl,
            rawTags: tags,
            source: 'dammymoihoan'
          });
        }
      });

      await delay(1500);

    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`[WP Crawler] No more pages for tag "${tag}"`);
        break;
      }
      console.error(`[WP Crawler] Error:`, error.message);
    }
  }

  return allPosts;
}

/**
 * Crawl trực tiếp từ một URL WordPress bất kỳ
 * @param {string} url - URL WordPress post
 * @returns {Promise<Object>} Thông tin truyện
 */
async function crawlSinglePost(url) {
  console.log(`[WP Crawler] Crawling single post: ${url}`);

  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);

    // Title
    let title = $('h1.entry-title, .post-title, h1.title, article h1').first().text().trim();
    if (!title) {
      title = $('title').text().split('–')[0].split('|')[0].trim();
    }

    // Cover image
    let coverImage = '';
    const imgSelectors = [
      '.entry-content img',
      '.post-content img', 
      'article img',
      '.wp-post-image',
      'meta[property="og:image"]'
    ];
    
    for (const selector of imgSelectors) {
      const el = $(selector).first();
      const src = selector.includes('meta') ? el.attr('content') : el.attr('src');
      if (src && src.startsWith('http')) {
        coverImage = src;
        break;
      }
    }

    // Content text for parsing
    const content = $('.entry-content, .post-content, article').first().text();
    const html = $('.entry-content, .post-content, article').first().html() || '';

    // Author
    let author = '';
    const authorPatterns = [
      /Tác giả[:\s]*([^\n<]+)/i,
      /Author[:\s]*([^\n<]+)/i,
      /Tác Giả[:\s]*([^\n<]+)/i,
      /TG[:\s]*([^\n<]+)/i
    ];
    for (const pattern of authorPatterns) {
      const match = content.match(pattern);
      if (match) {
        author = match[1].trim().split('\n')[0].substring(0, 100);
        break;
      }
    }

    // Description
    let description = '';
    const descPatterns = [
      /Giới thiệu[:\s]*([^\n]+(?:\n[^\n]+)*)/i,
      /Tóm tắt[:\s]*([^\n]+(?:\n[^\n]+)*)/i,
      /Nội dung[:\s]*([^\n]+(?:\n[^\n]+)*)/i,
      /Summary[:\s]*([^\n]+(?:\n[^\n]+)*)/i
    ];
    for (const pattern of descPatterns) {
      const match = content.match(pattern);
      if (match) {
        description = match[1].trim().substring(0, 1000);
        break;
      }
    }
    if (!description) {
      // Fallback: lấy đoạn đầu content
      description = $('.entry-content p, .post-content p').slice(0, 3).text().trim().substring(0, 800);
    }

    // Raw tags from WordPress
    const rawTags = [];
    $('a[rel="tag"], .tag a, .tags a, .post-tags a').each((i, el) => {
      const tag = $(el).text().trim();
      if (tag && tag.length < 50) rawTags.push(tag);
    });

    // Parse tags from content
    const tagPatterns = [
      /Thể loại[:\s]*([^\n]+)/i,
      /Thể Loại[:\s]*([^\n]+)/i,
      /Tags?[:\s]*([^\n]+)/i,
      /Nhãn[:\s]*([^\n]+)/i
    ];
    for (const pattern of tagPatterns) {
      const match = content.match(pattern);
      if (match) {
        const tags = match[1].split(/[,|\/]/).map(t => t.trim()).filter(t => t && t.length < 50);
        rawTags.push(...tags);
      }
    }

    // Status
    let status = 'unknown';
    if (/Hoàn|Full|Complete/i.test(content)) status = 'completed';
    else if (/Đang ra|Ongoing|Updating/i.test(content)) status = 'ongoing';

    // Clean up
    const cleanTitle = title.replace(/^\[.*?\]\s*/, '').trim();

    const result = {
      title: cleanTitle || title,
      author: author || 'Unknown',
      description,
      coverImage,
      originalLink: url,
      rawTags: [...new Set(rawTags)],
      source: 'wordpress',
      status
    };

    console.log(`[WP Crawler] Extracted: "${result.title}" by ${result.author}, ${result.rawTags.length} tags`);
    return result;

  } catch (error) {
    console.error(`[WP Crawler] Error crawling ${url}:`, error.message);
    return null;
  }
}

module.exports = {
  crawlPage,
  crawlPostDetail,
  crawlMultiplePages,
  crawlByTag,
  crawlSinglePost,
  BASE_URL
};
