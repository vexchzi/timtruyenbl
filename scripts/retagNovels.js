#!/usr/bin/env node
/**
 * Script tự động quét và gắn lại tags cho truyện
 * 
 * Dựa trên rawTags có sẵn → chuyển thành standardTags qua TagDictionary
 * 
 * Usage:
 *   node scripts/retagNovels.js                     # Quét tất cả truyện chưa có tag
 *   node scripts/retagNovels.js --all               # Quét TẤT CẢ truyện (kể cả đã có tag)
 *   node scripts/retagNovels.js --source wattpad    # Chỉ quét truyện từ nguồn cụ thể
 *   node scripts/retagNovels.js --dry-run           # Chỉ xem kết quả, không lưu
 *   node scripts/retagNovels.js --limit 100         # Giới hạn số truyện xử lý
 *   node scripts/retagNovels.js --id <novel_id>     # Quét 1 truyện cụ thể
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel, TagDictionary } = require('../models');
const { normalizeTags, warmUpCache, clearCache } = require('../utils/tagNormalizer');

const MONGODB_URI = process.env.MONGODB_URI;

// Parse arguments
const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  dryRun: args.includes('--dry-run'),
  source: null,
  limit: null,
  novelId: null
};

// Parse --source
const sourceIdx = args.indexOf('--source');
if (sourceIdx !== -1 && args[sourceIdx + 1]) {
  options.source = args[sourceIdx + 1];
}

// Parse --limit
const limitIdx = args.indexOf('--limit');
if (limitIdx !== -1 && args[limitIdx + 1]) {
  options.limit = parseInt(args[limitIdx + 1], 10);
}

// Parse --id
const idIdx = args.indexOf('--id');
if (idIdx !== -1 && args[idIdx + 1]) {
  options.novelId = args[idIdx + 1];
}

async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

async function disconnect() {
  await mongoose.disconnect();
}

async function retagNovel(novel, stats) {
  const rawTags = novel.rawTags || [];
  
  if (rawTags.length === 0) {
    stats.skipped++;
    return null;
  }
  
  // Normalize raw tags to standard tags
  const newStandardTags = await normalizeTags(rawTags);
  
  // Get current tags
  const currentTags = novel.standardTags || [];
  
  // Check if there are changes
  const currentSet = new Set(currentTags);
  const newSet = new Set(newStandardTags);
  
  const added = newStandardTags.filter(t => !currentSet.has(t));
  const removed = currentTags.filter(t => !newSet.has(t));
  
  if (added.length === 0 && removed.length === 0) {
    stats.unchanged++;
    return null;
  }
  
  return {
    novel,
    oldTags: currentTags,
    newTags: newStandardTags,
    added,
    removed
  };
}

async function main() {
  console.log('\n🏷️  RETAG NOVELS SCRIPT');
  console.log('='.repeat(50));
  console.log('Options:', JSON.stringify(options, null, 2));
  console.log('='.repeat(50));
  
  await connect();
  
  // Warm up tag normalizer cache
  console.log('\n🔥 Loading tag dictionary...');
  await warmUpCache();
  
  // Build query
  const query = {};
  
  if (options.novelId) {
    query._id = options.novelId;
  } else {
    // Filter by source if specified
    if (options.source) {
      query.source = { $regex: options.source, $options: 'i' };
    }
    
    // Only novels without tags (unless --all)
    if (!options.all) {
      query.$or = [
        { standardTags: { $exists: false } },
        { standardTags: { $size: 0 } }
      ];
    }
    
    // Must have rawTags to process
    query.rawTags = { $exists: true, $not: { $size: 0 } };
  }
  
  // Count total
  const total = await Novel.countDocuments(query);
  console.log(`\n📊 Found ${total} novels to process`);
  
  if (total === 0) {
    console.log('Nothing to do.');
    await disconnect();
    return;
  }
  
  // Process in batches
  const batchSize = 100;
  const limit = options.limit || total;
  let processed = 0;
  let stats = {
    updated: 0,
    skipped: 0,
    unchanged: 0,
    errors: 0
  };
  
  const changes = [];
  
  console.log(`\n🔄 Processing${options.dryRun ? ' (DRY RUN)' : ''}...`);
  
  while (processed < limit) {
    const batch = await Novel.find(query)
      .select('_id title rawTags standardTags source')
      .skip(processed)
      .limit(Math.min(batchSize, limit - processed))
      .lean();
    
    if (batch.length === 0) break;
    
    for (const novel of batch) {
      try {
        const result = await retagNovel(novel, stats);
        
        if (result) {
          changes.push(result);
          
          if (!options.dryRun) {
            await Novel.updateOne(
              { _id: novel._id },
              { 
                $set: { 
                  standardTags: result.newTags,
                  updatedAt: new Date()
                }
              }
            );
          }
          
          stats.updated++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${novel._id}:`, err.message);
        stats.errors++;
      }
    }
    
    processed += batch.length;
    process.stdout.write(`\r   Processed: ${processed}/${Math.min(limit, total)}`);
  }
  
  console.log('\n');
  
  // Show summary
  console.log('='.repeat(50));
  console.log('📈 SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Total processed: ${processed}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Unchanged: ${stats.unchanged}`);
  console.log(`   Skipped (no rawTags): ${stats.skipped}`);
  console.log(`   Errors: ${stats.errors}`);
  
  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN - No changes were saved');
  }
  
  // Show sample changes
  if (changes.length > 0) {
    console.log('\n📝 Sample changes:');
    const sample = changes.slice(0, 10);
    for (const c of sample) {
      console.log(`\n   "${c.novel.title}"`);
      console.log(`   Source: ${c.novel.source || 'N/A'}`);
      if (c.added.length > 0) {
        console.log(`   + Added: ${c.added.join(', ')}`);
      }
      if (c.removed.length > 0) {
        console.log(`   - Removed: ${c.removed.join(', ')}`);
      }
      console.log(`   → Final: ${c.newTags.join(', ') || '(none)'}`);
    }
    
    if (changes.length > 10) {
      console.log(`\n   ... and ${changes.length - 10} more`);
    }
  }
  
  await disconnect();
  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
