/**
 * Test File - Kiểm tra Tag Normalizer
 * 
 * Chạy: npm run test:normalizer
 * Hoặc: node examples/testNormalizer.js
 */

const mongoose = require('mongoose');
const { normalizeTags, normalizeTagsDetailed, normalizeString, removeVietnameseTones } = require('../utils/tagNormalizer');
const { seedTagDictionary } = require('../seeds/tagDictionarySeeds');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novel_recommender';

/**
 * Test cases mẫu - Tag rác từ Wattpad/WordPress
 */
const testCases = [
  {
    name: 'Test 1: Tags tiếng Việt có dấu',
    input: ['Ngược thân', 'Sủng văn', 'Hiện đại', 'HE', 'Đam mỹ'],
    expectedCount: 5
  },
  {
    name: 'Test 2: Tags viết HOA/thường lẫn lộn',
    input: ['NGUOC', 'sung', 'HE', 'Co Dai', 'DAM MY'],
    expectedCount: 5
  },
  {
    name: 'Test 3: Tags có ký tự đặc biệt',
    input: ['#nguoc', '@he', 'sung!!!', '1v1~~', 'hien-dai'],
    expectedCount: 4
  },
  {
    name: 'Test 4: Tags không tồn tại trong dictionary',
    input: ['random_tag', 'abc123', 'not_a_tag', 'HE', 'nguoc'],
    expectedCount: 2 // Chỉ có HE và nguoc match
  },
  {
    name: 'Test 5: Tags trùng lặp',
    input: ['nguoc', 'NGUOC', 'Ngược', 'ngược thân', 'nguoc than'],
    expectedCount: 1 // Tất cả đều map sang "Ngược"
  },
  {
    name: 'Test 6: Mix đầy đủ',
    input: [
      'Đam mỹ',          // Có dấu tiếng Việt
      'he',              // Viết thường
      'TRUONG HOC',      // Viết hoa
      '#slow-burn',      // Có ký tự đặc biệt
      'random123',       // Không tồn tại
      'nguoc',           // Viết tắt
      'nguoc'            // Trùng lặp
    ]
  }
];

/**
 * Test utility functions
 */
function testUtilities() {
  console.log('\n' + '='.repeat(60));
  console.log('📐 TEST UTILITY FUNCTIONS');
  console.log('='.repeat(60));

  // Test removeVietnameseTones
  const vietnameseTests = [
    { input: 'Ngược thân', expected: 'Nguoc than' },
    { input: 'Đam Mỹ', expected: 'Dam My' },
    { input: 'Sủng văn', expected: 'Sung van' },
    { input: 'Hiện đại', expected: 'Hien dai' },
    { input: 'Trùng sinh', expected: 'Trung sinh' }
  ];

  console.log('\n🔤 removeVietnameseTones():');
  vietnameseTests.forEach(test => {
    const result = removeVietnameseTones(test.input);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`  ${status} "${test.input}" → "${result}" (expected: "${test.expected}")`);
  });

  // Test normalizeString
  const normalizeTests = [
    { input: '  Ngược Thân  ', expected: 'nguoc than' },
    { input: '#HE!!!', expected: 'he' },
    { input: 'DAM-MY', expected: 'dam-my' },
    { input: 'abc   def', expected: 'abc def' }
  ];

  console.log('\n🔧 normalizeString():');
  normalizeTests.forEach(test => {
    const result = normalizeString(test.input);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`  ${status} "${test.input}" → "${result}" (expected: "${test.expected}")`);
  });
}

/**
 * Test normalizeTags function
 */
async function testNormalizeTags() {
  console.log('\n' + '='.repeat(60));
  console.log('🏷️  TEST normalizeTags()');
  console.log('='.repeat(60));

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   Input: [${testCase.input.map(t => `"${t}"`).join(', ')}]`);
    
    const result = await normalizeTags(testCase.input);
    console.log(`   Output: [${result.map(t => `"${t}"`).join(', ')}]`);
    console.log(`   Count: ${result.length}${testCase.expectedCount ? ` (expected: ${testCase.expectedCount})` : ''}`);
  }
}

/**
 * Test normalizeTagsDetailed function
 */
async function testNormalizeTagsDetailed() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 TEST normalizeTagsDetailed()');
  console.log('='.repeat(60));

  const testInput = [
    'Đam mỹ',
    'HE',
    'nguoc than',
    'hien dai',
    'random_tag_123',
    'xyz_not_exist'
  ];

  console.log(`\nInput: [${testInput.map(t => `"${t}"`).join(', ')}]\n`);

  const result = await normalizeTagsDetailed(testInput);

  console.log('📊 Result Summary:');
  console.log(`   - Total Raw Tags: ${result.totalRaw}`);
  console.log(`   - Matched: ${result.matchedCount}`);
  console.log(`   - Unmatched: ${result.unmatchedTags.length}`);
  console.log(`   - Match Rate: ${result.matchRate}`);
  
  console.log('\n📝 Standard Tags:', result.standardTags);
  console.log('⚠️  Unmatched Tags:', result.unmatchedTags);

  console.log('\n📋 Match Details:');
  result.details.forEach(detail => {
    const icon = detail.matched ? '✅' : '❌';
    console.log(`   ${icon} "${detail.raw}" → "${detail.normalized}" → ${detail.standard || 'NO MATCH'}`);
  });
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 NOVEL RECOMMENDER - TAG NORMALIZER TEST');
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!');

    // Seed data nếu chưa có
    const TagDictionary = require('../models/TagDictionary');
    const count = await TagDictionary.countDocuments();
    
    if (count === 0) {
      console.log('📝 No dictionary data found. Running seed...');
      await seedTagDictionary();
    } else {
      console.log(`📚 Found ${count} dictionary entries`);
    }

    // Run tests
    testUtilities();
    await testNormalizeTags();
    await testNormalizeTagsDetailed();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run tests
runTests();
