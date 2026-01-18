require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');
const { extractTagsFromDescription, normalizeTagsWithDescription } = require('../utils/tagNormalizer');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Tìm truyện "Sói đi thành đôi"
  const novel = await Novel.findOne({
    title: { $regex: /sói/i }
  }).lean();
  
  if (novel) {
    console.log('Title:', novel.title);
    console.log('\nDescription (first 800 chars):');
    console.log(novel.description?.substring(0, 800));
    console.log('\n--- rawTags:', novel.rawTags);
    console.log('\n--- Current standardTags:', novel.standardTags);
    console.log('\n--- Extracted from description:');
    const extracted = extractTagsFromDescription(novel.description);
    console.log(extracted);
    console.log('\n--- After re-normalize with description:');
    const newTags = await normalizeTagsWithDescription(novel.rawTags, novel.description);
    console.log(newTags);
  } else {
    console.log('No novel found');
  }
  
  mongoose.disconnect();
});
