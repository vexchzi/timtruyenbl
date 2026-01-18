/**
 * Verify tags được cập nhật đúng
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Tìm truyện có "sinh tử" hoặc "điền văn"
  console.log('📚 Novels with "Sinh Tử" tag:');
  const sinhTuNovels = await Novel.find({ standardTags: 'Sinh Tử' })
    .select('title standardTags')
    .limit(5);
  sinhTuNovels.forEach(n => console.log(`  - ${n.title.substring(0, 50)}...`));
  console.log(`  Total: ${await Novel.countDocuments({ standardTags: 'Sinh Tử' })}\n`);

  console.log('📚 Novels with "Điền Văn" tag:');
  const dienVanNovels = await Novel.find({ standardTags: 'Điền Văn' })
    .select('title standardTags')
    .limit(5);
  dienVanNovels.forEach(n => console.log(`  - ${n.title.substring(0, 50)}...`));
  console.log(`  Total: ${await Novel.countDocuments({ standardTags: 'Điền Văn' })}\n`);

  // Tìm truyện "[REPOST] Đừng chạy"
  console.log('🔍 Searching for "[REPOST] Đừng chạy":');
  const testNovel = await Novel.findOne({ title: { $regex: 'Đừng chạy.*Mẹ', $options: 'i' } })
    .select('title description rawTags standardTags');
  
  if (testNovel) {
    console.log(`  Title: ${testNovel.title}`);
    console.log(`  Description: ${testNovel.description?.substring(0, 200)}...`);
    console.log(`  rawTags: ${testNovel.rawTags?.join(', ')}`);
    console.log(`  standardTags: ${testNovel.standardTags?.join(', ')}`);
  } else {
    console.log('  Not found');
  }

  await mongoose.disconnect();
}

main().catch(console.error);
