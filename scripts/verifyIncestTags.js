/**
 * Verify incest tags
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const TagDictionary = require('../models/TagDictionary');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const tags = ['Incest', 'Phụ Tử', 'Huynh Đệ', 'Chú Cháu', 'Song Sinh', 
                'Nghĩa Phụ', 'Sư Đồ', 'Quân Thần', 'Chủ Tớ'];

  console.log('📊 Tag Statistics:');
  console.log('==================');
  
  for (const tag of tags) {
    const count = await Novel.countDocuments({ standardTags: tag });
    console.log(`${tag.padEnd(15)}: ${count} novels`);
    
    if (count > 0 && count <= 3) {
      const samples = await Novel.find({ standardTags: tag }).select('title').limit(3);
      samples.forEach(n => console.log(`  → ${n.title.substring(0, 50)}...`));
    }
  }

  // Check aliases
  console.log('\n🔍 Tag Dictionary Aliases:');
  for (const tag of tags.slice(0, 3)) {
    const entry = await TagDictionary.findOne({ standardTag: tag });
    if (entry) {
      console.log(`${tag}: ${entry.aliases.slice(0, 8).join(', ')}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
