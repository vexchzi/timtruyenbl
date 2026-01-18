/**
 * API Service - Gọi Backend APIs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
};
