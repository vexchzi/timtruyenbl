/**
 * Thêm các tags còn thiếu - Part 2
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

const MISSING_TAGS = [
  // ========== CONTENT/SETTING ==========
  {
    keyword: 'vong phoi',
    standardTag: 'Võng Phối',
    category: 'content',
    priority: 8,
    description: 'Hẹn hò qua mạng, tìm hiểu online trước khi gặp nhau',
    aliases: ['võng phối', 'vongphoi', 'online dating', 'hẹn hò online', 'quen qua mạng', 'net dating']
  },
  {
    keyword: 'vuon truong',
    standardTag: 'Vườn Trường',
    category: 'setting',
    priority: 8,
    description: 'Bối cảnh học đường, trường học',
    aliases: ['vườn trường', 'vuontruong', 'campus', 'school life', 'thanh xuân vườn trường']
  },
  {
    keyword: 'hoa quy',
    standardTag: 'Hoa Quý',
    category: 'content',
    priority: 7,
    description: 'Nhân vật quý giá như hoa, được trân trọng',
    aliases: ['hoa quý', 'hoaquy', 'precious flower', 'hoa quý mùa mưa']
  },
  {
    keyword: 'co dien',
    standardTag: 'Cổ Điển',
    category: 'genre',
    priority: 7,
    description: 'Phong cách cổ điển, truyền thống',
    aliases: ['cổ điển', 'codien', 'classic', 'truyền thống', 'ngọt ngào cổ điển']
  },
  {
    keyword: 'boi canh',
    standardTag: 'Bối Cảnh',
    category: 'setting',
    priority: 5,
    description: 'Liên quan đến bối cảnh truyện',
    aliases: ['bối cảnh', 'boicanh', 'setting', 'background']
  },
  
  // ========== MORE COMMON TAGS ==========
  {
    keyword: 'song huong',
    standardTag: 'Song Hướng',
    category: 'content',
    priority: 8,
    description: 'Cả hai đều có tình cảm với nhau',
    aliases: ['song hướng', 'songhuong', 'mutual', 'hai chiều', 'song hướng yêu thầm', 'song hướng thầm mến']
  },
  {
    keyword: 'don huong',
    standardTag: 'Đơn Hướng',
    category: 'content',
    priority: 7,
    description: 'Yêu một chiều, đơn phương',
    aliases: ['đơn hướng', 'donhuong', 'one-sided', 'một chiều', 'đơn hướng yêu thầm']
  },
  {
    keyword: 'ngay tho',
    standardTag: 'Ngây Thơ',
    category: 'character',
    priority: 7,
    description: 'Nhân vật ngây thơ, trong sáng',
    aliases: ['ngây thơ', 'ngaytho', 'innocent', 'trong sáng', 'đơn thuần']
  },
  {
    keyword: 'thu cung',
    standardTag: 'Thú Cưng',
    category: 'content',
    priority: 7,
    description: 'Truyện có yếu tố thú cưng, nuôi pet',
    aliases: ['thú cưng', 'thucung', 'pet', 'nuôi thú', 'động vật']
  },
  {
    keyword: 'cap doi',
    standardTag: 'Cặp Đôi',
    category: 'relationship',
    priority: 7,
    description: 'Liên quan đến cặp đôi trong truyện',
    aliases: ['cặp đôi', 'capdoi', 'couple', 'cp', 'đôi']
  },
  {
    keyword: 'tinh yeu',
    standardTag: 'Tình Yêu',
    category: 'content',
    priority: 8,
    description: 'Truyện tình yêu, lãng mạn',
    aliases: ['tình yêu', 'tinhyeu', 'love', 'romance', 'yêu đương', 'lãng mạn']
  },
  {
    keyword: 'hanh phuc',
    standardTag: 'Hạnh Phúc',
    category: 'content',
    priority: 7,
    description: 'Truyện có kết thúc hoặc nội dung hạnh phúc',
    aliases: ['hạnh phúc', 'hanhphuc', 'happiness', 'vui vẻ', 'an yên']
  },
  {
    keyword: 'nam chinh',
    standardTag: 'Nam Chính',
    category: 'character',
    priority: 7,
    description: 'Liên quan đến nhân vật nam chính',
    aliases: ['nam chính', 'namchinh', 'male lead', 'main character', 'nhân vật chính nam']
  },
  {
    keyword: 'nu chinh',
    standardTag: 'Nữ Chính',
    category: 'character',
    priority: 7,
    description: 'Liên quan đến nhân vật nữ chính',
    aliases: ['nữ chính', 'nuchinh', 'female lead', 'nhân vật chính nữ']
  },
  {
    keyword: 'ngot van',
    standardTag: 'Ngọt Văn',
    category: 'content',
    priority: 8,
    description: 'Truyện ngọt ngào, ít drama',
    aliases: ['ngọt văn', 'ngotvan', 'sweet story', 'truyện ngọt', 'văn ngọt']
  },
  {
    keyword: 'nguoc van',
    standardTag: 'Ngược Văn',
    category: 'content',
    priority: 8,
    description: 'Truyện có nhiều tình tiết đau khổ',
    aliases: ['ngược văn', 'nguocvan', 'angst story', 'truyện ngược', 'văn ngược']
  },
  {
    keyword: 'truyen dai',
    standardTag: 'Truyện Dài',
    category: 'content',
    priority: 6,
    description: 'Truyện có nhiều chương',
    aliases: ['truyện dài', 'truyendai', 'long story', 'dài', 'nhiều chương']
  },
  {
    keyword: 'truyen ngan',
    standardTag: 'Truyện Ngắn',
    category: 'content',
    priority: 6,
    description: 'Truyện ngắn, ít chương',
    aliases: ['truyện ngắn', 'truyenngan', 'short story', 'ngắn', 'oneshot']
  },
  
  // ========== EMOTIONS/THEMES ==========
  {
    keyword: 'cam dong',
    standardTag: 'Cảm Động',
    category: 'content',
    priority: 7,
    description: 'Truyện gây xúc động, cảm xúc',
    aliases: ['cảm động', 'camdong', 'touching', 'xúc động', 'rơi nước mắt']
  },
  {
    keyword: 'lang man',
    standardTag: 'Lãng Mạn',
    category: 'content',
    priority: 8,
    description: 'Truyện lãng mạn, tình cảm',
    aliases: ['lãng mạn', 'langman', 'romantic', 'romance', 'tình cảm lãng mạn']
  },
  {
    keyword: 'bi kich',
    standardTag: 'Bi Kịch',
    category: 'content',
    priority: 7,
    description: 'Truyện có yếu tố bi kịch, đau thương',
    aliases: ['bi kịch', 'bikich', 'tragedy', 'đau thương', 'thảm kịch']
  },
  
  // ========== STORY ELEMENTS ==========
  {
    keyword: 'hieu lam',
    standardTag: 'Hiểu Lầm',
    category: 'content',
    priority: 7,
    description: 'Truyện có nhiều hiểu lầm giữa các nhân vật',
    aliases: ['hiểu lầm', 'hieulam', 'misunderstanding', 'ngộ nhận']
  },
  {
    keyword: 'chia tay',
    standardTag: 'Chia Tay',
    category: 'content',
    priority: 7,
    description: 'Truyện có tình tiết chia tay',
    aliases: ['chia tay', 'chiatay', 'breakup', 'tan vỡ', 'ly biệt']
  },
  {
    keyword: 'tai hop',
    standardTag: 'Tái Hợp',
    category: 'content',
    priority: 7,
    description: 'Chia tay rồi quay lại với nhau',
    aliases: ['tái hợp', 'taihop', 'reunion', 'quay lại', 'nối lại tình xưa']
  }
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let added = 0, updated = 0;

  for (const tag of MISSING_TAGS) {
    try {
      const existing = await TagDictionary.findOne({ standardTag: tag.standardTag });
      
      if (existing) {
        // Merge aliases
        const newAliases = [...new Set([...existing.aliases, ...tag.aliases])];
        let changed = false;
        
        if (newAliases.length > existing.aliases.length) {
          existing.aliases = newAliases;
          changed = true;
        }
        if (!existing.description && tag.description) {
          existing.description = tag.description;
          changed = true;
        }
        
        if (changed) {
          await existing.save();
          console.log(`🔄 Updated: ${tag.standardTag}`);
          updated++;
        }
      } else {
        await TagDictionary.create(tag);
        console.log(`✅ Added: ${tag.standardTag}`);
        added++;
      }
    } catch (error) {
      console.error(`❌ Error ${tag.standardTag}:`, error.message);
    }
  }

  console.log(`\n📊 Added: ${added}, Updated: ${updated}`);
  
  const total = await TagDictionary.countDocuments();
  console.log(`📊 Total tags: ${total}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
