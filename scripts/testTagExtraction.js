/**
 * Test tag extraction từ description
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { extractTagsFromDescription, normalizeTags } = require('../utils/tagNormalizer');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Tìm novel cụ thể
  const novel = await Novel.findOne({ title: /Tiểu CV cùng võng phối/i });
  
  if (!novel) {
    console.log('Novel not found');
    await mongoose.disconnect();
    return;
  }
  
  console.log('=== Novel Info ===');
  console.log('Title:', novel.title);
  console.log('\nDescription:');
  console.log(novel.description);
  console.log('\nRaw Tags:', novel.rawTags);
  console.log('\nCurrent Standard Tags:', novel.standardTags);
  
  console.log('\n=== Testing extractTagsFromDescription ===');
  const extractedFromDesc = extractTagsFromDescription(novel.description);
  console.log('Extracted from description:', extractedFromDesc);
  
  console.log('\n=== Testing normalizeTags ===');
  // Combine rawTags and extracted tags
  const allRawTags = [...(novel.rawTags || []), ...extractedFromDesc];
  console.log('All raw tags combined:', allRawTags);
  
  const normalized = await normalizeTags(allRawTags);
  console.log('Normalized tags:', normalized);
  
  await mongoose.disconnect();
}

main().catch(console.error);
