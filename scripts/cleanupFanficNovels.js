/**
 * Script xóa các truyện fanfic/đồng nhân đã crawl nhầm
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

// Danh sách từ khóa fanfic - CHỈ các từ khóa CHÍNH XÁC
const FANFIC_KEYWORDS = [
  // Vietnamese terms (full words only)
  'đồng nhân', 'đồngnhân', 'dong nhan', 'dongnhan',
  'fanfic', 'fanfiction', // KHÔNG dùng 'fic' vì quá ngắn
  'crossover', 'cross over',
  
  // Chinese idol groups - TFBoys, etc
  'tfboys', 'kaiyuan', 'kai yuan', 'karry wang', 'wang junkai', 'vương tuấn khải',
  'wang yuan', 'vương nguyên', 'roy wang', 'jackson yi', 'dịch dương thiên tỷ',
  'khải nguyên', 'khải thiên', 'nguyên khải', 'thiên khải',
  
  // Detective Conan / DCMK
  'conan', 'detective conan', 'meitantei', 'dcmk', 'thám tử lừng danh',
  'kaishin', 'kai shin', 'kaito', 'shinichi', 'kudo shinichi', 'kudou',
  'kaito kid', 'kaitou kid', 'ran mouri', 'heiji', 'hakuba', 'akai', 'amuro',
  'coai', 'shinran', 'heiha', 'kaiao', 'kaitoxshinichi',
  
  // Katekyo Hitman Reborn / KHR
  'khr', 'katekyo', 'hitman reborn', 'vongola', 'varia', 'sawada',
  'tsunayoshi', 'tsuna', 'hibari', 'mukuro', '1827', '6927', '8027', 'r27',
  'reborn', 'gokudera', 'yamamoto', 'xanxus', 'squalo',
  
  // K-pop fanfic
  'bts', 'bangtan', 'exo', 'nct', 'got7', 'seventeen', 'blackpink',
  'jungkook', 'taehyung', 'jimin', 'vkook', 'taekook', 'yoonmin', 'namjin', 'jikook',
  'chanbaek', 'hunhan', 'kaisoo',
  'bigbang', 'nyongtory', 'seungri', 'gtop',
  
  // Chinese celebrities
  'tiêu chiến', 'vương nhất bác', 'bjyx', 'yizhan',
  'cung tuấn', 'trương triết hạn', 'điền hủ ninh', 'tử du',
  'the untamed', 'trần tình lệnh', 'cql', 'word of honor', 'sơn hà lệnh',
  
  // Chinese novel fandoms (fanfic of other danmei)
  'mdzs', 'ma đạo tổ sư', 'modaozushi', 'wangxian', 'wei wuxian', 'lan wangji',
  'tgcf', 'thiên quan tứ phúc', 'heaven official', 'hualian', 'xie lian', 'hua cheng',
  'svsss', 'scum villain', 'bingqiu', 'shen qingqiu', 'luo binghe',
  '2ha', 'erha', 'nhị ha', 'ranwan', 'chu wanning', 'mo ran',
  
  // Japanese anime/manga fandoms
  'naruto', 'sasuke', 'sasunaru', 'narusasu',
  'one piece', 'luffy', 'zoro', 'sanji', 'zosan',
  'haikyuu', 'kagehina', 'iwaoi', 'hinata', 'kageyama',
  'jjk', 'jujutsu', 'gojo', 'geto', 'satosugu',
  'aot', 'attack on titan', 'levi', 'eren', 'ereri',
  'bnha', 'boku no hero', 'bakudeku', 'tododeku',
  'demon slayer', 'kimetsu', 'tanjiro', 'zenitsu',
  'tokyo revengers', 'mikey', 'draken',
  'genshin', 'genshin impact', 'zhongli', 'childe', 'zhongchi',
  'honkai', 'star rail',
  
  // Harry Potter
  'harry potter', 'hogwarts', 'draco', 'drarry', 'snape', 'snarry', 'wolfstar',
  
  // Marvel/DC
  'marvel', 'mcu', 'avengers', 'thor', 'loki', 'tony stark', 'stony', 'stucky',
  'dc', 'batman', 'superman', 'superbat',
  
  // Minecraft/Gaming
  'minecraft', 'mcyt', 'dream smp', 'technoblade', 'tommyinnit', 'tubbo',
  
  // Thai BL actors
  'brightwin', 'mewgulf', 'taynew', 'offgun', 'pondphuwin',
  'mileapo', 'zeenunew', 'joongdunk', 'forcebook',
  'bounprem', 'boun', 'prem', 'alltake',
  
  // Chuyển ver / Convert ver (often fanfic)
  'chuyển ver', 'chuyen ver', 'convert ver', '[ver]', '(ver)', 'ver ]',
  
  // Language indicators (non-Vietnamese)
  'español', 'espanol',
];

function isFanfic(novel) {
  const titleLower = (novel.title || '').toLowerCase();
  const authorLower = (novel.author || '').toLowerCase();
  const descLower = (novel.description || '').toLowerCase();
  const rawTagsStr = (novel.rawTags || []).join(' ').toLowerCase();
  
  const combinedText = `${titleLower} ${authorLower} ${descLower} ${rawTagsStr}`;
  
  for (const keyword of FANFIC_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      return { isFanfic: true, keyword };
    }
  }
  
  return { isFanfic: false };
}

async function cleanupFanficNovels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allNovels = await Novel.find({}).lean();
    console.log(`📚 Total novels in DB: ${allNovels.length}\n`);

    const toDelete = [];
    
    for (const novel of allNovels) {
      const result = isFanfic(novel);
      if (result.isFanfic) {
        toDelete.push({
          _id: novel._id,
          title: novel.title,
          keyword: result.keyword
        });
      }
    }

    console.log(`🔍 Found ${toDelete.length} fanfic novels to delete\n`);

    if (toDelete.length > 0) {
      console.log('Sample novels to delete:');
      toDelete.slice(0, 20).forEach((n, i) => {
        console.log(`  ${i + 1}. "${n.title.substring(0, 50)}..." (keyword: ${n.keyword})`);
      });
      
      console.log('\n⚠️ Deleting...');
      
      const ids = toDelete.map(n => n._id);
      const result = await Novel.deleteMany({ _id: { $in: ids } });
      
      console.log(`✅ Deleted ${result.deletedCount} novels`);
    }

    const remaining = await Novel.countDocuments();
    console.log(`\n📚 Remaining novels: ${remaining}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Done!');
  }
}

cleanupFanficNovels();
