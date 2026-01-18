/**
 * Crawl truyện từ Wattpad Reading Lists
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Novel = require('../models/Novel');
const { normalizeTags, extractTagsFromDescription } = require('../utils/tagNormalizer');

const READING_LISTS = [
  'https://www.wattpad.com/list/867040038-list-truyn-am-m-hay',
  'https://www.wattpad.com/list/601200563-truyn-am-m-hay-',
  'https://www.wattpad.com/list/843571427-',
  'https://www.wattpad.com/list/862583377-am-m-hay',
  'https://www.wattpad.com/list/1292282541-am-m-hin-i'
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fanfic keywords to filter out
const FANFIC_KEYWORDS = [
  'đồng nhân', 'dongnhan', 'fanfic', 'fanfiction',
  'tiêu chiến', 'xiao zhan', 'vương nhất bác', 'wang yibo',
  'bjyx', 'yizhan', 'trần tình lệnh', 'the untamed', 'cql',
  'bts', 'exo', 'nct', 'blackpink', 'bigbang',
  'mdzs', 'tgcf', 'svsss', 'wangxian', 'hualian',
  'naruto', 'one piece', 'genshin', 'honkai',
  'brightwin', 'mewgulf', 'gmmtv'
];

function isFanfic(title, tags, description) {
  const combined = `${title} ${tags.join(' ')} ${description || ''}`.toLowerCase();
  return FANFIC_KEYWORDS.some(kw => combined.includes(kw.toLowerCase()));
}

async function getListStories(listId) {
  try {
    // Wattpad API for reading list
    const url = `https://www.wattpad.com/api/v3/lists/${listId}?fields=stories(id,title,description,cover,readCount,voteCount,numParts,user(name),tags,completed)&limit=200`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (response.data && response.data.stories) {
      return response.data.stories;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching list ${listId}:`, error.message);
    return [];
  }
}

async function processStory(story) {
  const {
    id,
    title,
    description,
    cover,
    readCount,
    voteCount,
    numParts,
    user,
    tags,
    completed
  } = story;

  const originalLink = `https://www.wattpad.com/story/${id}`;
  const author = user?.name || 'Unknown';
  const coverImage = cover || null;
  const rawTags = tags || [];

  // Check if fanfic
  if (isFanfic(title, rawTags, description)) {
    console.log(`  ⚠️ Skipped (fanfic): ${title}`);
    return null;
  }

  // Extract tags from description and normalize
  const descTags = extractTagsFromDescription(description || '');
  const allRawTags = [...rawTags, ...descTags];
  const standardTags = await normalizeTags(allRawTags);

  return {
    title,
    author,
    description: description || '',
    coverImage,
    originalLink,
    rawTags,
    standardTags,
    source: 'wattpad',
    readCount: readCount || 0,
    voteCount: voteCount || 0,
    chapterCount: numParts || 0,
    status: completed ? 'completed' : 'ongoing'
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let totalAdded = 0;
  let totalSkipped = 0;
  let totalFanfic = 0;

  for (const listUrl of READING_LISTS) {
    // Extract list ID from URL
    const match = listUrl.match(/list\/(\d+)/);
    if (!match) {
      console.log(`Invalid list URL: ${listUrl}`);
      continue;
    }
    
    const listId = match[1];
    console.log(`\n📖 Processing list ${listId}...`);
    
    const stories = await getListStories(listId);
    console.log(`  Found ${stories.length} stories`);

    for (const story of stories) {
      try {
        // Check if already exists
        const existing = await Novel.findOne({ 
          originalLink: `https://www.wattpad.com/story/${story.id}` 
        });
        
        if (existing) {
          // Update readCount if higher
          if (story.readCount > (existing.readCount || 0)) {
            existing.readCount = story.readCount;
            existing.voteCount = story.voteCount || existing.voteCount;
            await existing.save();
          }
          totalSkipped++;
          continue;
        }

        const novelData = await processStory(story);
        
        if (novelData) {
          await Novel.create(novelData);
          console.log(`  ✅ Added: ${novelData.title} (${novelData.readCount.toLocaleString()} views)`);
          totalAdded++;
        } else {
          totalFanfic++;
        }
        
        await delay(100);
      } catch (error) {
        if (error.code === 11000) {
          totalSkipped++;
        } else {
          console.error(`  ❌ Error: ${story.title}:`, error.message);
        }
      }
    }
    
    // Delay between lists
    await delay(2000);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Added: ${totalAdded}`);
  console.log(`   - Skipped (exists): ${totalSkipped}`);
  console.log(`   - Filtered (fanfic): ${totalFanfic}`);

  const total = await Novel.countDocuments();
  console.log(`   - Total novels: ${total}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
