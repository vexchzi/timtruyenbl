/**
 * API Service - Gọi Backend APIs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Get site token from URL or localStorage
 */
function getSiteToken() {
  // Check URL params first
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  if (urlToken) {
    localStorage.setItem('siteToken', urlToken);
    return urlToken;
  }
  // Fall back to localStorage
  return localStorage.getItem('siteToken');
}

/**
 * Fetch wrapper với error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const siteToken = getSiteToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(siteToken && { 'X-Site-Token': siteToken }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle auth redirect
    if (response.status === 401) {
      localStorage.removeItem('siteToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
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
