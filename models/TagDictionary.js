/**
 * TagDictionary Schema - Từ điển mapping tag
 * 
 * Mục đích:
 * - Map từ khóa rác (keyword) sang tag chuẩn (standardTag)
 * - Hỗ trợ chuẩn hóa tags crawl được từ nhiều nguồn khác nhau
 * 
 * Ví dụ:
 * - { keyword: "nguoc than", standardTag: "Ngược" }
 * - { keyword: "he", standardTag: "Happy Ending" }
 * - { keyword: "hien dai", standardTag: "Hiện Đại" }
 */

const mongoose = require('mongoose');

const TagDictionarySchema = new mongoose.Schema({
  /**
   * keyword: Từ khóa gốc đã được normalize
   * - Đã lowercase và bỏ dấu tiếng Việt
   * - UNIQUE để tránh trùng lặp
   * Ví dụ: "nguoc than", "he", "hien dai"
   */
  keyword: {
    type: String,
    required: [true, 'Keyword là bắt buộc'],
    unique: true,
    trim: true,
    lowercase: true, // Tự động lowercase khi save
    index: true
  },

  /**
   * standardTag: Tag chuẩn sẽ được sử dụng
   * - Giữ nguyên định dạng hiển thị đẹp
   * - Dùng để filter và recommend
   * Ví dụ: "Ngược", "Happy Ending", "Hiện Đại"
   */
  standardTag: {
    type: String,
    required: [true, 'Standard Tag là bắt buộc'],
    trim: true,
    index: true
  },

  /**
   * category: Phân loại tag (tùy chọn)
   * - Giúp tổ chức và quản lý tags
   */
  category: {
    type: String,
    enum: [
      'type',         // Thể loại chính: Đam Mỹ, Bách Hợp, Fanfic...
      'ending',       // Kết thúc: HE, BE, OE
      'era',          // Thời đại: Hiện Đại, Cổ Đại, Cận Đại...
      'world',        // Thế giới: Mạt Thế, Dị Giới, ABO...
      'setting',      // Bối cảnh: Học Đường, Quân Nhân...
      'genre',        // Phong cách: Ngược, Sủng, Hài...
      'plot',         // Xu hướng: Xuyên Việt, Trùng Sinh...
      'relationship', // Mối quan hệ: Thanh Mai, Gương Vỡ...
      'couple',       // Couple: 1v1, NP, Cường Cường...
      'character',    // Nhân vật: Công/Thụ types
      'content',      // Nội dung: 18+, NTR...
      'other'         // Khác
    ],
    default: 'other'
  },

  /**
   * priority: Độ ưu tiên của tag (1-10)
   * - Tag quan trọng có priority cao hơn
   * - Dùng khi recommend hoặc hiển thị
   */
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },

  /**
   * aliases: Các biến thể khác của keyword
   * - Lưu thêm các cách viết khác
   * - Không cần tạo nhiều document
   */
  aliases: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  /**
   * description: Mô tả ý nghĩa của tag
   * - Hiển thị cho người dùng khi chọn tag
   */
  description: {
    type: String,
    trim: true,
    default: ''
  },

  /**
   * isActive: Tag có đang được sử dụng không
   * - Cho phép disable tag mà không cần xóa
   */
  isActive: {
    type: Boolean,
    default: true
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'tag_dictionary'
});

/**
 * Index cho aliases để tìm kiếm nhanh
 */
TagDictionarySchema.index({ aliases: 1 });

/**
 * Compound index cho category và priority
 * - Hữu ích khi lấy tags theo category, sắp xếp theo priority
 */
TagDictionarySchema.index({ category: 1, priority: -1 });

/**
 * Pre-save middleware
 * - Cập nhật updatedAt
 * - Đảm bảo keyword đã lowercase
 */
TagDictionarySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Đảm bảo keyword lowercase
  if (this.keyword) {
    this.keyword = this.keyword.toLowerCase();
  }
  
  // Đảm bảo aliases cũng lowercase
  if (this.aliases && this.aliases.length > 0) {
    this.aliases = this.aliases.map(a => a.toLowerCase());
  }
  
  next();
});

/**
 * Static: Lấy toàn bộ dictionary dưới dạng Map
 * - Key: keyword (và aliases)
 * - Value: standardTag
 * - Dùng cho cache và lookup nhanh
 */
TagDictionarySchema.statics.getDictionaryMap = async function() {
  const entries = await this.find({ isActive: true }).lean();
  const map = new Map();
  
  entries.forEach(entry => {
    // Map keyword chính
    map.set(entry.keyword, entry.standardTag);
    
    // Map các aliases
    if (entry.aliases && entry.aliases.length > 0) {
      entry.aliases.forEach(alias => {
        map.set(alias, entry.standardTag);
      });
    }
  });
  
  return map;
};

/**
 * Bảng chuyển đổi ký tự có dấu tiếng Việt sang không dấu
 */
const VIETNAMESE_MAP = {
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
  'đ': 'd'
};

function removeVietnameseTones(str) {
  if (!str) return '';
  return str.split('').map(char => VIETNAMESE_MAP[char] || char).join('');
}

/**
 * Static: Lấy dictionary dưới dạng Object
 * - Dễ serialize cho cache
 * - Cả keyword và aliases đều được normalize (bỏ dấu)
 */
TagDictionarySchema.statics.getDictionaryObject = async function() {
  const entries = await this.find({ isActive: true }).lean();
  const dict = {};
  
  entries.forEach(entry => {
    // Keyword đã được normalize khi lưu
    dict[entry.keyword] = entry.standardTag;
    
    if (entry.aliases && entry.aliases.length > 0) {
      entry.aliases.forEach(alias => {
        // Lưu cả alias gốc và alias đã bỏ dấu
        dict[alias] = entry.standardTag;
        const normalizedAlias = removeVietnameseTones(alias);
        if (normalizedAlias !== alias) {
          dict[normalizedAlias] = entry.standardTag;
        }
      });
    }
  });
  
  return dict;
};

/**
 * Static: Lấy danh sách tất cả standardTags unique
 * - Dùng để hiển thị filter UI
 */
TagDictionarySchema.statics.getAllStandardTags = async function() {
  const result = await this.aggregate([
    { $match: { isActive: true } },
    { $group: { 
      _id: '$standardTag',
      category: { $first: '$category' },
      priority: { $max: '$priority' }
    }},
    { $sort: { priority: -1, _id: 1 } },
    { $project: {
      _id: 0,
      tag: '$_id',
      category: 1,
      priority: 1
    }}
  ]);
  
  return result;
};

/**
 * Static: Thêm nhiều entries cùng lúc
 * - Dùng để seed data hoặc import
 */
TagDictionarySchema.statics.bulkAddEntries = async function(entries) {
  const operations = entries.map(entry => ({
    updateOne: {
      filter: { keyword: entry.keyword.toLowerCase() },
      update: { $set: entry },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

/**
 * Static: Tìm standardTag cho 1 keyword
 * @param {string} keyword - Từ khóa cần tìm (đã normalize)
 * @returns {string|null} - StandardTag hoặc null nếu không tìm thấy
 */
TagDictionarySchema.statics.findStandardTag = async function(keyword) {
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  // Tìm theo keyword chính
  let entry = await this.findOne({ 
    keyword: normalizedKeyword,
    isActive: true 
  }).lean();
  
  if (entry) return entry.standardTag;
  
  // Tìm trong aliases
  entry = await this.findOne({
    aliases: normalizedKeyword,
    isActive: true
  }).lean();
  
  return entry ? entry.standardTag : null;
};

module.exports = mongoose.model('TagDictionary', TagDictionarySchema);
