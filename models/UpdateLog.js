const mongoose = require('mongoose');

const updateLogSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    content: {
        type: [String], // Array of bullet points
        required: true
    },
    type: {
        type: String,
        enum: ['feature', 'fix', 'improvement', 'other'],
        default: 'improvement'
    }
});

module.exports = mongoose.model('UpdateLog', updateLogSchema);
