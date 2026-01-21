/**
 * Routes Index - Tổng hợp tất cả routes
 */

const novelRoutes = require('./novelRoutes');
const adminRoutes = require('./adminRoutes');
const reviewRoutes = require('./reviewRoutes');
const voteRoutes = require('./voteRoutes');
const updateRoutes = require('./updates');

module.exports = {
  novelRoutes,
  adminRoutes,
  reviewRoutes,
  voteRoutes,
  updateRoutes
};
