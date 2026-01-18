/**
 * Fix và thêm tags Incest
 * - Sửa "luân loạn" thành "Incest"
 * - Thêm phụ tử, huynh đệ, chú cháu...
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');
const Novel = require('../models/Novel');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // 1. Kiểm tra tags hiện có
  console.log('🔍 Checking existing incest-related tags...\n');
  const existing = await TagDictionary.find({
    $or: [
      { keyword: { $regex: /luan|incest|phu tu|huynh|chu chau/i } },
      { standardTag: { $regex: /loạn|incest|phụ tử|huynh/i } },
      { aliases: { $regex: /loạn luân|incest|phụ tử/i } }
    ]
  }).lean();

  console.log('Found tags:');
  existing.forEach(t => {
    console.log(`  - keyword: "${t.keyword}", standardTag: "${t.standardTag}"`);
  });

  // 2. Xóa tag cũ nếu có (luân loạn sai)
  console.log('\n🗑️ Removing incorrect tags...');
  const deleted = await TagDictionary.deleteMany({
    $or: [
      { keyword: 'luan loan' },
      { standardTag: 'Luân Loạn' },
      { standardTag: { $regex: /^luân loạn$/i } }
    ]
  });
  console.log(`  Deleted: ${deleted.deletedCount} tags`);

  // 3. Thêm/Update tags Incest
  console.log('\n➕ Adding/updating Incest tags...');

  const INCEST_TAGS = [
    // Main Incest tag
    {
      keyword: 'incest',
      standardTag: 'Incest',
      category: 'content',
      priority: 7,
      aliases: [
        'incest', 'loạn luân', 'loan luan', 'luân loạn', 'luan loan',
        'cấm kỵ', 'cam ky', 'taboo', 'forbidden love', 'cấm đoán'
      ]
    },
    // Phụ Tử (Father-Son)
    {
      keyword: 'phu tu',
      standardTag: 'Phụ Tử',
      category: 'relationship',
      priority: 7,
      aliases: [
        'phụ tử', 'phutu', 'father son', 'cha con', 'bố con',
        'daddy', 'papa', 'ngụy phụ tử', 'nguy phu tu', 'giả phụ tử'
      ]
    },
    // Huynh Đệ (Brothers)
    {
      keyword: 'huynh de',
      standardTag: 'Huynh Đệ',
      category: 'relationship',
      priority: 7,
      aliases: [
        'huynh đệ', 'huynhde', 'brothers', 'anh em', 'anh em ruột',
        'huynh trưởng', 'đệ đệ', 'anh trai em trai', 'sibling'
      ]
    },
    // Chú Cháu (Uncle-Nephew)
    {
      keyword: 'chu chau',
      standardTag: 'Chú Cháu',
      category: 'relationship',
      priority: 7,
      aliases: [
        'chú cháu', 'chuchau', 'uncle nephew', 'bác cháu', 'cậu cháu',
        'ngụy chú cháu', 'nguy chu chau', 'giả chú cháu'
      ]
    },
    // Song Sinh (Twins)
    {
      keyword: 'song sinh',
      standardTag: 'Song Sinh',
      category: 'relationship',
      priority: 7,
      aliases: [
        'song sinh', 'songsinh', 'twins', 'sinh đôi', 'anh em sinh đôi',
        'twin brothers', 'đồng bào sinh đôi'
      ]
    },
    // Nghĩa Phụ (Adoptive Father)
    {
      keyword: 'nghia phu',
      standardTag: 'Nghĩa Phụ',
      category: 'relationship',
      priority: 7,
      aliases: [
        'nghĩa phụ', 'nghiaphu', 'adoptive father', 'bố nuôi', 'cha nuôi',
        'dưỡng phụ', 'duong phu', 'foster father'
      ]
    },
    // Sư Đồ (Master-Disciple)
    {
      keyword: 'su do',
      standardTag: 'Sư Đồ',
      category: 'relationship',
      priority: 8,
      aliases: [
        'sư đồ', 'sudo', 'master disciple', 'thầy trò', 'sư phụ đồ đệ',
        'sư tôn', 'đồ đệ', 'sư phụ', 'su phu', 'sư trưởng'
      ]
    },
    // Quân Thần (Emperor-Subject)
    {
      keyword: 'quan than',
      standardTag: 'Quân Thần',
      category: 'relationship',
      priority: 7,
      aliases: [
        'quân thần', 'quanthan', 'emperor subject', 'vua tôi', 
        'hoàng đế đại thần', 'vương tử đại thần', 'quân vương'
      ]
    },
    // Chủ Tớ (Master-Servant)
    {
      keyword: 'chu to',
      standardTag: 'Chủ Tớ',
      category: 'relationship',
      priority: 7,
      aliases: [
        'chủ tớ', 'chuto', 'master servant', 'chủ nhân hầu',
        'chủ nô', 'chu no', 'master slave', 'ông chủ'
      ]
    }
  ];

  let added = 0, updated = 0;

  for (const tag of INCEST_TAGS) {
    const existing = await TagDictionary.findOne({ standardTag: tag.standardTag });
    
    if (existing) {
      // Merge aliases
      const newAliases = [...new Set([...existing.aliases, ...tag.aliases])];
      existing.aliases = newAliases;
      await existing.save();
      console.log(`  🔄 Updated: ${tag.standardTag}`);
      updated++;
    } else {
      await TagDictionary.create(tag);
      console.log(`  ✅ Added: ${tag.standardTag}`);
      added++;
    }
  }

  console.log(`\n📊 Summary: Added ${added}, Updated ${updated}`);

  // 4. Update novels có tag sai
  console.log('\n🔄 Updating novels with incorrect "Luân Loạn" tag...');
  const novelsToFix = await Novel.updateMany(
    { standardTags: 'Luân Loạn' },
    { $set: { 'standardTags.$[elem]': 'Incest' } },
    { arrayFilters: [{ elem: 'Luân Loạn' }] }
  );
  console.log(`  Fixed: ${novelsToFix.modifiedCount} novels`);

  // 5. Đếm số truyện có tags mới
  console.log('\n📚 Novels count by tag:');
  for (const tag of INCEST_TAGS) {
    const count = await Novel.countDocuments({ standardTags: tag.standardTag });
    if (count > 0) {
      console.log(`  ${tag.standardTag}: ${count}`);
    }
  }

  // Total tags
  const total = await TagDictionary.countDocuments();
  console.log(`\n📊 Total tags in dictionary: ${total}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
