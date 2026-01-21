const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Public routes
router.post('/', reviewController.createReview);
router.get('/novel/:novelId', reviewController.getReviewsByNovel);

// Admin routes (cần bảo vệ nếu muốn, nhưng ở đây để public cho đơn giản theo yêu cầu cũ, hoặc gắn middleware admin nếu cần)
// Tạm thời để public hoặc dùng chung middleware adminAuth nếu tích hợp vào adminRoutes
router.get('/latest', reviewController.getLatestReviews);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
