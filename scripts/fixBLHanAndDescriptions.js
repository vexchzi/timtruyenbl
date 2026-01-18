require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { getNovelDetails } = require('../services/navyteamCrawler');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📚 Connected to MongoDB');
  
  // 1. Xóa tag "Đam Mỹ" khỏi các truyện có "BL Hàn"
  console.log('\n🏷️ Xóa tag "Đam Mỹ" khỏi truyện BL Hàn...');
  const result = await Novel.updateMany(
    { standardTags: { $all: ['BL Hàn', 'Đam Mỹ'] } },
    { $pull: { standardTags: 'Đam Mỹ' } }
  );
  console.log(`   ✅ Đã xóa từ ${result.modifiedCount} truyện`);
  
  // 2. Tìm và cập nhật mô tả cho NavyTeam novels
  console.log('\n📝 Tìm truyện NavyTeam thiếu mô tả...');
  const novelsWithoutDesc = await Novel.find({
    source: 'navyteam',
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: '' },
      { description: { $regex: /^.{0,30}$/ } }
    ]
  });
  
  console.log(`   Tìm thấy ${novelsWithoutDesc.length} truyện thiếu mô tả`);
  
  if (novelsWithoutDesc.length === 0) {
    console.log('✅ Tất cả truyện đã có mô tả!');
    mongoose.disconnect();
    return;
  }
  
  let updated = 0;
  let failed = 0;
  
  for (let i = 0; i < novelsWithoutDesc.length; i++) {
    const novel = novelsWithoutDesc[i];
    console.log(`[${i+1}/${novelsWithoutDesc.length}] ${novel.title.substring(0, 45)}...`);
    
    try {
      const details = await getNovelDetails(novel.originalLink);
      
      if (details && details.description && details.description.length > 30) {
        novel.description = details.description;
        await novel.save();
        updated++;
        console.log(`   ✅ (${details.description.length} chars)`);
      } else {
        failed++;
        console.log(`   ⚠️ Không lấy được mô tả`);
      }
      
      // Delay
      await new Promise(r => setTimeout(r, 1200));
      
    } catch (error) {
      failed++;
      console.log(`   ❌ Lỗi: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 KẾT QUẢ:`);
  console.log(`   🏷️ Đã xóa tag Đam Mỹ từ BL Hàn: ${result.modifiedCount}`);
  console.log(`   📝 Đã cập nhật mô tả: ${updated}`);
  console.log(`   ❌ Thất bại: ${failed}`);
  console.log('='.repeat(50));
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

fix();
