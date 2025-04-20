// routes/newsRoutes.js (Phiên bản đơn giản - không có status)

const express = require('express');
const router = express.Router();
const News = require('../models/News'); // Đảm bảo đường dẫn đúng
const Report = require('../models/Report'); 
const axios = require("axios");
const mongoose = require('mongoose');

// Import middleware (vẫn cần để bảo vệ)
const { isAdmin, isAuthenticated } = require('../middlewares/authMiddleware'); // Đảm bảo đường dẫn đúng

// --- ROUTE ĐỊNH NGHĨA ---

/**
 * @route   POST /api/news/save
 * @desc    Lưu tin tức mới sau khi người dùng phân loại (KHÔNG CÓ STATUS)
 * @access  Private (isAuthenticated)
 */
router.post("/save", isAuthenticated, async (req, res) => {
    const { title, content, category, result: resultDataFromRequest } = req.body;
    const userIdFromToken = req.user?.userId || req.user?._id.toString(); // Lấy từ middleware

    if (!userIdFromToken) return res.status(401).json({ error: "Authentication error: User ID not found." });
    if (!title || !content) return res.status(400).json({ error: "Error: Title and content cannot be empty." });
    if (!resultDataFromRequest || typeof resultDataFromRequest.fake_probability === 'undefined' || typeof resultDataFromRequest.real_probability === 'undefined') {
        return res.status(400).json({ error: "Error: Missing valid classification results object." });
    }

    try {
        const predicted_label = resultDataFromRequest.fake_probability > 50 ? "Fake" : "Real";
        const newsData = {
            title: title.trim(),
            content: content.trim(),
            category: category ? category.trim() : 'Uncategorized',
            fake_probability: resultDataFromRequest.fake_probability,
            real_probability: resultDataFromRequest.real_probability,
            predicted_label: predicted_label,
            top_fake_words: Array.isArray(resultDataFromRequest.top_fake_words) ? resultDataFromRequest.top_fake_words : [],
            detected_language: resultDataFromRequest.detected_language || 'unknown',
            userId: userIdFromToken,
        };

        const news = new News(newsData);
        await news.save();
        res.status(201).json({ message: "News article saved successfully!" });

    } catch (error) {
        console.error("Lỗi khi lưu tin tức:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation error.", details: messages });
        }
        res.status(500).json({ error: "System error while trying to save news article." });
    }
});

/**
 * @route   GET /api/news/admin/list
 * @desc    Lấy danh sách tin tức cho Admin (hỗ trợ tìm kiếm, phân trang - KHÔNG LỌC STATUS)
 * @access  Private (isAdmin)
 */
router.get('/admin/list', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const query = {};
        if (search) {
            // Tìm kiếm theo title hoặc content (vì schema không có source)
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } } // Hoặc chỉ tìm theo title
            ];
        }

        const skip = (page - 1) * limit;
        const totalNews = await News.countDocuments(query);
        const totalPages = Math.ceil(totalNews / limit);

        // Lấy danh sách news, dùng .lean() để trả về plain JS objects cho dễ sửa
        const newsArticles = await News.find(query)
                                   .sort({ createdAt: -1 })
                                   .skip(skip)
                                   .limit(limit)
                                   .lean(); // <--- Thêm .lean()

        // --- Bổ sung logic lấy Report Status ---
        // Tạo một mảng các promises để truy vấn trạng thái report song song
        const newsWithStatusPromises = newsArticles.map(async (news) => {
            // Tìm xem có report nào đang 'pending' cho news này không
            const pendingReport = await Report.findOne({ newsId: news._id, status: 'pending' }).select('_id').lean(); // Chỉ cần check tồn tại

            if (pendingReport) {
                // Nếu có pending, gán trạng thái là 'pending'
                news.reportStatus = 'pending';
            } else {
                // Nếu không có pending, kiểm tra xem có report nào khác không (đã xử lý hoặc bị từ chối)
                const processedReportExists = await Report.exists({ newsId: news._id }); // Kiểm tra tồn tại bất kỳ report nào
                if (processedReportExists) {
                     // Nếu có report nhưng không phải pending -> đã xử lý (hoặc bị từ chối)
                     // Bạn có thể thêm logic phức tạp hơn để lấy status cụ thể nếu muốn (vd: verified_correct)
                     news.reportStatus = 'processed'; // Trạng thái chung là đã xử lý
                } else {
                     // Nếu không có report nào cả
                     news.reportStatus = 'no_report';
                }
            }
            return news; // Trả về object news đã được thêm reportStatus
        });

        // Chờ tất cả các promise truy vấn report hoàn thành
        const newsWithStatus = await Promise.all(newsWithStatusPromises);
        // -------------------------------------

        res.json({ news: newsWithStatus, totalPages, currentPage: page, totalNews });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách tin tức cho admin:", error);
        res.status(500).json({ error: "Server error fetching admin news list." });
    }
});

/**
 * @route   GET /api/news/:id
 * @desc    Lấy chi tiết một tin tức theo ID (_id)
 * @access  Private (isAuthenticated)
 */
router.get("/:id", isAuthenticated, async (req, res) => {
    try {
        const newsId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(newsId)) return res.status(400).json({ error: "Invalid news article ID format." });
        const news = await News.findById(newsId);
        if (!news) return res.status(404).json({ error: "News article not found." });
        res.json(news);
    } catch (error) {
        console.error(`Lỗi khi lấy tin tức ID ${req.params.id}:`, error);
        res.status(500).json({ error: "Server error fetching news details." });
    }
});

/**
 * @route   PUT /api/news/:id
 * @desc    Cập nhật thông tin một tin tức (Admin)
 * @access  Private (isAdmin)
 */
router.put("/:id", isAdmin, async (req, res) => {
    try {
        const newsId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(newsId)) return res.status(400).json({ error: "Invalid news article ID format." });

        // Loại bỏ các trường không nên cho phép cập nhật trực tiếp
        const { userId, createdAt, __v, _id, ...updateData } = req.body;

        const updatedNews = await News.findByIdAndUpdate(newsId, updateData, { new: true, runValidators: true });
        if (!updatedNews) return res.status(404).json({ error: "News article not found for update." });
        res.json(updatedNews);
    } catch (error) {
        console.error(`Lỗi khi cập nhật tin tức ID ${req.params.id}:`, error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation error during update.", details: messages });
        }
        res.status(500).json({ error: "Server error updating news article." });
    }
});

/**
 * @route   GET /api/news/history/:userId
 * @desc    Lấy lịch sử tin tức đã phân loại của một user cụ thể
 * @access  Private (isAuthenticated - User chỉ lấy được của mình, Admin có thể lấy của người khác - tùy logic)
 */
router.get('/history/:userId', isAuthenticated, async (req, res) => {
    try {
        const userIdToFetch = req.params.userId;
        const loggedInUserId = req.user.userId; 
        const loggedInUserRole = req.user.role;

        if (userIdToFetch !== loggedInUserId && loggedInUserRole !== 'admin') {
            return res.status(403).json({ success: false, error: "Forbidden: You can only view your own history." });
        }

        // Tìm tin tức theo userId, sắp xếp và lấy hết các trường
        const newsHistory = await News.find({ userId: userIdToFetch })
                                      .sort({ createdAt: -1 }) 
                                      // KHÔNG còn dòng .select() ở đây nữa
                                      .lean(); 

        res.json(newsHistory); // Trả về mảng tin tức với đầy đủ các trường

    } catch (error) {
        console.error(`Error fetching history for userId ${req.params.userId}:`, error);
        res.status(500).json({ success: false, error: "Server error fetching history." });
    }
});


/**
 * @route   DELETE /api/news/:id
 * @desc    Xóa một tin tức (Chủ sở hữu hoặc Admin)
 * @access  Private (isAuthenticated) // <<< THAY ĐỔI: Dùng isAuthenticated thay vì isAdmin
 */
router.delete("/:id", isAuthenticated, async (req, res) => { // <<< THAY ĐỔI Middleware
    try {
        const newsId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(newsId)) {
             return res.status(400).json({ success: false, error: "Invalid news article ID format." });
        }

        const newsToDelete = await News.findById(newsId);

        if (!newsToDelete) {
             return res.status(404).json({ success: false, error: "News article not found." });
        }

        // --- Kiểm tra quyền xóa ---
        const loggedInUserId = req.user.userId; // Lấy userId từ token
        const loggedInUserRole = req.user.role; // Lấy role từ token
        const ownerId = newsToDelete.userId;    // Lấy userId của người tạo tin tức

        if (loggedInUserId !== ownerId && loggedInUserRole !== 'admin') {
            // Không phải chủ sở hữu VÀ cũng không phải admin -> Từ chối
            return res.status(403).json({ success: false, error: "Forbidden: You do not have permission to delete this news article." });
        }
        // --- Kết thúc kiểm tra quyền xóa ---

        // Nếu có quyền, tiến hành xóa
        // Optional: Xóa các report liên quan trước nếu cần
        // await Report.deleteMany({ newsId: newsId });

        await News.findByIdAndDelete(newsId);

        res.status(200).json({ success: true, message: "News article deleted successfully." });

    } catch (error) {
        console.error(`Lỗi khi xóa tin tức ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: "Server error deleting news article." });
    }
});


/**
 * @route   POST /api/news/classify (Giữ nguyên)
 * @desc    Proxy request phân loại đến Flask API
 * @access  Public
 */
router.post('/classify', async (req, res) => {
   const { text, explain } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Error: Text content cannot be empty.' });
    try {
        const flaskApiUrl = process.env.FLASK_API_URL || 'http://127.0.0.1:5001/classify';
        const response = await axios.post(flaskApiUrl, { text, explain });
        res.json(response.data);
    } catch (error) {
        const flaskError = error.response?.data?.error || error.message || 'Unknown error';
        const flaskStatus = error.response?.status || 503;
        console.error(`❌ Lỗi khi gọi Flask API:`, flaskError);
        res.status(flaskStatus).json({ error: 'Error from classification API.', details: error.response?.data });
    }
});

/**
 * @route   GET /api/news/admin/suggestions
 * @desc    Lấy gợi ý tiêu đề tin tức cho Admin search
 * @access  Private (isAdmin)
 * @query   query - Chuỗi tìm kiếm tiêu đề
 * @query   limit - Số lượng gợi ý tối đa (mặc định 5)
 */
router.get('/admin/suggestions', isAdmin, async (req, res) => {
    try {
      const query = (req.query.query || '').trim(); // Lấy chuỗi tìm kiếm và loại bỏ khoảng trắng thừa
      const limit = parseInt(req.query.limit, 10) || 5; // Lấy giới hạn, mặc định là 5
  
      // Chỉ tìm kiếm nếu query có ít nhất 1 ký tự (hoặc bạn có thể đặt > 1)
      if (query.length < 1) {
        return res.json({ success: true, data: [] }); // Trả về mảng rỗng nếu query quá ngắn
      }
  
      // Tạo điều kiện tìm kiếm MongoDB: tìm title chứa query (không phân biệt hoa thường)
      const mongoQuery = {
        title: { $regex: query, $options: 'i' }
      };
  
      // Thực hiện tìm kiếm, chỉ lấy _id và title, giới hạn số lượng, sắp xếp (tùy chọn)
      const suggestions = await News.find(mongoQuery)
                                    .limit(limit)
                                    .select('_id title') // Chỉ chọn các trường cần thiết cho gợi ý
                                    .sort({ createdAt: -1 }) // Sắp xếp theo mới nhất hoặc theo relevance nếu dùng $text search
                                    .lean(); // Sử dụng .lean() để tăng tốc độ
  
      // Trả về kết quả thành công với danh sách gợi ý
      res.json({ success: true, data: suggestions });
  
    } catch (error) {
      // Ghi lại lỗi và trả về lỗi server
      console.error('Lỗi khi lấy gợi ý tin tức:', error);
      res.status(500).json({ success: false, error: 'Server error fetching news suggestions.' });
    }
  });
module.exports = router;