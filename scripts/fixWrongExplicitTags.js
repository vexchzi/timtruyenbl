require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeTags } = require('../utils/tagNormalizer');

// Keywords thật sự chỉ 18+/Thô tục
const EXPLICIT_KEYWORDS = [
  'thô tục', 'thotuc', '18+', 'smut', 'cao h', 'caoh',
  'h nặng', 'hnang', 'nc-17', 'nc17', 'mature',
  'lemon', 'lime', 'r18', 'r-18', 'nsfw',
  'cảnh nóng', 'canhnong', 'xxx', 'porn',
  'dâm', 'dam', 'tục', 'tuc', 'h văn', 'hvan'
];

function isReallyExplicit(novel) {
  const textToCheck = `${novel.title} ${novel.description || ''} ${(novel.rawTags || []).join(' ')}`.toLowerCase();
  return EXPLICIT_KEYWORDS.some(kw => textToCheck.includes(kw));
}

async function fixWrongTags() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📚 Connected to MongoDB');
  
  // Tìm những truyện CHỈ có tags 18+ và Thô Tục
  const novelsToCheck = await Novel.find({
    standardTags: { $all: ['18+', 'Thô Tục'], $size: 2 }
  });
  
  console.log(`\n🔍 Tìm thấy ${novelsToCheck.length} truyện có tags [18+, Thô Tục]`);
  
  let fixed = 0;
  let deleted = 0;
  
  for (const novel of novelsToCheck) {
    const isExplicit = isReallyExplicit(novel);
    
    if (!isExplicit) {
      // Truyện KHÔNG thật sự là 18+, cần sửa tags hoặc xóa
      console.log(`\n❌ Sai tag: ${novel.title.substring(0, 50)}...`);
      console.log(`   Raw tags: ${(novel.rawTags || []).join(', ')}`);
      
      // Thử normalize tags đúng
      const allTags = [...(novel.rawTags || [])];
      const normalizedTags = await normalizeTags(allTags);
      
      if (normalizedTags.length > 0) {
        // Có tags đúng, cập nhật
        novel.standardTags = normalizedTags;
        await novel.save();
        console.log(`   ✅ Đã sửa thành: ${normalizedTags.join(', ')}`);
        fixed++;
      } else {
        // Không có tags gì, xóa truyện
        await Novel.deleteOne({ _id: novel._id });
        console.log(`   🗑️  Đã xóa (không có tags phù hợp)`);
        deleted++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 KẾT QUẢ:`);
  console.log(`   ✅ Đã sửa tags: ${fixed} truyện`);
  console.log(`   🗑️  Đã xóa: ${deleted} truyện`);
  console.log('='.repeat(50));
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

fixWrongTags();
