const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
 * Lấy danh sách link truyện từ trang danh sách
 */
async function getNovelListFromPage(pageUrl) {
  try {
    const response = await axiosInstance.get(pageUrl, {
      headers: { 'User-Agent': getRandomUserAgent() }
    });
    
    const $ = cheerio.load(response.data);
    const novels = [];
    
    // Tìm các link truyện trong trang
    // Cấu trúc có thể thay đổi tùy theo website
    $('article, .post, .entry, .novel-item, .story-item, a[href*="/truyen/"]').each((i, el) => {
      const $el = $(el);
      let link = '';
      let title = '';
      let cover = '';
      
      // Thử tìm link
      if ($el.is('a')) {
        link = $el.attr('href');
        title = $el.text().trim() || $el.attr('title');
      } else {
        const $link = $el.find('a').first();
        link = $link.attr('href');
        title = $link.text().trim() || $link.attr('title') || $el.find('h2, h3, .title').text().trim();
      }
      
      // Tìm cover
      const $img = $el.find('img').first();
      cover = $img.attr('src') || $img.attr('data-src') || '';
      
      if (link && link.includes('/truyen/') && !link.includes('/danh-sach-truyen/')) {
        // Đảm bảo link đầy đủ
        if (!link.startsWith('http')) {
          link = 'https://navyteamn.com' + link;
        }
        
        novels.push({
          link,
          title: title || 'Unknown',
          cover
        });
      }
    });
    
    // Tìm thêm các link truyện theo pattern khác
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/truyen/') && !href.includes('/danh-sach-truyen/') && !href.includes('/tieu-thuyet')) {
        const fullLink = href.startsWith('http') ? href : 'https://navyteamn.com' + href;
        if (!novels.find(n => n.link === fullLink)) {
          novels.push({
            link: fullLink,
            title: $(el).text().trim() || 'Unknown',
            cover: ''
          });
        }
      }
    });
    
    return novels;
  } catch (error) {
    console.error(`Error fetching page ${pageUrl}:`, error.message);
    return [];
  }
}

/**
 * Lấy chi tiết truyện từ trang truyện
 */
async function getNovelDetails(novelUrl) {
  try {
    const response = await axiosInstance.get(novelUrl, {
      headers: { 'User-Agent': getRandomUserAgent() }
    });
    
    const $ = cheerio.load(response.data);
    
    // Lấy title từ <title> tag (format: "Tên Truyện Novel (Hoàn) - Navy Team")
    let title = '';
    const pageTitle = $('title').text();
    if (pageTitle) {
      // Loại bỏ phần " - Navy Team" và " Novel"
      title = pageTitle
        .split(' - Navy Team')[0]
        .replace(/\s*Novel\s*(\(Hoàn\)|\(Đang ra\))?\s*$/i, '')
        .replace(/\s*\(Hoàn\)\s*$/i, '')
        .replace(/\s*\(Đang ra\)\s*$/i, '')
        .trim();
    }
    
    if (!title) {
      title = $('h1.entry-title, h1.post-title, .novel-title').first().text().trim();
    }
    
    // Lấy description từ .manga-description
    let description = '';
    
    // NavyTeam dùng class manga-description
    const $desc = $('.manga-description').first();
    if ($desc.length) {
      // Lấy text, loại bỏ phần "Giới thiệu" header
      description = $desc.text()
        .replace(/^Giới thiệu\s*/i, '')
        .trim();
      
      // Giới hạn độ dài
      if (description.length > 2000) {
        description = description.substring(0, 2000) + '...';
      }
    }
    
    // Fallback: thử các selector khác
    if (!description) {
      const contentSelectors = [
        '.entry-content', '.post-content', '.content', 
        '.novel-description', '.story-description',
        'article', '.synopsis', '.summary'
      ];
      
      for (const selector of contentSelectors) {
        const $content = $(selector).first();
        if ($content.length) {
          const paragraphs = [];
          $content.find('p').each((i, p) => {
            const text = $(p).text().trim();
            if (text && text.length > 20) {
              paragraphs.push(text);
            }
          });
          
          if (paragraphs.length > 0) {
            description = paragraphs.slice(0, 5).join('\n\n');
            break;
          }
        }
      }
    }
    
    // Lấy cover image
    let coverImage = '';
    const imgSelectors = [
      '.entry-content img', '.post-content img', 
      '.novel-cover img', 'article img', '.wp-post-image'
    ];
    
    for (const selector of imgSelectors) {
      const $img = $(selector).first();
      if ($img.length) {
        coverImage = $img.attr('src') || $img.attr('data-src') || '';
        if (coverImage) break;
      }
    }
    
    // Lấy author từ content
    let author = 'NavyTeam';
    const authorPatterns = [
      /tác giả[:\s]*([^\n<]+)/i,
      /author[:\s]*([^\n<]+)/i,
      /by[:\s]*([^\n<]+)/i
    ];
    
    const pageText = $.text();
    for (const pattern of authorPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        author = match[1].trim().substring(0, 100);
        break;
      }
    }
    
    // Lấy tags từ content
    const rawTags = ['BL Hàn', 'tiểu thuyết hàn'];
    
    // Tìm tags trong page
    $('.tag, .tags a, .category a, .cat-links a').each((i, el) => {
      const tag = $(el).text().trim();
      if (tag && tag.length < 30) {
        rawTags.push(tag);
      }
    });
    
    // Tìm keywords trong description
    const tagKeywords = [
      'hiện đại', 'cổ đại', 'xuyên không', 'trọng sinh',
      'ngọt', 'ngược', 'he', 'be', 'oe',
      'sủng', 'hài', 'drama', 'tình cảm',
      'abo', '18+', 'smut', 'cao h'
    ];
    
    const lowerDesc = (description + ' ' + title).toLowerCase();
    for (const kw of tagKeywords) {
      if (lowerDesc.includes(kw)) {
        rawTags.push(kw);
      }
    }
    
    return {
      title,
      author,
      description,
      coverImage,
      originalLink: novelUrl,
      rawTags: [...new Set(rawTags)],
      source: 'navyteam'
    };
    
  } catch (error) {
    console.error(`Error fetching novel ${novelUrl}:`, error.message);
    return null;
  }
}

/**
 * Crawl tất cả truyện từ NavyTeam
 */
async function crawlNavyTeam(maxPages = 10) {
  const baseUrl = 'https://navyteamn.com/danh-sach-truyen/tieu-thuyet';
  const allNovels = [];
  
  console.log(`\n🇰🇷 Crawling NavyTeam - Tiểu thuyết Hàn`);
  console.log('='.repeat(60));
  
  // Crawl page 1 trước
  console.log(`\n📄 Đang lấy danh sách truyện từ trang chính...`);
  const mainPageNovels = await getNovelListFromPage(baseUrl);
  console.log(`   Tìm thấy ${mainPageNovels.length} truyện`);
  
  for (const novel of mainPageNovels) {
    if (!allNovels.find(n => n.link === novel.link)) {
      allNovels.push(novel);
    }
  }
  
  // Crawl các trang phân trang (dùng ?page=X)
  for (let page = 2; page <= maxPages; page++) {
    const pageUrl = `${baseUrl}?page=${page}`;
    console.log(`\n📄 Trang ${page}...`);
    
    const pageNovels = await getNovelListFromPage(pageUrl);
    if (pageNovels.length === 0) {
      console.log('   Hết trang');
      break;
    }
    
    console.log(`   Tìm thấy ${pageNovels.length} truyện`);
    
    for (const novel of pageNovels) {
      if (!allNovels.find(n => n.link === novel.link)) {
        allNovels.push(novel);
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n📊 Tổng: ${allNovels.length} truyện unique`);
  return allNovels;
}

module.exports = {
  getNovelListFromPage,
  getNovelDetails,
  crawlNavyTeam
};
