const express = require('express');
const router = express.Router();
const UpdateLog = require('../models/UpdateLog');

/**
 * GET /api/updates
 * Get all updates sorted by date/version desc
 */
router.get('/', async (req, res) => {
    try {
        const updates = await UpdateLog.find().sort({ date: -1 });
        res.json({ success: true, data: updates });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/updates
 * Create new update log
 */
router.post('/', async (req, res) => {
    try {
        const { version, content, type, date } = req.body;

        if (!version || !content || !Array.isArray(content)) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        const newUpdate = new UpdateLog({
            version,
            content,
            type,
            date: date || Date.now()
        });

        await newUpdate.save();
        res.json({ success: true, data: newUpdate });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * DELETE /api/updates/:id
 * Delete an update log
 */
router.delete('/:id', async (req, res) => {
    try {
        await UpdateLog.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
