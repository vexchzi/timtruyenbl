require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeTags } = require('../utils/tagNormalizer');

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('📚 Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Keywords để xác định đam mỹ/BL
const BL_KEYWORDS = [
  'đam mỹ', 'đammỹ', 'dam my', 'dammy',
  'bl', 'boy love', 'boyslove', 'boys love',
  'đm', 'dm',
  'công', 'thụ', 'cong', 'thu',
  'nam x nam', 'namxnam',
  'gay', 'yaoi',
  'chủ công', 'chủ thụ', 'chuthu', 'chucong',
  'niên hạ', 'niên thượng',
  'hắc hóa', 'sủng',
  'song tính nam',
  '1x1', '1v1'
];

// Keywords để loại bỏ (het/nữ/fanfic)
const EXCLUDE_KEYWORDS = [
  'ngôn tình', 'ngontinh', 'ngon tinh',
  'nữ chính', 'nu chinh', 'nữ cường',
  'gl', 'girl love', 'bách hợp', 'bach hop',
  'np', 'đa thụ', 'đa công', 'reverse harem',
  'fanfic', 'fanfiction', 'đồng nhân', 'dong nhan',
  // K-pop
  'tfboys', 'bts', 'exo', 'nct', 'got7', 'stray kids', 'enhypen', 'seventeen',
  'tiêu chiến', 'vương nhất bác', 'bjyx', 'yizhan', 'bác quân nhất tiêu',
  'nyongtory', 'bigbang', 'seungri', 'gd', 'top', 'g-dragon',
  'taekook', 'vkook', 'jikook', 'namjin', 'yoonmin', 'sope', 'taegi',
  'chanbaek', 'kaisoo', 'hunhan', 'baekyeol', 'xiuchen', 'sulay',
  'markson', 'jackbam', 'jjp', '2jae', 'yugbam',
  'minsung', 'hyunlix', 'changlix', 'seungjin', 'chanlix', 'hyunchan',
  'yeonbin', 'soobin', 'beomgyu', 'taehyun', 'hueningkai',
  'ateez', 'woosan', 'seongjoong', 'yungi', 'hongjoong', 'seonghwa',
  // Thai BL actors/series
  'brightwin', 'mewgulf', 'taynew', 'offgun',
  'jundylan', 'jun dylan', 'junndylan', 'dylanjun',
  'nuthong', 'nut hong', 'fakehong', 'fakenut',
  'tharntype', 'tharn type', '2gether', 'sarawat',
  'phuwin', 'pondphuwin', 'gemfourth', 'earthmix',
  'zeenew', 'maxnate', 'forcebook', 'tayin',
  'kinnporsche', 'kinn porsche', 'vegaspete',
  'ah_lynn', 'seinn2010', 'lynn_seinn', 'myanmar',
  // Chuyển ver
  'chuyển ver', 'chuyen ver', 'convert ver'
];

// Ký tự của các ngôn ngữ KHÔNG phải tiếng Việt
const NON_VIETNAMESE_PATTERNS = [
  /[\u1000-\u109F]/,  // Myanmar (Miến Điện)
  /[\u0E00-\u0E7F]/,  // Thai
  /[\u3040-\u309F]/,  // Hiragana (Nhật)
  /[\u30A0-\u30FF]/,  // Katakana (Nhật)
  /[\uAC00-\uD7AF]/,  // Hangul (Hàn)
  /[\u0900-\u097F]/,  // Devanagari (Ấn Độ)
  /[\u0600-\u06FF]/,  // Arabic
];

// Kiểm tra có phải đam mỹ không
function isBL(title, description, tags) {
  const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
  
  // Kiểm tra có từ khóa BL không
  const hasBLKeyword = BL_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  
  // Kiểm tra có từ khóa loại bỏ không
  const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  
  return hasBLKeyword && !hasExcludeKeyword;
}

// Kiểm tra có phải tiếng Việt không
function hasVietnamese(text) {
  const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vietnamesePattern.test(text);
}

// Kiểm tra có chứa ngôn ngữ khác (Myanmar, Thai, Nhật, Hàn...)
function hasNonVietnameseLanguage(text) {
  return NON_VIETNAMESE_PATTERNS.some(pattern => pattern.test(text));
}

// Crawl từ Wattpad API
async function crawlThoTuc(maxNovels = 500) {
  const searchQuery = 'Thô tục';
  let offset = 0;
  const limit = 20;
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalExisting = 0;
  
  console.log(`\n🔍 Bắt đầu crawl "${searchQuery}"...`);
  console.log('⚠️  Chỉ lấy truyện đam mỹ/BL, gắn tag 18+ và Thô Tục\n');
  
  while (totalAdded < maxNovels) {
    try {
      const response = await axios.get('https://www.wattpad.com/v4/search/stories', {
        params: {
          query: searchQuery,
          fields: 'stories(id,title,description,cover,user,completed,numParts,readCount,voteCount,tags)',
          limit: limit,
          offset: offset,
          mature: true // Cho phép nội dung mature
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        proxy: false
      });
      
      const stories = response.data?.stories || [];
      
      if (stories.length === 0) {
        console.log('📭 Không còn kết quả');
        break;
      }
      
      console.log(`\n📄 Trang ${Math.floor(offset / limit) + 1} - ${stories.length} kết quả`);
      
      for (const story of stories) {
        const title = story.title || '';
        const description = story.description || '';
        const tags = story.tags || [];
        const originalLink = `https://www.wattpad.com/story/${story.id}`;
        
        // Kiểm tra đã tồn tại chưa
        const exists = await Novel.findOne({ originalLink });
        if (exists) {
          totalExisting++;
          continue;
        }
        
        // Kiểm tra tiếng Việt và loại bỏ ngôn ngữ khác
        const fullText = `${title} ${description}`;
        if (!hasVietnamese(title) && !hasVietnamese(description)) {
          totalSkipped++;
          console.log(`  ⏭️  Bỏ qua (không tiếng Việt): ${title.substring(0, 40)}...`);
          continue;
        }
        
        // Loại bỏ truyện có ký tự Myanmar, Thai, Nhật, Hàn...
        if (hasNonVietnameseLanguage(fullText)) {
          totalSkipped++;
          console.log(`  ⏭️  Bỏ qua (ngôn ngữ khác): ${title.substring(0, 40)}...`);
          continue;
        }
        
        // Kiểm tra có phải BL không
        if (!isBL(title, description, tags)) {
          totalSkipped++;
          console.log(`  ⏭️  Bỏ qua (không phải BL): ${title.substring(0, 40)}...`);
          continue;
        }
        
        // Kiểm tra xem truyện CÓ THẬT SỰ là 18+/Thô tục không
        // IMPORTANT: không dùng các từ quá ngắn như "dam" / "tuc"
        // vì sẽ match nhầm "đam mỹ" (dam my) hoặc "tục" trong ngữ cảnh khác.
        const textToCheck = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
        const EXPLICIT_KEYWORDS = [
          // 18+
          '18+', 'r18', 'r-18', 'p18', 'po18', 'nc17', 'nc-17', 'nc18', 'nc-18',
          'mature', 'nsfw', 'explicit', 'adult', 'smut', 'sex', 'pwp', 'lemon', 'lime',
          'cao h', 'caoh', 'h văn', 'hvan', 'h++', 'h+++', 'h nặng', 'hnang',
          'cảnh nóng', 'canhnong', 'có thịt', 'nhiều thịt', 'thịt',
          // Thô tục / dirty talk / fetish
          'thô tục', 'thotuc', 'dirtytalk', 'dirty talk', 'talkdirty',
          'xxx', 'porn', 'bdsm', 'gangbang', 'sextoy', 'sex toy', 'sex toys',
          'pisskink', 'nuoctieuplay', 'loạn luân', 'loan luan', 'cưỡng hiếp', 'cuong hiep'
        ];
        
        const isExplicit = EXPLICIT_KEYWORDS.some(kw => textToCheck.includes(kw));
        
        // Nếu KHÔNG phải 18+, bỏ qua
        if (!isExplicit) {
          totalSkipped++;
          console.log(`  ⏭️  Bỏ qua (không phải 18+): ${title.substring(0, 40)}...`);
          continue;
        }
        
        // Tạo novel mới - normalize tags và chỉ gắn 18+/Thô Tục khi thật sự có dấu hiệu
        const standardTags = await normalizeTags(tags);
        if (!standardTags.includes('18+')) standardTags.push('18+');
        if (!standardTags.includes('Thô Tục')) standardTags.push('Thô Tục');

        const novel = new Novel({
          title: title,
          author: story.user?.name || 'Unknown',
          description: description,
          coverImage: story.cover || '',
          originalLink: originalLink,
          rawTags: tags,
          standardTags,
          source: 'wattpad',
          chapterCount: story.numParts || 0,
          readCount: story.readCount || 0,
          voteCount: story.voteCount || 0,
          status: story.completed ? 'completed' : 'ongoing'
        });
        
        await novel.save();
        totalAdded++;
        console.log(`  ✅ [${totalAdded}] ${title.substring(0, 50)}...`);
        
        if (totalAdded >= maxNovels) break;
      }
      
      offset += limit;
      
      // Delay để tránh bị chặn
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error) {
      console.error(`❌ Lỗi: ${error.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 KẾT QUẢ CRAWL "THÔ TỤC":`);
  console.log(`   ✅ Đã thêm: ${totalAdded} truyện`);
  console.log(`   ⏭️  Bỏ qua: ${totalSkipped} (không phải BL/không tiếng Việt)`);
  console.log(`   📦 Đã tồn tại: ${totalExisting}`);
  console.log('='.repeat(50));
  
  mongoose.disconnect();
  console.log('\n🔌 Đã ngắt kết nối MongoDB');
}

// Chạy
const maxNovels = parseInt(process.argv[2]) || 300;
crawlThoTuc(maxNovels);
