/**
 * Recommender Service - Logic gợi ý truyện tương tự
 * 
 * Thuật toán:
 * - Sử dụng standardTags để tính độ tương đồng
 * - Jaccard Similarity: |A ∩ B| / |A ∪ B|
 * - Kết hợp với weighted scoring dựa trên tag priority
 */

const { Novel } = require('../models');

/**
 * Cache cho recommendation results
 * - Tránh query DB lặp lại cho cùng 1 truyện
 * - TTL ngắn vì data có thể thay đổi
 */
const recommendationCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 phút

/**
 * Xóa cache entry đã hết hạn
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of recommendationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      recommendationCache.delete(key);
    }
  }
}

// Cleanup cache định kỳ
setInterval(cleanupCache, 60 * 1000);

/**
 * MAIN: Tìm truyện tương tự dựa trên standardTags
 * 
 * @param {Object} currentNovel - Object truyện hiện tại (phải có standardTags và _id)
 * @param {Object} options - Tùy chọn
 * @param {number} options.limit - Số lượng kết quả (default: 10)
 * @param {number} options.minMatchingTags - Số tag tối thiểu phải khớp (default: 1)
 * @param {boolean} options.useCache - Sử dụng cache (default: true)
 * @returns {Promise<Array>} Mảng truyện tương tự, sắp xếp theo độ khớp giảm dần
 * 
 * @example
 * const similar = await findSimilarNovels(novel, { limit: 10 });
 */
async function findSimilarNovels(currentNovel, options = {}) {
  const {
    limit = 10,
    minMatchingTags = 1,
    useCache = true
  } = options;

  // Validate input
  if (!currentNovel || !currentNovel.standardTags || currentNovel.standardTags.length === 0) {
    console.warn('[Recommender] Novel has no standardTags, cannot find similar');
    return [];
  }

  const novelId = currentNovel._id?.toString() || currentNovel.originalLink;
  const cacheKey = `${novelId}_${limit}`;

  // Check cache
  if (useCache && recommendationCache.has(cacheKey)) {
    const cached = recommendationCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Recommender] Cache hit for:', currentNovel.title);
      return cached.data;
    }
  }

  console.log(`[Recommender] Finding similar novels for: "${currentNovel.title}"`);
  console.log(`[Recommender] Source tags: [${currentNovel.standardTags.join(', ')}]`);

  try {
    /**
     * MongoDB Aggregation Pipeline
     * 
     * Tối ưu hiệu suất:
     * 1. $match đầu tiên để filter nhanh bằng index
     * 2. Tính toán trong pipeline thay vì fetch về client
     * 3. $limit sớm để giảm data xử lý
     */
    const pipeline = [
      // Stage 1: Loại trừ chính truyện đang xét + filter có ít nhất 1 tag chung
      {
        $match: {
          // Loại trừ truyện hiện tại
          ...(currentNovel._id && { _id: { $ne: currentNovel._id } }),
          originalLink: { $ne: currentNovel.originalLink },
          // Phải có ít nhất 1 tag trùng (sử dụng index)
          standardTags: { $in: currentNovel.standardTags }
        }
      },

      // Stage 2: Tính số tag trùng khớp
      {
        $addFields: {
          // Số tag trùng = size của intersection
          matchingTagsCount: {
            $size: {
              $setIntersection: ['$standardTags', currentNovel.standardTags]
            }
          },
          // Tags nào trùng (để hiển thị)
          matchingTags: {
            $setIntersection: ['$standardTags', currentNovel.standardTags]
          },
          // Tổng số tags unique giữa 2 truyện (cho Jaccard)
          totalUniqueTags: {
            $size: {
              $setUnion: ['$standardTags', currentNovel.standardTags]
            }
          }
        }
      },

      // Stage 3: Tính điểm similarity (Jaccard + bonus)
      {
        $addFields: {
          // Jaccard Similarity: intersection / union
          jaccardScore: {
            $cond: {
              if: { $eq: ['$totalUniqueTags', 0] },
              then: 0,
              else: {
                $divide: ['$matchingTagsCount', '$totalUniqueTags']
              }
            }
          },
          // Bonus cho truyện có nhiều lượt đọc (normalized)
          popularityBonus: {
            $cond: {
              if: { $gt: ['$readCount', 0] },
              then: { $min: [{ $divide: [{ $ln: { $add: ['$readCount', 1] } }, 20] }, 0.1] },
              else: 0
            }
          }
        }
      },

      // Stage 4: Tính final score
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $multiply: ['$jaccardScore', 0.9] },     // 90% weight cho tag match
              { $multiply: ['$popularityBonus', 0.1] }  // 10% weight cho popularity
            ]
          }
        }
      },

      // Stage 5: Filter theo minMatchingTags
      {
        $match: {
          matchingTagsCount: { $gte: minMatchingTags }
        }
      },

      // Stage 6: Sắp xếp theo điểm similarity giảm dần
      {
        $sort: {
          similarityScore: -1,
          matchingTagsCount: -1,
          readCount: -1
        }
      },

      // Stage 7: Giới hạn kết quả
      { $limit: limit },

      // Stage 8: Project chỉ các field cần thiết
      {
        $project: {
          _id: 1,
          title: 1,
          author: 1,
          description: { $substrCP: ['$description', 0, 200] }, // Truncate description
          coverImage: 1,
          originalLink: 1,
          standardTags: 1,
          matchingTags: 1,
          matchingTagsCount: 1,
          similarityScore: { $round: ['$similarityScore', 3] },
          readCount: 1,
          status: 1
        }
      }
    ];

    const startTime = Date.now();
    const results = await Novel.aggregate(pipeline);
    const duration = Date.now() - startTime;

    console.log(`[Recommender] Found ${results.length} similar novels in ${duration}ms`);

    // Cache results
    if (useCache) {
      recommendationCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });
    }

    return results;

  } catch (error) {
    console.error('[Recommender] Error finding similar novels:', error);
    throw error;
  }
}

/**
 * Tìm truyện tương tự theo tags cụ thể (không cần novel object)
 * 
 * @param {string[]} tags - Mảng standardTags
 * @param {Object} options - Tùy chọn
 * @returns {Promise<Array>}
 */
async function findByTags(tags, options = {}) {
  const { limit = 10, excludeIds = [] } = options;

  if (!tags || tags.length === 0) {
    return [];
  }

  const results = await Novel.aggregate([
    {
      $match: {
        standardTags: { $in: tags },
        _id: { $nin: excludeIds }
      }
    },
    {
      $addFields: {
        matchingTagsCount: {
          $size: { $setIntersection: ['$standardTags', tags] }
        }
      }
    },
    { $sort: { matchingTagsCount: -1, readCount: -1 } },
    { $limit: limit },
    {
      $project: {
        title: 1,
        author: 1,
        coverImage: 1,
        originalLink: 1,
        standardTags: 1,
        matchingTagsCount: 1
      }
    }
  ]);

  return results;
}

/**
 * Lấy top tags phổ biến nhất trong DB
 * 
 * @param {number} limit - Số lượng tags
 * @returns {Promise<Array>} [{ tag: 'Ngược', count: 150 }, ...]
 */
async function getPopularTags(limit = 20) {
  const results = await Novel.aggregate([
    { $unwind: '$standardTags' },
    { $group: { _id: '$standardTags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, tag: '$_id', count: 1 } }
  ]);

  return results;
}

/**
 * Lấy thống kê tổng quan
 */
async function getStats() {
  const [totalNovels, tagStats] = await Promise.all([
    Novel.countDocuments(),
    Novel.aggregate([
      { $unwind: '$standardTags' },
      { $group: { _id: null, uniqueTags: { $addToSet: '$standardTags' } } },
      { $project: { count: { $size: '$uniqueTags' } } }
    ])
  ]);

  return {
    totalNovels,
    uniqueTags: tagStats[0]?.count || 0,
    cacheSize: recommendationCache.size
  };
}

/**
 * Clear recommendation cache
 */
function clearCache() {
  recommendationCache.clear();
  console.log('[Recommender] Cache cleared');
}

module.exports = {
  findSimilarNovels,
  findByTags,
  getPopularTags,
  getStats,
  clearCache
};
