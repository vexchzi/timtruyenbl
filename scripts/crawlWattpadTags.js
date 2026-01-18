/**
 * Crawl Wattpad by Tags - Using Wattpad API
 * - Sử dụng API JSON của Wattpad
 * - Tự động crawl truyện đam mỹ
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeTags } = require('../utils/tagNormalizer');

// ============== CONFIG ==============
const WATTPAD_TAGS = [
  'đammỹ',
  'dammy', 
  'bl',
  'danmei',
  'boyslove',
  'yaoi',
  'đammỹviệt',
  'blviet',
  'ngôntu00ecnh',
  'truyendammy'
];

const DELAY_BETWEEN_REQUESTS = 2000;
const DELAY_BETWEEN_PAGES = 3000;
const MAX_STORIES_PER_TAG = 500;
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

// ============== HELPERS ==============
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// ============== API FUNCTIONS ==============

/**
 * Search stories by tag using Wattpad API
 */
async function searchByTag(tag, offset = 0, limit = 30) {
  const url = `https://www.wattpad.com/v4/stories`;
  
  try {
    const response = await axios.get(url, {
      params: {
        query: tag,
        fields: 'stories(id,title,description,cover,user,tags,readCount,voteCount,numParts,completed)',
        limit: limit,
        offset: offset,
        mature: 0,
        language: 1 // Vietnamese
      },
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'application/json',
        'Authorization': 'Basic YW5kcm9pZDoxNzE0NjU=', // Public API key
      },
      timeout: 15000,
    });

    return response.data?.stories || [];
  } catch (error) {
    // Try alternative endpoint
    try {
      const altUrl = `https://www.wattpad.com/api/v3/stories`;
      const altResponse = await axios.get(altUrl, {
        params: {
          query: tag,
          limit: limit,
          offset: offset,
          filter: 'new',
          language: 1
        },
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'application/json',
        },
        timeout: 15000,
      });
      return altResponse.data?.stories || [];
    } catch (e) {
      console.error(`[API] Tag "${tag}" offset ${offset} error:`, error.message);
      return [];
    }
  }
}

/**
 * Get story details by ID
 */
async function getStoryDetails(storyId) {
  const url = `https://www.wattpad.com/api/v3/stories/${storyId}`;
  
  try {
    const response = await axios.get(url, {
      params: {
        fields: 'id,title,description,cover,user,tags,readCount,voteCount,numParts,completed,url'
      },
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    const story = response.data;
    if (!story || !story.title) return null;

    return {
      title: story.title,
      author: story.user?.name || 'Unknown',
      description: story.description?.slice(0, 2000) || '',
      coverImage: story.cover,
      rawTags: story.tags || [],
      originalLink: story.url || `https://www.wattpad.com/story/${storyId}`,
      source: 'wattpad',
      readCount: story.readCount || 0,
      chapterCount: story.numParts || 0
    };
  } catch (error) {
    console.error(`[Story ${storyId}] Error:`, error.message);
    return null;
  }
}

/**
 * Crawl story page directly (fallback)
 */
async function crawlStoryPage(storyId) {
  const url = `https://www.wattpad.com/story/${storyId}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html',
      },
      timeout: 15000,
    });

    const html = response.data;
    
    // Extract JSON data from page
    const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      const story = data?.props?.pageProps?.story || data?.props?.pageProps?.storyInfo;
      
      if (story) {
        return {
          title: story.title,
          author: story.user?.name || story.author || 'Unknown',
          description: story.description?.slice(0, 2000) || '',
          coverImage: story.cover,
          rawTags: story.tags || [],
          originalLink: url,
          source: 'wattpad',
          readCount: story.readCount || 0,
          chapterCount: story.numParts || 0
        };
      }
    }

    // Fallback: extract from meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    
    if (titleMatch) {
      return {
        title: titleMatch[1],
        author: 'Unknown',
        description: descMatch?.[1] || '',
        coverImage: imageMatch?.[1],
        rawTags: [],
        originalLink: url,
        source: 'wattpad'
      };
    }

    return null;
  } catch (error) {
    console.error(`[Page ${storyId}] Error:`, error.message);
    return null;
  }
}

/**
 * Main crawl function
 */
async function crawlWattpadByTags(options = {}) {
  const {
    tags = WATTPAD_TAGS,
    maxStoriesPerTag = MAX_STORIES_PER_TAG,
    startFromTag = 0,
  } = options;

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const startingCount = await Novel.countDocuments();
  console.log(`📚 Starting count: ${startingCount} novels\n`);

  let totalSaved = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let tagIndex = startFromTag; tagIndex < tags.length; tagIndex++) {
    const tag = tags[tagIndex];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📌 TAG: ${tag} (${tagIndex + 1}/${tags.length})`);
    console.log(`${'='.repeat(50)}`);

    let offset = 0;
    let tagSaved = 0;
    const limit = 30;

    while (tagSaved < maxStoriesPerTag) {
      console.log(`\n📄 Fetching offset ${offset}...`);
      
      const stories = await searchByTag(tag, offset, limit);
      
      if (stories.length === 0) {
        console.log('   No more stories found');
        break;
      }

      console.log(`   Found ${stories.length} stories`);

      for (const story of stories) {
        const storyId = story.id;
        const storyUrl = `https://www.wattpad.com/story/${storyId}`;

        // Check if exists
        const exists = await Novel.findOne({ 
          originalLink: { $regex: storyId.toString() } 
        });
        
        if (exists) {
          totalSkipped++;
          continue;
        }

        await delay(DELAY_BETWEEN_REQUESTS);

        // Get full details
        let storyData = await getStoryDetails(storyId);
        
        // Fallback to page crawl
        if (!storyData) {
          storyData = await crawlStoryPage(storyId);
        }

        if (!storyData || !storyData.title) {
          totalErrors++;
          continue;
        }

        // Normalize tags
        const standardTags = await normalizeTags(storyData.rawTags);

        // Save
        try {
          const novel = new Novel({
            ...storyData,
            standardTags
          });
          await novel.save();
          totalSaved++;
          tagSaved++;
          
          console.log(`   ✅ [${tagSaved}] ${storyData.title.slice(0, 50)}...`);
        } catch (saveError) {
          if (saveError.code === 11000) {
            totalSkipped++;
          } else {
            totalErrors++;
          }
        }
      }

      offset += limit;
      
      console.log(`   📊 Tag progress: ${tagSaved}/${maxStoriesPerTag}`);
      
      await delay(DELAY_BETWEEN_PAGES);
    }
  }

  const finalCount = await Novel.countDocuments();

  console.log(`\n${'='.repeat(50)}`);
  console.log('🏁 CRAWL COMPLETED');
  console.log(`${'='.repeat(50)}`);
  console.log(`📚 Starting: ${startingCount} → Final: ${finalCount} (+${finalCount - startingCount})`);
  console.log(`✅ Saved: ${totalSaved}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`❌ Errors: ${totalErrors}`);

  await mongoose.disconnect();
}

// ============== RUN ==============
const args = process.argv.slice(2);
const maxStories = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1]) || MAX_STORIES_PER_TAG;
const startTag = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1]) || 0;

console.log('🚀 Wattpad Tag Crawler (API Mode)');
console.log(`   Tags: ${WATTPAD_TAGS.length} tags`);
console.log(`   Max stories per tag: ${maxStories}`);
console.log('');

crawlWattpadByTags({
  maxStoriesPerTag: maxStories,
  startFromTag: startTag
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
