/**
 * Thêm các tags còn thiếu
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

const MISSING_TAGS = [
  // ========== SỦNG TYPES ==========
  {
    keyword: 'cong sung thu',
    standardTag: 'Công Sủng Thụ',
    category: 'content',
    priority: 8,
    description: 'Công chiều chuộng, yêu thương thụ',
    aliases: ['công sủng thụ', 'congsungthu', 'seme pampers uke', 'công chiều thụ', 'sủng thụ']
  },
  {
    keyword: 'thu sung cong',
    standardTag: 'Thụ Sủng Công',
    category: 'content',
    priority: 8,
    description: 'Thụ chiều chuộng, yêu thương công',
    aliases: ['thụ sủng công', 'thusungcong', 'uke pampers seme', 'thụ chiều công', 'sủng công']
  },
  
  // ========== SETTING/GENRE ==========
  {
    keyword: 'quan van',
    standardTag: 'Quân Văn',
    category: 'setting',
    priority: 8,
    description: 'Bối cảnh quân đội, quân nhân',
    aliases: ['quân văn', 'quanvan', 'military', 'quân sự', 'quân ngũ', 'lính']
  },
  {
    keyword: 'xuyen viet',
    standardTag: 'Xuyên Việt',
    category: 'genre',
    priority: 8,
    description: 'Xuyên không qua các thời đại, quốc gia',
    aliases: ['xuyên việt', 'xuyenviet', 'time travel', 'xuyên thời gian', 'xuyên qua']
  },
  {
    keyword: 'hao mon the gia',
    standardTag: 'Hào Môn Thế Gia',
    category: 'setting',
    priority: 8,
    description: 'Bối cảnh gia đình quyền quý, giàu có',
    aliases: ['hào môn thế gia', 'haomonthegia', 'noble family', 'gia tộc', 'thế gia', 'hào môn', 'danh gia vọng tộc', 'quyền quý']
  },
  {
    keyword: 'lam giau',
    standardTag: 'Làm Giàu',
    category: 'genre',
    priority: 7,
    description: 'Nhân vật phấn đấu làm giàu, kinh doanh',
    aliases: ['làm giàu', 'lamgiau', 'getting rich', 'kinh doanh', 'buôn bán', 'phát tài']
  },
  {
    keyword: 'bao thu',
    standardTag: 'Báo Thù',
    category: 'content',
    priority: 7,
    description: 'Nhân vật trả thù những kẻ đã hại mình',
    aliases: ['báo thù', 'baothu', 'revenge', 'trả thù', 'phục thù']
  },
  {
    keyword: 'tinh cam',
    standardTag: 'Tình Cảm',
    category: 'genre',
    priority: 7,
    description: 'Truyện tập trung vào tình cảm, cảm xúc',
    aliases: ['tình cảm', 'tinhcam', 'romance', 'lãng mạn', 'yêu đương']
  },
  {
    keyword: 'lich su',
    standardTag: 'Lịch Sử',
    category: 'setting',
    priority: 7,
    description: 'Bối cảnh lịch sử, có yếu tố lịch sử thực',
    aliases: ['lịch sử', 'lichsu', 'history', 'historical', 'cổ sử']
  },
  
  // ========== CHARACTER INTERACTIONS ==========
  {
    keyword: 'cong ngao thu',
    standardTag: 'Công Ngạo Thụ',
    category: 'content',
    priority: 7,
    description: 'Công kiêu ngạo, cao ngạo với thụ',
    aliases: ['công ngạo thụ', 'congnaochu', 'arrogant seme']
  },
  {
    keyword: 'ngot ngao',
    standardTag: 'Ngọt Ngào',
    category: 'content',
    priority: 8,
    description: 'Truyện ngọt ngào, ít drama',
    aliases: ['ngọt ngào', 'ngotngao', 'sweet', 'fluffy', 'đáng yêu']
  },
  {
    keyword: 'chut nguoc',
    standardTag: 'Chút Ngược',
    category: 'content',
    priority: 7,
    description: 'Có một chút ngược nhẹ, không quá nặng',
    aliases: ['chút ngược', 'chutnguoc', 'slight angst', 'ngược nhẹ', 'hơi ngược']
  },
  
  // ========== SPECIAL SETTINGS ==========
  {
    keyword: 'mafia',
    standardTag: 'Hắc Bang',
    category: 'setting',
    priority: 8,
    description: 'Bối cảnh xã hội đen, mafia',
    aliases: ['mafia', 'xã hội đen', 'gangster', 'băng đảng', 'tội phạm', 'underworld']
  },
  {
    keyword: 'thong minh',
    standardTag: 'Thông Minh',
    category: 'character',
    priority: 7,
    description: 'Nhân vật thông minh, mưu trí',
    aliases: ['thông minh', 'thongminh', 'smart', 'clever', 'trí tuệ', 'cao thủ']
  },
  {
    keyword: 'quy tinh',
    standardTag: 'Quỷ Tính',
    category: 'character',
    priority: 7,
    description: 'Nhân vật có tính cách quỷ quyệt',
    aliases: ['quỷ tính', 'quytinh', 'cunning', 'quỷ quyệt', 'xảo quyệt']
  },
  
  // ========== ENDING TYPES ==========
  {
    keyword: 'hoan thanh',
    standardTag: 'Hoàn Thành',
    category: 'ending',
    priority: 9,
    description: 'Truyện đã được hoàn thành',
    aliases: ['hoàn thành', 'hoanthanh', 'completed', 'hoàn', 'full', 'kết thúc']
  },
  
  // ========== MORE CHARACTER TYPES ==========
  {
    keyword: 'cong sung thu suat',
    standardTag: 'Sủng',
    category: 'content',
    priority: 8,
    description: 'Chiều chuộng, yêu thương đối phương',
    aliases: ['sủng', 'sung', 'pamper', 'dote', 'cưng chiều', 'sủng ái']
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
      console.error(`❌ Error: ${tag.standardTag}:`, error.message);
    }
  }

  console.log(`\n📊 Added: ${added}, Updated: ${updated}`);
  
  const total = await TagDictionary.countDocuments();
  console.log(`📊 Total tags: ${total}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
