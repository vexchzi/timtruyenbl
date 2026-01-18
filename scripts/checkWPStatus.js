/**
 * Check WordPress description status
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const wpTotal = await Novel.countDocuments({ source: 'wordpress' });
  const wpWithDesc = await Novel.countDocuments({ 
    source: 'wordpress', 
    description: { $exists: true, $ne: '', $ne: null } 
  });
  const wpLongDesc = await Novel.countDocuments({ 
    source: 'wordpress', 
    $expr: { $gt: [{ $strLenCP: '$description' }, 100] }
  });

  console.log('=== WordPress Novels Status ===');
  console.log(`Total: ${wpTotal}`);
  console.log(`With description: ${wpWithDesc} (${(wpWithDesc/wpTotal*100).toFixed(1)}%)`);
  console.log(`Long description (>100 chars): ${wpLongDesc} (${(wpLongDesc/wpTotal*100).toFixed(1)}%)`);
  console.log(`Missing/empty description: ${wpTotal - wpWithDesc}`);

  // Sample some without description
  const samples = await Novel.find({ 
    source: 'wordpress',
    $or: [
      { description: { $exists: false } },
      { description: '' },
      { description: null }
    ]
  }).select('title').limit(5).lean();

  if (samples.length > 0) {
    console.log('\nSample novels without description:');
    samples.forEach((n, i) => console.log(`  ${i+1}. ${n.title}`));
  }

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(console.error);
