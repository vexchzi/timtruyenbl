/**
 * Models Index - Export tất cả Mongoose models
 * 
 * Sử dụng:
 * const { Novel, TagDictionary, TagReport, SiteNotice } = require('./models');
 */

const Novel = require('./Novel');
const TagDictionary = require('./TagDictionary');
const TagReport = require('./TagReport');
const SiteNotice = require('./SiteNotice');
const Review = require('./Review');
const Vote = require('./Vote');

module.exports = {
  Novel,
  TagDictionary,
  TagReport,
  SiteNotice,
  Review,
  Vote
};

