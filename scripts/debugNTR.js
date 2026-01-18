/**
 * Debug chi tiết vấn đề NTR
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Tìm các truyện cụ thể
  const titles = [
    'Tôi bị ánh trăng của nam chính coi trọng',
    'Omega Hắn Thích Biết Đọc Suy Nghĩ',
    'Hướng dẫn giả ngoan của tên điên'
  ];

  for (const searchTitle of titles) {
    const novel = await Novel.findOne({ 
      title: { $regex: searchTitle, $options: 'i' } 
    }).lean();

    if (novel) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`"${novel.title}"`);
      console.log(`${'='.repeat(60)}`);
      
      // Tìm vị trí "ntr" trong rawTags
      const rawTagsLower = (novel.rawTags || []).map(t => t.toLowerCase());
      console.log('\n--- rawTags (lowercase) ---');
      rawTagsLower.forEach((tag, i) => {
        const hasNTR = tag.includes('ntr');
        console.log(`  ${i}: "${tag}" ${hasNTR ? '<-- HAS NTR!' : ''}`);
      });

      // Tìm vị trí "ntr" trong description
      const descLower = (novel.description || '').toLowerCase();
      console.log('\n--- Searching "ntr" in description ---');
      
      let pos = descLower.indexOf('ntr');
      if (pos >= 0) {
        console.log(`Found "ntr" at position ${pos}`);
        // Hiển thị context
        const start = Math.max(0, pos - 30);
        const end = Math.min(descLower.length, pos + 30);
        console.log(`Context: "...${descLower.substring(start, end)}..."`);
      } else {
        console.log('NOT FOUND in description');
      }

      // Kiểm tra từng ký tự xung quanh "ntr" nếu tìm thấy
      const combined = rawTagsLower.join(' ') + ' ' + descLower;
      pos = combined.indexOf('ntr');
      if (pos >= 0) {
        console.log('\n--- Found in combined text ---');
        const start = Math.max(0, pos - 20);
        const end = Math.min(combined.length, pos + 20);
        console.log(`Position: ${pos}`);
        console.log(`Context: "${combined.substring(start, end)}"`);
        console.log(`Char codes around: ${combined.substring(pos-2, pos+5).split('').map(c => c.charCodeAt(0)).join(', ')}`);
      } else {
        console.log('\n--- NOT FOUND in combined text ---');
        console.log('This novel should NOT have NTR tag!');
      }
    }
  }

  // Xóa tag NTR khỏi những truyện không có NTR thực sự
  console.log('\n\n=== REMOVING NTR FROM FALSE POSITIVES ===');
  
  const ntrNovels = await Novel.find({ standardTags: 'NTR' }).lean();
  let removed = 0;
  
  for (const novel of ntrNovels) {
    const combined = [
      ...(novel.rawTags || []),
      novel.description || ''
    ].join(' ').toLowerCase();
    
    // Tìm "ntr" không nằm trong cụm phủ định
    const hasRealNTR = /(?<!không.{0,10})(?<!ko.{0,10})(?<!no.{0,5})\bntr\b/i.test(combined) ||
                       combined.includes('netorare') ||
                       combined.includes('ngoại tình') ||
                       combined.includes('ngoai tinh') ||
                       combined.includes('cắm sừng') ||
                       combined.includes('cam sung') ||
                       /\bcheating\b/i.test(combined);
    
    if (!hasRealNTR) {
      await Novel.updateOne(
        { _id: novel._id },
        { $pull: { standardTags: 'NTR' } }
      );
      console.log(`Removed NTR from: "${novel.title}"`);
      removed++;
    }
  }
  
  console.log(`\nTotal removed: ${removed}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(console.error);
