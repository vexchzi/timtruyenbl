require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { getNovelDetails } = require('../services/navyteamCrawler');

async function fixNavyTeamNovels() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📚 Connected to MongoDB');
  
  // Lấy tất cả truyện NavyTeam
  const novels = await Novel.find({ source: 'navyteam' });
  console.log(`\n🔧 Sửa ${novels.length} truyện NavyTeam...`);
  
  let fixed = 0;
  let descUpdated = 0;
  
  for (let i = 0; i < novels.length; i++) {
    const novel = novels[i];
    let needSave = false;
    
    // 1. Xóa tag "Đam Mỹ"
    if (novel.standardTags.includes('Đam Mỹ')) {
      novel.standardTags = novel.standardTags.filter(t => t !== 'Đam Mỹ');
      needSave = true;
      fixed++;
    }
    
    // 2. Cập nhật mô tả nếu thiếu
    if (!novel.description || novel.description.length < 50) {
      console.log(`[${i+1}/${novels.length}] Lấy mô tả: ${novel.title.substring(0, 40)}...`);
      
      const details = await getNovelDetails(novel.originalLink);
      if (details && details.description && details.description.length > 50) {
        novel.description = details.description;
        descUpdated++;
        needSave = true;
        console.log(`   ✅ Đã cập nhật mô tả (${details.description.length} chars)`);
      }
      
      // Delay
      await new Promise(r => setTimeout(r, 1000));
    }
    
    if (needSave) {
      await novel.save();
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 KẾT QUẢ:`);
  console.log(`   🏷️  Đã xóa tag Đam Mỹ: ${fixed} truyện`);
  console.log(`   📝 Đã cập nhật mô tả: ${descUpdated} truyện`);
  console.log('='.repeat(50));
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

fixNavyTeamNovels();
