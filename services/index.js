/**
 * Services Index - Export tất cả services
 */

const crawler = require('./crawler');
const recommender = require('./recommender');

module.exports = {
  ...crawler,
  ...recommender
};
