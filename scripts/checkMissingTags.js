/**
 * Check và thêm tags bị thiếu
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Tìm tags liên quan
  const searchTerms = ['sinh', 'dien', 'điền', 'tu van', 'tử văn'];
  
  console.log('🔍 Searching for existing tags...\n');
  
  for (const term of searchTerms) {
    const found = await TagDictionary.find({
      $or: [
        { keyword: { $regex: term, $options: 'i' } },
        { standardTag: { $regex: term, $options: 'i' } },
        { aliases: { $regex: term, $options: 'i' } }
      ]
    }).lean();
    
    if (found.length > 0) {
      console.log(`"${term}":`);
      found.forEach(t => {
        console.log(`  - keyword: "${t.keyword}", standardTag: "${t.standardTag}"`);
        if (t.aliases?.length) console.log(`    aliases: ${t.aliases.slice(0,5).join(', ')}`);
      });
    } else {
      console.log(`"${term}": NOT FOUND`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
