require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

async function addBLHanTag() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📚 Connected to MongoDB');
  
  const blHanTag = {
    keyword: 'bl hàn',
    standardTag: 'BL Hàn',
    category: 'genre',
    priority: 10,
    aliases: [
      'bl hàn', 'blhan', 'bl han', 'korean bl',
      'hàn quốc', 'han quoc', 'korea', 'korean',
      'tiểu thuyết hàn', 'novel hàn', 'truyện hàn',
      'manhwa', 'webtoon bl', 'webnovel hàn',
      'danmei hàn', 'đam mỹ hàn'
    ],
    description: 'Truyện BL/Đam mỹ Hàn Quốc - Korean Boys Love novels'
  };
  
  try {
    // Kiểm tra đã tồn tại chưa
    const exists = await TagDictionary.findOne({ standardTag: 'BL Hàn' });
    if (exists) {
      console.log('⚠️  Tag "BL Hàn" đã tồn tại, cập nhật...');
      await TagDictionary.updateOne(
        { standardTag: 'BL Hàn' },
        { $set: blHanTag }
      );
    } else {
      await TagDictionary.create(blHanTag);
      console.log('✅ Đã thêm tag "BL Hàn"');
    }
    
    // Thêm thêm các aliases riêng
    const additionalAliases = [
      { keyword: 'hàn quốc', standardTag: 'BL Hàn', category: 'genre', priority: 8 },
      { keyword: 'korean', standardTag: 'BL Hàn', category: 'genre', priority: 8 },
      { keyword: 'manhwa', standardTag: 'BL Hàn', category: 'genre', priority: 9 },
      { keyword: 'webtoon', standardTag: 'BL Hàn', category: 'genre', priority: 7 },
    ];
    
    for (const alias of additionalAliases) {
      const aliasExists = await TagDictionary.findOne({ keyword: alias.keyword });
      if (!aliasExists) {
        await TagDictionary.create(alias);
        console.log(`  ✅ Thêm alias: ${alias.keyword}`);
      }
    }
    
    console.log('\n✅ Hoàn tất thêm tag BL Hàn!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await mongoose.disconnect();
}

addBLHanTag();
