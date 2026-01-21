/**
 * Migration Script: Migrate Ratings
 * 
 * Mục đích: 
 * - Cập nhật field `ratingAverage` và `reviewCount` cho các document Novel cũ
 * - Mặc định set về 0 nếu chưa có
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Novel = require('../models/Novel');

async function migrate() {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log('🔄 Starting migration...');

        const result = await Novel.updateMany(
            {
                $or: [
                    { ratingAverage: { $exists: false } },
                    { reviewCount: { $exists: false } }
                ]
            },
            {
                $set: {
                    ratingAverage: 0,
                    reviewCount: 0
                }
            }
        );

        console.log(`✅ Migration completed.`);
        console.log(`   Matched: ${result.matchedCount}`);
        console.log(`   Modified: ${result.modifiedCount}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Addios!');
    }
}

migrate();
