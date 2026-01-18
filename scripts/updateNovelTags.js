#!/usr/bin/env node
/**
 * CLI script để cập nhật tags cho novel
 * 
 * Usage:
 *   node scripts/updateNovelTags.js <novel_id> <tag1> <tag2> ...
 *   node scripts/updateNovelTags.js --search "tên truyện" 
 *   node scripts/updateNovelTags.js --list-tags
 * 
 * Examples:
 *   node scripts/updateNovelTags.js 696d246975d5e90c6a18cdcf "Đam Mỹ" "Happy Ending" "Sủng"
 *   node scripts/updateNovelTags.js --search "Xuyên thành ba"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel, TagDictionary } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI;

async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

async function disconnect() {
  await mongoose.disconnect();
}

async function listTags() {
  const tags = await TagDictionary.find({ isActive: true })
    .select('standardTag category')
    .sort({ category: 1, standardTag: 1 })
    .lean();
  
  const byCategory = {};
  for (const t of tags) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t.standardTag);
  }
  
  console.log('\n📋 Danh sách tags theo category:\n');
  for (const [cat, tagList] of Object.entries(byCategory)) {
    console.log(`[${cat}]`);
    console.log('  ' + tagList.join(', '));
    console.log();
  }
}

async function searchNovels(query) {
  const novels = await Novel.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { author: { $regex: query, $options: 'i' } }
    ]
  })
  .select('_id title author standardTags')
  .limit(20)
  .lean();
  
  if (novels.length === 0) {
    console.log('❌ Không tìm thấy truyện nào.');
    return;
  }
  
  console.log(`\n🔍 Tìm thấy ${novels.length} truyện:\n`);
  for (const n of novels) {
    console.log(`ID: ${n._id}`);
    console.log(`   Tên: ${n.title}`);
    console.log(`   Tác giả: ${n.author || 'N/A'}`);
    console.log(`   Tags: ${(n.standardTags || []).join(', ') || '(chưa có)'}`);
    console.log();
  }
}

async function updateTags(novelId, tags) {
  const novel = await Novel.findById(novelId);
  if (!novel) {
    console.log('❌ Không tìm thấy truyện với ID:', novelId);
    return;
  }
  
  console.log(`\n📖 Truyện: ${novel.title}`);
  console.log(`   Tags cũ: ${(novel.standardTags || []).join(', ') || '(chưa có)'}`);
  
  novel.standardTags = tags;
  novel.updatedAt = new Date();
  await novel.save();
  
  console.log(`   Tags mới: ${tags.join(', ')}`);
  console.log('✅ Đã cập nhật thành công!');
}

async function addTags(novelId, tagsToAdd) {
  const novel = await Novel.findById(novelId);
  if (!novel) {
    console.log('❌ Không tìm thấy truyện với ID:', novelId);
    return;
  }
  
  const currentTags = new Set(novel.standardTags || []);
  for (const t of tagsToAdd) {
    currentTags.add(t);
  }
  
  console.log(`\n📖 Truyện: ${novel.title}`);
  console.log(`   Tags cũ: ${(novel.standardTags || []).join(', ') || '(chưa có)'}`);
  
  novel.standardTags = Array.from(currentTags);
  novel.updatedAt = new Date();
  await novel.save();
  
  console.log(`   Tags mới: ${novel.standardTags.join(', ')}`);
  console.log('✅ Đã thêm tags thành công!');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📝 Cách dùng:
  
  Liệt kê tất cả tags:
    node scripts/updateNovelTags.js --list-tags
  
  Tìm truyện:
    node scripts/updateNovelTags.js --search "tên truyện"
  
  Cập nhật tags (thay thế hoàn toàn):
    node scripts/updateNovelTags.js <novel_id> "Tag 1" "Tag 2" "Tag 3"
  
  Thêm tags (giữ nguyên tags cũ):
    node scripts/updateNovelTags.js --add <novel_id> "Tag mới 1" "Tag mới 2"
`);
    return;
  }
  
  await connect();
  
  try {
    if (args[0] === '--list-tags') {
      await listTags();
    } else if (args[0] === '--search' && args[1]) {
      await searchNovels(args[1]);
    } else if (args[0] === '--add' && args[1]) {
      const novelId = args[1];
      const tags = args.slice(2);
      if (tags.length === 0) {
        console.log('❌ Cần ít nhất 1 tag để thêm.');
      } else {
        await addTags(novelId, tags);
      }
    } else if (args[0] && !args[0].startsWith('--')) {
      const novelId = args[0];
      const tags = args.slice(1);
      if (tags.length === 0) {
        // Chỉ xem thông tin
        const novel = await Novel.findById(novelId).lean();
        if (novel) {
          console.log(`\n📖 Truyện: ${novel.title}`);
          console.log(`   Tác giả: ${novel.author || 'N/A'}`);
          console.log(`   Tags: ${(novel.standardTags || []).join(', ') || '(chưa có)'}`);
        } else {
          console.log('❌ Không tìm thấy truyện.');
        }
      } else {
        await updateTags(novelId, tags);
      }
    } else {
      console.log('❌ Lệnh không hợp lệ. Chạy không có tham số để xem hướng dẫn.');
    }
  } finally {
    await disconnect();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
