/**
 * Script dọn dẹp database - xóa truyện không phải đam mỹ Việt
 * - Xóa truyện tiếng Anh
 * - Xóa fanfic (Minecraft, K-pop, Anime...)
 * - Chỉ giữ truyện đam mỹ tiếng Việt
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

// Từ khóa fanfic để lọc bỏ
const FANFIC_KEYWORDS = [
  // Vietnamese terms
  'đồng nhân', 'đồngnhân', 'dong nhan', 'dongnhan',
  'fanfic', 'fanfiction',
  
  // Minecraft/Dream SMP
  'minecraft', 'mcyt', 'dream smp', 'dreamsmp', 'dsmp',
  'tommyinnit', 'tommy innit', 'tubbo', 'ranboo', 'philza',
  'technoblade', 'techno', 'wilbur soot', 'wilbur', 'sapnap',
  'badboyhalo', 'bbh', 'quackity', 'karl jacobs', 'nihachu',
  'sbi', 'sleepy bois', 'dream team', 'bench trio', 'beeduo',
  
  // K-pop groups
  'bts', 'bangtan', 'exo', 'nct', 'got7', 'seventeen', 'txt',
  'stray kids', 'blackpink', 'twice', 'red velvet', 'aespa',
  'bigbang', 'winner', 'ikon', '2ne1', 'snsd',
  
  // K-pop members (BTS)
  'jungkook', 'taehyung', 'jimin', 'vkook', 'taekook', 'yoonmin',
  
  // BigBang members - IMPORTANT
  'g-dragon', 'gdragon', 'gd', 'kwon jiyong', 'jiyong',
  'top', 't.o.p', 'choi seunghyun', 'seunghyun',
  'taeyang', 'youngbae', 'daesung', 'seungri',
  'nyongtory', 'gtop', 'todae', 'gdyb', 'daeri',
  
  // Chinese novel fandoms
  'mdzs', 'ma đạo tổ sư', 'wangxian', 'wei wuxian', 'lan wangji',
  'tgcf', 'thiên quan tứ phúc', 'hualian', 'xie lian', 'hua cheng',
  'svsss', 'bingqiu', '2ha', 'erha', 'nhị ha',
  
  // Anime/Manga
  'naruto', 'sasunaru', 'one piece', 'haikyuu', 'kagehina',
  'jjk', 'jujutsu kaisen', 'satosugu', 'gojo',
  'attack on titan', 'aot', 'ereri', 'demon slayer',
  'genshin', 'zhongchi', 'tartali', 'honkai',
  
  // Western
  'harry potter', 'drarry', 'marvel', 'stony', 'stucky',
  'sherlock', 'johnlock', 'supernatural', 'destiel',
  
  // Thai BL actors & dramas
  'brightwin', 'gmmtv', 'kinnporsche', 'mewgulf', 'taynew', 'offgun',
  'pondphuwin', 'pond', 'phuwin', 'gaborone', 'gemini', 'fourth',
  'joongdunk', 'joong', 'dunk', 'mileapo', 'mile', 'apo',
  'bossnoeul', 'boss', 'noeul', 'zeenunew', 'zee', 'nunew',
  'netjames', 'forcebook', 'perthsaint', '2gether', 'bad buddy',
  
  // Other
  'x reader', 'reader insert', 'self insert',
];

// Kiểm tra có chữ tiếng Việt không
function hasVietnamese(text) {
  if (!text) return false;
  const vnPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vnPattern.test(text);
}

// Kiểm tra có phải fanfic không
function isFanfic(novel) {
  const text = [
    novel.title,
    novel.author,
    novel.description,
    ...(novel.rawTags || []),
  ].filter(Boolean).join(' ').toLowerCase();

  return FANFIC_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

// Kiểm tra có phải truyện tiếng Việt không
function isVietnameseNovel(novel) {
  return hasVietnamese(novel.title) || 
         hasVietnamese(novel.description) || 
         (novel.rawTags || []).some(tag => hasVietnamese(tag));
}

// Kiểm tra có phải đam mỹ không
function isDanmei(novel) {
  const tags = [...(novel.standardTags || []), ...(novel.rawTags || [])].map(t => t.toLowerCase());
  const text = tags.join(' ') + ' ' + (novel.description || '').toLowerCase();
  
  const danmeiKeywords = [
    'đam mỹ', 'dammy', 'bl', 'boy love', 'boys love', 'yaoi', 'danmei',
    'công', 'thụ', 'cường cường', '1v1', 'hỗ công', 'abo', 'niên thượng', 'niên hạ'
  ];
  
  return danmeiKeywords.some(kw => text.includes(kw));
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const totalBefore = await Novel.countDocuments();
  console.log(`📊 Total novels before cleanup: ${totalBefore}\n`);

  // Tìm tất cả novels
  const novels = await Novel.find({}).lean();
  
  const toDelete = [];
  const stats = {
    fanfic: 0,
    nonVietnamese: 0,
    nonDanmei: 0,
    kept: 0,
  };

  console.log('🔍 Analyzing novels...\n');

  for (const novel of novels) {
    let deleteReason = null;

    // Check fanfic
    if (isFanfic(novel)) {
      deleteReason = 'fanfic';
      stats.fanfic++;
    }
    // Check Vietnamese
    else if (!isVietnameseNovel(novel)) {
      deleteReason = 'nonVietnamese';
      stats.nonVietnamese++;
    }
    // Check Danmei (optional - có thể comment nếu không muốn lọc quá kỹ)
    // else if (!isDanmei(novel)) {
    //   deleteReason = 'nonDanmei';
    //   stats.nonDanmei++;
    // }

    if (deleteReason) {
      toDelete.push({
        id: novel._id,
        title: novel.title,
        reason: deleteReason,
      });
    } else {
      stats.kept++;
    }
  }

  console.log('📋 Analysis complete:');
  console.log(`  - Fanfic to remove: ${stats.fanfic}`);
  console.log(`  - Non-Vietnamese to remove: ${stats.nonVietnamese}`);
  // console.log(`  - Non-Danmei to remove: ${stats.nonDanmei}`);
  console.log(`  - To keep: ${stats.kept}`);
  console.log(`  - Total to delete: ${toDelete.length}\n`);

  // Show samples
  console.log('📝 Sample novels to delete:');
  toDelete.slice(0, 10).forEach(n => {
    console.log(`  [${n.reason}] ${n.title.substring(0, 60)}...`);
  });

  // Delete novels
  if (toDelete.length > 0) {
    console.log('\n🗑️ Deleting novels...');
    const ids = toDelete.map(n => n.id);
    const result = await Novel.deleteMany({ _id: { $in: ids } });
    console.log(`✅ Deleted ${result.deletedCount} novels\n`);
  }

  const totalAfter = await Novel.countDocuments();
  console.log(`📊 Total novels after: ${totalAfter}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
