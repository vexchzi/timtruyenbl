require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const tags = [
    'Đại Thúc Thụ', 'Bình Phàm Thụ', 'Nhược Thụ', 'Thụ Đa Công',
    'Bá Đạo Công', 'Ôn Nhu Công', 'Phúc Hắc Công', 'Tra Cường Công',
    'Tổng Tài', 'Minh Tinh', 'Hắc Bang', 'Bác Sĩ'
  ];

  console.log('📊 New Character Tags:');
  for (const t of tags) {
    const c = await Novel.countDocuments({ standardTags: t });
    if (c > 0) console.log(`  ${t}: ${c} novels`);
  }

  await mongoose.disconnect();
}
main();
