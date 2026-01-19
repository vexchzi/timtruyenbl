/**
 * TagReport Schema - Lưu trữ báo cáo tag sai từ người dùng
 * 
 * Mục đích:
 * - Cho phép người dùng report truyện bị gắn sai tag (không cần đăng nhập)
 * - Admin có thể xem và xử lý các báo cáo này
 */

const mongoose = require('mongoose');

const TagReportSchema = new mongoose.Schema({
  // Reference tới truyện bị báo cáo
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Novel',
    required: [true, 'Novel ID là bắt buộc'],
    index: true
  },

  // Loại báo cáo
  reportType: {
    type: String,
    enum: ['wrong_tag', 'missing_tag', 'other'],
    default: 'wrong_tag'
  },

  // Tags mà người dùng cho là sai (nếu có)
  wrongTags: [{
    type: String,
    trim: true
  }],

  // Tags mà người dùng đề xuất thêm (nếu có)
  suggestedTags: [{
    type: String,
    trim: true
  }],

  // Lý do/Mô tả từ người dùng
  reason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Lý do không được vượt quá 1000 ký tự']
  },

  // Trạng thái xử lý
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'rejected'],
    default: 'pending',
    index: true
  },

  // Ghi chú từ admin khi xử lý
  adminNote: {
    type: String,
    trim: true
  },

  // IP của người report (để chống spam cơ bản)
  reporterIp: {
    type: String,
    trim: true
  },

  // Thời gian tạo báo cáo
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Thời gian xử lý
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'tag_reports'
});

// Index compound cho query phổ biến
TagReportSchema.index({ status: 1, createdAt: -1 });
TagReportSchema.index({ novelId: 1, status: 1 });

/**
 * Static method: Đếm số report theo trạng thái
 */
TagReportSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    pending: 0,
    reviewed: 0,
    resolved: 0,
    rejected: 0,
    total: 0
  };

  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  return result;
};

/**
 * Static method: Lấy danh sách reports với populate novel info
 */
TagReportSchema.statics.getReportsWithNovel = async function(options = {}) {
  const { status, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  const [reports, total] = await Promise.all([
    this.find(query)
      .populate('novelId', 'title author originalLink standardTags rawTags coverImage source')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model('TagReport', TagReportSchema);
