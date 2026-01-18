/**
 * Tag Normalizer - Logic cốt lõi chuẩn hóa tags
 * 
 * Quy trình:
 * 1. Load Dictionary từ DB (có cache)
 * 2. Duyệt từng rawTag: lowercase + bỏ dấu tiếng Việt
 * 3. So khớp với Dictionary
 * 4. Loại bỏ trùng lặp
 * 5. Trả về mảng standardTags sạch
 */

const TagDictionary = require('../models/TagDictionary');

/**
 * BLACKLIST TAGS - Các tags sẽ bị bỏ qua
 * - Tags liên quan đến fanfic, format không cần thiết
 * - Tags chung chung của Wattpad
 */
const BLACKLIST_TAGS = [
  // Fanfic related
  'fic', 'fanfic', 'fanfiction', 'shortfic', 'fiction', 'fics',
  'fanfics', 'oneshot', 'twoshot', 'drabble', 'ficlet',
  // Wattpad generic tags
  'wattpad', 'wattpadstories', 'stories', 'story', 'reading',
  'ebooks', 'books', 'book', 'newadult', 'teenfiction',
  'romance', 'love', 'lovestory',
  // Format tags
  'edit', 'edited', 'raw', 'cv', 'convert', 'qt', 'mtl',
  // Other generic
  'vietnam', 'vietnamese', 'truyện', 'truyen', 'đọc', 'doc'
];

/**
 * NEGATION PATTERNS - Các cụm từ phủ định
 * Khi gặp các cụm này, không match tag trong đó
 * Ví dụ: "không có NTR" -> không gán tag NTR
 */
const NEGATION_PATTERNS = [
  // Vietnamese negations
  'khong co', 'khong', 'ko co', 'ko', 'chua co', 'chua',
  'khong phai', 'khong he', 'khong hoan toan',
  // English negations  
  'no ', 'not ', 'without ', 'non-', 'non '
];

/**
 * SENSITIVE_TAGS - Tags nhạy cảm cần kiểm tra kỹ trước khi gán
 * Các tags này chỉ được gán khi có từ khóa rõ ràng, không phải trong cụm phủ định
 * VÀ phải là từ riêng biệt (có word boundary), không phải substring của từ khác
 */
const SENSITIVE_TAGS = ['ntr', 'np', 'ngoai tinh', 'cam sung', 'cheating'];

/**
 * Kiểm tra xem keyword có phải là từ riêng biệt trong tag không
 * Tránh match "ntr" trong "vuontruong" (vườn trường)
 * @param {string} tag - Tag đã normalize
 * @param {string} keyword - Keyword cần kiểm tra
 * @returns {boolean}
 */
function isStandaloneKeyword(tag, keyword) {
  // Nếu tag = keyword thì là exact match
  if (tag === keyword) return true;
  
  // Tạo regex với word boundary
  // Word boundary trong context này là: đầu/cuối string, space, hoặc ký tự đặc biệt
  const regex = new RegExp(`(^|[\\s,;|/\\-_])${keyword}($|[\\s,;|/\\-_])`, 'i');
  return regex.test(tag);
}

/**
 * CACHE cho Dictionary
 * - Tránh query DB mỗi lần normalize
 * - Tự động refresh sau TTL
 */
const cache = {
  dictionary: null,       // Object: { keyword: standardTag }
  lastFetch: null,        // Timestamp lần fetch cuối
  ttl: 5 * 60 * 1000      // Time-to-live: 5 phút
};

/**
 * Bảng chuyển đổi ký tự có dấu tiếng Việt sang không dấu
 * - Bao gồm cả chữ hoa và chữ thường
 */
const VIETNAMESE_MAP = {
  // Chữ thường có dấu
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  'đ': 'd',
  
  // Chữ hoa có dấu
  'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
  'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
  'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
  'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
  'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
  'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
  'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
  'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
  'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
  'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
  'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
  'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
  'Đ': 'D'
};

/**
 * Loại bỏ dấu tiếng Việt từ string
 * @param {string} str - Chuỗi cần xử lý
 * @returns {string} - Chuỗi không dấu
 */
function removeVietnameseTones(str) {
  if (!str) return '';
  
  return str
    .split('')
    .map(char => VIETNAMESE_MAP[char] || char)
    .join('');
}

/**
 * Chuẩn hóa 1 tag đơn lẻ
 * - Lowercase
 * - Bỏ dấu tiếng Việt  
 * - Trim và loại bỏ ký tự đặc biệt
 * @param {string} tag - Tag gốc
 * @returns {string} - Tag đã normalize
 */
function normalizeString(tag) {
  if (!tag || typeof tag !== 'string') return '';
  
  return removeVietnameseTones(tag)
    .toLowerCase()                    // Chuyển thành chữ thường
    .trim()                           // Loại bỏ khoảng trắng đầu/cuối
    .replace(/[#@!$%^&*()+=\[\]{}|\\:;"'<>,.\/?]/g, '') // Bỏ ký tự đặc biệt
    .replace(/\s+/g, ' ')             // Gộp nhiều khoảng trắng thành 1
    .trim();
}

/**
 * Load Dictionary từ Database (có cache)
 * @param {boolean} forceRefresh - Bắt buộc refresh cache
 * @returns {Promise<Object>} - Dictionary object
 */
async function loadDictionary(forceRefresh = false) {
  const now = Date.now();
  
  // Kiểm tra cache còn valid không
  const cacheValid = cache.dictionary && 
                     cache.lastFetch && 
                     (now - cache.lastFetch < cache.ttl);
  
  if (cacheValid && !forceRefresh) {
    return cache.dictionary;
  }
  
  // Fetch từ DB
  console.log('[TagNormalizer] Loading dictionary from database...');
  
  try {
    cache.dictionary = await TagDictionary.getDictionaryObject();
    cache.lastFetch = now;
    
    const entryCount = Object.keys(cache.dictionary).length;
    console.log(`[TagNormalizer] Loaded ${entryCount} dictionary entries`);
    
    return cache.dictionary;
  } catch (error) {
    console.error('[TagNormalizer] Error loading dictionary:', error);
    
    // Nếu có cache cũ, vẫn dùng
    if (cache.dictionary) {
      console.log('[TagNormalizer] Using stale cache');
      return cache.dictionary;
    }
    
    // Không có gì thì trả về object rỗng
    return {};
  }
}

/**
 * Xóa cache Dictionary
 * - Gọi khi update Dictionary trong DB
 */
function clearCache() {
  cache.dictionary = null;
  cache.lastFetch = null;
  console.log('[TagNormalizer] Cache cleared');
}

/**
 * MAIN FUNCTION: Chuẩn hóa mảng tags
 * 
 * @param {string[]} rawTags - Mảng tag gốc crawl được
 * @param {Object} options - Tùy chọn
 * @param {boolean} options.includeUnmatched - Có giữ tag không khớp không (default: false)
 * @param {string} options.unmatchedLabel - Nhãn cho tag không khớp (default: null = bỏ qua)
 * @returns {Promise<string[]>} - Mảng standardTags đã chuẩn hóa
 * 
 * @example
 * const rawTags = ['Ngược thân', 'HE', 'hiện đại', 'SỦNG', 'random_tag'];
 * const standardTags = await normalizeTags(rawTags);
 * // Output: ['Ngược', 'Happy Ending', 'Hiện Đại', 'Sủng']
 */
async function normalizeTags(rawTags, options = {}) {
  const { 
    includeUnmatched = false, 
    unmatchedLabel = null 
  } = options;
  
  // Validate input
  if (!rawTags || !Array.isArray(rawTags) || rawTags.length === 0) {
    return [];
  }
  
  // B1: Load Dictionary từ DB (hoặc cache)
  const dictionary = await loadDictionary();
  
  // B2 & B3: Duyệt từng rawTag và so khớp
  const standardTagsSet = new Set(); // Dùng Set để tự động loại trùng
  const unmatchedTags = [];
  
  for (const rawTag of rawTags) {
    // Skip nếu tag rỗng hoặc không phải string
    if (!rawTag || typeof rawTag !== 'string') {
      continue;
    }
    
    // Normalize tag: lowercase + bỏ dấu
    const normalizedTag = normalizeString(rawTag);
    
    // Skip nếu sau khi normalize thành rỗng
    if (!normalizedTag) {
      continue;
    }
    
    // Skip nếu tag nằm trong blacklist
    if (BLACKLIST_TAGS.some(bt => normalizedTag.includes(bt) || bt.includes(normalizedTag))) {
      continue;
    }
    
    // So khớp với Dictionary
    let matched = false;
    
    // Kiểm tra xem tag có chứa cụm phủ định không
    const hasNegation = NEGATION_PATTERNS.some(neg => normalizedTag.includes(neg));
    
    // 1. Thử exact match trước
    if (dictionary[normalizedTag]) {
      standardTagsSet.add(dictionary[normalizedTag]);
      matched = true;
    } else {
      // 2. Thử tìm từng keyword trong dictionary có chứa trong tag
      for (const [keyword, stdTag] of Object.entries(dictionary)) {
        // Chỉ match nếu keyword đủ dài (>= 3 ký tự) và tag chứa keyword
        if (keyword.length >= 3 && normalizedTag.includes(keyword)) {
          // Nếu tag có cụm phủ định VÀ keyword là sensitive tag -> bỏ qua
          if (hasNegation && SENSITIVE_TAGS.some(st => keyword.includes(st))) {
            continue; // Bỏ qua, không gán tag này
          }
          
          // Nếu là sensitive tag, kiểm tra xem có phải standalone keyword không
          // Tránh match "ntr" trong "vuontruong" (vườn trường)
          const isSensitive = SENSITIVE_TAGS.some(st => keyword === st || keyword.includes(st));
          if (isSensitive && !isStandaloneKeyword(normalizedTag, keyword)) {
            continue; // Bỏ qua, "ntr" chỉ là substring của từ khác
          }
          
          standardTagsSet.add(stdTag);
          matched = true;
        }
      }
      
      // 3. Nếu vẫn chưa match, thử tách tag thành các phần nhỏ
      if (!matched) {
        const parts = normalizedTag.split(/[\s,]+/).filter(p => p.length >= 2);
        for (const part of parts) {
          if (dictionary[part]) {
            // Kiểm tra sensitive tags
            if (hasNegation && SENSITIVE_TAGS.some(st => part.includes(st))) {
              continue;
            }
            // Kiểm tra standalone cho sensitive tags
            const isSensitive = SENSITIVE_TAGS.some(st => part === st || part.includes(st));
            if (isSensitive && !isStandaloneKeyword(normalizedTag, part)) {
              continue;
            }
            standardTagsSet.add(dictionary[part]);
            matched = true;
          }
        }
      }
    }
    
    if (!matched) {
      // Không tìm thấy
      unmatchedTags.push(rawTag);
      
      if (includeUnmatched && unmatchedLabel) {
        // Gán nhãn cho tag không khớp
        standardTagsSet.add(unmatchedLabel);
      }
    }
  }
  
  // Log các tag không khớp (để debug và bổ sung Dictionary)
  if (unmatchedTags.length > 0) {
    console.log('[TagNormalizer] Unmatched tags:', unmatchedTags);
  }
  
  // B4: Chuyển Set thành Array và trả về
  return Array.from(standardTagsSet);
}

/**
 * Chuẩn hóa tags với kết quả chi tiết
 * - Trả về cả matched và unmatched tags
 * - Hữu ích cho debugging và phân tích
 * 
 * @param {string[]} rawTags - Mảng tag gốc
 * @returns {Promise<Object>} - { standardTags, matchedCount, unmatchedTags }
 */
async function normalizeTagsDetailed(rawTags) {
  if (!rawTags || !Array.isArray(rawTags) || rawTags.length === 0) {
    return {
      standardTags: [],
      matchedCount: 0,
      unmatchedTags: [],
      totalRaw: 0
    };
  }
  
  const dictionary = await loadDictionary();
  
  const standardTagsSet = new Set();
  const unmatchedTags = [];
  const matchDetails = []; // Chi tiết mapping
  
  for (const rawTag of rawTags) {
    if (!rawTag || typeof rawTag !== 'string') continue;
    
    const normalizedTag = normalizeString(rawTag);
    if (!normalizedTag) continue;
    
    const standardTag = dictionary[normalizedTag];
    
    if (standardTag) {
      standardTagsSet.add(standardTag);
      matchDetails.push({
        raw: rawTag,
        normalized: normalizedTag,
        standard: standardTag,
        matched: true
      });
    } else {
      unmatchedTags.push(rawTag);
      matchDetails.push({
        raw: rawTag,
        normalized: normalizedTag,
        standard: null,
        matched: false
      });
    }
  }
  
  return {
    standardTags: Array.from(standardTagsSet),
    matchedCount: standardTagsSet.size,
    unmatchedTags,
    totalRaw: rawTags.length,
    matchRate: rawTags.length > 0 
      ? ((rawTags.length - unmatchedTags.length) / rawTags.length * 100).toFixed(1) + '%'
      : '0%',
    details: matchDetails
  };
}

/**
 * Tìm kiếm gần đúng trong Dictionary
 * - Dùng khi không match chính xác
 * - Tìm các keyword có chứa từ khóa tìm kiếm
 * 
 * @param {string} keyword - Từ khóa cần tìm
 * @param {number} limit - Số kết quả tối đa
 * @returns {Promise<Array>} - Mảng các standardTag gợi ý
 */
async function suggestTags(keyword, limit = 5) {
  const dictionary = await loadDictionary();
  const normalizedKeyword = normalizeString(keyword);
  
  if (!normalizedKeyword) return [];
  
  const suggestions = [];
  const seenTags = new Set();
  
  for (const [dictKeyword, standardTag] of Object.entries(dictionary)) {
    // Tìm keyword chứa từ khóa tìm kiếm hoặc ngược lại
    if (dictKeyword.includes(normalizedKeyword) || 
        normalizedKeyword.includes(dictKeyword)) {
      if (!seenTags.has(standardTag)) {
        seenTags.add(standardTag);
        suggestions.push({
          keyword: dictKeyword,
          standardTag
        });
      }
    }
    
    if (suggestions.length >= limit) break;
  }
  
  return suggestions;
}

/**
 * Extract tags từ description text
 * - Tìm các pattern như "Thể loại:", "Tags:", "Tính chất:", etc.
 * - Parse và tách các tags
 * 
 * @param {string} description - Nội dung giới thiệu truyện
 * @returns {string[]} - Mảng các tags tìm được
 */
function extractTagsFromDescription(description) {
  if (!description || typeof description !== 'string') {
    return [];
  }

  const extractedTags = [];
  
  // Các patterns để tìm tags trong description
  const patterns = [
    // Vietnamese patterns
    /Thể\s*loại\s*[:\-]\s*([^\n\r]+)/gi,
    /Tags?\s*[:\-]\s*([^\n\r]+)/gi,
    /Tính\s*chất\s*[:\-]\s*([^\n\r]+)/gi,
    /Tính\s*chất\s*truyện\s*[:\-]\s*([^\n\r]+)/gi,
    /Tính\s*chất\s*nội\s*dung\s*[:\-]\s*([^\n\r]+)/gi,
    /Couple\s*[:\-]\s*([^\n\r]+)/gi,
    /CP\s*[:\-]\s*([^\n\r]+)/gi,
    /Bối\s*cảnh\s*[:\-]\s*([^\n\r]+)/gi,
    /Kết\s*cục\s*[:\-]\s*([^\n\r]+)/gi,
    /Kết\s*thúc\s*[:\-]\s*([^\n\r]+)/gi,
    /Tình\s*trạng\s*[:\-]\s*([^\n\r]+)/gi,
    /Nhân\s*vật\s*chính\s*[:\-]\s*([^\n\r]+)/gi,
    /Góc\s*nhìn\s*[:\-]\s*([^\n\r]+)/gi,
    /Thể\s*loại\s*công\s*[:\-]\s*([^\n\r]+)/gi,
    /Thể\s*loại\s*thụ\s*[:\-]\s*([^\n\r]+)/gi,
    /Công\s*[:\-]\s*([^\n\r]+)/gi,
    /Thụ\s*[:\-]\s*([^\n\r]+)/gi,
    // English patterns (often mixed)
    /Genre\s*[:\-]\s*([^\n\r]+)/gi,
    /Categories?\s*[:\-]\s*([^\n\r]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const tagLine = match[1];
      
      // Tách tags bằng dấu phẩy, dấu chấm, hoặc dấu gạch
      const tags = tagLine
        .split(/[,，、\/|·]+/)
        .map(t => t.trim())
        .filter(t => {
          // Lọc bỏ các giá trị không phải tag
          if (!t || t.length < 2 || t.length > 50) return false;
          // Bỏ qua các giá trị là số, ngày tháng
          if (/^\d+$/.test(t)) return false;
          if (/^\d+\/\d+/.test(t)) return false;
          // Bỏ qua các từ không phải tag
          const skipWords = ['full', 'hoàn', 'đang ra', 'drop', 'ngưng', 'chương', 'tập', 
                            'tác giả', 'nguồn', 'biên tập', 'editor', 'edit', 'cv', 'convert',
                            'đăng tại', 'link', 'http', 'www', '.com', 'wordpress'];
          const tLower = t.toLowerCase();
          if (skipWords.some(w => tLower.includes(w))) return false;
          return true;
        });
      
      extractedTags.push(...tags);
    }
  }

  // Loại bỏ trùng lặp (case-insensitive)
  const uniqueTags = [];
  const seenLower = new Set();
  for (const tag of extractedTags) {
    const lower = tag.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      uniqueTags.push(tag);
    }
  }

  return uniqueTags;
}

/**
 * Normalize tags kết hợp cả rawTags và description
 * - Extract tags từ description
 * - Merge với rawTags
 * - Normalize tất cả
 * 
 * @param {string[]} rawTags - Tags gốc
 * @param {string} description - Nội dung giới thiệu
 * @returns {Promise<string[]>} - Mảng standardTags
 */
async function normalizeTagsWithDescription(rawTags = [], description = '') {
  // Extract tags từ description
  const descriptionTags = extractTagsFromDescription(description);
  
  // Merge rawTags và descriptionTags
  const allTags = [...(rawTags || []), ...descriptionTags];
  
  // Normalize tất cả
  return normalizeTags(allTags);
}

/**
 * Preload Dictionary vào cache
 * - Gọi khi server start để warm up cache
 */
async function warmUpCache() {
  console.log('[TagNormalizer] Warming up cache...');
  await loadDictionary(true);
  console.log('[TagNormalizer] Cache warmed up successfully');
}

/**
 * Lấy thống kê về cache
 */
function getCacheStats() {
  return {
    hasData: cache.dictionary !== null,
    entryCount: cache.dictionary ? Object.keys(cache.dictionary).length : 0,
    lastFetch: cache.lastFetch ? new Date(cache.lastFetch).toISOString() : null,
    ttl: cache.ttl,
    isStale: cache.lastFetch ? (Date.now() - cache.lastFetch > cache.ttl) : true
  };
}

// Export các functions
module.exports = {
  // Main functions
  normalizeTags,
  normalizeTagsDetailed,
  normalizeTagsWithDescription,
  
  // Utility functions
  normalizeString,
  removeVietnameseTones,
  suggestTags,
  extractTagsFromDescription,
  
  // Cache management
  loadDictionary,
  clearCache,
  warmUpCache,
  getCacheStats
};
