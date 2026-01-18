/**
 * Tìm truyện có chứa keywords trong rawTags hoặc description
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const keywords = [
    'nữ biến nam', 'nu bien nam', 'female to male',
    'giả nữ', 'gia nu', 'crossdress', 'nữ trang',
    'song tính', 'song tinh', 'lưỡng tính',
    'nhân ngư', 'nhan ngu', 'người cá', 'mermaid'
  ];

  console.log('🔍 Searching for novels with special tags...\n');

  for (const kw of keywords) {
    const count = await Novel.countDocuments({
      $or: [
        { rawTags: { $regex: kw, $options: 'i' } },
        { description: { $regex: kw, $options: 'i' } }
      ]
    });
    
    if (count > 0) {
      console.log(`✅ "${kw}": ${count} novels found`);
      
      // Show sample
      const sample = await Novel.findOne({
        $or: [
          { rawTags: { $regex: kw, $options: 'i' } },
          { description: { $regex: kw, $options: 'i' } }
        ]
      }).select('title rawTags');
      
      if (sample) {
        console.log(`   Example: ${sample.title.substring(0, 50)}...`);
        console.log(`   rawTags: ${sample.rawTags.slice(0, 5).join(', ')}`);
      }
    }
  }

  // Also check for common tags that might be in standardTags already
  console.log('\n📊 Current standardTags distribution:');
  const tagStats = await Novel.aggregate([
    { $unwind: '$standardTags' },
    { $group: { _id: '$standardTags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 }
  ]);
  
  tagStats.forEach(t => console.log(`  ${t._id}: ${t.count}`));

  await mongoose.disconnect();
}

main().catch(console.error);
