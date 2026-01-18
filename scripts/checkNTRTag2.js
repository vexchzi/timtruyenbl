/**
 * Script để kiểm tra chi tiết tag NTR - tìm false positives
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Novel, TagDictionary } = require('../models');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Lấy tất cả truyện có tag NTR
  const ntrNovels = await Novel.find({ standardTags: 'NTR' })
    .select('title rawTags standardTags description')
    .lean();

  console.log(`Total novels with NTR tag: ${ntrNovels.length}\n`);

  // Tìm những truyện có "không có NTR", "không NTR", "no NTR" trong rawTags hoặc description
  const falsePositives = ntrNovels.filter(novel => {
    const rawTagsStr = novel.rawTags?.join(' ').toLowerCase() || '';
    const descLower = novel.description?.toLowerCase() || '';
    
    // Patterns chỉ ra KHÔNG có NTR
    const noNTRPatterns = [
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
      'không ngoại tình'
    ];
    
    return noNTRPatterns.some(pattern => 
      rawTagsStr.includes(pattern) || descLower.includes(pattern)
    );
  });

  console.log(`=== FALSE POSITIVES (có "không NTR" nhưng vẫn bị gán tag): ${falsePositives.length} ===\n`);
  
  falsePositives.forEach((novel, i) => {
    console.log(`${i + 1}. "${novel.title}"`);
    console.log(`   rawTags: ${novel.rawTags?.join(', ')}`);
    console.log('');
  });

  // Tìm thêm những truyện có thể bị gán sai do match từ khác
  console.log('\n=== CHECKING FOR PARTIAL MATCHES ===\n');
  
  const partialMatchNovels = ntrNovels.filter(novel => {
    const rawTagsStr = novel.rawTags?.join(' ').toLowerCase() || '';
    
    // Không có từ "ntr" đứng riêng, nhưng có thể có trong từ khác
    const hasExactNTR = novel.rawTags?.some(tag => {
      const tagLower = tag.toLowerCase().trim();
      return tagLower === 'ntr' || 
             tagLower.includes('ntr ') || 
             tagLower.includes(' ntr') ||
             tagLower.includes('netorare') ||
             tagLower.includes('ngoại tình') ||
             tagLower.includes('cắm sừng');
    });
    
    return !hasExactNTR;
  });

  console.log(`Novels without exact NTR match in rawTags: ${partialMatchNovels.length}`);
  partialMatchNovels.slice(0, 20).forEach((novel, i) => {
    console.log(`\n${i + 1}. "${novel.title}"`);
    console.log(`   rawTags: ${novel.rawTags?.slice(0, 15).join(', ')}`);
  });

  await mongoose.disconnect();
  console.log('\n\nDone!');
}

main().catch(console.error);
