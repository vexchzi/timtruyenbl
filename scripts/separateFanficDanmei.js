/**
 * SEPARATE FANFIC & DANMEI SCRIPT
 * 
 * Mục tiêu: Nếu truyện đã là "Fanfic", thì xoá tag "Đam Mỹ" ra khỏi nó.
 * Để phân biệt rõ ràng giữa Fanfic (Đồng nhân) và Đam Mỹ (Nguyên sang).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');

// Connect DB
const MONGODB_URI = process.env.MONGODB_URI;

const FANFIC_TAG = 'Fanfic';
const DANMEI_TAG = 'Đam Mỹ';

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        // 1. Đếm số lượng truyện bị ảnh hưởng
        const count = await Novel.countDocuments({
            standardTags: { $all: [FANFIC_TAG, DANMEI_TAG] }
        });

        console.log(`Tìm thấy ${count} truyện có cả tag "${FANFIC_TAG}" và "${DANMEI_TAG}".`);

        if (count === 0) {
            console.log('Không có gì để làm.');
            process.exit(0);
        }

        console.log(`Đang tiến hành gỡ bỏ tag "${DANMEI_TAG}" khỏi các truyện này...`);

        // 2. Thực hiện update
        const result = await Novel.updateMany(
            { standardTags: { $all: [FANFIC_TAG, DANMEI_TAG] } },
            { $pull: { standardTags: DANMEI_TAG } }
        );

        console.log(`\n=== KẾT QUẢ ===`);
        console.log(`Đã xử lý xong!`);
        console.log(`Số truyện được cập nhật: ${result.modifiedCount}`);

    } catch (err) {
        console.error('Lỗi:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
