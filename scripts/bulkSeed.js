/**
 * Bulk Seed - Seed số lượng lớn truyện
 * 
 * Chạy: node scripts/bulkSeed.js --target 1000
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');
const { crawlMultiplePages } = require('../services/wordpressCrawler');
const { normalizeTags } = require('../utils/tagNormalizer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novel_recommender';

// Tags phổ biến trên dammymoihoan
const POPULAR_TAGS = [
  'hien-dai', 'co-trang', 'he', 'nguoc-tam', 'sung-thu',
  'nien-ha', 'nien-thuong', 'ho-sung', 'h-van', 'diem-van',
  'truong-sinh', 'xuyen-khong', 'abo', 'mat-the', 'tu-chan',
  'gioi-giai-tri', 'quan-nhan', 'hao-mon', 'vuon-truong'
];

/**
 * Delay helper
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Lưu truyện
 */
async function saveNovel(novelData) {
  try {
    const exists = await Novel.findOne({
      $or: [
        { title: novelData.title },
        { originalLink: novelData.postUrl }
      ]
    });

    if (exists) return { saved: false, duplicate: true };

    const standardTags = await normalizeTags(novelData.rawTags || []);

    const novel = new Novel({
      title: novelData.title,
      originalLink: novelData.postUrl,
      source: 'wordpress',
      author: novelData.author || 'Unknown',
      description: novelData.description || '',
      coverImage: novelData.coverImage || null,
      rawTags: novelData.rawTags || [],
      standardTags,
      status: novelData.status || 'unknown'
    });

    await novel.save();
    return { saved: true };
  } catch (error) {
    if (error.code === 11000) return { saved: false, duplicate: true };
    return { saved: false, error: true };
  }
}

/**
 * Bulk seed từ WordPress
 */
async function bulkSeed(targetCount = 1000) {
  console.log('🚀 BULK SEED - Target:', targetCount, 'novels');
  console.log('='.repeat(60));

  const startTime = Date.now();
  let totalSaved = 0;
  let totalProcessed = 0;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Đếm số truyện hiện có
    const currentCount = await Novel.countDocuments();
    console.log(`📚 Current novels in DB: ${currentCount}`);
    
    const needed = targetCount - currentCount;
    if (needed <= 0) {
      console.log('✅ Target already reached!');
      return;
    }
    console.log(`🎯 Need to add: ${needed} more novels\n`);

    // Tính số trang cần crawl (ước tính 8 truyện/trang, 50% duplicate)
    const pagesNeeded = Math.ceil(needed / 4);
    console.log(`📖 Will crawl approximately ${pagesNeeded} pages\n`);

    // Crawl từ trang chủ
    const { crawlPage } = require('../services/wordpressCrawler');
    let page = 1;
    while (totalSaved < needed && page <= pagesNeeded + 50) {
      console.log(`\n📄 Page ${page}...`);
      
      const posts = await crawlPage(page); // Crawl specific page
      
      if (posts.length === 0) {
        console.log('No more posts found');
        break;
      }

      for (const post of posts) {
        totalProcessed++;
        const result = await saveNovel(post);
        
        if (result.saved) {
          totalSaved++;
          process.stdout.write(`\r   Saved: ${totalSaved}/${needed} | Processed: ${totalProcessed}`);
        }

        if (totalSaved >= needed) break;
      }

      page++;
      await delay(1500);

      // Progress update
      if (page % 10 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const rate = totalSaved / (elapsed / 60);
        const remaining = Math.round((needed - totalSaved) / rate);
        console.log(`\n   ⏱️ Elapsed: ${elapsed}s | Rate: ${rate.toFixed(1)}/min | ETA: ${remaining}min`);
      }
    }

    // Final stats
    const duration = Math.round((Date.now() - startTime) / 1000);
    const finalCount = await Novel.countDocuments();

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 BULK SEED COMPLETED');
    console.log('='.repeat(60));
    console.log(`   Processed:    ${totalProcessed}`);
    console.log(`   New saved:    ${totalSaved}`);
    console.log(`   Total in DB:  ${finalCount}`);
    console.log(`   Duration:     ${Math.floor(duration/60)}m ${duration%60}s`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// CLI
const args = process.argv.slice(2);
const targetIndex = args.indexOf('--target');
const target = targetIndex !== -1 ? parseInt(args[targetIndex + 1], 10) : 1000;

if (args.includes('--help')) {
  console.log(`
📚 Bulk Seed - Seed số lượng lớn truyện

Usage:
  node scripts/bulkSeed.js                    # Seed đến 1000 truyện
  node scripts/bulkSeed.js --target 500       # Seed đến 500 truyện
  node scripts/bulkSeed.js --target 5000      # Seed đến 5000 truyện
  `);
  process.exit(0);
}

bulkSeed(target);
