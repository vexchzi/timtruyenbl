/**
 * Thêm tags bị thiếu: sinh tử văn, điền văn, etc.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

const MISSING_TAGS = [
  // Sinh Tử Văn
  {
    keyword: 'sinh tu',
    standardTag: 'Sinh Tử',
    category: 'content',
    priority: 8,
    aliases: [
      'sinh tử', 'sinhtu', 'sinh tu van', 'sinh tử văn', 
      'sinhtử', 'sinhtư', 'life and death', 'sống chết',
      'sinh tử bệnh', 'bệnh tật', 'ung thư', 'bạo bệnh'
    ]
  },
  // Điền Văn
  {
    keyword: 'dien van',
    standardTag: 'Điền Văn',
    category: 'genre',
    priority: 8,
    aliases: [
      'điền văn', 'dienvan', 'điền viên', 'dien vien',
      'farming', 'nông nghiệp', 'làm nông', 'ruộng đồng',
      'điền viên văn', 'điền gia', 'điền trang', 'canh tác'
    ]
  },
  // Ấm Áp Văn
  {
    keyword: 'am ap van',
    standardTag: 'Ấm Áp',
    category: 'content',
    priority: 8,
    aliases: [
      'ấm áp', 'amapvan', 'ấm áp văn', 'warm', 'heartwarming',
      'healing', 'chữa lành', 'ấm lòng', 'an ủi'
    ]
  },
  // Hài Hước
  {
    keyword: 'hai huoc',
    standardTag: 'Hài',
    category: 'genre',
    priority: 8,
    aliases: [
      'hài hước', 'haihuoc', 'comedy', 'funny', 'vui nhộn',
      'hài kịch', 'cười', 'giải trí', 'nhẹ nhàng hài hước'
    ]
  },
  // 1x1 (tương tự 1v1)
  {
    keyword: '1x1',
    standardTag: '1v1',
    category: 'relationship',
    priority: 9,
    aliases: ['1x1', '1 x 1', 'một một', 'one on one']
  },
  // LGBT
  {
    keyword: 'lgbt',
    standardTag: 'Đam Mỹ',
    category: 'relationship',
    priority: 9,
    aliases: ['lgbt', 'lgbtq', 'queer', 'gay', 'homosexual']
  },
  // Danmei
  {
    keyword: 'danmei',
    standardTag: 'Đam Mỹ',
    category: 'relationship',
    priority: 10,
    aliases: ['danmei', 'dan mei', 'đam mỹ', 'đammỹ', '耽美']
  },
  // Thêm một số tags phổ biến khác
  {
    keyword: 'nuoc mat',
    standardTag: 'Ngược',
    category: 'content',
    priority: 7,
    aliases: ['nước mắt', 'nuoc mat', 'tears', 'khóc', 'buồn']
  },
  {
    keyword: 'phe',
    standardTag: 'Ngọt',
    category: 'content',
    priority: 7,
    aliases: ['phê', 'phe', 'ngọt ngào', 'ngot ngao', 'sugar', 'đường']
  },
  {
    keyword: 'suong',
    standardTag: 'Sủng',
    category: 'content',
    priority: 8,
    aliases: ['sướng', 'suong', 'sung sướng', 'hạnh phúc', 'vui vẻ', 'thoải mái']
  },
  // Văn án ngắn/dài
  {
    keyword: 'van an ngan',
    standardTag: 'Đoản Văn',
    category: 'content',
    priority: 7,
    aliases: ['văn án ngắn', 'văn ngắn', 'short', 'ngắn', 'mini']
  },
  {
    keyword: 'van an dai',
    standardTag: 'Trường Thiên',
    category: 'content',
    priority: 7,
    aliases: ['văn án dài', 'văn dài', 'long', 'dài', 'epic']
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const tag of MISSING_TAGS) {
    try {
      // Check if standardTag already exists
      const existingByStandard = await TagDictionary.findOne({ standardTag: tag.standardTag });
      
      if (existingByStandard) {
        // Merge aliases
        const newAliases = [...new Set([...existingByStandard.aliases, ...tag.aliases])];
        if (newAliases.length > existingByStandard.aliases.length) {
          existingByStandard.aliases = newAliases;
          await existingByStandard.save();
          console.log(`🔄 Updated "${tag.standardTag}" (+${newAliases.length - existingByStandard.aliases.length} aliases)`);
          updated++;
        } else {
          console.log(`⏭️ Skipped "${tag.standardTag}" (already exists)`);
          skipped++;
        }
        continue;
      }

      // Check if keyword exists
      const existingByKeyword = await TagDictionary.findOne({ keyword: tag.keyword });
      if (existingByKeyword) {
        console.log(`⏭️ Skipped "${tag.keyword}" (keyword exists)`);
        skipped++;
        continue;
      }

      // Create new
      const newTag = new TagDictionary(tag);
      await newTag.save();
      console.log(`✅ Added: ${tag.standardTag}`);
      added++;

    } catch (error) {
      console.error(`❌ Error with ${tag.standardTag}:`, error.message);
    }
  }

  console.log('\n========================================');
  console.log(`✅ Added: ${added}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log('========================================');

  // Count total
  const total = await TagDictionary.countDocuments();
  console.log(`\n📊 Total tags in dictionary: ${total}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
