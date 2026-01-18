/**
 * Script thêm các tags bị thiếu từ Frontend vào TagDictionary
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

// Tags bị thiếu cần thêm
const MISSING_TAGS = [
  // Đặc biệt - Special
  {
    keyword: 'nu bien nam',
    standardTag: 'Nữ Biến Nam',
    category: 'character',
    priority: 7,
    aliases: ['nữ biến nam', 'nubiennam', 'female to male', 'f2m', 'nữ hoá nam', 'nữ hóa nam']
  },
  {
    keyword: 'song tinh',
    standardTag: 'Song Tính',
    category: 'character',
    priority: 7,
    aliases: ['song tính', 'songtinh', 'lưỡng tính', 'luong tinh', 'hermaphrodite', 'futa']
  },
  {
    keyword: 'gia nu',
    standardTag: 'Giả Nữ',
    category: 'character',
    priority: 7,
    aliases: ['giả nữ', 'gianu', 'crossdress', 'cross dress', 'nữ trang', 'giả gái', 'gia gai', 'nam giả nữ', 'nam gia nu']
  },
  {
    keyword: 'nhan ngu',
    standardTag: 'Nhân Ngư',
    category: 'character',
    priority: 7,
    aliases: ['nhân ngư', 'nhanngu', 'mermaid', 'merman', 'người cá', 'nguoi ca']
  },
  
  // Quan hệ - Relationship
  {
    keyword: 'thanh mai truc ma',
    standardTag: 'Thanh Mai Trúc Mã',
    category: 'relationship',
    priority: 8,
    aliases: ['thanh mai trúc mã', 'thanhmaitrucma', 'bạn thuở nhỏ', 'ban thuo nho', 'childhood friends', 'thanh mai', 'trúc mã', 'truc ma']
  },
  {
    keyword: 'guong vo lai lanh',
    standardTag: 'Gương Vỡ Lại Lành',
    category: 'relationship',
    priority: 8,
    aliases: ['gương vỡ lại lành', 'guongvolailanh', 'phá kính trọng viên', 'reunion', 'hàn băng', 'nối lại tình xưa', 'noi lai tinh xua', 'cựu ái', 'cuu ai']
  },
  {
    keyword: 'tinh dich bien cp',
    standardTag: 'Tình Địch Biến CP',
    category: 'relationship',
    priority: 7,
    aliases: ['tình địch biến cp', 'tinhdicbiencp', 'rivals to lovers', 'kẻ thù thành người yêu', 'tình địch', 'tinh dich']
  },
  
  // Kết thúc - Ending
  {
    keyword: 'bad ending',
    standardTag: 'Bad Ending',
    category: 'ending',
    priority: 9,
    aliases: ['be', 'bad end', 'kết buồn', 'ket buon', 'kết cục tồi tệ', 'bi thương', 'bi kịch']
  },
  
  // Nội dung - Content  
  {
    keyword: 'duong thanh',
    standardTag: 'Dưỡng Thành',
    category: 'content',
    priority: 8,
    aliases: ['dưỡng thành', 'duongthanh', 'nuôi dưỡng', 'nuoi duong', 'raising', 'dưỡng dục', 'duong duc']
  },
  {
    keyword: 'cuu chuoc',
    standardTag: 'Cứu Chuộc',
    category: 'content',
    priority: 8,
    aliases: ['cứu chuộc', 'cuuchuoc', 'redemption', 'cứu vớt', 'cuu vot', 'cứu rỗi', 'cuu roi']
  },
  {
    keyword: 'cham nhiet',
    standardTag: 'Chậm Nhiệt',
    category: 'content',
    priority: 8,
    aliases: ['chậm nhiệt', 'chamnhiet', 'slow burn', 'slowburn', 'chậm rãi', 'cham rai']
  },
  {
    keyword: 'truy the',
    standardTag: 'Truy Thê',
    category: 'content',
    priority: 8,
    aliases: ['truy thê', 'truythe', 'đuổi theo vợ', 'duoi theo vo', 'chasing wife']
  },
  {
    keyword: 'oan gia',
    standardTag: 'Oan Gia',
    category: 'content',
    priority: 8,
    aliases: ['oan gia', 'oanga', 'enemies', 'kẻ thù', 'ke thu', 'thù địch', 'thu dich']
  },
  {
    keyword: 'cuong ep',
    standardTag: 'Cưỡng Ép',
    category: 'content',
    priority: 7,
    aliases: ['cưỡng ép', 'cuongep', 'ép buộc', 'ep buoc', 'forced', 'cưỡng bức', 'cuong buc', 'cưỡng chế', 'cuong che']
  },
  
  // Thể loại - Genre
  {
    keyword: 'song khiet',
    standardTag: 'Song Khiết',
    category: 'content',
    priority: 8,
    aliases: ['song khiết', 'songkhiet', 'sạch sẽ', 'sach se', '1c1t', 'một công một thụ', 'mot cong mot thu', 'thuần khiết', 'thuan khiet', 'sạch']
  },
  {
    keyword: 'ho sung',
    standardTag: 'Hỗ Sủng',
    category: 'content',
    priority: 8,
    aliases: ['hỗ sủng', 'hosung', 'sủng lẫn nhau', 'sung lan nhau', 'mutual pampering']
  },
  {
    keyword: 'diem van',
    standardTag: 'Điềm Văn',
    category: 'genre',
    priority: 8,
    aliases: ['điềm văn', 'diemvan', 'nhẹ nhàng', 'nhe nhang', 'êm đềm', 'em dem', 'bình lặng', 'binh lang']
  },
  {
    keyword: 'chinh kich',
    standardTag: 'Chính Kịch',
    category: 'genre',
    priority: 8,
    aliases: ['chính kịch', 'chinhkich', 'drama', 'kịch tính', 'kich tinh']
  },
  {
    keyword: 'kinh di',
    standardTag: 'Kinh Dị',
    category: 'genre',
    priority: 8,
    aliases: ['kinh dị', 'kinhdi', 'horror', 'rùng rợn', 'rung ron', 'ma quái', 'ma quai']
  },
  {
    keyword: 'trinh tham',
    standardTag: 'Trinh Thám',
    category: 'genre',
    priority: 8,
    aliases: ['trinh thám', 'trinhtham', 'detective', 'thám tử', 'tham tu', 'điều tra', 'dieu tra', 'phá án', 'pha an']
  },
  {
    keyword: 'hac am',
    standardTag: 'Hắc Ám',
    category: 'genre',
    priority: 7,
    aliases: ['hắc ám', 'hacam', 'dark', 'tăm tối', 'tam toi', 'u ám', 'u am', 'đen tối', 'den toi']
  },
  {
    keyword: 'bao thu',
    standardTag: 'Báo Thù',
    category: 'content',
    priority: 8,
    aliases: ['báo thù', 'baothu', 'revenge', 'trả thù', 'tra thu', 'phục thù', 'phuc thu']
  },
  
  // Bối cảnh - Setting
  {
    keyword: 'quan truong',
    standardTag: 'Quan Trường',
    category: 'setting',
    priority: 7,
    aliases: ['quan trường', 'quantruong', 'quan lại', 'quan lai', 'chính trường', 'chinh truong', 'political']
  },
  {
    keyword: 'quan nhan',
    standardTag: 'Quân Nhân',
    category: 'setting',
    priority: 8,
    aliases: ['quân nhân', 'quannhan', 'military', 'lính', 'linh', 'binh lính', 'binh linh', 'bộ đội', 'bo doi']
  },
  {
    keyword: 'nong thon',
    standardTag: 'Nông Thôn',
    category: 'setting',
    priority: 7,
    aliases: ['nông thôn', 'nongthon', 'rural', 'làng quê', 'lang que', 'village', 'điền viên', 'dien vien']
  },
  {
    keyword: 'do thi',
    standardTag: 'Đô Thị',
    category: 'setting',
    priority: 7,
    aliases: ['đô thị', 'dothi', 'urban', 'thành phố', 'thanh pho', 'city']
  },
  
  // Nhân vật - Character
  {
    keyword: 'phuc hac',
    standardTag: 'Phúc Hắc',
    category: 'character',
    priority: 7,
    aliases: ['phúc hắc', 'phuchac', 'black belly', 'bụng đen', 'bung den', 'thâm hiểm', 'tham hiem']
  },
  {
    keyword: 'bang son',
    standardTag: 'Băng Sơn',
    category: 'character',
    priority: 7,
    aliases: ['băng sơn', 'bangson', 'lạnh lùng', 'lanh lung', 'iceberg', 'băng giá', 'bang gia', 'cold', 'lãnh đạm', 'lanh dam']
  },
  {
    keyword: 'benh kieu',
    standardTag: 'Bệnh Kiều',
    category: 'character',
    priority: 7,
    aliases: ['bệnh kiều', 'benhkieu', 'sickly beauty', 'yếu đuối', 'yeu duoi', 'bệnh nhược', 'benh nhuoc']
  },
  {
    keyword: 'yandere',
    standardTag: 'Yandere',
    category: 'character',
    priority: 7,
    aliases: ['yandere', 'yan', 'cuồng dại', 'cuong dai', 'ám muội', 'am muoi', 'biến thái', 'bien thai']
  },
  
  // Chủ đề - Theme
  {
    keyword: 'xuyen sach',
    standardTag: 'Xuyên Sách',
    category: 'genre',
    priority: 8,
    aliases: ['xuyên sách', 'xuyensach', 'xuyên văn', 'xuyen van', 'transmigration into book', 'vào sách']
  },
  {
    keyword: 'ky huyen',
    standardTag: 'Kỳ Huyễn',
    category: 'genre',
    priority: 8,
    aliases: ['kỳ huyễn', 'kyhuyen', 'fantasy', 'kì huyễn', 'kihuyen', 'huyền ảo', 'huyen ao']
  },

  // Tags từ web search
  {
    keyword: 'tinh huu doc chung',
    standardTag: 'Tình Hữu Độc Chung',
    category: 'relationship',
    priority: 8,
    aliases: ['tình hữu độc chung', 'tinhhuudocchung', 'only love', 'duy nhất', 'chung thủy', 'chung thuy']
  },
  {
    keyword: 'nguoc luyen tinh tham',
    standardTag: 'Ngược Luyến Tình Thâm',
    category: 'content',
    priority: 8,
    aliases: ['ngược luyến tình thâm', 'nguocluyentinhtham', 'ngược thương', 'nguoc thuong', 'ngược ngọt', 'nguoc ngot', 'abuse to love']
  },
  {
    keyword: 'nien thuong',
    standardTag: 'Niên Thượng',
    category: 'relationship',
    priority: 9,
    aliases: ['niên thượng', 'nienthuong', 'older top', 'công lớn tuổi', 'cong lon tuoi', 'age gap']
  },
  {
    keyword: 'nien ha',
    standardTag: 'Niên Hạ',
    category: 'relationship',
    priority: 9,
    aliases: ['niên hạ', 'nienha', 'younger top', 'công nhỏ tuổi', 'cong nho tuoi', 'younger seme']
  },
  {
    keyword: 'cuoi truoc yeu sau',
    standardTag: 'Cưới Trước Yêu Sau',
    category: 'content',
    priority: 8,
    aliases: ['cưới trước yêu sau', 'cuoitruocyeusau', 'marriage first', 'hôn trước yêu sau', 'hon truoc yeu sau', 'tiên hôn hậu ái', 'tien hon hau ai']
  }
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const tag of MISSING_TAGS) {
    try {
      // Check if exists by keyword or standardTag
      const existing = await TagDictionary.findOne({
        $or: [
          { keyword: tag.keyword },
          { standardTag: tag.standardTag }
        ]
      });

      if (existing) {
        // Update aliases if needed
        const newAliases = [...new Set([...existing.aliases, ...tag.aliases])];
        if (newAliases.length > existing.aliases.length) {
          existing.aliases = newAliases;
          await existing.save();
          console.log(`  🔄 Updated: ${tag.standardTag} (+${newAliases.length - existing.aliases.length} aliases)`);
          updated++;
        } else {
          console.log(`  ⏭️ Skipped: ${tag.standardTag} (already exists)`);
          skipped++;
        }
      } else {
        // Create new
        const newTag = new TagDictionary(tag);
        await newTag.save();
        console.log(`  ✅ Added: ${tag.standardTag}`);
        added++;
      }
    } catch (error) {
      console.error(`  ❌ Error with ${tag.standardTag}:`, error.message);
    }
  }

  console.log('\n========================================');
  console.log(`✅ Added: ${added}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log('========================================\n');

  // Final count
  const total = await TagDictionary.countDocuments();
  console.log(`📊 Total tags in dictionary: ${total}\n`);

  await mongoose.disconnect();
  console.log('✅ Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
