require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');
const Novel = require('../models/Novel');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== Tags liên quan đến Điền Văn ===\n');
  
  // Tìm tất cả tags liên quan đến Điền Văn
  const tags = await TagDictionary.find({ 
    $or: [
      { standardTag: /điền/i },
      { keyword: /dien/i },
      { aliases: /điền|dien/i }
    ]
  }).select('keyword standardTag aliases category');
  
  tags.forEach(t => {
    console.log('StandardTag:', t.standardTag);
    console.log('Keyword:', t.keyword);
    console.log('Aliases:', t.aliases.join(', '));
    console.log('Category:', t.category);
    console.log('---');
  });
  
  console.log('\n=== Novels với tag Điền Văn ===\n');
  
  // Tìm novels có tag Điền Văn
  const novels = await Novel.find({
    standardTags: 'Điền Văn'
  }).select('title rawTags standardTags').limit(10);
  
  novels.forEach(n => {
    console.log('Title:', n.title);
    console.log('Raw Tags:', n.rawTags?.slice(0, 10).join(', '));
    console.log('Standard Tags:', n.standardTags?.join(', '));
    console.log('---');
  });
  
  console.log('\n=== Novels từ WordPress không có description ===\n');
  
  // Tìm novels từ wordpress không có description
  const noDescNovels = await Novel.find({
    source: 'wordpress',
    $or: [
      { description: null },
      { description: '' },
      { description: { $exists: false } }
    ]
  }).select('title originalLink source').limit(10);
  
  console.log(`Tìm thấy ${noDescNovels.length} novels không có description:`);
  noDescNovels.forEach(n => {
    console.log('  -', n.title);
    console.log('   Link:', n.originalLink);
  });
  
  // Count total
  const totalNoDesc = await Novel.countDocuments({
    source: 'wordpress',
    $or: [
      { description: null },
      { description: '' },
      { description: { $exists: false } }
    ]
  });
  console.log(`\nTổng số novels wordpress không có description: ${totalNoDesc}`);
  
  await mongoose.disconnect();
}
main();
