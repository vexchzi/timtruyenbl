/**
 * SEPARATE DONG NHAN & DANMEI SCRIPT
 * 
 * Mục tiêu: Nếu truyện có tag "Đồng Nhân", thì xoá tag "Đam Mỹ".
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI;

const TARGET_TAG = 'Đồng Nhân';
const DANMEI_TAG = 'Đam Mỹ';

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);

        // 1. Đếm
        const count = await Novel.countDocuments({
            standardTags: { $all: [TARGET_TAG, DANMEI_TAG] }
        });

        console.log(`Tìm thấy ${count} truyện có cả tag "${TARGET_TAG}" và "${DANMEI_TAG}".`);

        if (count === 0) {
            console.log('Không có gì để làm.');
            process.exit(0);
        }

        console.log(`Đang tiến hành gỡ bỏ tag "${DANMEI_TAG}"...`);

        // 2. Update
        const result = await Novel.updateMany(
            { standardTags: { $all: [TARGET_TAG, DANMEI_TAG] } },
            { $pull: { standardTags: DANMEI_TAG } }
        );

        console.log(`Đã xử lý xong ${result.modifiedCount} truyện.`);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

run();
