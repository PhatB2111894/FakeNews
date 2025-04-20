// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News', // Tham chiếu đến model News của bạn
    required: [true, 'News ID is required'],
    index: true // Index để truy vấn nhanh hơn
  },
  reporterUserId: { // Lưu userId dạng string như trong News và User
    type: String,
    required: [true, 'Reporter User ID is required'],
    index: true
  },
  systemPrediction: {
    type: String,
    enum: ['Real', 'Fake'],
    required: [true, 'System prediction is required']
  },
  userCorrection: {
    type: String,
    enum: ['Real', 'Fake'],
    required: [true, 'User correction is required']
  },
  sourceUrl: {
    type: String,
    required: [true, 'Source URL is required'],
    trim: true
    // Optional: Thêm validation phức tạp hơn cho URL nếu cần
  },
  comments: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified_correct', 'verified_incorrect', 'rejected'],
    default: 'pending',
    index: true // Index để admin lọc theo status
  },
  verifiedAt: {
    type: Date
  },
  verifierUserId: { // Có thể là ID của admin
    type: String // Hoặc ObjectId nếu admin có collection riêng
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tránh tạo report trùng lặp hoàn toàn bởi cùng một người cho cùng một bài báo? (Tùy chọn)
// reportSchema.index({ newsId: 1, reporterUserId: 1 }, { unique: true }); // Cân nhắc kỹ lưỡng nếu áp dụng

module.exports = mongoose.model('Report', reportSchema);