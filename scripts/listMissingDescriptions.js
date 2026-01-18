require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const tags = await TagDictionary.find({ 
    $or: [
      { description: null },
      { description: '' },
      { description: { $exists: false } }
    ]
  }).select('standardTag category').sort('category standardTag');
  
  console.log('Tags without description:\n');
  
  let currentCategory = '';
  tags.forEach(t => {
    if (t.category !== currentCategory) {
      currentCategory = t.category;
      console.log(`\n=== ${currentCategory.toUpperCase()} ===`);
    }
    console.log(`  ${t.standardTag}`);
  });
  
  console.log(`\n\nTotal: ${tags.length}`);
  await mongoose.disconnect();
}
main();
