/**
 * Seed từ dammymoihoan.wordpress.com
 * 
 * Chạy: node scripts/seedFromWordpress.js
 * Hoặc: node scripts/seedFromWordpress.js --pages 10
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');
const { crawlMultiplePages, crawlPostDetail, crawlByTag } = require('../services/wordpressCrawler');
const { normalizeTags } = require('../utils/tagNormalizer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novel_recommender';

// Config
const DEFAULT_PAGES = 5;
const DELAY_BETWEEN_DETAILS = 1500; // 1.5s

// Stats
const stats = {
  totalPosts: 0,
  saved: 0,
  duplicates: 0,
  errors: 0,
  startTime: null
};

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Lưu truyện vào DB
 */
async function saveNovel(novelData) {
  try {
    // Check duplicate bằng title (vì không có originalLink từ Wattpad)
    const exists = await Novel.findOne({
      $or: [
        { title: novelData.title },
        { originalLink: novelData.postUrl }
      ]
    });

    if (exists) {
      console.log(`[Seed WP] ⏭️  Skip duplicate: "${novelData.title}"`);
      return { saved: false, duplicate: true };
    }

    // Normalize tags
    const standardTags = await normalizeTags(novelData.rawTags);

    const novel = new Novel({
      title: novelData.title,
      originalLink: novelData.postUrl, // Link bài review
      source: 'wordpress',
      author: novelData.author || 'Unknown',
      description: novelData.description || '',
      coverImage: novelData.coverImage || null,
      rawTags: novelData.rawTags,
      standardTags,
      status: novelData.status || 'unknown'
    });

    await novel.save();
    console.log(`[Seed WP] ✅ Saved: "${novel.title}" (${standardTags.length} tags)`);
    return { saved: true, duplicate: false };

  } catch (error) {
    if (error.code === 11000) {
      return { saved: false, duplicate: true };
    }
    console.error(`[Seed WP] ❌ Error saving:`, error.message);
    return { saved: false, duplicate: false, error: true };
  }
}

/**
 * Main seed function
 */
async function seedFromWordpress(maxPages = DEFAULT_PAGES) {
  console.log('🚀 SEED FROM DAMMYMOIHOAN.WORDPRESS.COM');
  console.log('='.repeat(60));

  stats.startTime = Date.now();

  try {
    // Connect DB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!');

    // Crawl danh sách bài viết
    console.log(`\n📖 Crawling ${maxPages} pages...`);
    const posts = await crawlMultiplePages(maxPages, 2000);
    stats.totalPosts = posts.length;

    console.log(`\n📚 Found ${posts.length} posts. Processing...`);

    // Xử lý từng bài
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n[${i + 1}/${posts.length}] ${post.title}`);

      try {
        // Lấy chi tiết bài viết
        const detail = await crawlPostDetail(post.postUrl);

        // Merge data
        const novelData = {
          ...post,
          ...detail,
          rawTags: [...new Set([...(post.rawTags || []), ...(detail.theLoai || [])])],
        };

        // Lưu vào DB
        const result = await saveNovel(novelData);

        if (result.saved) stats.saved++;
        else if (result.duplicate) stats.duplicates++;
        else if (result.error) stats.errors++;

      } catch (error) {
        console.error(`[Seed WP] Error processing post:`, error.message);
        stats.errors++;
      }

      // Delay
      if (i < posts.length - 1) {
        await delay(DELAY_BETWEEN_DETAILS);
      }
    }

    // Print stats
    const duration = Math.round((Date.now() - stats.startTime) / 1000);
    console.log('\n' + '='.repeat(60));
    console.log('📊 STATISTICS');
    console.log('='.repeat(60));
    console.log(`   Total Posts:     ${stats.totalPosts}`);
    console.log(`   Saved:           ${stats.saved}`);
    console.log(`   Duplicates:      ${stats.duplicates}`);
    console.log(`   Errors:          ${stats.errors}`);
    console.log(`   Duration:        ${duration}s`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

/**
 * Seed theo tag cụ thể
 */
async function seedByTag(tag, maxPages = 3) {
  console.log(`🚀 SEED BY TAG: ${tag}`);
  console.log('='.repeat(60));

  stats.startTime = Date.now();

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const posts = await crawlByTag(tag, maxPages);
    stats.totalPosts = posts.length;

    console.log(`\n📚 Found ${posts.length} posts with tag "${tag}"`);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n[${i + 1}/${posts.length}] ${post.title}`);

      const detail = await crawlPostDetail(post.postUrl);
      const novelData = {
        ...post,
        ...detail,
        rawTags: [...new Set([...(post.rawTags || []), ...(detail.theLoai || [])])],
      };

      const result = await saveNovel(novelData);
      if (result.saved) stats.saved++;
      else if (result.duplicate) stats.duplicates++;

      await delay(1500);
    }

    console.log(`\n✅ Saved ${stats.saved} novels from tag "${tag}"`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📖 Seed từ dammymoihoan.wordpress.com

Usage:
  node scripts/seedFromWordpress.js                    # Seed 5 trang đầu
  node scripts/seedFromWordpress.js --pages 10         # Seed 10 trang
  node scripts/seedFromWordpress.js --tag hien-dai     # Seed theo tag
  node scripts/seedFromWordpress.js --tag co-trang --pages 5

Options:
  --pages <n>    Số trang cần crawl (default: 5)
  --tag <slug>   Crawl theo tag cụ thể
  --help         Hiển thị help
  `);
  process.exit(0);
}

// Parse args
const pagesIndex = args.indexOf('--pages');
const tagIndex = args.indexOf('--tag');

const pages = pagesIndex !== -1 ? parseInt(args[pagesIndex + 1], 10) : DEFAULT_PAGES;
const tag = tagIndex !== -1 ? args[tagIndex + 1] : null;

if (tag) {
  seedByTag(tag, pages);
} else {
  seedFromWordpress(pages);
}
