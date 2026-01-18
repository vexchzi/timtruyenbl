/**
 * Crawl truyện từ Wattpad Reading Lists
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Novel = require('../models/Novel');
const {
  normalizeTags,
  extractTagsFromDescription,
  normalizeString,
} = require('../utils/tagNormalizer');

const DEFAULT_READING_LISTS = [
  'https://www.wattpad.com/list/790907864',
  'https://www.wattpad.com/list/793758824',
  'https://www.wattpad.com/list/888941499',
  'https://www.wattpad.com/list/1347109419',
  'https://www.wattpad.com/list/1627059258',
  'https://www.wattpad.com/list/1271649356',
  'https://www.wattpad.com/list/581232432',
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
  // Strong indicators
  'dong nhan',
  'fanfic',
  'fanfiction',
  'oneshot',
  'one shot',
  'one short',
  'oneshort',
  'doujin',
  'doujinshi',
  'djs',
  'ooc',
  // AU is too short for substring matching; treat as token only
  'au',
  'ff',
  'fic',
  'fics',
  // Common fandom / ship indicators (token/phrase match only)
  'tieu chien',
  'xiao zhan',
  'vuong nhat bac',
  'wang yibo',
  'bjyx',
  'yizhan',
  'tran tinh lenh',
  'the untamed',
  'cql',
  'bts',
  'exo',
  'nct',
  'blackpink',
  'bigbang',
  'mdzs',
  'tgcf',
  'svsss',
  'wangxian',
  'hualian',
  'naruto',
  'one piece',
  'genshin',
  'honkai',
  'brightwin',
  'mewgulf',
  'gmmtv',
];

function tokenizeNormalized(str) {
  const norm = normalizeString(str);
  if (!norm) return [];
  return norm.split(/\s+/).filter(Boolean);
}

function hasWholePhrase(haystackNorm, phraseNorm) {
  if (!haystackNorm || !phraseNorm) return false;
  const re = new RegExp(`(^|\\s)${phraseNorm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(\\s|$)`, 'i');
  return re.test(haystackNorm);
}

// Exclude Girl Love / Bách Hợp content
const BACHHOP_KEYWORDS = [
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

function isBachHop(title, tags, description) {
  const combinedNorm = normalizeString(`${title || ''} ${description || ''}`);
  const tokens = new Set(tokenizeNormalized(combinedNorm));

  const tagsJoined = (tags || []).join(' ');
  const tagsNorm = normalizeString(tagsJoined);
  const tagTokens = new Set(tokenizeNormalized(tagsJoined));

  for (const kw of BACHHOP_KEYWORDS) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;

    // Single-token keywords: match as token (NOT substring)
    if (!kwNorm.includes(' ')) {
      if (tokens.has(kwNorm) || tagTokens.has(kwNorm) || tagsNorm === kwNorm) return true;
      continue;
    }

    // Multi-word keywords: match as whole phrase
    if (hasWholePhrase(combinedNorm, kwNorm) || hasWholePhrase(tagsNorm, kwNorm)) return true;
  }

  return false;
}

// Exclude Ngôn Tình / BG / HET (nam-nữ)
const NGONTINH_KEYWORDS = [
  'ngon tinh',
  'ngontinh',
  'bg',
  'nam nu',
  'nam-nu',
  'nu nam',
  'nu-nam',
  'nu x nam',
  'nam x nu',
];

function isNgonTinh(title, tags, description) {
  const combinedNorm = normalizeString(`${title || ''} ${description || ''}`);
  const tokens = new Set(tokenizeNormalized(combinedNorm));

  const tagsJoined = (tags || []).join(' ');
  const tagsNorm = normalizeString(tagsJoined);
  const tagTokens = new Set(tokenizeNormalized(tagsJoined));

  // explicit standard tag in tags
  if ((tags || []).some(t => normalizeString(t) === 'ngon tinh')) return true;

  for (const kw of NGONTINH_KEYWORDS) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;

    if (!kwNorm.includes(' ')) {
      if (tokens.has(kwNorm) || tagTokens.has(kwNorm) || tagsNorm === kwNorm) return true;
      continue;
    }

    if (hasWholePhrase(combinedNorm, kwNorm) || hasWholePhrase(tagsNorm, kwNorm)) return true;
  }

  return false;
}

function isFanfic(title, tags, description) {
  const combinedNorm = normalizeString(`${title || ''} ${description || ''}`);
  const tokens = new Set(tokenizeNormalized(combinedNorm));
  const tagTokens = new Set(tokenizeNormalized((tags || []).join(' ')));

  for (const kw of FANFIC_KEYWORDS) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;

    // Single-token keywords: match as token (NOT substring)
    if (!kwNorm.includes(' ')) {
      if (tokens.has(kwNorm) || tagTokens.has(kwNorm)) return true;
      continue;
    }

    // Multi-word keywords: match as whole phrase
    if (hasWholePhrase(combinedNorm, kwNorm)) return true;
    // Also allow phrase match in tags joined
    const tagsNorm = normalizeString((tags || []).join(' '));
    if (hasWholePhrase(tagsNorm, kwNorm)) return true;
  }

  return false;
}

function extractPairingTagKeysFromDescription(description) {
  if (!description || typeof description !== 'string') return new Set();

  // Match lines commonly containing character/pairing info
  const patterns = [
    /Nhân\s*vật\s*[:\-]\s*([^\n\r]+)/gim,
    /Nhan\s*vat\s*[:\-]\s*([^\n\r]+)/gim,
    /Nhân\s*vật\s*chính\s*[:\-]\s*([^\n\r]+)/gim,
    /Dien\s*vien\s*chinh\s*[:\-]\s*([^\n\r]+)/gim,
    /Diễn\s*viên\s*chính\s*[:\-]\s*([^\n\r]+)/gim,
    /Pairing\s*[:\-]\s*([^\n\r]+)/gim,
    /Couple\s*[:\-]\s*([^\n\r]+)/gim,
    /CP\s*[:\-]\s*([^\n\r]+)/gim,
  ];

  const keys = new Set();
  for (const re of patterns) {
    let m;
    while ((m = re.exec(description)) !== null) {
      const line = (m[1] || '').trim();
      if (!line) continue;

      // Prefer splitting on x/× (A x B). If not present, handle common separators used for pairing:
      // - "A - B", "A – B", "A — B", "A vs B"
      let parts = line.split(/\s*[x×]\s*/i);
      if (parts.length < 2) {
        parts = line.split(/\s*(?:vs|v\.s\.)\s*/i);
      }
      if (parts.length < 2) {
        parts = line.split(/\s*(?:–|—|-)\s*/);
      }

      if (parts.length >= 2) {
        const left = parts[0];
        const right = parts[1];

        for (const rawName of [left, right]) {
          const cleaned = rawName
            .split('(')[0]
            .split('[')[0]
            .split('{')[0]
            .split('|')[0]
            .split(',')[0]
            .trim();

          const norm = normalizeString(cleaned);
          if (norm && norm.length >= 3) {
            keys.add(norm);
            keys.add(norm.replace(/\s+/g, '')); // slug-like tags (no spaces)
          }
        }
      }
    }
  }

  return keys;
}

function filterOutFanficAndPairingTags({ title, rawTags = [], description = '' }) {
  const pairingKeys = extractPairingTagKeysFromDescription(description);

  const filteredRawTags = (rawTags || []).filter(t => {
    const k = normalizeString(t);
    const kNoSpace = k.replace(/\s+/g, '');
    if (!k) return false;
    // Remove explicit pair tags like "ax b" collapsed
    if (/^[a-z0-9]+x[a-z0-9]+$/.test(kNoSpace)) return false;
    if (pairingKeys.has(k) || pairingKeys.has(kNoSpace)) return false;
    return true;
  });

  // If title/description indicates fanfic, skip whole story
  const isFan = isFanfic(title || '', filteredRawTags, description || '');
  const isGL = isBachHop(title || '', filteredRawTags, description || '');
  const isNT = isNgonTinh(title || '', filteredRawTags, description || '');

  return { isFan, isGL, isNT, filteredRawTags, pairingKeys };
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

  const { isFan, isGL, isNT, filteredRawTags } = filterOutFanficAndPairingTags({
    title,
    rawTags,
    description: description || '',
  });

  // Check if fanfic (after basic tag cleanup)
  if (isFan) {
    console.log(`  ⚠️ Skipped (fanfic): ${title}`);
    return null;
  }

  if (isGL) {
    console.log(`  ⚠️ Skipped (bách hợp/GL): ${title}`);
    return null;
  }

  if (isNT) {
    console.log(`  ⚠️ Skipped (ngôn tình/BG): ${title}`);
    return null;
  }

  // Extract tags from description and normalize
  const descTagsAll = extractTagsFromDescription(description || '');
  // Also remove pairing keys from description-extracted tags
  const pairingKeys = extractPairingTagKeysFromDescription(description || '');
  const descTags = descTagsAll.filter(t => {
    const k = normalizeString(t);
    const kNoSpace = k.replace(/\s+/g, '');
    if (!k) return false;
    if (/^[a-z0-9]+x[a-z0-9]+$/.test(kNoSpace)) return false;
    if (pairingKeys.has(k) || pairingKeys.has(kNoSpace)) return false;
    return true;
  });

  const allRawTags = [...filteredRawTags, ...descTags];
  const standardTags = await normalizeTags(allRawTags);

  return {
    title,
    author,
    description: description || '',
    coverImage,
    originalLink,
    rawTags: filteredRawTags,
    standardTags,
    source: 'wattpad',
    readCount: readCount || 0,
    voteCount: voteCount || 0,
    chapterCount: numParts || 0,
    status: completed ? 'completed' : 'ongoing'
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in environment.');
    console.error('   - Set it in .env (backend) or export it before running this script.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let totalAdded = 0;
  let totalSkipped = 0;
  let totalFanfic = 0;

  const listUrls = process.argv.slice(2).filter(Boolean);
  const READING_LISTS = listUrls.length > 0 ? listUrls : DEFAULT_READING_LISTS;

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
