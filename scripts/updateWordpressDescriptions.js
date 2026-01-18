/**
 * Cập nhật description cho novels từ WordPress
 * Crawl lại từng trang để lấy description
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const Novel = require('../models/Novel');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function crawlDescription(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Lấy nội dung bài viết
    let description = '';
    
    // Thử nhiều selector khác nhau
    const contentSelectors = [
      '.entry-content',
      '.post-content', 
      'article .content',
      '.td-post-content',
      '.post-body'
    ];
    
    for (const selector of contentSelectors) {
      const content = $(selector);
      if (content.length) {
        // Lấy text từ các paragraph
        const paragraphs = [];
        content.find('p').each((i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 20) {
            paragraphs.push(text);
          }
        });
        
        if (paragraphs.length > 0) {
          // Lấy tối đa 5 paragraph đầu tiên
          description = paragraphs.slice(0, 5).join('\n\n');
          break;
        }
      }
    }
    
    // Cắt ngắn nếu quá dài
    if (description.length > 2000) {
      description = description.substring(0, 2000) + '...';
    }
    
    return description;
  } catch (error) {
    console.error(`  ❌ Error crawling ${url}:`, error.message);
    return null;
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Lấy novels từ wordpress không có description
  const novels = await Novel.find({
    source: 'wordpress',
    $or: [
      { description: null },
      { description: '' },
      { description: { $exists: false } }
    ]
  }).select('_id title originalLink').limit(100); // Giới hạn 100 mỗi lần

  console.log(`📊 Found ${novels.length} novels without description\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < novels.length; i++) {
    const novel = novels[i];
    console.log(`[${i + 1}/${novels.length}] ${novel.title}`);
    
    const description = await crawlDescription(novel.originalLink);
    
    if (description && description.length > 50) {
      await Novel.updateOne(
        { _id: novel._id },
        { $set: { description } }
      );
      console.log(`  ✅ Updated (${description.length} chars)`);
      updated++;
    } else {
      console.log(`  ⚠️ No description found`);
      failed++;
    }
    
    // Delay 1-2 giây giữa các request
    await delay(1000 + Math.random() * 1000);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Failed: ${failed}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
