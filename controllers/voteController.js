const Vote = require('../models/Vote');
const Novel = require('../models/Novel');

/**
 * Kiếm tra xem IP đã vote cho truyện này trong 24h qua chưa
 * @param {string} ipAddress - IP người dùng
 * @param {string} novelId - ID truyện
 * @returns {Promise<boolean>} - true nếu đã vote
 */
async function hasVoted(ipAddress, novelId) {
    // Check if ANY vote exists for this IP and Novel (Lifetime check)
    const existingVote = await Vote.findOne({
        ipAddress,
        novelId
    });
    return !!existingVote;
}

/**
 * POST /api/votes
 * Body: { novelId }
 */
exports.addVote = async (req, res) => {
    try {
        const { novelId } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        if (!novelId) {
            return res.status(400).json({ success: false, message: 'Novel ID is required' });
        }

        // 1. Check Rate Limit (1 vote / novel / lifetime per IP)
        const alreadyVoted = await hasVoted(ipAddress, novelId);
        if (alreadyVoted) {
            return res.status(429).json({
                success: false,
                message: 'Bạn đã bình chọn cho truyện này rồi.'
            });
        }

        // 2. Add Vote
        await Vote.create({ novelId, ipAddress });

        // 3. Update Novel stats
        // Tăng voteCount lên 1
        // Tăng weeklyScore lên 1 (hoặc logic khác tuỳ chỉnh sau này)
        const updatedNovel = await Novel.findByIdAndUpdate(
            novelId,
            {
                $inc: { voteCount: 1, weeklyScore: 1 }
            },
            { new: true, select: 'voteCount weeklyScore' }
        );

        if (!updatedNovel) {
            return res.status(404).json({ success: false, message: 'Việc vote thất bại do không tìm thấy truyện.' });
        }

        return res.json({
            success: true,
            message: 'Cảm ơn bạn đã bình chọn!',
            data: {
                voteCount: updatedNovel.voteCount
            }
        });

    } catch (error) {
        console.error('[Vote] Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xử lý bình chọn.' });
    }
};

/**
 * GET /api/rankings
 * Query: 
 *   type: 'vote' (default) | 'view' | 'newest' | 'rating'
 *   limit: number (default 10)
 */
exports.getRankings = async (req, res) => {
    try {
        const { type = 'vote', limit = 10 } = req.query;
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

        let sortOption = {};

        switch (type) {
            case 'view':
                sortOption = { readCount: -1 };
                break;
            case 'rating':
                sortOption = { ratingAverage: -1, reviewCount: -1 }; // Điểm cao + nhiều review
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'vote':
            default:
                sortOption = { weeklyScore: -1, voteCount: -1 }; // Ưu tiên điểm tuần, sau đó tổng vote
                break;
        }

        const novels = await Novel.find({})
            .sort(sortOption)
            .limit(limitNum)
            .select('title author coverImage voteCount weeklyScore readCount ratingAverage reviewCount status source originalLink description standardTags rawTags')
            .lean();

        return res.json({
            success: true,
            data: novels
        });

    } catch (error) {
        console.error('[Ranking] Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy bảng xếp hạng.' });
    }
};

/**
 * GET /api/votes/check?novelId=...
 * Check xem user (IP) đã vote cho truyện này chưa (thể hiện nút Vote disable/enable)
 */
exports.checkVoteStatus = async (req, res) => {
    try {
        const { novelId } = req.query;
        const ipAddress = req.ip || req.connection.remoteAddress;

        if (!novelId) return res.status(400).json({ success: false });

        const voted = await hasVoted(ipAddress, novelId);
        return res.json({ success: true, voted });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
