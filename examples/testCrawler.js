/**
 * Test Crawler - Kiểm tra module crawler
 * 
 * Chạy: npm run test:crawler
 * Hoặc: node examples/testCrawler.js
 */

const {
  crawlWattpad,
  crawlReadingList,
  normalizeWattpadUrl,
  getRandomUserAgent
} = require('../services/crawler');

// ============== TEST CONFIG ==============

/**
 * Test URLs - Thay thế bằng URL thực
 * 
 * Để test, bạn cần:
 * 1. Tìm 1 truyện trên Wattpad
 * 2. Copy URL và paste vào TEST_STORY_URL
 * 3. Tìm 1 reading list và paste vào TEST_READING_LIST_URL
 */
const TEST_STORY_URL = process.argv[2] || '';
const TEST_READING_LIST_URL = process.argv[3] || '';

// ============== TEST FUNCTIONS ==============

/**
 * Test utility functions
 */
function testUtilities() {
  console.log('='.repeat(60));
  console.log('🔧 TEST UTILITY FUNCTIONS');
  console.log('='.repeat(60));
  
  // Test User-Agent rotation
  console.log('\n📱 Random User-Agents:');
  for (let i = 0; i < 3; i++) {
    const ua = getRandomUserAgent();
    console.log(`   ${i + 1}. ${ua.substring(0, 60)}...`);
  }
  
  // Test URL normalization
  console.log('\n🔗 URL Normalization:');
  const testUrls = [
    'https://www.wattpad.com/story/123456-my-story?utm_source=test',
    'https://www.wattpad.com/story/789012-another-story#chapter-1',
    'http://wattpad.com/story/345678-example',
    'https://example.com/not-wattpad'
  ];
  
  testUrls.forEach(url => {
    const normalized = normalizeWattpadUrl(url);
    console.log(`   ${url}`);
    console.log(`   → ${normalized}\n`);
  });
}

/**
 * Test crawl single story
 */
async function testCrawlStory(url) {
  console.log('='.repeat(60));
  console.log('📖 TEST CRAWL SINGLE STORY');
  console.log('='.repeat(60));
  
  if (!url) {
    console.log('\n⚠️  No URL provided');
    console.log('   Usage: node examples/testCrawler.js <story_url> [reading_list_url]');
    console.log('   Example: node examples/testCrawler.js https://www.wattpad.com/story/123456');
    return null;
  }
  
  console.log(`\n🔗 URL: ${url}\n`);
  
  try {
    const result = await crawlWattpad(url);
    
    if (result) {
      console.log('\n✅ CRAWL SUCCESS!');
      console.log('='.repeat(40));
      console.log(`📌 Title:       ${result.title}`);
      console.log(`👤 Author:      ${result.author}`);
      console.log(`📝 Description: ${result.description ? result.description.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`🖼️  Cover Image: ${result.coverImage ? 'Yes' : 'No'}`);
      console.log(`📊 Chapters:    ${result.chapterCount}`);
      console.log(`👁️  Reads:       ${result.readCount.toLocaleString()}`);
      console.log(`🏷️  Raw Tags (${result.rawTags.length}):`);
      result.rawTags.forEach((tag, i) => {
        console.log(`      ${i + 1}. ${tag}`);
      });
      console.log(`🔗 Original:    ${result.originalLink}`);
      
      return result;
    } else {
      console.log('\n❌ CRAWL FAILED - No data returned');
      return null;
    }
  } catch (error) {
    console.error('\n❌ CRAWL ERROR:', error.message);
    return null;
  }
}

/**
 * Test crawl reading list
 */
async function testCrawlReadingList(url) {
  console.log('\n' + '='.repeat(60));
  console.log('📚 TEST CRAWL READING LIST');
  console.log('='.repeat(60));
  
  if (!url) {
    console.log('\n⚠️  No reading list URL provided');
    console.log('   Skipping reading list test');
    return [];
  }
  
  console.log(`\n🔗 URL: ${url}\n`);
  
  try {
    const links = await crawlReadingList(url);
    
    if (links.length > 0) {
      console.log(`\n✅ Found ${links.length} story links:`);
      links.slice(0, 10).forEach((link, i) => {
        console.log(`   ${i + 1}. ${link}`);
      });
      if (links.length > 10) {
        console.log(`   ... and ${links.length - 10} more`);
      }
      
      return links;
    } else {
      console.log('\n⚠️  No story links found');
      return [];
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return [];
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 NOVEL RECOMMENDER - CRAWLER TEST');
  console.log('='.repeat(60));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('');
  
  // Test utilities (không cần network)
  testUtilities();
  
  // Test story crawl
  const storyResult = await testCrawlStory(TEST_STORY_URL);
  
  // Test reading list crawl
  const listLinks = await testCrawlReadingList(TEST_READING_LIST_URL);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Story Crawl:        ${storyResult ? '✅ Success' : '❌ Failed/Skipped'}`);
  console.log(`   Reading List Crawl: ${listLinks.length > 0 ? `✅ Found ${listLinks.length} links` : '❌ Failed/Skipped'}`);
  
  if (!TEST_STORY_URL && !TEST_READING_LIST_URL) {
    console.log('\n💡 To run full tests, provide URLs:');
    console.log('   node examples/testCrawler.js <story_url> [reading_list_url]');
    console.log('\n   Example:');
    console.log('   node examples/testCrawler.js https://www.wattpad.com/story/123456-my-story');
  }
  
  console.log('\n✅ TEST COMPLETED!');
}

// Run tests
runTests().catch(console.error);
