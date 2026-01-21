/**
 * Debug Fanfic Tag
 * Tìm các truyện có tag "Fanfic" nhưng nghi ngờ là sai (chứa Science Fiction, Teen Fiction...)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    await mongoose.connect(MONGODB_URI);

    // Tìm các truyện có tag Fanfic VÀ (rawTag chứa Fiction nhưng KHÔNG chứa Fan)
    const novels = await Novel.find({
        standardTags: 'Fanfic',
        rawTags: { $regex: /fiction/i }
    }).select('title rawTags');

    console.log(`Tìm thấy ${novels.length} truyện chứa từ "fiction".`);

    let suspiciousCount = 0;

    novels.forEach(n => {
        // Check nếu rawTags có từ fiction mà không phải fanfiction
        const hasBadTag = n.rawTags.some(t => {
            const lower = t.toLowerCase();
            return lower.includes('fiction') && !lower.includes('fan');
        });

        if (hasBadTag) {
            suspiciousCount++;
            console.log(`[SUSPICIOUS] ${n.title}`);
            console.log(`  Raw Tags:`, n.rawTags);
            console.log('---');
        }
    });

    console.log(`Tổng số truyện nghi vấn: ${suspiciousCount}`);
    process.exit(0);
}

run();
