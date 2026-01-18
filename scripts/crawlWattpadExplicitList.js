require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeTags } = require('../utils/tagNormalizer');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('📚 Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const WATTPAD_LIST_URL = 'https://www.wattpad.com/list/1783002676';

// User agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Exclude Girl Love / Bách Hợp content
const BACHHOP_KEYWORDS = [
  'bách hợp',
  'bach hop',
  'bhtt',
  'girl love',
  'girls love',
  'girllove',
  'gl',
  'yuri',
  'lesbian',
  '百合',
];

// Exclude Ngôn Tình / BG / HET (nam-nữ)
const NGONTINH_KEYWORDS = [
  'ngôn tình',
  'ngon tinh',
  'ngontinh',
  'bg',
  'nam nữ',
  'nam nu',
  'nam-nu',
  'nữ nam',
  'nu nam',
  'nu-nam',
  'nữ x nam',
  'nu x nam',
  'nam x nữ',
  'nam x nu',
];

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u1EF9\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function hasWholePhrase(haystack, phrase) {
  const h = ` ${String(haystack || '').toLowerCase()} `;
  const p = String(phrase || '').toLowerCase().trim();
  if (!p) return false;
  return h.includes(` ${p} `);
}

function isBachHop({ title = '', description = '', tags = [] }) {
  const combined = `${title} ${description}`;
  const tokens = new Set(tokenize(combined));
  const tagTokens = new Set(tokenize((tags || []).join(' ')));

  for (const kw of BACHHOP_KEYWORDS) {
    const k = String(kw).toLowerCase().trim();
    if (!k) continue;
    if (!k.includes(' ')) {
      if (tokens.has(k) || tagTokens.has(k)) return true;
      continue;
    }
    if (hasWholePhrase(combined, k) || hasWholePhrase((tags || []).join(' '), k)) return true;
  }
  return false;
}

function isNgonTinh({ title = '', description = '', tags = [] }) {
  const combined = `${title} ${description}`;
  const tokens = new Set(tokenize(combined));
  const tagTokens = new Set(tokenize((tags || []).join(' ')));

  for (const kw of NGONTINH_KEYWORDS) {
    const k = String(kw).toLowerCase().trim();
    if (!k) continue;
    if (!k.includes(' ')) {
      if (tokens.has(k) || tagTokens.has(k)) return true;
      continue;
    }
    if (hasWholePhrase(combined, k) || hasWholePhrase((tags || []).join(' '), k)) return true;
  }
  return false;
}

async function getStoriesFromList(listId) {
  try {
    // Thử dùng web scraping
    const response = await axios.get(`https://www.wattpad.com/list/${listId}`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html'
      },
      proxy: false
    });
    
    const $ = cheerio.load(response.data);
    const storyIds = [];
    
    // Tìm story IDs từ các link trong page
    $('a[href*="/story/"]').each((i, el) => {
      const href = $(el).attr('href');
      const match = href.match(/\/story\/(\d+)/);
      if (match && match[1]) {
        if (!storyIds.includes(match[1])) {
          storyIds.push(match[1]);
        }
      }
    });
    
    console.log(`   Tìm thấy ${storyIds.length} story IDs từ HTML`);
    return storyIds;
    
  } catch (error) {
    console.error('Error fetching list:', error.message);
    return [];
  }
}

async function getStoryDetails(storyId) {
  try {
    const response = await axios.get(`https://www.wattpad.com/api/v3/stories/${storyId}`, {
      params: {
        fields: 'id,title,description,cover,user,completed,numParts,readCount,voteCount,tags'
      },
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json'
      },
      proxy: false
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching story ${storyId}:`, error.message);
    return null;
  }
}

async function crawlExplicitList() {
  const listId = '1783002676';
  
  console.log(`\n🔞 Crawling Wattpad 18+ List: ${WATTPAD_LIST_URL}`);
  console.log('='.repeat(60));
  
  const stories = await getStoriesFromList(listId);
  console.log(`📋 Tìm thấy ${stories.length} truyện trong list`);
  
  let added = 0;
  let skipped = 0;
  let existing = 0;
  
  for (const story of stories) {
    const storyId = story.id || story;
    const originalLink = `https://www.wattpad.com/story/${storyId}`;
    
    // Check if already exists
    const exists = await Novel.findOne({ originalLink });
    if (exists) {
      console.log(`  📦 Đã tồn tại: ${exists.title.substring(0, 40)}...`);
      existing++;
      continue;
    }
    
    // Get full story details
    const details = await getStoryDetails(storyId);
    if (!details) {
      skipped++;
      continue;
    }
    
    const title = details.title || '';
    const description = details.description || '';
    const tags = details.tags || [];

    if (isBachHop({ title, description, tags })) {
      console.log(`  ⚠️ Bỏ qua (bách hợp/GL): ${title.substring(0, 50)}...`);
      skipped++;
      continue;
    }

    if (isNgonTinh({ title, description, tags })) {
      console.log(`  ⚠️ Bỏ qua (ngôn tình/BG): ${title.substring(0, 50)}...`);
      skipped++;
      continue;
    }
    
    // Normalize tags
    // IMPORTANT: Không auto-force "18+" / "Thô Tục" cho toàn bộ list,
    // vì list có thể lẫn truyện không 18+.
    const normalizedTags = await normalizeTags(tags);
    
    const novel = new Novel({
      title: title,
      author: details.user?.name || 'Unknown',
      description: description,
      coverImage: details.cover || '',
      originalLink: originalLink,
      rawTags: tags,
      standardTags: normalizedTags,
      source: 'wattpad',
      chapterCount: details.numParts || 0,
      readCount: details.readCount || 0,
      voteCount: details.voteCount || 0,
      status: details.completed ? 'completed' : 'ongoing'
    });
    
    await novel.save();
    added++;
    console.log(`  ✅ [${added}] ${title.substring(0, 50)}...`);
    console.log(`     Tags: ${normalizedTags.join(', ')}`);
    
    // Delay
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 KẾT QUẢ:`);
  console.log(`   ✅ Đã thêm: ${added}`);
  console.log(`   📦 Đã tồn tại: ${existing}`);
  console.log(`   ⏭️  Bỏ qua: ${skipped}`);
  console.log('='.repeat(60));
  
  mongoose.disconnect();
}

crawlExplicitList();
