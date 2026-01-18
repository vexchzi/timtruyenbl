/**
 * Crawl truyện đam mỹ từ Wattpad Search API
 * Sắp xếp theo lượt đọc (view) từ cao đến thấp
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeTags } = require('../utils/tagNormalizer');

// Wattpad Search API
const WATTPAD_SEARCH_API = 'https://www.wattpad.com/v4/search/stories';

// User agents để tránh bị block
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

// Từ khóa fanfic cần loại bỏ - COMPREHENSIVE LIST
const FANFIC_KEYWORDS = [
  // Vietnamese terms (full words only - avoid short matches)
  'fanfic', 'đồng nhân', 'dong nhan', 'fanfiction', 'đn ',
  
  // K-pop groups & members
  'bts', 'exo', 'blackpink', 'twice', 'nct', 'seventeen', 'stray kids',
  'got7', 'bigbang', 'nyongtory', 'seungri', 'gd', 'top', 'taeyang',
  'taekook', 'vkook', 'jikook', 'yoonmin', 'namjin', 'jungkook', 'taehyung',
  'chanbaek', 'hunhan', 'kaisoo', 'baekyeol',
  
  // Chinese celebrities
  'tiêu chiến', 'vương nhất bác', 'bác quân nhất tiêu', 'bjyx', 'yizhan',
  'điền hủ ninh', 'tử du', 'zsww', 'cung tuấn', 'trương triết hạn',
  
  // Chinese idol groups - TFBoys, etc
  'tfboys', 'kaiyuan', 'kai yuan', 'karry wang', 'wang junkai', 'vương tuấn khải',
  'wang yuan', 'vương nguyên', 'roy wang', 'jackson yi', 'dịch dương thiên tỷ',
  'khải nguyên', 'khải thiên', 'nguyên khải', 'thiên khải',
  
  // Thai BL actors
  'phuwin', 'milkpond', 'pondphuwin', 'brightwin', 'mewgulf', 'zeenunew',
  'offgun', 'taynew', 'kristsingto', 'sotus', 'gemfourth', 'mileapo',
  
  // Detective Conan / DCMK
  'conan', 'detective conan', 'meitantei', 'dcmk', 'thám tử lừng danh',
  'kaishin', 'kai shin', 'kaito', 'shinichi', 'kudo shinichi', 'kudou',
  'kaito kid', 'kaitou kid', 'ran', 'heiji', 'hakuba', 'akai', 'amuro',
  'coai', 'shinran', 'heiha', 'kaiao',
  
  // Katekyo Hitman Reborn / KHR
  'khr', 'katekyo', 'hitman reborn', 'vongola', 'varia', 'sawada',
  'tsunayoshi', 'tsuna', 'hibari', 'mukuro', '1827', '6927', '8027', 'r27',
  'reborn', 'gokudera', 'yamamoto', 'xanxus', 'squalo',
  
  // Harry Potter
  'harry potter', 'hogwarts', 'draco', 'drarry', 'snape', 'snarry', 'wolfstar',
  'hermione', 'ron weasley', 'dumbledore', 'voldemort', 'slytherin', 'gryffindor',
  
  // Marvel/DC
  'marvel', 'mcu', 'avengers', 'thor', 'loki', 'tony stark', 'steve rogers',
  'stony', 'stucky', 'thorki', 'spiderman', 'peter parker', 'wade wilson',
  'dc', 'batman', 'superman', 'superbat', 'wayne', 'gotham', 'joker',
  
  // Minecraft/Gaming
  'minecraft', 'dream smp', 'mcyt', 'dsmp', 'technoblade', 'tommyinnit',
  'tubbo', 'ranboo', 'dream', 'georgenotfound', 'sapnap', 'wilbur',
  
  // Anime/Manga fandoms
  'anime', 'manga', 'naruto', 'sasunaru', 'narusasu', 'sasuke', 'kakashi',
  'one piece', 'luffy', 'zoro', 'sanji', 'zosan', 'lawlu',
  'attack on titan', 'aot', 'snk', 'levi', 'eren', 'ereri', 'eruri',
  'demon slayer', 'kimetsu', 'tanjiro', 'zenitsu', 'giyuu', 'rengoku',
  'haikyuu', 'kagehina', 'iwaoi', 'hinata', 'kageyama', 'oikawa',
  'jjk', 'jujutsu', 'gojo', 'geto', 'satosugu', 'itafushi',
  'bnha', 'boku no hero', 'bakudeku', 'tododeku', 'kiribaku',
  'genshin', 'genshin impact', 'zhongli', 'childe', 'zhongchi', 'xiaoven', 'kaeluc',
  'honkai', 'star rail', 'hsr',
  'danganronpa', 'my hero academia', 'tokyo revengers', 'given',
  'yuri on ice', 'victuuri', 'banana fish',
  
  // Chinese novel fandoms (MDZS, TGCF, etc - these are đồng nhân of other danmei)
  'mdzs', 'ma đạo tổ sư', 'modaozushi', 'wangxian', 'wei wuxian', 'lan wangji',
  'tgcf', 'thiên quan tứ phúc', 'heaven official', 'hualian', 'xie lian', 'hua cheng',
  'svsss', 'scum villain', 'bingqiu', 'shen qingqiu', 'luo binghe',
  '2ha', 'erha', 'nhị ha', 'ranwan', 'chu wanning', 'mo ran',
  
  // Chuyển ver / Convert ver (often fanfic)
  'chuyển ver', 'chuyen ver', 'convert ver', '[ver]', '(ver)', 'ver ]',
  'alltake', 'bounprem', 'boun', 'prem',
  
  // Other indicators
  'crossover', 'cross over', 'x reader', 'reader insert', 'oc x', 'y/n',
  'real person', 'rps', 'rpf', 'idol x idol',
  
  // Language indicators (non-Vietnamese)
  'español', 'espanol', 'english', 'indonesia', 'tagalog', 'bahasa',
];


function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isFanfic(story) {
  const checkText = [
    story.title?.toLowerCase() || '',
    story.description?.toLowerCase() || '',
    ...(story.tags || []).map(t => t.name?.toLowerCase() || t.toLowerCase())
  ].join(' ');

  return FANFIC_KEYWORDS.some(keyword => checkText.includes(keyword.toLowerCase()));
}

function hasVietnamese(text) {
  if (!text) return false;
  const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vietnamesePattern.test(text);
}

async function searchWattpad(query, offset = 0, limit = 50) {
  try {
    const response = await axios.get(WATTPAD_SEARCH_API, {
      params: {
        query: query,
        mature: true,
        free: true,
        filter: 'complete', // Chỉ lấy truyện hoàn
        fields: 'stories(id,title,description,cover,readCount,voteCount,numParts,tags,user,completed,mature)',
        limit: limit,
        offset: offset
      },
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 30000
    });

    return response.data?.stories || [];
  } catch (error) {
    console.error(`  ❌ Search error at offset ${offset}:`, error.message);
    return [];
  }
}

async function saveStory(story) {
  try {
    // Check fanfic
    if (isFanfic(story)) {
      return { status: 'skipped', reason: 'fanfic' };
    }

    // Check Vietnamese content
    const titleHasViet = hasVietnamese(story.title);
    const descHasViet = hasVietnamese(story.description);
    if (!titleHasViet && !descHasViet) {
      return { status: 'skipped', reason: 'not vietnamese' };
    }

    const originalLink = `https://www.wattpad.com/story/${story.id}`;
    
    // Check if exists
    const exists = await Novel.findOne({ originalLink });
    if (exists) {
      return { status: 'exists' };
    }

    // Extract tags
    const rawTags = story.tags?.map(t => typeof t === 'string' ? t : t.name) || [];
    const standardTags = await normalizeTags(rawTags);

    // Create novel
    const novel = new Novel({
      title: story.title,
      author: story.user?.name || 'Unknown',
      description: story.description || '',
      coverImage: story.cover,
      originalLink,
      rawTags,
      standardTags,
      source: 'wattpad',
      chapterCount: story.numParts || 0,
      readCount: story.readCount || 0,
      voteCount: story.voteCount || 0,
      status: story.completed ? 'completed' : 'ongoing'
    });

    await novel.save();
    return { status: 'added', novel };

  } catch (error) {
    if (error.code === 11000) {
      return { status: 'exists' };
    }
    return { status: 'error', error: error.message };
  }
}

async function crawlWattpadSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const queries = ['đam mỹ', 'dammy', 'đam mĩ', 'dam my'];
    let totalAdded = 0;
    let totalSkipped = 0;
    let totalExists = 0;
    let totalErrors = 0;

    for (const query of queries) {
      console.log(`\n🔍 Searching: "${query}"`);
      console.log('=' .repeat(50));

      let offset = 0;
      const limit = 50;
      let emptyCount = 0;

      while (emptyCount < 3) { // Dừng sau 3 trang trống liên tiếp
        console.log(`\n📄 Offset ${offset}...`);
        
        const stories = await searchWattpad(query, offset, limit);
        
        if (stories.length === 0) {
          emptyCount++;
          console.log(`  ⚠️ Empty page (${emptyCount}/3)`);
          offset += limit;
          await delay(2000);
          continue;
        }

        emptyCount = 0;

        // Sắp xếp theo readCount giảm dần
        stories.sort((a, b) => (b.readCount || 0) - (a.readCount || 0));

        for (const story of stories) {
          const result = await saveStory(story);
          
          switch (result.status) {
            case 'added':
              totalAdded++;
              const views = story.readCount?.toLocaleString() || '0';
              console.log(`  ✅ Added: ${story.title?.substring(0, 50)}... (${views} views)`);
              break;
            case 'exists':
              totalExists++;
              break;
            case 'skipped':
              totalSkipped++;
              break;
            case 'error':
              totalErrors++;
              console.log(`  ❌ Error: ${result.error}`);
              break;
          }
        }

        console.log(`  📊 Progress: +${stories.length} stories | Total added: ${totalAdded}`);
        
        offset += limit;
        await delay(3000); // Delay giữa các request

        // Dừng nếu đã crawl đủ nhiều
        if (offset > 2000) {
          console.log(`\n⚠️ Reached offset limit for query "${query}"`);
          break;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Added: ${totalAdded}`);
    console.log(`⏭️ Skipped (fanfic/non-viet): ${totalSkipped}`);
    console.log(`📋 Already exists: ${totalExists}`);
    console.log(`❌ Errors: ${totalErrors}`);

    const totalNovels = await Novel.countDocuments();
    console.log(`\n📚 Total novels in DB: ${totalNovels}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

crawlWattpadSearch();
