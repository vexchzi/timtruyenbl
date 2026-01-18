/**
 * Xóa các truyện tiếng Tây Ban Nha và các ngôn ngữ khác không phải tiếng Việt
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

// Các từ khóa tiếng Tây Ban Nha phổ biến
const SPANISH_KEYWORDS = [
  'cuando', 'había', 'descubrió', 'convertido', 'entregada',
  'planeta', 'bestias', 'hembra', 'artificial', 'mariscal',
  'imperial', 'transmigrado', 'después', 'también', 'había',
  'porque', 'pero', 'como', 'sobre', 'entre', 'hasta',
  'después', 'antes', 'siempre', 'nunca', 'ahora',
  'mundo', 'vida', 'amor', 'corazón', 'tiempo',
  'años', 'días', 'noche', 'mañana', 'historia'
];

// Các từ khóa tiếng Indonesia/Tagalog
const INDONESIAN_KEYWORDS = [
  'adalah', 'untuk', 'dengan', 'pada', 'yang',
  'tidak', 'dari', 'dalam', 'akan', 'bisa',
  'aku', 'kamu', 'dia', 'kami', 'mereka',
  'sudah', 'belum', 'masih', 'sangat', 'sekali'
];

async function cleanupNonVietnamese() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Tạo regex pattern cho các từ khóa
    const spanishPattern = SPANISH_KEYWORDS.map(w => `\\b${w}\\b`).join('|');
    const indoPattern = INDONESIAN_KEYWORDS.map(w => `\\b${w}\\b`).join('|');

    // Tìm truyện tiếng Tây Ban Nha
    const spanishNovels = await Novel.find({
      description: { $regex: new RegExp(spanishPattern, 'i') }
    }).select('title description').limit(20);

    console.log(`Found ${spanishNovels.length} potential Spanish novels:`);
    spanishNovels.forEach(n => console.log(`  - ${n.title.substring(0, 50)}...`));

    if (spanishNovels.length > 0) {
      const result = await Novel.deleteMany({
        description: { $regex: new RegExp(spanishPattern, 'i') }
      });
      console.log(`\n✅ Deleted ${result.deletedCount} Spanish novels`);
    }

    // Tìm truyện tiếng Indonesia
    const indoNovels = await Novel.find({
      description: { $regex: new RegExp(indoPattern, 'i') }
    }).select('title description').limit(20);

    console.log(`\nFound ${indoNovels.length} potential Indonesian novels:`);
    indoNovels.forEach(n => console.log(`  - ${n.title.substring(0, 50)}...`));

    if (indoNovels.length > 0) {
      const result = await Novel.deleteMany({
        description: { $regex: new RegExp(indoPattern, 'i') }
      });
      console.log(`\n✅ Deleted ${result.deletedCount} Indonesian novels`);
    }

    const total = await Novel.countDocuments();
    console.log(`\n📚 Remaining novels: ${total}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Done!');
  }
}

cleanupNonVietnamese();
