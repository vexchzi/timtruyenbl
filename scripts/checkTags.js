/**
 * Script kiểm tra tags trong database
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');
const Novel = require('../models/Novel');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // 1. Tổng số tags trong dictionary
  const totalTags = await TagDictionary.countDocuments();
  console.log(`📊 Total tags in dictionary: ${totalTags}`);

  // 2. Kiểm tra tag "Nữ Biến Nam"
  console.log('\n🔍 Searching for "Nữ Biến Nam" tag...');
  const nuBienNam = await TagDictionary.find({
    $or: [
      { standardTag: /nữ biến nam/i },
      { keyword: /nu bien nam/i },
      { aliases: /nữ biến nam/i }
    ]
  });
  console.log('Found entries:', nuBienNam.length);
  nuBienNam.forEach(t => {
    console.log(`  - keyword: "${t.keyword}", standardTag: "${t.standardTag}", aliases: ${JSON.stringify(t.aliases)}`);
  });

  // 3. Tìm truyện có tag "Nữ Biến Nam"
  console.log('\n📚 Novels with "Nữ Biến Nam" tag:');
  const novelsWithTag = await Novel.find({ standardTags: 'Nữ Biến Nam' })
    .select('title rawTags standardTags')
    .limit(10);
  
  console.log(`Found ${novelsWithTag.length} novels`);
  novelsWithTag.forEach(n => {
    console.log(`\n  Title: ${n.title}`);
    console.log(`  rawTags: ${n.rawTags.slice(0, 10).join(', ')}`);
    console.log(`  standardTags: ${n.standardTags.join(', ')}`);
  });

  // 4. Check một số tags WIKIDICH
  console.log('\n🔍 Checking WIKIDICH tags existence...');
  const wikidichSamples = ['Thai Xuyên', 'Song Xuyên', 'Hồng Hoang', 'Cyberpunk', 'Steampunk'];
  for (const tag of wikidichSamples) {
    const found = await TagDictionary.findOne({ standardTag: tag });
    console.log(`  ${tag}: ${found ? '✅ Found' : '❌ Not found'}`);
  }

  // 5. Liệt kê các categories
  console.log('\n📁 Tag categories distribution:');
  const categories = await TagDictionary.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  categories.forEach(c => console.log(`  ${c._id}: ${c.count} tags`));

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
