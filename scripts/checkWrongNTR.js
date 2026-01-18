/**
 * Kiểm tra các truyện bị gắn tag NTR sai
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

  for (const title of titles) {
    const novel = await Novel.findOne({ 
      title: { $regex: title, $options: 'i' } 
    }).lean();

    if (novel) {
      console.log(`\n=== "${novel.title}" ===`);
      console.log('standardTags:', novel.standardTags);
      console.log('rawTags:', novel.rawTags);
      console.log('description (first 500 chars):', novel.description?.substring(0, 500));
      
      // Kiểm tra xem có từ nào liên quan NTR không
      const allText = [
        ...(novel.rawTags || []),
        novel.description || ''
      ].join(' ').toLowerCase();
      
      const ntrKeywords = ['ntr', 'netorare', 'ngoại tình', 'ngoai tinh', 'cắm sừng', 'cam sung', 'cheating'];
      const foundKeywords = ntrKeywords.filter(kw => allText.includes(kw));
      console.log('NTR keywords found:', foundKeywords.length > 0 ? foundKeywords : 'NONE');
    } else {
      console.log(`\nNot found: "${title}"`);
    }
  }

  // Lấy tất cả truyện có NTR và kiểm tra xem có thực sự có NTR không
  console.log('\n\n=== CHECKING ALL NTR NOVELS ===');
  const ntrNovels = await Novel.find({ standardTags: 'NTR' })
    .select('title rawTags description')
    .lean();

  console.log(`Total novels with NTR tag: ${ntrNovels.length}`);

  const falsePositives = [];
  const ntrKeywords = ['ntr', 'netorare', 'ngoại tình', 'ngoai tinh', 'cắm sừng', 'cam sung', 'cheating', 'cheated'];

  for (const novel of ntrNovels) {
    const rawTagsStr = (novel.rawTags || []).join(' ').toLowerCase();
    const descLower = (novel.description || '').toLowerCase();
    const combined = rawTagsStr + ' ' + descLower;

    // Kiểm tra có pattern phủ định không
    const hasNegation = /không.{0,5}ntr|ko.{0,5}ntr|no.{0,3}ntr/i.test(combined);
    
    // Kiểm tra có keyword NTR thực sự không (không phải trong cụm phủ định)
    let hasRealNTR = false;
    for (const kw of ntrKeywords) {
      if (combined.includes(kw)) {
        // Kiểm tra xem có phải trong cụm phủ định không
        const regex = new RegExp(`(không|ko|no).{0,10}${kw}`, 'i');
        if (!regex.test(combined)) {
          hasRealNTR = true;
          break;
        }
      }
    }

    if (!hasRealNTR) {
      falsePositives.push(novel);
    }
  }

  console.log(`\nFalse positives (no real NTR): ${falsePositives.length}`);
  falsePositives.forEach((novel, i) => {
    console.log(`${i + 1}. "${novel.title}"`);
    console.log(`   rawTags: ${novel.rawTags?.slice(0, 8).join(', ')}`);
  });

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(console.error);
