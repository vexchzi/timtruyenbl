require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { getNovelDetails } = require('../services/navyteamCrawler');

async function updateMissingDescriptions() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📚 Connected to MongoDB');
  
  // Tìm các truyện NavyTeam thiếu mô tả
  const novels = await Novel.find({
    source: 'navyteam',
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: '' },
      { description: 'Chưa có giới thiệu.' }
    ]
  });
  
  console.log(`\n📝 Tìm thấy ${novels.length} truyện thiếu mô tả`);
  
  if (novels.length === 0) {
    console.log('✅ Tất cả truyện đã có mô tả!');
    mongoose.disconnect();
    return;
  }
  
  let updated = 0;
  let failed = 0;
  
  for (let i = 0; i < novels.length; i++) {
    const novel = novels[i];
    console.log(`[${i+1}/${novels.length}] ${novel.title.substring(0, 50)}...`);
    
    try {
      const details = await getNovelDetails(novel.originalLink);
      
      if (details && details.description && details.description.length > 50) {
        novel.description = details.description;
        
        // Cũng xóa tag Đam Mỹ nếu có
        if (novel.standardTags.includes('Đam Mỹ')) {
          novel.standardTags = novel.standardTags.filter(t => t !== 'Đam Mỹ');
        }
        
        await novel.save();
        updated++;
        console.log(`   ✅ Đã cập nhật (${details.description.length} chars)`);
      } else {
        failed++;
        console.log(`   ⚠️ Không lấy được mô tả`);
      }
      
      // Delay
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (error) {
      failed++;
      console.log(`   ❌ Lỗi: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 KẾT QUẢ:`);
  console.log(`   ✅ Đã cập nhật: ${updated}`);
  console.log(`   ❌ Thất bại: ${failed}`);
  console.log('='.repeat(50));
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

updateMissingDescriptions();
