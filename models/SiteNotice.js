/**
 * SiteNotice Schema - Lưu trữ thông báo web
 * 
 * Chỉ có 1 document duy nhất cho thông báo hiện tại
 */

const mongoose = require('mongoose');

const SiteNoticeSchema = new mongoose.Schema({
    // Tiêu đề thông báo
    title: {
        type: String,
        trim: true,
        default: 'Thông báo'
    },

    // Nội dung thông báo (HTML hoặc text)
    content: {
        type: String,
        trim: true,
        default: ''
    },

    // Có bật thông báo không
    isActive: {
        type: Boolean,
        default: false
    },

    // Thời gian cập nhật
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'site_notice'
});

// Static method: Lấy thông báo hiện tại
SiteNoticeSchema.statics.getCurrent = async function () {
    let notice = await this.findOne().lean();
    if (!notice) {
        // Tạo document mặc định nếu chưa có
        notice = await this.create({
            title: 'Thông báo',
            content: 'Chào mừng bạn đến với trang web!',
            isActive: false
        });
        return notice.toObject();
    }
    return notice;
};

// Static method: Cập nhật thông báo
SiteNoticeSchema.statics.updateNotice = async function (data) {
    const update = {
        ...data,
        updatedAt: new Date()
    };

    const notice = await this.findOneAndUpdate(
        {},
        { $set: update },
        { new: true, upsert: true }
    ).lean();

    return notice;
};

module.exports = mongoose.model('SiteNotice', SiteNoticeSchema);
