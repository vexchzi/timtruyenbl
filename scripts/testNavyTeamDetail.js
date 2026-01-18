const axios = require('axios');
const cheerio = require('cheerio');

async function testDetail() {
  const url = 'https://navyteamn.com/truyen/dinh-menh-alphega';
  
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  
  const $ = cheerio.load(response.data);
  
  console.log('=== PAGE STRUCTURE ===');
  console.log('Title:', $('title').text());
  
  // Tìm mô tả
  console.log('\n=== DESCRIPTION SEARCH ===');
  
  // Thử các selector khác nhau
  const selectors = [
    '.story-description',
    '.novel-info',
    '.truyen-info',
    '.description',
    '.synopsis',
    '.summary',
    '.story-intro',
    '.novel-summary',
    'div[class*="desc"]',
    'div[class*="info"]',
    'div[class*="intro"]',
    '.entry-content p'
  ];
  
  for (const sel of selectors) {
    const text = $(sel).first().text().trim().substring(0, 200);
    if (text) {
      console.log(`${sel}:`, text.substring(0, 100) + '...');
    }
  }
  
  // In ra HTML structure
  console.log('\n=== MAIN CONTENT CLASSES ===');
  $('div[class]').each((i, el) => {
    const cls = $(el).attr('class');
    if (cls && (cls.includes('info') || cls.includes('desc') || cls.includes('story') || cls.includes('novel'))) {
      console.log('Class:', cls);
    }
  });
  
  // Tìm meta description
  console.log('\n=== META ===');
  console.log('og:description:', $('meta[property="og:description"]').attr('content')?.substring(0, 200));
  console.log('description:', $('meta[name="description"]').attr('content')?.substring(0, 200));
}

testDetail();
