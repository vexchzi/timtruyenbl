require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');
const { normalizeTags } = require('../utils/tagNormalizer');
const axios = require('axios');
const cheerio = require('cheerio');

// Keywords thật sự là 18+/Thô tục
const EXPLICIT_KEYWORDS = [
  'thô tục', 'thotuc', '18+', 'smut', 'cao h', 'caoh',
  'h nặng', 'hnang', 'nc-17', 'nc17', 'mature',
  'lemon', 'lime', 'r18', 'r-18', 'nsfw',
  'cảnh nóng', 'canhnong', 'h văn', 'hvan',
  'dam duc', 'dâm dục'
];

function isReallyExplicit(novel) {
  const text = `${novel.title || ''} ${novel.description || ''} ${(novel.rawTags || []).join(' ')}`.toLowerCase();
  return EXPLICIT_KEYWORDS.some(kw => text.includes(kw));
}

async function getWordpressDescription(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Tìm description
    let description = '';
    
    // Thử các selector phổ biến
    const selectors = [
      '.entry-content',
      '.post-content', 
      'article .content',
      '.the-content',
      '.single-content'
    ];
    
    for (const sel of selectors) {
      const $content = $(sel).first();
      if ($content.length) {
        // Lấy các paragraph
        const paragraphs = [];
        $content.find('p').each((i, p) => {
          const text = $(p).text().trim();
          if (text.length > 30 && !text.includes('Đọc tiếp') && !text.includes('Click')) {
            paragraphs.push(text);
          }
        });
        
        if (paragraphs.length > 0) {
          description = paragraphs.slice(0, 5).join('\n\n');
          if (description.length > 2000) {
            description = description.substring(0, 2000) + '...';
          }
          break;
        }
      }
    }
    
    return description;
  } catch (error) {
    return '';
  }
}

async function updateWordpress() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📚 Connected to MongoDB');
  
  // Lấy tất cả truyện WordPress
  const novels = await Novel.find({ source: 'wordpress' });
  console.log(`\n📖 Tìm thấy ${novels.length} truyện WordPress`);
  
  let descUpdated = 0;
  let tagsFixed = 0;
  let explicitRemoved = 0;
  let processed = 0;
  
  const batchSize = 100;
  const totalBatches = Math.ceil(novels.length / batchSize);
  
  for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, novels.length);
    const batchNovels = novels.slice(start, end);
    
    console.log(`\n📦 Batch ${batch + 1}/${totalBatches} (${start + 1}-${end})`);
    
    for (const novel of batchNovels) {
      processed++;
      let needSave = false;
      
      // 1. Cập nhật mô tả nếu thiếu
      if (!novel.description || novel.description.length < 50) {
        const desc = await getWordpressDescription(novel.originalLink);
        if (desc && desc.length > 50) {
          novel.description = desc;
          descUpdated++;
          needSave = true;
        }
        // Delay nhỏ
        await new Promise(r => setTimeout(r, 500));
      }
      
      // 2. Kiểm tra và sửa tags 18+/Thô Tục sai
      const hasExplicitTag = novel.standardTags.includes('18+') || novel.standardTags.includes('Thô Tục');
      if (hasExplicitTag) {
        const isExplicit = isReallyExplicit(novel);
        if (!isExplicit) {
          // Xóa tags 18+ và Thô Tục không đúng
          novel.standardTags = novel.standardTags.filter(t => t !== '18+' && t !== 'Thô Tục');
          explicitRemoved++;
          needSave = true;
        }
      }
      
      // 3. Re-normalize tags nếu chưa có nhiều tags
      if (novel.standardTags.length < 3 && novel.rawTags && novel.rawTags.length > 0) {
        const newTags = await normalizeTags(novel.rawTags);
        if (newTags.length > novel.standardTags.length) {
          // Giữ lại tags cũ và thêm tags mới
          const mergedTags = [...new Set([...novel.standardTags, ...newTags])];
          // Loại bỏ 18+/Thô Tục nếu không phải explicit
          if (!isReallyExplicit(novel)) {
            novel.standardTags = mergedTags.filter(t => t !== '18+' && t !== 'Thô Tục');
          } else {
            novel.standardTags = mergedTags;
          }
          tagsFixed++;
          needSave = true;
        }
      }
      
      if (needSave) {
        await novel.save();
      }
      
      // Progress log mỗi 50 truyện
      if (processed % 50 === 0) {
        console.log(`   [${processed}/${novels.length}] Desc: ${descUpdated} | Tags: ${tagsFixed} | Explicit removed: ${explicitRemoved}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 KẾT QUẢ TỔNG:`);
  console.log(`   📝 Đã cập nhật mô tả: ${descUpdated}`);
  console.log(`   🏷️ Đã sửa tags: ${tagsFixed}`);
  console.log(`   🔞 Đã xóa tags 18+/Thô Tục sai: ${explicitRemoved}`);
  console.log(`   📖 Tổng xử lý: ${processed}`);
  console.log('='.repeat(60));
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

updateWordpress();
