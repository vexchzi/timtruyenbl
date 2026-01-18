/**
 * Cleanup bách hợp / girl love novels that slipped in from specific Wattpad Reading Lists.
 *
 * Scope:
 * - Deletes ONLY novels whose originalLink is in the provided reading lists.
 *
 * Usage:
 *   node scripts/cleanupBachHopFromWattpadLists.js
 *   node scripts/cleanupBachHopFromWattpadLists.js https://www.wattpad.com/list/123 ...more
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Novel = require('../models/Novel');
const { normalizeString } = require('../utils/tagNormalizer');

const DEFAULT_READING_LISTS = [
  'https://www.wattpad.com/list/790907864',
  'https://www.wattpad.com/list/793758824',
  'https://www.wattpad.com/list/888941499',
  'https://www.wattpad.com/list/1347109419',
  'https://www.wattpad.com/list/1627059258',
  'https://www.wattpad.com/list/1271649356',
  'https://www.wattpad.com/list/581232432',
];

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

function tokenizeNormalized(str) {
  const norm = normalizeString(str);
  if (!norm) return [];
  return norm.split(/\s+/).filter(Boolean);
}

function hasWholePhrase(haystackNorm, phraseNorm) {
  if (!haystackNorm || !phraseNorm) return false;
  const re = new RegExp(
    `(^|\\s)${phraseNorm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(\\s|$)`,
    'i'
  );
  return re.test(haystackNorm);
}

function isBachHopNovel(novel) {
  const combinedNorm = normalizeString(
    `${novel.title || ''} ${novel.author || ''} ${novel.description || ''} ${(novel.rawTags || []).join(' ')}`
  );
  const tokens = new Set(tokenizeNormalized(combinedNorm));
  const tagsNorm = normalizeString((novel.rawTags || []).join(' '));
  const tagTokens = new Set(tokenizeNormalized((novel.rawTags || []).join(' ')));

  for (const kw of BACHHOP_KEYWORDS) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;
    if (!kwNorm.includes(' ')) {
      if (tokens.has(kwNorm) || tagTokens.has(kwNorm) || tagsNorm === kwNorm) {
        return { isBachHop: true, keyword: kw };
      }
      continue;
    }
    if (hasWholePhrase(combinedNorm, kwNorm) || hasWholePhrase(tagsNorm, kwNorm)) {
      return { isBachHop: true, keyword: kw };
    }
  }

  return { isBachHop: false };
}

async function getListStories(listId) {
  const url = `https://www.wattpad.com/api/v3/lists/${listId}?fields=stories(id)&limit=200`;
  const res = await axios.get(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
    timeout: 30000,
  });
  return res.data?.stories || [];
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  const listUrls = process.argv.slice(2).filter(Boolean);
  const READING_LISTS = listUrls.length > 0 ? listUrls : DEFAULT_READING_LISTS;

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const storyUrlSet = new Set();
  for (const listUrl of READING_LISTS) {
    const match = listUrl.match(/list\/(\d+)/);
    if (!match) {
      console.log(`Invalid list URL: ${listUrl}`);
      continue;
    }
    const listId = match[1];
    console.log(`📖 Fetching story IDs from list ${listId}...`);
    const stories = await getListStories(listId);
    console.log(`  Found ${stories.length} IDs`);
    for (const s of stories) {
      if (s?.id) storyUrlSet.add(`https://www.wattpad.com/story/${s.id}`);
    }
  }

  console.log(`\n🔎 Total unique story URLs from lists: ${storyUrlSet.size}\n`);
  if (storyUrlSet.size === 0) {
    console.log('Nothing to do.');
    return;
  }

  const candidates = await Novel.find({ originalLink: { $in: Array.from(storyUrlSet) } })
    .select('_id title originalLink author rawTags description')
    .lean();

  console.log(`📚 Found ${candidates.length} novels in DB from these lists\n`);

  const toDelete = [];
  for (const novel of candidates) {
    const res = isBachHopNovel(novel);
    if (res.isBachHop) {
      toDelete.push({ _id: novel._id, title: novel.title, keyword: res.keyword });
    }
  }

  console.log(`🧹 Will delete ${toDelete.length} bách hợp/GL novels from these lists`);
  toDelete.slice(0, 20).forEach((n, i) => {
    console.log(`  ${i + 1}. "${String(n.title).slice(0, 70)}" (keyword: ${n.keyword})`);
  });

  if (toDelete.length > 0) {
    const ids = toDelete.map(n => n._id);
    const del = await Novel.deleteMany({ _id: { $in: ids } });
    console.log(`\n✅ Deleted ${del.deletedCount} novels`);
  }
}

main()
  .catch(err => {
    console.error('❌ Error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch (_) {}
    console.log('\n✅ Done!');
  });

