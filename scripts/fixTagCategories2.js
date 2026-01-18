require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

async function fixTagCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📚 Connected to MongoDB');
  
  // 1. Đam Mỹ và BL Hàn -> genre (thể loại chính)
  const genreTags = ['Đam Mỹ', 'BL Hàn', 'Bách Hợp', 'Ngôn Tình'];
  
  for (const tag of genreTags) {
    const result = await TagDictionary.updateMany(
      { standardTag: tag },
      { $set: { category: 'genre', priority: 100 } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ ${tag} -> genre (priority: 100)`);
    }
  }
  
  // 2. Cường Cường và các tag tương tự -> character
  const characterTags = [
    'Cường Cường', 'Cường Công Cường Thụ',
    'Chủ Công', 'Chủ Thụ',
    'Hắc Hóa Công', 'Hắc Hóa Thụ',
    'Bá Đạo Công', 'Phúc Hắc Công', 'Ôn Nhu Công', 'Lãnh Đạm Công',
    'Nhược Thụ', 'Cao Lãnh Thụ', 'Ngây Thơ Thụ',
    'Đại Thúc Thụ', 'Bình Phàm Thụ', 'Bình Phàm Công',
    'Tra Công', 'Tra Thụ',
    'Tổng Tài', 'Minh Tinh', 'Bác Sĩ'
  ];
  
  for (const tag of characterTags) {
    const result = await TagDictionary.updateMany(
      { standardTag: tag },
      { $set: { category: 'character' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ ${tag} -> character`);
    }
  }
  
  // 3. Kiểm tra lại
  console.log('\n=== KIỂM TRA ===');
  const damMy = await TagDictionary.findOne({ standardTag: 'Đam Mỹ' });
  const blHan = await TagDictionary.findOne({ standardTag: 'BL Hàn' });
  const cuongCuong = await TagDictionary.findOne({ standardTag: 'Cường Cường' });
  
  console.log('Đam Mỹ:', damMy?.category, '| priority:', damMy?.priority);
  console.log('BL Hàn:', blHan?.category, '| priority:', blHan?.priority);
  console.log('Cường Cường:', cuongCuong?.category);
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

fixTagCategories();
