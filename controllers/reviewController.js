const Review = require('../models/Review');
const Novel = require('../models/Novel');

// Hàm tính lại điểm trung bình cho truyện
const calcAverageRatings = async (novelId) => {
    const stats = await Review.aggregate([
        {
            $match: { novel: novelId }
        },
        {
            $group: {
                _id: '$novel',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        const avg = Math.round(stats[0].avgRating * 10) / 10;
        await Novel.findByIdAndUpdate(novelId, {
            ratingAverage: avg,
            reviewCount: stats[0].nRating
        });
    } else {
        await Novel.findByIdAndUpdate(novelId, {
            ratingAverage: 0,
            reviewCount: 0
        });
    }
};

// POST /api/reviews
exports.createReview = async (req, res) => {
    try {
        const { novelId, nickname, content, rating } = req.body;
        let finalNickname = (nickname || '').trim() || 'Ẩn danh';

        // Simple Bad Word Filter (Ví dụ cơ bản)
        const badWords = ['đm', 'vcl', 'cc', 'lồn', 'buồi', 'đụ', 'địt'];
        const isBad = badWords.some(word =>
            finalNickname.toLowerCase().includes(word) ||
            content.toLowerCase().includes(word)
        );

        if (isBad) {
            // Cách 1: Chặn luôn
            // return res.status(400).json({ success: false, message: 'Nội dung chứa từ ngữ không phù hợp.' });

            // Cách 2: Sensor (thay bằng ***)
            badWords.forEach(word => {
                const regex = new RegExp(word, 'gi');
                finalNickname = finalNickname.replace(regex, '***');
                // content = content.replace(regex, '***'); // Filter content if needed
            });
        }

        const newReview = await Review.create({
            novel: novelId,
            nickname: finalNickname,
            content,
            rating,
            ipAddress: req.ip // Tracking IP
        });

        // Cập nhật rating cho Novel
        await calcAverageRatings(novelId);

        // Populate data trả về (để hiển thị ngay)
        const populatedReview = await Review.findById(newReview._id);

        // Lấy thông tin mới nhất của Novel để cập nhật UI
        const updatedNovel = await Novel.findById(novelId).select('ratingAverage reviewCount');

        res.status(201).json({
            success: true,
            review: populatedReview,
            novelStats: updatedNovel
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/reviews/novel/:novelId
exports.getReviewsByNovel = async (req, res) => {
    try {
        const { novelId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const reviews = await Review.find({ novel: novelId, isVisible: true })
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/reviews/latest (Cho Admin Dashboard)
exports.getLatestReviews = async (req, res) => {
    try {
        const limit = 20;
        const reviews = await Review.find()
            .populate('novel', 'title') // Lấy tên truyện
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/reviews/:id (Admin xóa review)
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Tính lại điểm cho truyện đó
        await calcAverageRatings(review.novel);

        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
