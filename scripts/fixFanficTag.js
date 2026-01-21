/**
 * FIX FANFIC TAG SCRIPT (Version 2)
 * 
 * Update: Xoá thêm các alias nguy hiểm như "convert", "fic"...
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Novel, TagDictionary } = require('../models');
const { normalizeTagsWithDescription, loadDictionary, clearCache } = require('../utils/tagNormalizer');

// Connect DB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    process.exit(1);
}

// Danh sách từ khoá CẦN XOÁ khỏi alias của Fanfic
const BAD_KEYWORDS = [
    'fiction', 'science fiction', 'teen fiction', 'historical fiction', 'general fiction',
    'convert', 'chuyển', 'chuyen', 'ver', 'fic', 'fics'
];
const TARGET_TAG = 'Fanfic';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        console.log(`\n=== BƯỚC 1: Xoá mapping sai trong TagDictionary ===`);
        console.log('Bad keywords:', BAD_KEYWORDS);

        // 1. Tìm và xoá document nếu keyword chính nằm trong BAD_KEYWORDS
        const deletedDocs = await TagDictionary.deleteMany({
            keyword: { $in: BAD_KEYWORDS },
            standardTag: TARGET_TAG
        });
        console.log(`- Đã xoá ${deletedDocs.deletedCount} entries.`);

        // 2. Tìm các document có standardTag = Fanfic và xoá bad keywords khỏi aliases
        const updateResult = await TagDictionary.updateMany(
            { standardTag: TARGET_TAG },
            { $pull: { aliases: { $in: BAD_KEYWORDS } } }
        );
        console.log(`- Đã cập nhật ${updateResult.modifiedCount} documents (xoá alias).`);

        // 3. Clear cache
        clearCache();
        await loadDictionary(true);

        console.log(`\n=== BƯỚC 2: Quét lại truyện ===`);

        // Tìm truyện có tag Fanfic
        const novels = await Novel.find({ standardTags: TARGET_TAG }).select('title description rawTags standardTags');
        const total = novels.length;

        console.log(`Tìm thấy ${total} truyện có tag "${TARGET_TAG}".`);

        let removedCount = 0;

        for (let i = 0; i < total; i++) {
            const novel = novels[i];
            try {
                const newStandardTags = await normalizeTagsWithDescription(novel.rawTags, novel.description);

                if (!newStandardTags.includes(TARGET_TAG)) {
                    await Novel.updateOne(
                        { _id: novel._id },
                        { $pull: { standardTags: TARGET_TAG } }
                    );
                    removedCount++;
                    // console.log(`  [Cleaned] ${novel.title}`);
                }

                if ((i + 1) % 100 === 0) console.log(`... ${i + 1}/${total}`);
            } catch (err) { }
        }

        console.log('\n=== KẾT QUẢ ===');
        console.log(`ĐÃ GỠ BỎ: ${removedCount} truyện.`);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

run();
