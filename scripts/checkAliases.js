/**
 * Check Aliases Script
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { TagDictionary } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    await mongoose.connect(MONGODB_URI);

    const entries = await TagDictionary.find({ standardTag: 'Fanfic' });
    console.log('=== FANFIC ENTRIES ===');
    entries.forEach(e => {
        console.log(`Keyword: "${e.keyword}"`);
        console.log(`Aliases:`, e.aliases);
    });

    process.exit(0);
}

run();
