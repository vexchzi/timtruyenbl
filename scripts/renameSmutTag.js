require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');
const Novel = require('../models/Novel');

async function renameSmutTo18Plus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Đổi tên tag Smut thành 18+ trong TagDictionary
    console.log('=== Đổi tên Smut -> 18+ ===');
    
    const smutTag = await TagDictionary.findOne({ standardTag: 'Smut' });
    if (smutTag) {
      // Lấy tất cả aliases của Smut
      const smutAliases = smutTag.aliases || [];
      
      // Cập nhật thành 18+
      await TagDictionary.updateOne(
        { standardTag: 'Smut' },
        { 
          $set: { 
            standardTag: '18+',
            keyword: '18+',
            description: 'Nội dung dành cho người trưởng thành (18+), có cảnh nóng/giường chiếu'
          }
        }
      );
      console.log('  Updated TagDictionary: Smut -> 18+');
      
      // Thêm các aliases mới
      const newAliases = ['smut', 'cao h', 'caoh', '18+', 'r18', 'nc17', 'nc-17', 'mature', 'adult', 'lemon', 'h văn', 'hvan', 'thịt', 'thit', 'nặng đô', 'nang do'];
      await TagDictionary.updateOne(
        { standardTag: '18+' },
        { $addToSet: { aliases: { $each: newAliases } } }
      );
      console.log('  Added more aliases for 18+');
    } else {
      // Tạo mới nếu chưa có
      await TagDictionary.create({
        keyword: '18+',
        standardTag: '18+',
        category: 'content',
        description: 'Nội dung dành cho người trưởng thành (18+), có cảnh nóng/giường chiếu',
        aliases: ['smut', 'cao h', 'caoh', '18+', 'r18', 'nc17', 'nc-17', 'mature', 'adult', 'lemon', 'h văn', 'hvan', 'thịt', 'thit', 'nặng đô', 'nang do']
      });
      console.log('  Created new 18+ tag');
    }

    // 2. Cập nhật novels: thay Smut bằng 18+
    await Novel.updateMany(
      { standardTags: 'Smut' },
      { $addToSet: { standardTags: '18+' } }
    );
    const smutResult = await Novel.updateMany(
      { standardTags: 'Smut' },
      { $pull: { standardTags: 'Smut' } }
    );
    console.log(`  Updated ${smutResult.modifiedCount} novels: Smut -> 18+`);

    // 3. Thêm tag Thô Tục
    console.log('\n=== Thêm tag Thô Tục ===');
    const thoTucExists = await TagDictionary.findOne({ standardTag: 'Thô Tục' });
    if (!thoTucExists) {
      await TagDictionary.create({
        keyword: 'thô tục',
        standardTag: 'Thô Tục',
        category: 'content',
        description: 'Ngôn ngữ thô tục, văn phong bỗ bã, có nhiều từ ngữ nhạy cảm',
        aliases: ['thô tục', 'tho tuc', 'dirty talk', 'dirtytalk', 'bẩn', 'ban', 'tục tĩu', 'tuc tiu', 'thô', 'tho', 'ngôn ngữ thô', 'ngon ngu tho']
      });
      console.log('  Created Thô Tục tag');
    } else {
      console.log('  Thô Tục tag already exists');
    }

    // 4. Xóa tag Smut cũ nếu còn
    await TagDictionary.deleteOne({ standardTag: 'Smut' });
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

renameSmutTo18Plus();
