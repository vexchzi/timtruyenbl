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
    
    // Atlantis: Tác giả có thể hiển thị ngay dưới title dưới dạng text đơn giản
    // Hoặc trong description có dòng "Tác giả: xxx"
    if (!author) {
      // Tìm element ngay sau h1 title
      const titleEl = $('h1').first();
      if (titleEl.length) {
        // Lấy text ngay sau title (có thể là tên tác giả)
        const nextText = titleEl.next().text().trim();
        if (nextText && nextText.length < 50 && !nextText.includes('chương') && !nextText.includes('Chương')) {
          // Có thể là tên tác giả
          const possibleAuthor = nextText.split('\n')[0].trim();
          if (possibleAuthor.length > 1 && possibleAuthor.length < 50) {
            author = possibleAuthor;
          }
        }
      }
    }
    
    // Tìm trong description nếu có dòng "Tác giả: xxx"
    if (!author) {
      const pageText = $('body').text();
      const authorMatch = pageText.match(/Tác\s*giả\s*[:\-]\s*([^\n\r\(]+)/i);
      if (authorMatch) {
        author = authorMatch[1].trim().split(/[\(\[]/)[0].trim(); // Bỏ phần trong ngoặc
        if (author.length > 50) author = '';
      }
    }
    
    // Lấy mô tả - Atlantis specific: tìm phần "Giới thiệu chung"
    let description = '';
    
    // Atlantis: Mô tả nằm sau heading "Giới thiệu chung" hoặc "Giới thiệu"
    $('h5, h4, h3, .section-title').each((i, el) => {
      const headingText = $(el).text().trim().toLowerCase();
      if (headingText.includes('giới thiệu')) {
        // Lấy tất cả nội dung sau heading này
        let content = '';
        let nextEl = $(el).next();
        
        // Lấy nội dung cho đến khi gặp heading khác hoặc section khác
        while (nextEl.length && !nextEl.is('h1, h2, h3, h4, h5, .chapter-list, #chapter-list, [class*="chapter"]')) {
          const text = nextEl.text().trim();
          if (text) {
            content += text + '\n\n';
          }
          nextEl = nextEl.next();
        }
        
        if (content.length > 50) {
          description = content.trim();
          console.log(`[Atlantis] Found description after "Giới thiệu" heading`);
          return false; // break
        }
      }
    });
    
    // Fallback: Tìm trong parent của heading
    if (!description) {
      const introSection = $('*:contains("Giới thiệu chung")').filter(function() {
        return $(this).children().length === 0 || $(this).is('h5, h4, h3');
      }).first().parent();
      
      if (introSection.length) {
        const text = introSection.text().trim();
        if (text.length > 100) {
          description = text;
          console.log(`[Atlantis] Found description from intro section parent`);
        }
      }
    }
    
    // Fallback 2: Thử các selectors thông thường
    if (!description) {
      const descSelectors = [
        '.story-description',
        '.novel-description', 
        '.description',
        '.summary',
        '.synopsis',
        '.gioi-thieu',
        '.intro',
      ];
      
      for (const selector of descSelectors) {
        try {
          const found = $(selector).first().text().trim();
          if (found && found.length > 30) {
            description = found;
            console.log(`[Atlantis] Found description with selector: ${selector}`);
            break;
          }
        } catch (e) {}
      }
    }
    
    // Fallback 3: meta description
    if (!description) {
      const metaDesc = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content');
      if (metaDesc && metaDesc.length > 30) {
        description = metaDesc;
        console.log(`[Atlantis] Found description from meta tag`);
      }
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
    
    // Atlantis specific: Tags hiển thị dưới dạng badges/spans riêng biệt
    // Tìm các element có text ngắn giống tag (sau phần description)
    const knownTagKeywords = [
      'chủ thụ', 'chủ công', 'hỗ công', 'cổ đại', 'hiện đại', 'cận đại',
      'đam mỹ', 'bách hợp', 'he', 'be', 'abo', 'xuyên', 'ngọt', 'sủng',
      'cung đình', 'cường cường', 'nhẹ nhàng', 'hài', 'ngược', 'sắc',
      'tu tiên', 'huyền huyễn', 'đô thị', 'học đường', 'quân đội',
      'kinh dị', 'trinh thám', 'lãng mạn', 'tâm lý', 'sinh tồn',
      'hệ thống', 'trùng sinh', 'xuyên không', 'xuyên nhanh', 'fanfic'
    ];
    
    // Tags từ các thẻ tag/badge
    const tagSelectors = [
      'a[rel="tag"]',
      '.story-tags a',
      '.novel-tags a', 
      '.tags a',
      '.entry-tags a',
      '.post-tags a',
      '.tag-list a',
      '.the-loai a',
      'a[href*="/tag/"]',
      'a[href*="/the-loai/"]',
      'a[href*="/category/"]',
      '.category a',
      '.categories a',
      '.info-item a',
      '.novel-info a',
      '.story-info a',
      // Atlantis: Tags có thể là span hoặc link trong khu vực tags
      'span.tag',
      '.tag-badge',
      '.badge',
    ];
    
    tagSelectors.forEach(selector => {
      $(selector).each((i, el) => {
        const tag = $(el).text().trim();
        if (tag && tag.length > 1 && tag.length < 50 && !rawTags.includes(tag)) {
          // Loại bỏ các text không phải tag (navigation, etc.)
          const lowerTag = tag.toLowerCase();
          if (!lowerTag.includes('đăng nhập') && 
              !lowerTag.includes('đăng ký') && 
              !lowerTag.includes('trang chủ') &&
              !lowerTag.includes('bình luận') &&
              !lowerTag.includes('chương')) {
            rawTags.push(tag);
          }
        }
      });
    });
    
    // Lấy tags từ description nếu có format "Thể loại: xxx, yyy"
    if (description) {
      const tagPatterns = [
        /Thể\s*loại\s*[:\-]\s*([^\n\r]+)/gi,
      ];
      
      tagPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(description)) !== null) {
          const tagLine = match[1];
          // Tách bằng dấu phẩy
          tagLine.split(/[,，、]+/).forEach(t => {
            let tag = t.trim();
            // Loại bỏ dấu chấm cuối
            tag = tag.replace(/\.$/, '');
            
            // Chỉ nhận tag ngắn hợp lệ
            if (tag.length > 25) return; // Quá dài, không phải tag
            if (tag.length < 2) return;
            if (tag.match(/^\d+/)) return; // Bắt đầu bằng số
            if (tag.match(/^(hoàn thành|đang|nguồn|tình trạng|editor|tác giả)/i)) return;
            if (tag.includes(':')) return; // Có dấu hai chấm - là label
            
            // Chuẩn hóa tag
            const normalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1);
            
            if (!rawTags.some(t => t.toLowerCase() === normalizedTag.toLowerCase())) {
              rawTags.push(normalizedTag);
            }
          });
        }
      });
    }
    
    // Loại bỏ các tag rác
    const filteredTags = rawTags.filter(tag => {
      if (tag.length > 25) return false; // Tag thường ngắn
      if (tag.length < 2) return false;
      if (tag.includes(':')) return false;
      if (tag.match(/^(nguồn|tình trạng|editor|tác giả|giới thiệu|bị |đánh |giết |đốt |mặc |ánh |chỉ |thống |nhốt )/i)) return false;
      if (tag.match(/^\d/)) return false;
      if (tag.includes('___')) return false;
      if (tag.split(' ').length > 4) return false; // Quá nhiều từ (tag thường 1-3 từ)
      // Loại bỏ các cụm từ từ description (không phải tag)
      if (tag.match(/(cắt gân|gãy chân|hôn quân|đô thành|áo cưới|ba năm|thiên hạ|nham hiểm)/i)) return false;
      return true;
    });
    
    // Remove duplicates (case-insensitive)
    const uniqueTags = [];
    const seenLower = new Set();
    filteredTags.forEach(tag => {
      const lower = tag.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        uniqueTags.push(tag);
      }
    });
    
    console.log(`[Atlantis] Found ${uniqueTags.length} raw tags:`, uniqueTags.slice(0, 15));
    
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
    const hasDammy = uniqueTags.some(t => 
      t.toLowerCase().includes('đam mỹ') || 
      t.toLowerCase().includes('bl') ||
      t.toLowerCase().includes('boy love')
    );
    if (!hasDammy) {
      uniqueTags.push('Đam Mỹ');
    }
    
    const result = {
      title,
      author: author || 'Unknown',
      description,
      coverImage,
      rawTags: uniqueTags,
      originalLink: url,
      source: 'atlantis',
      status,
      chapterCount,
      readCount
    };
    
    console.log(`[Atlantis] Extracted: "${title}" - ${uniqueTags.length} tags`);
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
