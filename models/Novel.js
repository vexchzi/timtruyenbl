/**
 * Novel Schema - Lưu trữ thông tin truyện đã crawl
 * 
 * Mục đích:
 * - Lưu trữ metadata của truyện từ Wattpad/WordPress
 * - Lưu cả tag gốc (rawTags) và tag chuẩn hóa (standardTags)
 * - Hỗ trợ tìm kiếm và gợi ý truyện tương tự
 */

const mongoose = require('mongoose');

const NovelSchema = new mongoose.Schema({
  // Tiêu đề truyện
  title: {
    type: String,
    required: [true, 'Tiêu đề truyện là bắt buộc'],
    trim: true,
    maxlength: [500, 'Tiêu đề không được vượt quá 500 ký tự'],
    index: true // Index để tìm kiếm nhanh theo title
  },

  // Link gốc từ Wattpad/WordPress - UNIQUE để tránh crawl trùng
  originalLink: {
    type: String,
    required: [true, 'Link gốc là bắt buộc'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Validate URL format cơ bản
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Link không hợp lệ'
    }
  },

  // Nguồn gốc: wattpad, wordpress, navyteam, gocnho, other
  source: {
    type: String,
    enum: ['wattpad', 'wordpress', 'navyteam', 'gocnho', 'other'],
    default: 'other'
  },

  // Tên tác giả
  author: {
    type: String,
    trim: true,
    default: 'Unknown'
  },

  // Mô tả/Giới thiệu truyện
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Mô tả không được vượt quá 5000 ký tự']
  },

  // Link ảnh bìa
  coverImage: {
    type: String,
    trim: true,
    default: null
  },

  /**
   * rawTags: Mảng tag GỐC crawl được từ web
   * - Giữ nguyên định dạng ban đầu (có dấu, viết hoa/thường lộn xộn)
   * - Dùng để debug và tra cứu khi cần
   * Ví dụ: ["Ngược thân", "HE", "hiện đại", "SỦNG"]
   */
  rawTags: [{
    type: String,
    trim: true
  }],

  /**
   * standardTags: Mảng tag đã CHUẨN HÓA
   * - Đã được normalize qua TagDictionary
   * - Dùng để filter, tìm kiếm và recommend
   * Ví dụ: ["Ngược", "Happy Ending", "Hiện Đại", "Sủng"]
   */
  standardTags: [{
    type: String,
    trim: true,
    index: true // Index để query nhanh theo tag
  }],

  // Trạng thái truyện
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'dropped', 'unknown'],
    default: 'unknown'
  },

  // Số chapter (nếu crawl được)
  chapterCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Số lượt đọc (nếu crawl được)
  readCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Điểm đánh giá (nếu có)
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  // Thời gian crawl
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Thời gian cập nhật lần cuối
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Tự động thêm createdAt và updatedAt
  timestamps: true,
  
  // Collection name trong MongoDB
  collection: 'novels'
});

/**
 * Compound Index cho tìm kiếm truyện tương tự
 * - Tối ưu query: tìm truyện có cùng standardTags
 */
NovelSchema.index({ standardTags: 1, createdAt: -1 });

/**
 * Text Index cho full-text search
 * - Tìm kiếm theo title và description
 */
NovelSchema.index({ 
  title: 'text', 
  description: 'text' 
}, {
  weights: {
    title: 10,      // Title có trọng số cao hơn
    description: 5
  },
  name: 'TextSearchIndex'
});

/**
 * Pre-save middleware
 * - Tự động cập nhật updatedAt
 * - Detect source từ originalLink
 */
NovelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-detect source từ URL
  if (this.originalLink) {
    if (this.originalLink.includes('wattpad.com')) {
      this.source = 'wattpad';
    } else if (this.originalLink.includes('wordpress.com') || 
               this.originalLink.includes('.wp.')) {
      this.source = 'wordpress';
    }
  }
  
  next();
});

/**
 * Static method: Tìm truyện tương tự dựa trên standardTags
 * @param {string} novelId - ID của truyện gốc
 * @param {number} limit - Số lượng kết quả tối đa
 * @returns {Promise<Array>} - Mảng truyện tương tự
 */
NovelSchema.statics.findSimilar = async function(novelId, limit = 10) {
  const novel = await this.findById(novelId);
  if (!novel || !novel.standardTags.length) {
    return [];
  }

  // Tìm truyện có chung standardTags, sắp xếp theo số tag khớp
  return this.aggregate([
    // Loại trừ chính truyện đang xét
    { $match: { _id: { $ne: novel._id } } },
    
    // Tính số tag trùng khớp
    { 
      $addFields: {
        matchingTags: {
          $size: {
            $setIntersection: ['$standardTags', novel.standardTags]
          }
        }
      }
    },
    
    // Chỉ lấy truyện có ít nhất 1 tag trùng
    { $match: { matchingTags: { $gt: 0 } } },
    
    // Sắp xếp theo số tag trùng (giảm dần)
    { $sort: { matchingTags: -1, readCount: -1 } },
    
    // Giới hạn kết quả
    { $limit: limit },
    
    // Chỉ lấy các field cần thiết
    { 
      $project: {
        title: 1,
        author: 1,
        coverImage: 1,
        standardTags: 1,
        matchingTags: 1,
        originalLink: 1
      }
    }
  ]);
};

/**
 * Static method: Tìm truyện theo tags
 * @param {Array<string>} tags - Mảng standardTags cần tìm
 * @param {Object} options - { page, limit, matchAll }
 */
NovelSchema.statics.findByTags = async function(tags, options = {}) {
  const { page = 1, limit = 20, matchAll = false } = options;
  const skip = (page - 1) * limit;

  const query = matchAll 
    ? { standardTags: { $all: tags } }  // Phải có TẤT CẢ tags
    : { standardTags: { $in: tags } };  // Có ÍT NHẤT 1 tag

  const [novels, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    novels,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Instance method: Kiểm tra truyện đã tồn tại chưa
 */
NovelSchema.statics.existsByLink = async function(originalLink) {
  const count = await this.countDocuments({ originalLink });
  return count > 0;
};

module.exports = mongoose.model('Novel', NovelSchema);
