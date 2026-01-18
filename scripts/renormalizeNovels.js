/**
 * Re-normalize all novels
 * - Cập nhật standardTags cho tất cả truyện dựa trên TagDictionary mới
 * - Extract tags từ description nếu có
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeTagsWithDescription, clearCache } = require('../utils/tagNormalizer');

async function renormalizeNovels() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Clear tag normalizer cache to load fresh dictionary
    if (clearCache) clearCache();

    const totalNovels = await Novel.countDocuments();
    console.log(`📚 Total novels to process: ${totalNovels}\n`);

    const batchSize = 100;
    let processed = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches
    while (processed < totalNovels) {
      const novels = await Novel.find({})
        .skip(processed)
        .limit(batchSize)
        .select('_id title rawTags standardTags description');

      for (const novel of novels) {
        try {
          // Re-normalize tags - including extraction from description
          const newStandardTags = await normalizeTagsWithDescription(novel.rawTags || [], novel.description || '');
          
          // Check if tags changed
          const oldTags = (novel.standardTags || []).sort().join(',');
          const newTags = newStandardTags.sort().join(',');

          if (oldTags !== newTags) {
            await Novel.updateOne(
              { _id: novel._id },
              { $set: { standardTags: newStandardTags, updatedAt: new Date() } }
            );
            updated++;
            
            // Log changes
            const added = newStandardTags.filter(t => !novel.standardTags?.includes(t));
            const removed = (novel.standardTags || []).filter(t => !newStandardTags.includes(t));
            
            if (added.length > 0 || removed.length > 0) {
              console.log(`  📝 ${novel.title?.slice(0, 40)}...`);
              if (added.length > 0) console.log(`     + Added: ${added.join(', ')}`);
              if (removed.length > 0) console.log(`     - Removed: ${removed.join(', ')}`);
            }
          }
        } catch (err) {
          errors++;
          console.error(`  ❌ Error processing "${novel.title}":`, err.message);
        }
      }

      processed += novels.length;
      const percent = Math.round((processed / totalNovels) * 100);
      console.log(`\n📊 Progress: ${processed}/${totalNovels} (${percent}%) - Updated: ${updated}\n`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 RE-NORMALIZE COMPLETED');
    console.log('='.repeat(50));
    console.log(`📚 Total processed: ${processed}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`⏭️  Unchanged: ${processed - updated - errors}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run
console.log('🔄 Re-normalize Novels Script');
console.log('This will update standardTags for all novels based on current TagDictionary\n');

renormalizeNovels();
