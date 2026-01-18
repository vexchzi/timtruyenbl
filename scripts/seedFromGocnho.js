/**
 * Seed từ Góc Nhỏ Đu Danmei
 * https://gocnhodudanmei.wordpress.com/
 * 
 * Chạy: node scripts/seedFromGocnho.js [--max-pages=30] [--category=hoan|chua-hoan]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { crawlCategory, crawlAllCategories, crawlPostDetail, CATEGORIES } = require('../services/gocnhoCrawler');
const { normalizeTags, extractTagsFromDescription } = require('../utils/tagNormalizer');

// ============== CONFIG ==============
const MONGO_URI = process.env.MONGODB_URI;
const DELAY_BETWEEN_SAVES = 300;

// Parse arguments
const args = process.argv.slice(2);
let maxPages = 50;
let categoryType = 'all';

for (const arg of args) {
  if (arg.startsWith('--max-pages=')) {
    maxPages = parseInt(arg.split('=')[1], 10) || 50;
  }
  if (arg.startsWith('--category=')) {
    categoryType = arg.split('=')[1];
  }
}

// Từ khóa fanfic để lọc
const FANFIC_KEYWORDS = [
  'đồng nhân', 'đồngnhân', 'dong nhan', 'dongnhan',
  'fanfic', 'fan fic', 'fanfiction',
  'bts', 'exo', 'nct', 'blackpink', 'kpop',
  'mdzs', 'tgcf', 'svsss', 'wangxian', 'hualian', 'bingqiu',
  'naruto', 'one piece', 'haikyuu', 'genshin',
  'harry potter', 'marvel', 'drarry',
];

function isFanfic(novel) {
  const text = [
    novel.title,
    novel.author,
    ...(novel.rawTags || []),
    novel.description,
  ].filter(Boolean).join(' ').toLowerCase();

  return FANFIC_KEYWORDS.some(kw => text.includes(kw));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Lưu một novel vào database
 */
async function saveNovel(post) {
  try {
    // Xác định link đọc chính
    let originalLink = post.postUrl;
    let source = 'gocnhodudanmei';

    // Ưu tiên link Wattpad nếu có
    if (post.sourceLinks && post.sourceLinks.length > 0) {
      const wattpadLink = post.sourceLinks.find(l => l.type === 'wattpad');
      const wpLink = post.sourceLinks.find(l => l.type === 'wordpress');
      
      if (wattpadLink) {
        originalLink = wattpadLink.url;
        source = 'wattpad';
      } else if (wpLink) {
        originalLink = wpLink.url;
        source = 'wordpress';
      }
    }

    // Check existing
    const existing = await Novel.findOne({ 
      $or: [
        { originalLink },
        { title: post.title, author: post.author }
      ]
    });

    if (existing) {
      console.log(`  ⏭️ Already exists: ${post.title.substring(0, 40)}...`);
      return { status: 'skipped', reason: 'exists' };
    }

    // Extract tags from description
    const descTags = extractTagsFromDescription(post.description || '');
    const allRawTags = [...new Set([...(post.rawTags || []), ...descTags])];

    // Normalize tags
    const standardTags = await normalizeTags(allRawTags);

    const novelData = {
      title: post.title,
      author: post.author || 'Unknown',
      description: post.description || '',
      coverImage: post.coverImage || null,
      originalLink,
      rawTags: allRawTags,
      standardTags,
      source,
      chapterCount: post.chapterCount || 0,
      status: post.status || 'unknown',
    };

    const novel = new Novel(novelData);
    await novel.save();

    console.log(`  ✅ Saved: ${post.title.substring(0, 40)}... [${standardTags.length} tags]`);
    return { status: 'saved', novel };

  } catch (error) {
    if (error.code === 11000) {
      console.log(`  ⏭️ Duplicate: ${post.title.substring(0, 40)}...`);
      return { status: 'skipped', reason: 'duplicate' };
    }
    console.error(`  ❌ Error saving ${post.title}:`, error.message);
    return { status: 'error', error: error.message };
  }
}

async function main() {
  console.log('\n📚 ========================================');
  console.log('   GÓC NHỎ ĐU DANMEI - CRAWLER & SEEDER');
  console.log('========================================\n');
  console.log(`Config: maxPages=${maxPages}, category=${categoryType}`);

  await connectDB();

  // Get initial stats
  const initialCount = await Novel.countDocuments();
  console.log(`📊 Current novels in DB: ${initialCount}\n`);

  // Crawl based on category
  let posts = [];
  
  if (categoryType === 'hoan') {
    console.log('🔍 Crawling: Tủ truyện hoàn...\n');
    posts = await crawlCategory(CATEGORIES.TU_TRUYEN_HOAN, maxPages, 2000);
  } else if (categoryType === 'chua-hoan') {
    console.log('🔍 Crawling: Truyện chưa hoàn...\n');
    posts = await crawlCategory(CATEGORIES.TRUYEN_CHUA_HOAN, maxPages, 2000);
  } else {
    console.log('🔍 Crawling all categories...\n');
    posts = await crawlAllCategories(maxPages);
  }

  console.log(`\n📝 Found ${posts.length} posts to process\n`);

  // Filter out fanfics
  const filteredPosts = posts.filter(p => !isFanfic(p));
  console.log(`📝 After filtering fanfics: ${filteredPosts.length} posts\n`);

  // Stats
  const stats = {
    saved: 0,
    skipped: 0,
    errors: 0,
  };

  // Save to DB
  for (let i = 0; i < filteredPosts.length; i++) {
    const post = filteredPosts[i];
    console.log(`[${i + 1}/${filteredPosts.length}] Processing: ${post.title.substring(0, 50)}...`);
    
    const result = await saveNovel(post);
    
    if (result.status === 'saved') stats.saved++;
    else if (result.status === 'skipped') stats.skipped++;
    else stats.errors++;

    // Small delay
    if (i < filteredPosts.length - 1) {
      await delay(DELAY_BETWEEN_SAVES);
    }
  }

  // Final stats
  const finalCount = await Novel.countDocuments();

  console.log('\n========================================');
  console.log('              📊 SUMMARY');
  console.log('========================================');
  console.log(`✅ Saved:   ${stats.saved}`);
  console.log(`⏭️ Skipped: ${stats.skipped}`);
  console.log(`❌ Errors:  ${stats.errors}`);
  console.log('----------------------------------------');
  console.log(`📚 Total novels in DB: ${finalCount} (+${finalCount - initialCount})`);
  console.log('========================================\n');

  await mongoose.connection.close();
  console.log('👋 Done!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
