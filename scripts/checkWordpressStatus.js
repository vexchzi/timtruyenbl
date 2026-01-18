require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const totalWP = await Novel.countDocuments({ source: 'wordpress' });
  const missingDesc = await Novel.countDocuments({
    source: 'wordpress',
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: '' },
      { description: { $regex: /^.{0,30}$/ } }
    ]
  });
  const hasDesc = totalWP - missingDesc;
  
  console.log('=== WORDPRESS STATUS ===');
  console.log('Total WordPress novels:', totalWP);
  console.log('Has description:', hasDesc);
  console.log('Missing description:', missingDesc);
  console.log('Completion:', Math.round(hasDesc/totalWP*100) + '%');
  
  await mongoose.disconnect();
}

check();
