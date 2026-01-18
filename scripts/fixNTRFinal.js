/**
 * Fix tag NTR bị gán sai do match substring
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');
const { normalizeTags } = require('../utils/tagNormalizer');

// Test cases
const TEST_TAGS = [
  // Không nên có NTR (substring)
  ['thanhxuânvườntrường', 'hiệnđại'],
  ['duyêntrờitáchợp', 'cườngcường'],
  ['vuontruong'],
  
  // Nên có NTR (real NTR)
  ['NTR', 'đam mỹ'],
  ['ntr', 'hiện đại'],
  ['ngoại tình', 'ngược'],
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Test normalizeTags
  console.log('=== TESTING normalizeTags ===\n');
  for (const tags of TEST_TAGS) {
    const result = await normalizeTags(tags);
    const hasNTR = result.includes('NTR');
    console.log(`Input: ${JSON.stringify(tags)}`);
    console.log(`Output: ${JSON.stringify(result)}`);
    console.log(`Has NTR: ${hasNTR ? '⚠️ YES' : '✓ NO'}\n`);
  }

  // Xóa tag NTR khỏi những truyện bị gán sai
  console.log('\n=== REMOVING WRONG NTR TAGS ===\n');
  
  const ntrNovels = await Novel.find({ standardTags: 'NTR' })
    .select('title rawTags description standardTags')
    .lean();

  console.log(`Total novels with NTR tag: ${ntrNovels.length}`);
  
  let removed = 0;
  const toRemove = [];

  for (const novel of ntrNovels) {
    // Re-normalize tags để kiểm tra
    const newTags = await normalizeTags(novel.rawTags || []);
    
    // Nếu sau khi re-normalize không có NTR thì xóa
    if (!newTags.includes('NTR')) {
      toRemove.push(novel);
    }
  }

  console.log(`\nNovels to remove NTR from: ${toRemove.length}`);
  
  for (const novel of toRemove) {
    await Novel.updateOne(
      { _id: novel._id },
      { $pull: { standardTags: 'NTR' } }
    );
    console.log(`✓ Removed NTR from: "${novel.title}"`);
    removed++;
  }

  console.log(`\n✅ Total removed: ${removed}`);

  // Verify
  const remaining = await Novel.countDocuments({ standardTags: 'NTR' });
  console.log(`Remaining novels with NTR: ${remaining}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(console.error);
