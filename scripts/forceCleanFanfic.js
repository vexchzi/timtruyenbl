/**
 * Force Clean Fanfic Tag Script
 * 
 * Loại bỏ tag "Fanfic" khỏi các truyện mà KHÔNG có dấu hiệu rõ ràng là Fanfic
 * (như btsfanfic, đồng nhân...) mà chỉ có chữ "fiction" chung chung (teenfiction, etc).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel } = require('../models');

// Connect DB
const MONGODB_URI = process.env.MONGODB_URI;

// Các từ khoá KHẲNG ĐỊNH là Fanfic (Giữ lại)
const KEEP_KEYWORDS = [
    'fanfic', 'fan fic', 'fan-fic',
    'dong nhan', 'đồng nhân', 'đn',
    'doujinshi', 'doujin',
    'bts', 'exo', 'blackpink', // Tên nhóm nhạc nổi tiếng thường là fanfic
    'harry potter', 'hp',
    'naruto', 'one piece',
    'mewgulf', 'brightwin', 'offgun' // Thái BL couples
];

// Các từ khoá "Fiction" chung chung (Nếu chỉ có cái này thì xoá)
const BAD_KEYWORDS = [
    'fiction',
    'teenfiction', 'teen-fiction',
    'sciencefiction', 'sci-fi',
    'generalfiction',
    'lgbtfiction', 'gayfiction',
    'nonfiction', 'non-fiction'
];

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        // Lấy tất cả truyện có tag Fanfic
        const novels = await Novel.find({ standardTags: 'Fanfic' }).select('title rawTags standardTags');
        console.log(`Đang kiểm tra ${novels.length} truyện tag Fanfic...`);

        let removedCount = 0;

        for (const novel of novels) {
            // 1. Normalize raw tags để check
            const rawTagsString = (novel.rawTags || []).join(' ').toLowerCase();
            const titleLower = novel.title.toLowerCase();

            // 2. Check xem có từ khoá GIỮ LẠI không
            const shouldKeep = KEEP_KEYWORDS.some(kw =>
                rawTagsString.includes(kw) || titleLower.includes(kw)
            );

            if (shouldKeep) {
                // Có dấu hiệu fanfic -> Giữ nguyên
                continue;
            }

            // 3. Check xem có từ khoá gây hiểu nhầm không
            // Thực ra nếu không có từ khoá giữ lại, mà đã bị gán tag Fanfic, thì khả năng cao là sai
            // (do logic cũ bắt nhầm chữ fiction).

            // Tuy nhiên để an toàn, ta check xem có phải do từ Fiction gây ra không.
            const hasBadKeyword = BAD_KEYWORDS.some(kw => rawTagsString.includes(kw));

            // Hoặc nếu không có bad keyword nào nhưng cũng chẳng có keep keyword nào -> Cứ xoá cho sạch?
            // Thôi, chỉ xoá nếu có bad keyword hoặc là "nonff" (non-fanfic)

            const isNonFanfic = rawTagsString.includes('nonff') || rawTagsString.includes('non-fanfic') || rawTagsString.includes('original work');

            if (hasBadKeyword || isNonFanfic) {
                // Xoá tag Fanfic
                await Novel.updateOne(
                    { _id: novel._id },
                    { $pull: { standardTags: 'Fanfic' } }
                );
                removedCount++;
                // console.log(`[Xoá Fanfic]: ${novel.title} (Tags: ${novel.rawTags.join(', ')})`);
            }
        }

        console.log(`\n=== KẾT QUẢ ===`);
        console.log(`Đã gỡ tag Fanfic khỏi ${removedCount} truyện.`);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

run();
