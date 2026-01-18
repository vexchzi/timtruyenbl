/**
 * Admin Routes - Protected endpoints.
 * Base path: /api/admin
 */

const express = require('express');
const router = express.Router();

const { requireAdminToken } = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Protect all admin routes
router.use(requireAdminToken);

// Novel stats
router.get('/novels/stats', adminController.getNovelStats);

// Keyword search in novels
router.get('/novels/search-keyword', adminController.searchByKeyword);

// Auto-tag novels without tags
router.post('/novels/auto-tag', adminController.autoTagNovels);

// Re-tag ALL novels (including those with existing tags)
router.post('/novels/retag-all', adminController.retagAllNovels);

// Update tags for a novel
router.put('/novels/:id/tags', adminController.updateNovelTags);

// Re-crawl novel from source
router.post('/novels/:id/recrawl', adminController.recrawlNovel);

// TagDictionary management
router.get('/tags', adminController.getAllTags);
router.post('/tags', adminController.createTag);
router.put('/tags/:id', adminController.updateTag);
router.delete('/tags/:id', adminController.deleteTag);

// Delete a novel
router.delete('/novels/:id', adminController.deleteNovel);

module.exports = router;

