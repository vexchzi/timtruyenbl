/**
 * Gộp các tags tương tự
 * - Hào Môn + Hào Môn Thế Gia -> Hào Môn
 * - Tu Tiên + Tu Chân -> Tu Tiên
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');
const Novel = require('../models/Novel');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // 1. Gộp Hào Môn Thế Gia vào Hào Môn
  console.log('=== Gộp Hào Môn Thế Gia -> Hào Môn ===');
  
  // Cập nhật novels: thêm Hào Môn trước
  await Novel.updateMany(
    { standardTags: 'Hào Môn Thế Gia' },
    { $addToSet: { standardTags: 'Hào Môn' } }
  );
  // Sau đó xóa Hào Môn Thế Gia
  const haoMonResult = await Novel.updateMany(
    { standardTags: 'Hào Môn Thế Gia' },
    { $pull: { standardTags: 'Hào Môn Thế Gia' } }
  );
  console.log(`  Updated ${haoMonResult.modifiedCount} novels`);
  
  // Chuyển aliases từ Hào Môn Thế Gia sang Hào Môn
  const haoMonTheGia = await TagDictionary.findOne({ standardTag: 'Hào Môn Thế Gia' });
  const haoMon = await TagDictionary.findOne({ standardTag: 'Hào Môn' });
  
  if (haoMonTheGia && haoMon) {
    // Merge aliases
    const newAliases = [...new Set([...haoMon.aliases, ...haoMonTheGia.aliases, 'hào môn thế gia', 'haomonthegia'])];
    haoMon.aliases = newAliases;
    haoMon.description = 'Bối cảnh gia đình quyền quý, danh gia vọng tộc, hào môn thế gia';
    await haoMon.save();
    
    // Xóa tag Hào Môn Thế Gia
    await TagDictionary.deleteOne({ standardTag: 'Hào Môn Thế Gia' });
    console.log('  Merged aliases and deleted Hào Môn Thế Gia');
  }

  // 2. Gộp Tu Chân vào Tu Tiên
  console.log('\n=== Gộp Tu Chân -> Tu Tiên ===');
  
  await Novel.updateMany(
    { standardTags: 'Tu Chân' },
    { $addToSet: { standardTags: 'Tu Tiên' } }
  );
  const tuChanResult = await Novel.updateMany(
    { standardTags: 'Tu Chân' },
    { $pull: { standardTags: 'Tu Chân' } }
  );
  console.log(`  Updated ${tuChanResult.modifiedCount} novels`);
  
  const tuChan = await TagDictionary.findOne({ standardTag: 'Tu Chân' });
  const tuTien = await TagDictionary.findOne({ standardTag: 'Tu Tiên' });
  
  if (tuChan && tuTien) {
    const newAliases = [...new Set([...tuTien.aliases, ...tuChan.aliases, 'tu chân', 'tuchan'])];
    tuTien.aliases = newAliases;
    tuTien.description = 'Bối cảnh tu luyện thành tiên, tu chân, tiên hiệp';
    await tuTien.save();
    
    await TagDictionary.deleteOne({ standardTag: 'Tu Chân' });
    console.log('  Merged aliases and deleted Tu Chân');
  }

  console.log('\n✅ Done!');
  await mongoose.disconnect();
}

main().catch(console.error);
