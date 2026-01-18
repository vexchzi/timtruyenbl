require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

async function checkDescriptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const total = await Novel.countDocuments();
    const noDesc = await Novel.countDocuments({ 
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });
    const wpNoDesc = await Novel.countDocuments({ 
      source: 'wordpress',
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });
    const wattpadNoDesc = await Novel.countDocuments({ 
      source: 'wattpad',
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });
    
    console.log('=== Thống kê mô tả ===');
    console.log('Tổng truyện:', total);
    console.log('Thiếu mô tả:', noDesc, '(' + Math.round(noDesc/total*100) + '%)');
    console.log('  - WordPress:', wpNoDesc);
    console.log('  - Wattpad:', wattpadNoDesc);
    console.log('Có mô tả:', total - noDesc, '(' + Math.round((total-noDesc)/total*100) + '%)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDescriptions();
