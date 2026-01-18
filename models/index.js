/**
 * Models Index - Export tất cả Mongoose models
 * 
 * Sử dụng:
 * const { Novel, TagDictionary } = require('./models');
 */

const Novel = require('./Novel');
const TagDictionary = require('./TagDictionary');

module.exports = {
  Novel,
  TagDictionary
};
