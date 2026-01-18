require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeTags } = require('../utils/tagNormalizer');
const { crawlNavyTeam, getNovelDetails } = require('../services/navyteamCrawler');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('📚 Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedNavyTeam() {
  const maxPages = parseInt(process.argv[2]) || 20;
  
  console.log(`\n🇰🇷 Bắt đầu seed từ NavyTeam (${maxPages} trang)`);
  
  // Lấy danh sách truyện
  const novelList = await crawlNavyTeam(maxPages);
  
  if (novelList.length === 0) {
    console.log('❌ Không tìm thấy truyện nào');
    mongoose.disconnect();
    return;
  }
  
  console.log(`\n📖 Bắt đầu lấy chi tiết ${novelList.length} truyện...`);
  console.log('='.repeat(60));
  
  let added = 0;
  let skipped = 0;
  let existing = 0;
  let failed = 0;
  
  for (let i = 0; i < novelList.length; i++) {
    const item = novelList[i];
    
    // Kiểm tra đã tồn tại
    const exists = await Novel.findOne({ originalLink: item.link });
    if (exists) {
      console.log(`[${i+1}/${novelList.length}] 📦 Đã tồn tại: ${item.title.substring(0, 40)}...`);
      existing++;
      continue;
    }
    
    // Lấy chi tiết
    console.log(`[${i+1}/${novelList.length}] 🔍 Đang lấy: ${item.title.substring(0, 40)}...`);
    const details = await getNovelDetails(item.link);
    
    if (!details || !details.title) {
      console.log(`   ❌ Không lấy được chi tiết`);
      failed++;
      continue;
    }
    
    // Normalize tags - thêm BL Hàn
    let allTags = [...details.rawTags];
    let normalizedTags = await normalizeTags(allTags);
    
    // Đảm bảo có tag BL Hàn
    if (!normalizedTags.includes('BL Hàn')) {
      normalizedTags.push('BL Hàn');
    }
    
    // KHÔNG gắn tag Đam Mỹ cho BL Hàn (đây là 2 category khác nhau)
    normalizedTags = normalizedTags.filter(t => t !== 'Đam Mỹ');
    
    try {
      const novel = new Novel({
        title: details.title,
        author: details.author,
        description: details.description,
        coverImage: details.coverImage || item.cover,
        originalLink: details.originalLink,
        rawTags: details.rawTags,
        standardTags: normalizedTags,
        source: 'navyteam',
        status: 'unknown'
      });
      
      await novel.save();
      added++;
      console.log(`   ✅ Đã thêm: ${details.title.substring(0, 50)}...`);
      console.log(`      Tags: ${normalizedTags.join(', ')}`);
      
    } catch (error) {
      if (error.code === 11000) {
        existing++;
        console.log(`   📦 Đã tồn tại (duplicate)`);
      } else {
        failed++;
        console.log(`   ❌ Lỗi: ${error.message}`);
      }
    }
    
    // Delay
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 KẾT QUẢ SEED NAVYTEAM:`);
  console.log(`   ✅ Đã thêm: ${added}`);
  console.log(`   📦 Đã tồn tại: ${existing}`);
  console.log(`   ❌ Thất bại: ${failed}`);
  console.log('='.repeat(60));
  
  mongoose.disconnect();
  console.log('\n🔌 Đã ngắt kết nối');
}

seedNavyTeam();
