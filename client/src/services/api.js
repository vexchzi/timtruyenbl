/**
 * API Service - Gọi Backend APIs
 */

// Use Render API directly for production, local proxy for development
// Determine API URL based on environment
// Default to relative path '/api' which works for:
// 1. Local development (via Vite Proxy)
// 2. Production Monolith (Frontend served by Backend)
let API_BASE_URL = '/api';

// Allow override via Environment Variable (e.g. for Vercel/Netlify separate deployment)
if (import.meta.env.VITE_API_URL) {
  API_BASE_URL = import.meta.env.VITE_API_URL;
}

/**
 * Fetch wrapper với error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Có lỗi xảy ra');
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    }
    throw error;
  }
}

/**
 * POST /api/recommend - Gợi ý truyện từ URL
 * @param {string} url - URL truyện Wattpad
 * @returns {Promise<{sourceNovel, recommendations, meta}>}
 */
export async function getRecommendations(url) {
  const response = await fetchAPI('/recommend', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });

  return response.data;
}

/**
 * GET /api/novels - Lấy danh sách truyện
 */
export async function getNovels(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetchAPI(`/novels?${queryString}`);
  return response.data;
}

/**
 * GET /api/novels/:id - Chi tiết truyện
 */
export async function getNovelById(id) {
  const response = await fetchAPI(`/novels/${id}`);
  return response.data;
}

/**
 * GET /api/tags - Lấy danh sách tags
 */
export async function getTags() {
  const response = await fetchAPI('/tags');
  return response.data;
}

/**
 * GET /api/stats - Thống kê
 */
export async function getStats() {
  const response = await fetchAPI('/stats');
  return response.data;
}

export default {
  getRecommendations,
  getNovels,
  getNovelById,
  getTags,
  getStats,
  createReview,
  getReviews,
  addVote,
  checkVoteStatus,
  getRankings
};

/**
 * POST /api/reviews - Tạo review
 */
export async function createReview(data) {
  const response = await fetchAPI('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * GET /api/reviews/novel/:id - Lấy reviews của truyện
 */
export async function getReviews(novelId) {
  const response = await fetchAPI(`/reviews/novel/${novelId}`);
  return response.data;
}

/**
 * POST /api/votes - Tạo vote
 */
export async function addVote(novelId) {
  const response = await fetchAPI('/votes', {
    method: 'POST',
    body: JSON.stringify({ novelId }),
  });
  return response;
}

/**
 * GET /api/votes/check - Kiểm tra trạng thái vote
 */
export async function checkVoteStatus(novelId) {
  const response = await fetchAPI(`/votes/check?novelId=${novelId}`);
  return response;
}

/**
 * GET /api/votes/rankings - Lấy bảng xếp hạng
 */
export async function getRankings(type = 'vote', limit = 10) {
  const response = await fetchAPI(`/votes/rankings?type=${type}&limit=${limit}`);
  return response.data;
}
