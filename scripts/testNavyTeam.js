require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

async function testNavyTeam() {
  const url = 'https://navyteamn.com/danh-sach-truyen/tieu-thuyet';
  
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(response.data);
    
    console.log('=== PAGINATION CHECK ===');
    
    // Tìm trang cuối cùng
    let maxPage = 1;
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/page\/(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1]);
        if (pageNum > maxPage) maxPage = pageNum;
      }
    });
    
    console.log('Max page found:', maxPage);
    
    // Đếm truyện trên trang 1
    const novelLinks = new Set();
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('/truyen/') && !href.includes('/danh-sach-truyen/')) {
        novelLinks.add(href);
      }
    });
    
    console.log('Novels per page:', novelLinks.size);
    console.log('Estimated total:', novelLinks.size * maxPage);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNavyTeam();
