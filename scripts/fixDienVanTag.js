/**
 * Sửa tag Điền Văn và Nông Thôn để tránh nhầm lẫn
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // 1. Cập nhật Điền Văn - chỉ giữ alias liên quan đến farming/nông nghiệp văn học
  const dienVan = await TagDictionary.findOne({ standardTag: 'Điền Văn' });
  if (dienVan) {
    dienVan.aliases = [
      'điền văn', 'dienvan', 'dien van',
      'farming', 'làm nông văn', 'nông văn',
      'điền viên văn', 'điền gia văn', 'chủng điền',
      'chung dien', 'chungdien', 'trồng trọt văn'
    ];
    dienVan.description = 'Truyện về cuộc sống điền viên, làm nông, trồng trọt, yên bình';
    await dienVan.save();
    console.log('✅ Updated Điền Văn aliases');
  }

  // 2. Cập nhật Nông Thôn - chỉ giữ alias liên quan đến bối cảnh
  const nongThon = await TagDictionary.findOne({ standardTag: 'Nông Thôn' });
  if (nongThon) {
    nongThon.aliases = [
      'nông thôn', 'nongthon', 'nong thon',
      'rural', 'làng quê', 'lang que', 'village',
      'thôn quê', 'thon que', 'quê hương'
    ];
    nongThon.description = 'Bối cảnh nông thôn, làng quê';
    await nongThon.save();
    console.log('✅ Updated Nông Thôn aliases');
  }

  // 3. Kiểm tra Điềm Văn
  const diemVan = await TagDictionary.findOne({ standardTag: 'Điềm Văn' });
  if (diemVan) {
    diemVan.aliases = [
      'điềm văn', 'diemvan', 'diem van',
      'điềm đạm', 'bình yên', 'nhẹ nhàng văn'
    ];
    diemVan.description = 'Truyện nhẹ nhàng, bình yên, không nhiều drama';
    await diemVan.save();
    console.log('✅ Updated Điềm Văn aliases');
  }

  console.log('\n✅ Done!');
  await mongoose.disconnect();
}

main().catch(console.error);
