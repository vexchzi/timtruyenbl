const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    novel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Novel',
        required: true,
        index: true
    },
    nickname: {
        type: String,
        default: 'Ẩn danh',
        trim: true,
        maxLength: 30
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxLength: 1000
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    ipAddress: {
        type: String,
        select: false // Hide by default
    },
    isVisible: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
