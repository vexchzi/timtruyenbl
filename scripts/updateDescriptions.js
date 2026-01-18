/**
 * Update Descriptions - Crawl trang chi tiết để lấy mô tả đầy đủ
 * 
 * Chạy: node scripts/updateDescriptions.js --limit 100
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const { Novel } = require('../models');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * Crawl chi tiết một truyện
 */
async function crawlNovelDetail(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': USER_AGENT }
    });
    
    const $ = cheerio.load(response.data);
    const content = $('.entry-content');
    
    // Lấy mô tả từ các nguồn khác nhau
    let description = '';
    
    // 1. Tìm phần "Giới thiệu" hoặc "Tóm tắt"
    const text = content.text();
    const gioiThieuMatch = text.match(/(?:Giới thiệu|Tóm tắt|Summary|Nội dung)[:\s]*([^\n]+(?:\n[^\n]+){0,5})/i);
    if (gioiThieuMatch) {
      description = gioiThieuMatch[1].trim();
    }
    
    // 2. Nếu không có, lấy đoạn văn đầu tiên (bỏ qua thông tin tác giả, thể loại)
    if (!description) {
      const paragraphs = content.find('p');
      for (let i = 0; i < paragraphs.length; i++) {
        const p = $(paragraphs[i]).text().trim();
        // Bỏ qua các dòng thông tin
        if (p && p.length > 50 && 
            !p.match(/^(Tác giả|Thể loại|Tình trạng|Edit|Convert|Link|Nguồn|Số chương|Chapter)/i)) {
          description = p;
          break;
        }
      }
    }
    
    // 3. Lấy thêm thông tin tác giả nếu có
    const authorMatch = text.match(/Tác giả[:\s]*([^\n]+)/i);
    const author = authorMatch ? authorMatch[1].trim().split('\n')[0].substring(0, 100) : null;
    
    // 4. Lấy cover image
    const coverImage = content.find('img').first().attr('src') || null;
    
    // 5. Lấy số chương
    const chapterMatch = text.match(/(\d+)\s*(?:chương|chapter)/i);
    const chapterCount = chapterMatch ? parseInt(chapterMatch[1], 10) : null;
    
    // 6. Lấy số lượt đọc nếu có
    const readMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:lượt|views?|reads?)/i);
    const readCount = readMatch ? parseInt(readMatch[1].replace(/[.,]/g, ''), 10) : null;
    
    return {
      description: description.substring(0, 1000),
      author,
      coverImage,
      chapterCount,
      readCount
    };
    
  } catch (error) {
    console.error(`Error crawling ${url}:`, error.message);
    return null;
  }
}

/**
 * Main function
 */
async function updateDescriptions(limit = 100) {
  console.log('🔄 UPDATE DESCRIPTIONS');
  console.log('='.repeat(50));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Lấy các truyện chưa có description hoặc description ngắn
    const novels = await Novel.find({
      $or: [
        { description: { $exists: false } },
        { description: '' },
        { description: null },
        { description: { $regex: /^.{0,50}$/ } } // Description ngắn hơn 50 ký tự
      ],
      originalLink: { $regex: /wordpress\.com/ } // Chỉ WordPress
    })
    .select('_id title originalLink description author')
    .limit(limit)
    .lean();
    
    console.log(`📚 Found ${novels.length} novels needing description update\n`);
    
    if (novels.length === 0) {
      console.log('✅ All novels have descriptions!');
      return;
    }
    
    let updated = 0;
    let failed = 0;
    
    for (let i = 0; i < novels.length; i++) {
      const novel = novels[i];
      const progress = `[${i + 1}/${novels.length}]`;
      
      console.log(`${progress} Crawling: ${novel.title.substring(0, 40)}...`);
      
      const detail = await crawlNovelDetail(novel.originalLink);
      
      if (detail && (detail.description || detail.author || detail.coverImage)) {
        const updateData = {};
        
        if (detail.description && detail.description.length > 20) {
          updateData.description = detail.description;
        }
        if (detail.author && !novel.author) {
          updateData.author = detail.author;
        }
        if (detail.coverImage) {
          updateData.coverImage = detail.coverImage;
        }
        if (detail.chapterCount) {
          updateData.chapterCount = detail.chapterCount;
        }
        if (detail.readCount) {
          updateData.readCount = detail.readCount;
        }
        
        if (Object.keys(updateData).length > 0) {
          await Novel.updateOne({ _id: novel._id }, { $set: updateData });
          updated++;
          console.log(`   ✅ Updated (${Object.keys(updateData).join(', ')})`);
        } else {
          console.log(`   ⏭️ No new data found`);
        }
      } else {
        failed++;
        console.log(`   ❌ Failed to crawl`);
      }
      
      // Delay để tránh rate limit
      if (i < novels.length - 1) {
        await delay(1500);
      }
      
      // Progress báo cáo
      if ((i + 1) % 20 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${novels.length} | Updated: ${updated} | Failed: ${failed}\n`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 COMPLETED');
    console.log('='.repeat(50));
    console.log(`   Processed: ${novels.length}`);
    console.log(`   Updated:   ${updated}`);
    console.log(`   Failed:    ${failed}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

// CLI
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : 100;

if (args.includes('--help')) {
  console.log(`
📝 Update Descriptions - Crawl chi tiết để lấy mô tả truyện

Usage:
  node scripts/updateDescriptions.js              # Update 100 truyện
  node scripts/updateDescriptions.js --limit 500  # Update 500 truyện
  `);
  process.exit(0);
}

updateDescriptions(limit);
