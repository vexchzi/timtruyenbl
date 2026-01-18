require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

// Ký tự Myanmar
const MYANMAR_PATTERN = /[\u1000-\u109F]/;

// Thai BL fanfic keywords
const THAI_FANFIC_KEYWORDS = [
  'jundylan', 'jun dylan', 'junndylan', 'dylanjun',
  'nuthong', 'nut hong', 'fakenut', 'fakehong',
  'ah_lynn', 'seinn2010', 'lynn_seinn', 'myanmar',
  'brightwin', 'mewgulf', 'taynew', 'offgun',
  'tharntype', '2gether', 'phuwin', 'earthmix',
  'zeenew', 'maxnate', 'forcebook', 'kinnporsche',
  'vegaspete', 'gemfourth', 'pondphuwin'
];

// K-pop fanfic keywords
const KPOP_FANFIC_KEYWORDS = [
  'taekook', 'vkook', 'jikook', 'namjin', 'yoonmin', 'sope', 'taegi',
  'bts', 'bangtan', 'army',
  'chanbaek', 'kaisoo', 'hunhan', 'baekyeol', 'xiuchen', 'sulay', 'exo',
  'markson', 'jackbam', 'jjp', '2jae', 'yugbam', 'got7',
  'minsung', 'hyunlix', 'changlix', 'seungjin', 'chanlix', 'stray kids', 'skz',
  'nct', 'wayv', 'johnten', 'markhyuck', 'nomin', 'jaeyong', 'doyoung',
  'seventeen', 'svt', 'meanie', 'verkwan', 'jeongcheol', 'jihan',
  'enhypen', 'heeseung', 'sunghoon', 'sunoo', 'jake',
  'txt', 'yeonbin', 'sookai', 'taegyu',
  'ateez', 'woosan', 'seongjoong', 'hongjoong', 'seonghwa'
];

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📚 Connected to MongoDB');
  
  let deleted = 0;
  
  // 1. Xóa truyện có ký tự Myanmar
  console.log('\n🔍 Tìm truyện Myanmar...');
  const allNovels = await Novel.find({}).select('_id title description');
  
  for (const novel of allNovels) {
    const text = `${novel.title} ${novel.description || ''}`;
    if (MYANMAR_PATTERN.test(text)) {
      await Novel.deleteOne({ _id: novel._id });
      console.log(`  🗑️  ${novel.title.substring(0, 50)}...`);
      deleted++;
    }
  }
  
  // 2. Xóa fanfic Thai BL
  console.log('\n🔍 Tìm fanfic Thai BL...');
  const thaiPattern = THAI_FANFIC_KEYWORDS.join('|');
  
  const thaiFanfics = await Novel.find({
    $or: [
      { title: { $regex: thaiPattern, $options: 'i' } },
      { author: { $regex: thaiPattern, $options: 'i' } },
      { description: { $regex: thaiPattern, $options: 'i' } }
    ]
  });
  
  for (const novel of thaiFanfics) {
    await Novel.deleteOne({ _id: novel._id });
    console.log(`  🗑️  Thai: ${novel.title.substring(0, 50)}...`);
    deleted++;
  }
  
  // 3. Xóa fanfic K-pop
  console.log('\n🔍 Tìm fanfic K-pop...');
  const kpopPattern = KPOP_FANFIC_KEYWORDS.join('|');
  
  const kpopFanfics = await Novel.find({
    $or: [
      { title: { $regex: kpopPattern, $options: 'i' } },
      { author: { $regex: kpopPattern, $options: 'i' } },
      { description: { $regex: kpopPattern, $options: 'i' } }
    ]
  });
  
  for (const novel of kpopFanfics) {
    await Novel.deleteOne({ _id: novel._id });
    console.log(`  🗑️  K-pop: ${novel.title.substring(0, 50)}...`);
    deleted++;
  }
  
  console.log(`\n✅ Đã xóa ${deleted} truyện`);
  
  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

cleanup();
