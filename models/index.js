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

module.exports = {
  Novel,
  TagDictionary,
  TagReport,
  SiteNotice
};

