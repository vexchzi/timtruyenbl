/**
 * Fix tag categories và thêm description
 * - Sửa "Nguyên Sáng" thành "Nguyên Sang"
 * - Phân loại lại tags vào đúng category
 * - Thêm description cho tags
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');
const Novel = require('../models/Novel');

// Tags cần cập nhật category và description
const TAG_UPDATES = [
  // ========== ENDING ==========
  {
    standardTag: 'Hoàn Thành',
    category: 'ending',
    description: 'Truyện đã được hoàn thành, có kết thúc rõ ràng'
  },
  
  // ========== CONTENT ==========
  {
    standardTag: 'Đoản Văn',
    category: 'content',
    description: 'Truyện ngắn, thường dưới 50 chương'
  },
  {
    standardTag: 'Trường Thiên',
    category: 'content',
    description: 'Truyện dài, thường trên 100 chương'
  },
  {
    standardTag: 'Nguyên Sang',  // Sẽ rename từ Nguyên Sáng
    category: 'content',
    description: 'Tác phẩm gốc, không phải fanfic hay chuyển thể'
  },
  {
    standardTag: 'Đồng Nhân',
    category: 'content', 
    description: 'Fanfiction - truyện dựa trên tác phẩm/nhân vật có sẵn'
  },
  
  // ========== GENRE/SETTING ==========
  {
    standardTag: 'Thị Giác Nam Chủ',
    category: 'genre',
    description: 'Góc nhìn từ nhân vật nam chính (thường là công hoặc thụ)'
  },
  {
    standardTag: 'Ngôi Thứ Nhất',
    category: 'genre',
    description: 'Truyện kể theo ngôi thứ nhất (tôi/ta)'
  },
  {
    standardTag: 'Song Thị Giác',
    category: 'genre',
    description: 'Truyện có góc nhìn từ cả hai nhân vật chính'
  },
  
  // ========== RELATIONSHIP ==========
  {
    standardTag: 'Đam Mỹ',
    category: 'relationship',
    description: 'Boys Love - truyện tình cảm giữa hai nam nhân vật'
  },
  {
    standardTag: '1v1',
    category: 'relationship',
    description: 'Một công một thụ, chung thủy, không có người thứ ba'
  },
  {
    standardTag: 'NP',
    category: 'relationship',
    description: 'Nhiều người (N phương) - một nhân vật có nhiều đối tượng tình cảm'
  },
  {
    standardTag: 'Hỗ Công',
    category: 'relationship',
    description: 'Cả hai đều có thể là công hoặc thụ, đổi vai'
  },
  {
    standardTag: 'Cường Cường',
    category: 'relationship',
    description: 'Cả công và thụ đều mạnh mẽ, ngang tài ngang sức'
  },
  {
    standardTag: 'Niên Thượng',
    category: 'relationship',
    description: 'Công lớn tuổi hơn thụ'
  },
  {
    standardTag: 'Niên Hạ',
    category: 'relationship',
    description: 'Công nhỏ tuổi hơn thụ'
  },
  
  // ========== ENDING ==========
  {
    standardTag: 'Happy Ending',
    category: 'ending',
    description: 'Kết thúc có hậu, hai nhân vật chính ở bên nhau'
  },
  {
    standardTag: 'Bad Ending',
    category: 'ending',
    description: 'Kết thúc bi kịch, không có hậu'
  },
  {
    standardTag: 'Open Ending',
    category: 'ending',
    description: 'Kết thúc mở, để người đọc tự suy luận'
  },
  
  // ========== CHARACTER ==========
  {
    standardTag: 'Chủ Thụ',
    category: 'character',
    description: 'Truyện tập trung vào góc nhìn/câu chuyện của thụ'
  },
  {
    standardTag: 'Chủ Công',
    category: 'character',
    description: 'Truyện tập trung vào góc nhìn/câu chuyện của công'
  },
  {
    standardTag: 'Mỹ Công',
    category: 'character',
    description: 'Công có ngoại hình đẹp, xinh trai'
  },
  {
    standardTag: 'Mỹ Thụ',
    category: 'character',
    description: 'Thụ có ngoại hình đẹp, xinh trai'
  },
  
  // ========== CONTENT TYPES ==========
  {
    standardTag: 'Ngược',
    category: 'content',
    description: 'Truyện có nhiều tình tiết đau khổ, ngược tâm'
  },
  {
    standardTag: 'Sủng',
    category: 'content',
    description: 'Công chiều chuộng, yêu thương thụ hết mực'
  },
  {
    standardTag: 'Ngọt',
    category: 'content',
    description: 'Truyện ngọt ngào, ít drama, tình cảm êm đềm'
  },
  {
    standardTag: 'Hài',
    category: 'genre',
    description: 'Truyện hài hước, vui nhộn'
  },
  {
    standardTag: 'Smut',
    category: 'content',
    description: '18+ - Có nội dung người lớn'
  },
  {
    standardTag: 'ABO',
    category: 'content',
    description: 'Alpha/Beta/Omega - thế giới với phân cấp giới tính đặc biệt'
  },
  
  // ========== SETTING ==========
  {
    standardTag: 'Hiện Đại',
    category: 'setting',
    description: 'Bối cảnh thời hiện đại'
  },
  {
    standardTag: 'Cổ Đại',
    category: 'setting',
    description: 'Bối cảnh cổ trang, phong kiến'
  },
  {
    standardTag: 'Dân Quốc',
    category: 'setting',
    description: 'Bối cảnh thời Dân Quốc (1912-1949)'
  },
  {
    standardTag: 'Giới Giải Trí',
    category: 'setting',
    description: 'Bối cảnh showbiz, giới nghệ sĩ'
  },
  {
    standardTag: 'Học Đường',
    category: 'setting',
    description: 'Bối cảnh trường học, sinh viên'
  },
  {
    standardTag: 'Cung Đình',
    category: 'setting',
    description: 'Bối cảnh cung đình, hoàng cung'
  },
  
  // ========== THEME ==========
  {
    standardTag: 'Xuyên Không',
    category: 'genre',
    description: 'Nhân vật xuyên không sang thế giới/thời đại khác'
  },
  {
    standardTag: 'Trọng Sinh',
    category: 'genre',
    description: 'Nhân vật được sống lại từ đầu với ký ức kiếp trước'
  },
  {
    standardTag: 'Hệ Thống',
    category: 'genre',
    description: 'Nhân vật có hệ thống (game-like) hỗ trợ'
  },
  
  // ========== SPECIAL RELATIONSHIPS ==========
  {
    standardTag: 'Incest',
    category: 'content',
    description: 'Quan hệ cấm kỵ giữa người thân trong gia đình'
  },
  {
    standardTag: 'Phụ Tử',
    category: 'relationship',
    description: 'Quan hệ cha-con (có thể là giả hoặc nuôi dưỡng)'
  },
  {
    standardTag: 'Huynh Đệ',
    category: 'relationship',
    description: 'Quan hệ anh-em (có thể là giả hoặc kết nghĩa)'
  },
  {
    standardTag: 'Sư Đồ',
    category: 'relationship',
    description: 'Quan hệ thầy-trò'
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // 1. Rename "Nguyên Sáng" -> "Nguyên Sang"
  console.log('🔄 Renaming "Nguyên Sáng" to "Nguyên Sang"...');
  
  const nguyenSang = await TagDictionary.findOne({ standardTag: 'Nguyên Sáng' });
  if (nguyenSang) {
    nguyenSang.standardTag = 'Nguyên Sang';
    nguyenSang.category = 'content';
    nguyenSang.description = 'Tác phẩm gốc, không phải fanfic hay chuyển thể';
    nguyenSang.aliases = [...new Set([...nguyenSang.aliases, 'nguyên sang', 'nguyen sang', 'original', 'nguyên sáng'])];
    await nguyenSang.save();
    console.log('  ✅ Renamed tag in dictionary');
    
    // Update novels
    const result = await Novel.updateMany(
      { standardTags: 'Nguyên Sáng' },
      { $set: { 'standardTags.$[elem]': 'Nguyên Sang' } },
      { arrayFilters: [{ elem: 'Nguyên Sáng' }] }
    );
    console.log(`  ✅ Updated ${result.modifiedCount} novels`);
  } else {
    // Create if not exists
    await TagDictionary.create({
      keyword: 'nguyen sang',
      standardTag: 'Nguyên Sang',
      category: 'content',
      priority: 7,
      description: 'Tác phẩm gốc, không phải fanfic hay chuyển thể',
      aliases: ['nguyên sang', 'nguyen sang', 'original', 'nguyên sáng', 'nguyen sang', 'tác phẩm gốc']
    });
    console.log('  ✅ Created new tag');
  }

  // 2. Update categories and descriptions
  console.log('\n🔄 Updating tag categories and descriptions...');
  let updated = 0;
  
  for (const update of TAG_UPDATES) {
    const tag = await TagDictionary.findOne({ standardTag: update.standardTag });
    if (tag) {
      let changed = false;
      
      if (tag.category !== update.category) {
        tag.category = update.category;
        changed = true;
      }
      
      if (!tag.description || tag.description !== update.description) {
        tag.description = update.description;
        changed = true;
      }
      
      if (changed) {
        await tag.save();
        console.log(`  ✅ ${update.standardTag} → ${update.category}`);
        updated++;
      }
    }
  }
  
  console.log(`\n📊 Updated ${updated} tags`);

  // 3. Check remaining "other" category tags
  console.log('\n📋 Remaining tags in "other" category:');
  const otherTags = await TagDictionary.find({ category: 'other' }).select('standardTag').lean();
  otherTags.slice(0, 20).forEach(t => console.log(`  - ${t.standardTag}`));
  if (otherTags.length > 20) console.log(`  ... and ${otherTags.length - 20} more`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
