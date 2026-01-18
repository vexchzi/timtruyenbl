/**
 * Thêm tags nhân vật: đại thúc, bình phàm, etc.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

const CHARACTER_TAGS = [
  // ========== THỤ (BOTTOM) TYPES ==========
  {
    keyword: 'dai thuc thu',
    standardTag: 'Đại Thúc Thụ',
    category: 'character',
    priority: 7,
    aliases: [
      'đại thúc thụ', 'daithucthu', 'uncle uke', 'thúc thụ',
      'đại thúc', 'dai thuc', 'older uke', 'mature uke'
    ]
  },
  {
    keyword: 'binh pham thu',
    standardTag: 'Bình Phàm Thụ',
    category: 'character',
    priority: 7,
    aliases: [
      'bình phàm thụ', 'binhphamthu', 'ordinary uke', 'thụ bình thường',
      'bình phàm', 'binh pham', 'common uke', 'normal uke'
    ]
  },
  {
    keyword: 'nhuoc thu',
    standardTag: 'Nhược Thụ',
    category: 'character',
    priority: 7,
    aliases: [
      'nhược thụ', 'nhuocthu', 'weak uke', 'thụ yếu đuối',
      'thụ nhược', 'thu nhuoc', 'fragile uke'
    ]
  },
  {
    keyword: 'thu da cong',
    standardTag: 'Thụ Đa Công',
    category: 'character',
    priority: 7,
    aliases: [
      'thụ đa công', 'thudacong', 'nhất thụ đa công', '1 thụ nhiều công',
      'một thụ nhiều công', 'reverse harem uke'
    ]
  },
  {
    keyword: 'ngay tho thu',
    standardTag: 'Ngây Thơ Thụ',
    category: 'character',
    priority: 7,
    aliases: [
      'ngây thơ thụ', 'ngaythothu', 'innocent uke', 'thụ trong sáng',
      'thụ ngây ngô', 'pure uke', 'naive uke'
    ]
  },
  {
    keyword: 'lanh dam thu',
    standardTag: 'Lãnh Đạm Thụ',
    category: 'character',
    priority: 7,
    aliases: [
      'lãnh đạm thụ', 'lanhdamthu', 'cold uke', 'thụ lạnh lùng',
      'thụ lãnh đạm', 'indifferent uke', 'aloof uke'
    ]
  },
  {
    keyword: 'cao lanh thu',
    standardTag: 'Cao Lãnh Thụ',
    category: 'character',
    priority: 7,
    aliases: [
      'cao lãnh thụ', 'caolanhthu', 'cold noble uke', 'thụ cao ngạo',
      'thụ kiêu ngạo', 'proud uke', 'arrogant uke'
    ]
  },

  // ========== CÔNG (TOP) TYPES ==========
  {
    keyword: 'binh pham cong',
    standardTag: 'Bình Phàm Công',
    category: 'character',
    priority: 7,
    aliases: [
      'bình phàm công', 'binhphamcong', 'ordinary seme', 'công bình thường',
      'common seme', 'normal seme'
    ]
  },
  {
    keyword: 'ba dao cong',
    standardTag: 'Bá Đạo Công',
    category: 'character',
    priority: 8,
    aliases: [
      'bá đạo công', 'badaocong', 'domineering seme', 'công bá đạo',
      'ba dao', 'tyrannical seme', 'overbearing seme', 'độc tài công'
    ]
  },
  {
    keyword: 'tra cuong cong',
    standardTag: 'Tra Cường Công',
    category: 'character',
    priority: 7,
    aliases: [
      'tra cường công', 'tracuongcong', 'scum strong seme', 
      'tra nam', 'scum seme', 'slag seme'
    ]
  },
  {
    keyword: 'phuc hac cong',
    standardTag: 'Phúc Hắc Công',
    category: 'character',
    priority: 8,
    aliases: [
      'phúc hắc công', 'phuchaccong', 'black belly seme', 'công bụng đen',
      'thâm hiểm công', 'scheming seme', 'cunning seme'
    ]
  },
  {
    keyword: 'on nhu cong',
    standardTag: 'Ôn Nhu Công',
    category: 'character',
    priority: 7,
    aliases: [
      'ôn nhu công', 'onnhucong', 'gentle seme', 'công ôn nhu',
      'công dịu dàng', 'soft seme', '温柔攻', 'on nhu'
    ]
  },
  {
    keyword: 'phong luu cong',
    standardTag: 'Phong Lưu Công',
    category: 'character',
    priority: 7,
    aliases: [
      'phong lưu công', 'phongluucong', 'playboy seme', 'công đào hoa',
      'công lăng nhăng', 'flirty seme', 'womanizer seme'
    ]
  },
  {
    keyword: 'lanh dam cong',
    standardTag: 'Lãnh Đạm Công',
    category: 'character',
    priority: 7,
    aliases: [
      'lãnh đạm công', 'lanhdamcong', 'cold seme', 'công lạnh lùng',
      'cold male lead', 'indifferent seme'
    ]
  },
  {
    keyword: 'thu khong cong',
    standardTag: 'Thú Khống Công',
    category: 'character',
    priority: 7,
    aliases: [
      'thú khống công', 'thukhongcong', 'possessive seme', 'công chiếm hữu',
      'controlling seme', 'jealous seme', 'yêu đương độc chiếm'
    ]
  },

  // ========== OTHER CHARACTER TYPES ==========
  {
    keyword: 'tong tai',
    standardTag: 'Tổng Tài',
    category: 'character',
    priority: 8,
    aliases: [
      'tổng tài', 'tongtai', 'ceo', 'president', 'tổng giám đốc',
      'boss', 'giám đốc', 'tycoon', 'big boss'
    ]
  },
  {
    keyword: 'minh tinh',
    standardTag: 'Minh Tinh',
    category: 'character',
    priority: 7,
    aliases: [
      'minh tinh', 'minhtinh', 'celebrity', 'ngôi sao', 'idol',
      'star', 'famous', 'ca sĩ', 'diễn viên'
    ]
  },
  {
    keyword: 'bac si',
    standardTag: 'Bác Sĩ',
    category: 'character',
    priority: 7,
    aliases: [
      'bác sĩ', 'bacsi', 'doctor', 'y sĩ', 'bác sỹ', 
      'physician', 'y bác sĩ'
    ]
  },
  {
    keyword: 'quan nhan',
    standardTag: 'Quân Nhân',
    category: 'character',
    priority: 8,
    aliases: [
      'quân nhân', 'quannhan', 'military', 'soldier', 'lính',
      'bộ đội', 'sĩ quan', 'army', 'quân đội'
    ]
  },
  {
    keyword: 'giang ho',
    standardTag: 'Giang Hồ',
    category: 'setting',
    priority: 7,
    aliases: [
      'giang hồ', 'giangho', 'jianghu', 'martial arts world',
      'võ lâm', 'wulin', 'kiếm hiệp'
    ]
  },
  {
    keyword: 'hac bang',
    standardTag: 'Hắc Bang',
    category: 'setting',
    priority: 7,
    aliases: [
      'hắc bang', 'hacbang', 'mafia', 'gang', 'xã hội đen',
      'gangster', 'underworld', 'crime', 'tội phạm'
    ]
  }
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let added = 0, updated = 0, skipped = 0;

  for (const tag of CHARACTER_TAGS) {
    try {
      const existing = await TagDictionary.findOne({ standardTag: tag.standardTag });
      
      if (existing) {
        const newAliases = [...new Set([...existing.aliases, ...tag.aliases])];
        if (newAliases.length > existing.aliases.length) {
          existing.aliases = newAliases;
          await existing.save();
          console.log(`🔄 Updated: ${tag.standardTag} (+${newAliases.length - existing.aliases.length} aliases)`);
          updated++;
        } else {
          console.log(`⏭️ Skipped: ${tag.standardTag}`);
          skipped++;
        }
      } else {
        await TagDictionary.create(tag);
        console.log(`✅ Added: ${tag.standardTag}`);
        added++;
      }
    } catch (error) {
      console.error(`❌ Error with ${tag.standardTag}:`, error.message);
    }
  }

  console.log('\n========================================');
  console.log(`✅ Added: ${added}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log('========================================');

  const total = await TagDictionary.countDocuments();
  console.log(`\n📊 Total tags: ${total}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
