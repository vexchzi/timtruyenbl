/**
 * Seed Data Script - Tool crawl tự động để làm đầy Database
 * 
 * Chạy: npm run seed:novels
 * Hoặc: node scripts/seedData.js
 * 
 * Mô tả:
 * - Input: Mảng link Reading List trên Wattpad
 * - Process: Crawl từng reading list -> Lấy link truyện -> Crawl chi tiết -> Normalize tags -> Lưu DB
 * - Output: Database được seed với dữ liệu truyện thực
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel, TagDictionary } = require('../models');
const { crawlReadingList, crawlWattpad, randomDelay, delay } = require('../services/crawler');
const { normalizeTags, warmUpCache } = require('../utils/tagNormalizer');

// ============== CONFIGURATION ==============

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novel_recommender';

// Delay settings (milliseconds)
const DELAY_BETWEEN_STORIES = { min: 3000, max: 6000 };  // 3-6 giây giữa mỗi truyện
const DELAY_BETWEEN_LISTS = { min: 5000, max: 10000 };   // 5-10 giây giữa mỗi reading list

/**
 * ============== READING LISTS TO CRAWL ==============
 * 
 * Thay thế các URL bên dưới bằng Reading List thực trên Wattpad.
 * Có thể là:
 * - Reading list công khai: https://www.wattpad.com/list/123456789-list-name
 * - User's reading list: https://www.wattpad.com/user/username/lists
 * 
 * Tips tìm Reading List tốt:
 * 1. Tìm các list có tag "đam mỹ", "danmei", "bl"
 * 2. Chọn list có 50-200 truyện để test
 * 3. Ưu tiên list có truyện đã hoàn thành
 */
const READING_LISTS = [
  'https://www.wattpad.com/list/801954168-danh-sch-c-ca-octopus1207',
  'https://www.wattpad.com/list/965452315-danh-sch-c-ca-phanthnh654',
  'https://www.wattpad.com/list/359162722-danh-sch-c-ca-dualeokhongngot',
  'https://www.wattpad.com/list/663387390-danh-sch-c-ca-tuathoanggia0811',
  'https://www.wattpad.com/list/240614677-danh-sch-c-ca-kyuokryeo',
];

// ============== STATISTICS ==============
const stats = {
  totalListsCrawled: 0,
  totalStoriesFound: 0,
  totalStoriesCrawled: 0,
  totalStoriesSaved: 0,
  totalDuplicates: 0,
  totalErrors: 0,
  startTime: null,
  endTime: null
};

/**
 * Lưu truyện vào Database
 * - Check trùng lặp trước khi lưu
 * - Normalize tags trước khi lưu
 * 
 * @param {Object} novelData - Dữ liệu truyện từ crawler
 * @returns {Promise<Object>} { saved: boolean, novel: Novel|null, duplicate: boolean }
 */
async function saveNovel(novelData) {
  try {
    // Check trùng lặp bằng originalLink
    const exists = await Novel.existsByLink(novelData.originalLink);
    
    if (exists) {
      console.log(`[Seed] ⏭️  Skip duplicate: "${novelData.title}"`);
      return { saved: false, novel: null, duplicate: true };
    }
    
    // Normalize tags
    const standardTags = await normalizeTags(novelData.rawTags);
    
    // Tạo document mới
    const novel = new Novel({
      title: novelData.title,
      originalLink: novelData.originalLink,
      source: novelData.source || 'wattpad',
      author: novelData.author,
      description: novelData.description,
      coverImage: novelData.coverImage,
      rawTags: novelData.rawTags,
      standardTags: standardTags,
      chapterCount: novelData.chapterCount || 0,
      readCount: novelData.readCount || 0
    });
    
    await novel.save();
    
    console.log(`[Seed] ✅ Saved: "${novel.title}" (${standardTags.length} tags)`);
    return { saved: true, novel, duplicate: false };
    
  } catch (error) {
    // Handle duplicate key error (nếu có race condition)
    if (error.code === 11000) {
      console.log(`[Seed] ⏭️  Skip duplicate (race condition): "${novelData.title}"`);
      return { saved: false, novel: null, duplicate: true };
    }
    
    console.error(`[Seed] ❌ Error saving "${novelData.title}":`, error.message);
    throw error;
  }
}

/**
 * Process một Reading List
 * - Crawl list để lấy link truyện
 * - Crawl từng truyện
 * - Lưu vào DB
 * 
 * @param {string} listUrl - URL của Reading List
 * @param {number} listIndex - Index của list (để hiển thị progress)
 * @param {number} totalLists - Tổng số lists
 */
async function processReadingList(listUrl, listIndex, totalLists) {
  console.log('\n' + '='.repeat(70));
  console.log(`📚 PROCESSING READING LIST ${listIndex + 1}/${totalLists}`);
  console.log(`   URL: ${listUrl}`);
  console.log('='.repeat(70));
  
  try {
    // Crawl reading list để lấy danh sách link truyện
    const storyLinks = await crawlReadingList(listUrl);
    stats.totalStoriesFound += storyLinks.length;
    
    if (storyLinks.length === 0) {
      console.log('[Seed] ⚠️  No stories found in this reading list');
      return;
    }
    
    console.log(`[Seed] Found ${storyLinks.length} stories. Starting crawl...\n`);
    
    // Crawl từng truyện
    for (let i = 0; i < storyLinks.length; i++) {
      const storyUrl = storyLinks[i];
      
      console.log(`\n[Seed] 📖 Story ${i + 1}/${storyLinks.length} in list ${listIndex + 1}`);
      
      try {
        // Crawl thông tin truyện
        const novelData = await crawlWattpad(storyUrl);
        stats.totalStoriesCrawled++;
        
        if (novelData) {
          // Lưu vào DB
          const result = await saveNovel(novelData);
          
          if (result.saved) {
            stats.totalStoriesSaved++;
          } else if (result.duplicate) {
            stats.totalDuplicates++;
          }
        } else {
          stats.totalErrors++;
        }
        
      } catch (error) {
        console.error(`[Seed] ❌ Error processing story: ${error.message}`);
        stats.totalErrors++;
      }
      
      // Delay trước truyện tiếp theo
      if (i < storyLinks.length - 1) {
        await randomDelay(DELAY_BETWEEN_STORIES.min, DELAY_BETWEEN_STORIES.max);
      }
    }
    
    stats.totalListsCrawled++;
    
  } catch (error) {
    console.error(`[Seed] ❌ Error processing reading list: ${error.message}`);
  }
}

/**
 * Print final statistics
 */
function printStats() {
  const duration = stats.endTime - stats.startTime;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 SEED DATA STATISTICS');
  console.log('='.repeat(70));
  console.log(`   Reading Lists Processed: ${stats.totalListsCrawled}/${READING_LISTS.length}`);
  console.log(`   Stories Found:           ${stats.totalStoriesFound}`);
  console.log(`   Stories Crawled:         ${stats.totalStoriesCrawled}`);
  console.log(`   Stories Saved:           ${stats.totalStoriesSaved}`);
  console.log(`   Duplicates Skipped:      ${stats.totalDuplicates}`);
  console.log(`   Errors:                  ${stats.totalErrors}`);
  console.log(`   Duration:                ${minutes}m ${seconds}s`);
  console.log(`   Success Rate:            ${stats.totalStoriesCrawled > 0 
    ? ((stats.totalStoriesSaved / stats.totalStoriesCrawled) * 100).toFixed(1) 
    : 0}%`);
  console.log('='.repeat(70));
}

/**
 * Main seed function
 */
async function seedData() {
  console.log('🚀 NOVEL RECOMMENDER - DATABASE SEEDER');
  console.log('='.repeat(70));
  
  // Validate input
  if (READING_LISTS.length === 0) {
    console.error('❌ Error: No reading lists configured!');
    console.log('\n📝 How to use:');
    console.log('   1. Open scripts/seedData.js');
    console.log('   2. Add Wattpad reading list URLs to READING_LISTS array');
    console.log('   3. Run: npm run seed:novels');
    console.log('\n💡 Example URLs:');
    console.log('   - https://www.wattpad.com/list/123456789-my-reading-list');
    console.log('   - https://www.wattpad.com/list/987654321-dam-my-hay');
    process.exit(1);
  }
  
  stats.startTime = Date.now();
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if TagDictionary has data
    const tagCount = await TagDictionary.countDocuments();
    if (tagCount === 0) {
      console.log('\n⚠️  Warning: TagDictionary is empty!');
      console.log('   Run "npm run seed" first to populate tag dictionary.');
      console.log('   Continuing without tag normalization...\n');
    } else {
      console.log(`✅ TagDictionary has ${tagCount} entries`);
      // Warm up cache
      await warmUpCache();
    }
    
    // Get current count
    const existingCount = await Novel.countDocuments();
    console.log(`📚 Current novels in DB: ${existingCount}`);
    
    console.log(`\n🎯 Will process ${READING_LISTS.length} reading list(s)`);
    console.log(`⏱️  Delay between stories: ${DELAY_BETWEEN_STORIES.min/1000}-${DELAY_BETWEEN_STORIES.max/1000}s`);
    console.log(`⏱️  Delay between lists: ${DELAY_BETWEEN_LISTS.min/1000}-${DELAY_BETWEEN_LISTS.max/1000}s`);
    
    // Process each reading list
    for (let i = 0; i < READING_LISTS.length; i++) {
      await processReadingList(READING_LISTS[i], i, READING_LISTS.length);
      
      // Delay between reading lists
      if (i < READING_LISTS.length - 1) {
        console.log(`\n⏳ Waiting before next reading list...`);
        await randomDelay(DELAY_BETWEEN_LISTS.min, DELAY_BETWEEN_LISTS.max);
      }
    }
    
    stats.endTime = Date.now();
    
    // Print statistics
    printStats();
    
    // Final count
    const finalCount = await Novel.countDocuments();
    console.log(`\n📚 Final novels in DB: ${finalCount} (+${finalCount - existingCount} new)`);
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    stats.endTime = Date.now();
    printStats();
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

/**
 * Seed từ danh sách URL truyện trực tiếp (không qua reading list)
 * Hữu ích khi bạn có sẵn danh sách URL
 * 
 * @param {string[]} storyUrls - Mảng URL truyện
 */
async function seedFromUrls(storyUrls) {
  console.log('🚀 SEEDING FROM DIRECT URLs');
  console.log('='.repeat(70));
  
  if (!storyUrls || storyUrls.length === 0) {
    console.error('❌ No URLs provided');
    return;
  }
  
  stats.startTime = Date.now();
  stats.totalStoriesFound = storyUrls.length;
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    await warmUpCache();
    
    for (let i = 0; i < storyUrls.length; i++) {
      console.log(`\n[Seed] 📖 Story ${i + 1}/${storyUrls.length}`);
      
      try {
        const novelData = await crawlWattpad(storyUrls[i]);
        stats.totalStoriesCrawled++;
        
        if (novelData) {
          const result = await saveNovel(novelData);
          if (result.saved) stats.totalStoriesSaved++;
          else if (result.duplicate) stats.totalDuplicates++;
        } else {
          stats.totalErrors++;
        }
      } catch (error) {
        console.error(`[Seed] ❌ Error: ${error.message}`);
        stats.totalErrors++;
      }
      
      if (i < storyUrls.length - 1) {
        await randomDelay(DELAY_BETWEEN_STORIES.min, DELAY_BETWEEN_STORIES.max);
      }
    }
    
    stats.endTime = Date.now();
    printStats();
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Test seed với 1 URL duy nhất (để debug)
 */
async function testSeedSingle(url) {
  console.log('🧪 TEST SEED SINGLE URL');
  console.log('='.repeat(70));
  console.log(`URL: ${url}\n`);
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    await warmUpCache();
    
    const novelData = await crawlWattpad(url);
    
    if (novelData) {
      console.log('\n📋 Crawled Data:');
      console.log(`   Title: ${novelData.title}`);
      console.log(`   Author: ${novelData.author}`);
      console.log(`   Cover: ${novelData.coverImage ? 'Yes' : 'No'}`);
      console.log(`   Raw Tags: [${novelData.rawTags.join(', ')}]`);
      
      const standardTags = await normalizeTags(novelData.rawTags);
      console.log(`   Standard Tags: [${standardTags.join(', ')}]`);
      
      // Ask to save
      console.log('\n💾 Saving to database...');
      const result = await saveNovel(novelData);
      
      if (result.saved) {
        console.log('✅ Saved successfully!');
        console.log(`   ID: ${result.novel._id}`);
      } else if (result.duplicate) {
        console.log('⏭️  Already exists in database');
      }
    } else {
      console.log('❌ Failed to crawl data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// ============== CLI INTERFACE ==============

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
  const command = args[0];
  
  if (command === 'test' && args[1]) {
    // Test với 1 URL: node scripts/seedData.js test <url>
    testSeedSingle(args[1]);
  } else if (command === 'urls') {
    // Seed từ URLs: node scripts/seedData.js urls <url1> <url2> ...
    const urls = args.slice(1);
    seedFromUrls(urls);
  } else if (command === 'help') {
    console.log('📖 SEED DATA - Usage Guide');
    console.log('='.repeat(50));
    console.log('\nCommands:');
    console.log('  node scripts/seedData.js              # Seed từ READING_LISTS array');
    console.log('  node scripts/seedData.js test <url>   # Test crawl 1 URL');
    console.log('  node scripts/seedData.js urls <...>   # Seed từ danh sách URLs');
    console.log('  node scripts/seedData.js help         # Hiển thị help');
    console.log('\nExamples:');
    console.log('  node scripts/seedData.js test https://www.wattpad.com/story/123456');
    console.log('  node scripts/seedData.js urls https://wattpad.com/story/111 https://wattpad.com/story/222');
  } else {
    console.log('Unknown command. Use "help" for usage guide.');
  }
} else {
  // Default: chạy seedData từ READING_LISTS
  seedData();
}

module.exports = {
  seedData,
  seedFromUrls,
  testSeedSingle,
  saveNovel
};
