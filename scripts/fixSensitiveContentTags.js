/**
 * Fix (remove) incorrect sensitive content tags from DB:
 * - 18+
 * - Thô Tục
 * - Song Tính
 *
 * Safe rule:
 * - Remove a tag only if there is NO evidence for it in title/description/rawTags.
 *
 * Usage:
 *   node scripts/fixSensitiveContentTags.js --dry
 *   node scripts/fixSensitiveContentTags.js --apply
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeString } = require('../utils/tagNormalizer');

const TARGET_TAGS = ['18+', 'Thô Tục', 'Song Tính'];

const EVIDENCE = {
  '18+': [
    '18+',
    'r18',
    'r 18',
    'p18',
    'po18',
    'nc17',
    'nc 17',
    'nc18',
    'nc 18',
    'adult',
    'explicit',
    'smut',
    'sex',
    'nsfw',
    'pwp',
    'lemon',
    'lime',
    'h van',
    'hvan',
    'h+',
    'h++',
    'h+++',
    'cao h',
    'caoh',
    'hnang',
    'h nang',
    'h-nang',
    'co h',
    'canh h',
    'thit',
    'co thit',
    'nhieu thit',
    'canh nong',
    'canhnong',
    'dirtytalk',
    'dirty talk',
    'talkdirty',
    'sac',
    'dam dang',
    'chay quan',
    'sextoy',
    'sextoys',
    'sex toy',
    'sex toys',
    'bdsm',
    'gangbang',
    'public',
    'pisskink',
    'nuoctieuplay',
    'loan luan',
    'cuong hiep',
    'mature',
    'maturecontent',
    'maturethemes',
    'porn',
    'xxx',
  ],
  // Thô Tục stricter
  'Thô Tục': [
    'tho tuc',
    'thotuc',
    'dirtytalk',
    'dirty talk',
    'talkdirty',
    'vulgar',
    'porn',
    'xxx',
    'bdsm',
    'gangbang',
    'public',
    'pisskink',
    'nuoctieuplay',
    'loan luan',
    'cuong hiep',
    'incest',
  ],
  'Song Tính': [
    'song tinh',
    'songtinh',
    'luong tinh',
    'intersex',
    'hermaphrodite',
    'futa',
    'boyhavepussy',
    'nhi tinh',
    'nhị tính',
  ],
};

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

function hasEvidence(tag, novel) {
  const title = novel.title || '';
  const desc = novel.description || '';
  const rawTags = Array.isArray(novel.rawTags) ? novel.rawTags : [];

  const combinedNorm = normalizeString(`${title} ${desc} ${rawTags.join(' ')}`);
  const tokens = new Set(tokenizeNormalized(combinedNorm));
  const rawNorm = normalizeString(rawTags.join(' '));

  const evidences = EVIDENCE[tag] || [];
  for (const kw of evidences) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;

    // Token-only for short keywords (avoid substring)
    if (!kwNorm.includes(' ') && kwNorm.length <= 4) {
      if (tokens.has(kwNorm)) return true;
      continue;
    }

    if (hasWholePhrase(combinedNorm, kwNorm) || hasWholePhrase(rawNorm, kwNorm)) return true;
  }

  return false;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const isDry = args.has('--dry') || !args.has('--apply');

  if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');
  console.log(isDry ? 'Mode: DRY RUN (no changes)\n' : 'Mode: APPLY (will update DB)\n');

  const summary = {};

  for (const tag of TARGET_TAGS) {
    const count = await Novel.countDocuments({ standardTags: tag });
    console.log(`=== ${tag} ===`);
    console.log(`Tagged count: ${count}`);

    if (count === 0) {
      console.log('');
      summary[tag] = { tagged: 0, removed: 0 };
      continue;
    }

    const cursor = Novel.find({ standardTags: tag })
      .select('_id title author originalLink standardTags rawTags description')
      .lean()
      .cursor();

    let scanned = 0;
    let toRemove = 0;
    const sample = [];
    const ids = [];

    for await (const n of cursor) {
      scanned++;
      if (!hasEvidence(tag, n)) {
        toRemove++;
        ids.push(n._id);
        if (sample.length < 15) {
          sample.push({
            title: n.title,
            author: n.author,
            link: n.originalLink,
            rawTags: (n.rawTags || []).slice(0, 25),
          });
        }
      }
    }

    console.log(`Scanned: ${scanned}`);
    console.log(`To remove (no evidence): ${toRemove}`);
    if (sample.length > 0) {
      console.log('Sample removals:');
      sample.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.title} | ${s.author} | ${s.link}`);
        console.log(`     rawTags: ${JSON.stringify(s.rawTags)}`);
      });
    }

    if (!isDry && ids.length > 0) {
      const res = await Novel.updateMany(
        { _id: { $in: ids } },
        { $pull: { standardTags: tag } }
      );
      console.log(`✅ Updated ${res.modifiedCount} novels (pulled "${tag}")`);
      summary[tag] = { tagged: count, removed: res.modifiedCount };
    } else {
      summary[tag] = { tagged: count, removed: 0 };
    }

    console.log('\n');
  }

  console.log('=== SUMMARY ===');
  for (const tag of TARGET_TAGS) {
    const s = summary[tag] || { tagged: 0, removed: 0 };
    console.log(`${tag}: tagged=${s.tagged}, removed=${s.removed}`);
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

