/**
 * Cleanup all Bách Hợp / Girl Love novels from DB.
 *
 * What it does:
 * - Deletes novels if they contain any GL/BH keywords in standardTags/rawTags/title/description.
 * - This is a global cleanup (entire DB), because UI tag counts come from all novels.
 *
 * Usage:
 *   node scripts/cleanupBachHopNovels.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeString } = require('../utils/tagNormalizer');

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
  // common title markers
  '[bh]',
  '[gl]',
  '(bh)',
  '(gl)',
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
  const stdTags = Array.isArray(novel.standardTags) ? novel.standardTags : [];
  const rawTags = Array.isArray(novel.rawTags) ? novel.rawTags : [];

  // Fast path: explicit standard tag
  if (stdTags.some(t => normalizeString(t) === 'bach hop')) {
    return { isBachHop: true, keyword: 'standardTag:Bách Hợp' };
  }

  const combinedNorm = normalizeString(
    `${novel.title || ''} ${novel.author || ''} ${novel.description || ''} ${rawTags.join(' ')} ${stdTags.join(' ')}`
  );
  const tokens = new Set(tokenizeNormalized(combinedNorm));

  const rawNorm = normalizeString(rawTags.join(' '));
  const stdNorm = normalizeString(stdTags.join(' '));

  for (const kw of BACHHOP_KEYWORDS) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;

    // single token: token match only (avoid substring false positives)
    if (!kwNorm.includes(' ')) {
      if (tokens.has(kwNorm)) return { isBachHop: true, keyword: kw };
      continue;
    }

    // phrase: match whole phrase
    if (hasWholePhrase(combinedNorm, kwNorm) || hasWholePhrase(rawNorm, kwNorm) || hasWholePhrase(stdNorm, kwNorm)) {
      return { isBachHop: true, keyword: kw };
    }
  }

  return { isBachHop: false };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const all = await Novel.find({})
    .select('_id title author originalLink standardTags rawTags description')
    .lean();

  console.log(`📚 Total novels in DB: ${all.length}\n`);

  const toDelete = [];
  for (const n of all) {
    const res = isBachHopNovel(n);
    if (res.isBachHop) {
      toDelete.push({ _id: n._id, title: n.title, keyword: res.keyword });
    }
  }

  console.log(`🧹 Found ${toDelete.length} bách hợp/GL novels to delete\n`);
  toDelete.slice(0, 30).forEach((n, i) => {
    console.log(`  ${i + 1}. "${String(n.title).slice(0, 80)}" (match: ${n.keyword})`);
  });

  if (toDelete.length > 0) {
    const ids = toDelete.map(n => n._id);
    const del = await Novel.deleteMany({ _id: { $in: ids } });
    console.log(`\n✅ Deleted ${del.deletedCount} novels`);
  }

  const remaining = await Novel.countDocuments();
  console.log(`\n📚 Remaining novels: ${remaining}`);
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

