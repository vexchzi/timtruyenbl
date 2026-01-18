/**
 * Script để sửa tag NTR bị gán sai
 * - Xóa tag NTR khỏi những truyện có "không có NTR" trong rawTags
 * - Kiểm tra lại và xóa những truyện không thực sự có NTR
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');

// Patterns chỉ ra KHÔNG có NTR
const NO_NTR_PATTERNS = [
  'không có ntr',
  'không ntr',
  'no ntr',
  'ko ntr',
  'ko có ntr',
  'không có np – ntr',
  'không có ntr – np',
  'không np – ntr',
  'không ntr – np',
  '1v1 không ntr',
  '1x1 không ntr',
  'sạch sẽ không ntr',
  'không ngoại tình',
  'không có ngoại tình',
  'không np, không ntr',
  'không ntr, không np',
  'clean không ntr'
];

// Patterns xác nhận CÓ NTR thực sự
const CONFIRM_NTR_PATTERNS = [
  /^ntr$/i,
  /\bntr\b/i,
  /netorare/i,
  /ngoại tình/i,
  /cắm sừng/i,
  /cheating/i,
  /\bcheated\b/i,
  /bị cướp người yêu/i,
  /bị ntr/i,
  /công ntr/i,
  /thụ ntr/i
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Lấy tất cả truyện có tag NTR
  const ntrNovels = await Novel.find({ standardTags: 'NTR' }).lean();
  console.log(`Total novels with NTR tag: ${ntrNovels.length}\n`);

  const toRemoveNTR = [];
  const confirmed = [];

  for (const novel of ntrNovels) {
    const rawTagsStr = (novel.rawTags?.join(' ') || '').toLowerCase();
    const descLower = (novel.description || '').toLowerCase();
    const combined = rawTagsStr + ' ' + descLower;

    // Check nếu có pattern phủ định
    const hasNoNTRPattern = NO_NTR_PATTERNS.some(pattern => combined.includes(pattern));

    // Check nếu có pattern xác nhận NTR thực sự (không phải trong cụm phủ định)
    let hasConfirmedNTR = false;
    
    // Kiểm tra từng rawTag riêng lẻ
    for (const tag of (novel.rawTags || [])) {
      const tagLower = tag.toLowerCase().trim();
      
      // Bỏ qua nếu tag chứa pattern phủ định
      if (NO_NTR_PATTERNS.some(p => tagLower.includes(p))) continue;
      
      // Kiểm tra pattern xác nhận
      if (CONFIRM_NTR_PATTERNS.some(p => p.test(tagLower))) {
        hasConfirmedNTR = true;
        break;
      }
    }

    if (hasNoNTRPattern && !hasConfirmedNTR) {
      toRemoveNTR.push(novel);
    } else if (hasConfirmedNTR) {
      confirmed.push(novel);
    } else {
      // Không có pattern phủ định, cũng không có xác nhận rõ ràng
      // Kiểm tra kỹ hơn
      const hasAnyNTRKeyword = CONFIRM_NTR_PATTERNS.some(p => p.test(rawTagsStr));
      if (!hasAnyNTRKeyword) {
        toRemoveNTR.push(novel);
      } else {
        confirmed.push(novel);
      }
    }
  }

  console.log(`=== WILL REMOVE NTR TAG FROM ${toRemoveNTR.length} NOVELS ===\n`);
  toRemoveNTR.forEach((novel, i) => {
    console.log(`${i + 1}. "${novel.title}"`);
    console.log(`   rawTags: ${novel.rawTags?.slice(0, 10).join(', ')}`);
  });

  console.log(`\n=== CONFIRMED NTR: ${confirmed.length} novels ===`);

  // Thực hiện xóa tag NTR
  if (toRemoveNTR.length > 0) {
    console.log('\n\nRemoving NTR tag from novels...');
    
    for (const novel of toRemoveNTR) {
      await Novel.updateOne(
        { _id: novel._id },
        { $pull: { standardTags: 'NTR' } }
      );
      console.log(`  ✓ Removed NTR from "${novel.title}"`);
    }
    
    console.log(`\n✅ Removed NTR tag from ${toRemoveNTR.length} novels`);
  }

  // Kiểm tra lại
  const remainingNTR = await Novel.countDocuments({ standardTags: 'NTR' });
  console.log(`\nRemaining novels with NTR tag: ${remainingNTR}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(console.error);
