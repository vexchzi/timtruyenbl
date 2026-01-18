/**
 * Audit potentially wrong sensitive content tags:
 * - 18+
 * - Thô Tục
 * - Song Tính
 *
 * Goal:
 * - Find novels that have these tags in standardTags but have weak/no evidence in title/description/rawTags.
 *
 * Usage:
 *   node scripts/auditSensitiveContentTags.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeString } = require('../utils/tagNormalizer');

const TARGET_TAGS = ['18+', 'Thô Tục', 'Song Tính'];

// Evidence keywords (normalized matching; token/phrase aware)
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
    // Vietnamese common phrases
    'co h',
    'c o h',
    'canh h',
    'c anh h',
    'thit',
    'co thit',
    'nhieu thit',
    'canh nong',
    'canhnong',
    'canh 18',
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
  // Keep Thô Tục stricter: only when text explicitly suggests vulgar/dirty talk/fetish
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
    'b o y h a v e p u s s y',
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

  // IMPORTANT: do NOT include standardTags in evidence.
  // Otherwise the presence of the tag in standardTags would always count as evidence.
  const combinedNorm = normalizeString(`${title} ${desc} ${rawTags.join(' ')}`);
  const tokens = new Set(tokenizeNormalized(combinedNorm));

  const rawNorm = normalizeString(rawTags.join(' '));

  const evidences = EVIDENCE[tag] || [];
  for (const kw of evidences) {
    const kwNorm = normalizeString(kw);
    if (!kwNorm) continue;

    // Token-only for short keywords (avoid substring)
    if (!kwNorm.includes(' ') && kwNorm.length <= 4) {
      if (tokens.has(kwNorm)) return { ok: true, keyword: kw };
      continue;
    }

    if (
      hasWholePhrase(combinedNorm, kwNorm) ||
      hasWholePhrase(rawNorm, kwNorm)
    ) {
      return { ok: true, keyword: kw };
    }
  }

  return { ok: false, keyword: null };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  for (const tag of TARGET_TAGS) {
    const count = await Novel.countDocuments({ standardTags: tag });
    console.log(`=== ${tag} ===`);
    console.log(`Tagged count: ${count}`);

    if (count === 0) {
      console.log('');
      continue;
    }

    const cursor = Novel.find({ standardTags: tag })
      .select('_id title author originalLink standardTags rawTags description')
      .lean()
      .cursor();

    let scanned = 0;
    let suspicious = 0;
    const samples = [];

    for await (const n of cursor) {
      scanned++;
      const ev = hasEvidence(tag, n);
      if (!ev.ok) {
        suspicious++;
        if (samples.length < 30) {
          samples.push({
            _id: String(n._id),
            title: n.title,
            author: n.author,
            link: n.originalLink,
            rawTags: (n.rawTags || []).slice(0, 25),
          });
        }
      }
    }

    console.log(`Scanned: ${scanned}`);
    console.log(`Suspicious (no evidence): ${suspicious}`);
    if (samples.length > 0) {
      console.log('\nSample suspicious novels:');
      samples.forEach((s, i) => {
        console.log(`${i + 1}. ${s.title} | ${s.author} | ${s.link}`);
        console.log(`   rawTags: ${JSON.stringify(s.rawTags)}`);
      });
    }
    console.log('\n');
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

