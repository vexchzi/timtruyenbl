/**
 * Test tag normalizer với các trường hợp NTR
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { normalizeTags } = require('../utils/tagNormalizer');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const testCases = [
    // Trường hợp có NTR thực sự
    ['NTR', 'đam mỹ', 'hiện đại'],
    ['ngoại tình', 'hiện đại', 'cao H'],
    ['cắm sừng', 'ngược'],
    
    // Trường hợp KHÔNG có NTR (phủ định)
    ['không có NTR – NP', 'đam mỹ', 'hiện đại'],
    ['không NTR', '1v1', 'ngọt'],
    ['không ngoại tình', 'chung tình'],
    ['ko có ntr', 'sạch sẽ'],
    ['no NTR', 'clean', 'sweet'],
    
    // Trường hợp phức tạp
    ['đam mỹ, cao H, không có NTR – NP, không ngược, luôn duy trì 1×1, HE'],
    ['bẻ cong, hiện đại, không có NTR – NP, HE'],
  ];

  console.log('=== TESTING TAG NORMALIZER ===\n');

  for (const tags of testCases) {
    console.log('Input:', tags);
    const result = await normalizeTags(tags);
    const hasNTR = result.includes('NTR');
    console.log('Output:', result);
    console.log('Has NTR:', hasNTR ? '⚠️ YES' : '✓ NO');
    console.log('---');
  }

  await mongoose.disconnect();
  console.log('\nDone!');
}

test().catch(console.error);
