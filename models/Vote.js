const mongoose = require('mongoose');

/**
 * Vote Schema - Lưu trữ lượt vote của người dùng
 */
const VoteSchema = new mongoose.Schema({
    novelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Novel',
        required: true,
        index: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    fingerprint: {
        type: String, // Browser fingerprint (optional, for stricter checking)
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 7 // Tự động xóa sau 7 ngày (tuỳ chọn, để reset weekly nếu cần)
    }
});

// Compound index để check unique vote trong 1 khoảng thời gian (nếu cần)
// Ví dụ: 1 IP chỉ được vote 1 lần cho 1 truyện mỗi ngày
VoteSchema.index({ novelId: 1, ipAddress: 1 }, { unique: false });

module.exports = mongoose.model('Vote', VoteSchema);
