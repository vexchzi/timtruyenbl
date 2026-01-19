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
// Delete a novel
router.delete('/novels/:id', adminController.deleteNovel);

// Analyze tags from text
router.post('/tags/analyze', adminController.analyzeTagsText);

// ============== Tag Reports Management ==============

// Get report statistics
router.get('/reports/stats', adminController.getReportStats);

// Get all reports with pagination
router.get('/reports', adminController.getReports);

// Update report status
router.put('/reports/:id/status', adminController.updateReportStatus);

// Resolve report (update status + optionally update novel tags)
router.post('/reports/:id/resolve', adminController.resolveReport);

// Delete a report
router.delete('/reports/:id', adminController.deleteReport);

// ============== Site Notice Management ==============

// Get current notice
router.get('/notice', adminController.getNotice);

// Update notice
router.put('/notice', adminController.updateNotice);

module.exports = router;

