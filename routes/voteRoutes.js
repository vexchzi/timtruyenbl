const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');

// POST /api/votes - Tạo vote mới
router.post('/', voteController.addVote);

// GET /api/votes/rankings - Lấy BXH (Lưu ý: path này sẽ được mount là /api/votes/rankings nếu dùng router.use('/api/votes', voteRoutes))
// TUY NHIÊN: Theo plan, route ranking nên là /api/rankings hoặc /api/votes/rankings. 
// Để nhất quán với server.js, ta sẽ define route rõ ràng.

// Route check status: GET /api/votes/check?novelId=...
router.get('/check', voteController.checkVoteStatus);

// Để tiện lợi, route ranking sẽ nằm tách biệt hoặc chung cũng được.
// Ở đây tôi sẽ để GET /api/votes/rankings luôn cho gọn, 
// hoặc có thể tách ra file rankingRoutes nếu muốn đúng chuẩn RESTful resource 'rankings'.
// Nhưng để đơn giản, gộp vào đây.
router.get('/rankings', voteController.getRankings);

module.exports = router;
