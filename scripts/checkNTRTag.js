/**
 * Script để kiểm tra tag NTR trong database
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Novel, TagDictionary } = require('../models');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // 1. Kiểm tra tag NTR trong dictionary
  console.log('=== TAG DICTIONARY ===');
  const ntrEntries = await TagDictionary.find({
    $or: [
      { standardTag: 'NTR' },
      { keyword: /ntr/i },
      { aliases: /ntr/i }
    ]
  }).lean();
  
  console.log('NTR entries in dictionary:');
  ntrEntries.forEach(e => {
    console.log(`  - keyword: "${e.keyword}", standardTag: "${e.standardTag}"`);
    console.log(`    aliases: ${JSON.stringify(e.aliases)}`);
  });

  // 2. Đếm số truyện có tag NTR
  const ntrNovelsCount = await Novel.countDocuments({ standardTags: 'NTR' });
  console.log(`\n=== NOVELS WITH NTR TAG: ${ntrNovelsCount} ===`);

  // 3. Lấy mẫu một số truyện có tag NTR để kiểm tra
  const sampleNovels = await Novel.find({ standardTags: 'NTR' })
    .select('title rawTags standardTags description')
    .limit(20)
    .lean();

  console.log('\nSample novels with NTR tag:');
  sampleNovels.forEach((novel, i) => {
    console.log(`\n${i + 1}. "${novel.title}"`);
    console.log(`   rawTags: ${novel.rawTags?.slice(0, 10).join(', ')}`);
    console.log(`   standardTags: ${novel.standardTags?.join(', ')}`);
    
    // Kiểm tra xem rawTags có chứa NTR không
    const hasNTRInRaw = novel.rawTags?.some(tag => 
      tag.toLowerCase().includes('ntr') || 
      tag.toLowerCase().includes('netorare') ||
      tag.toLowerCase().includes('ngoại tình') ||
      tag.toLowerCase().includes('cắm sừng')
    );
    console.log(`   Has NTR in rawTags: ${hasNTRInRaw ? 'YES' : 'NO ⚠️'}`);
  });

  // 4. Tìm những truyện có NTR trong standardTags nhưng KHÔNG có trong rawTags
  console.log('\n=== NOVELS WITH NTR TAG BUT NO NTR IN RAW TAGS ===');
  const allNTRNovels = await Novel.find({ standardTags: 'NTR' })
    .select('title rawTags standardTags description')
    .lean();

  const suspiciousNovels = allNTRNovels.filter(novel => {
    const rawTagsLower = novel.rawTags?.map(t => t.toLowerCase()).join(' ') || '';
    const descLower = novel.description?.toLowerCase() || '';
    
    // Các từ khóa liên quan đến NTR
    const ntrKeywords = ['ntr', 'netorare', 'ngoại tình', 'cắm sừng', 'cheating', 'ngoai tinh'];
    
    return !ntrKeywords.some(kw => rawTagsLower.includes(kw) || descLower.includes(kw));
  });

  console.log(`Found ${suspiciousNovels.length} suspicious novels (NTR tag but no NTR keywords):\n`);
  suspiciousNovels.slice(0, 30).forEach((novel, i) => {
    console.log(`${i + 1}. "${novel.title}"`);
    console.log(`   rawTags: ${novel.rawTags?.slice(0, 8).join(', ')}`);
  });

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(console.error);
