// routes/reportRoutes.js
const express = require('express');
const Report = require('../models/Report');
const News = require('../models/News');
const mongoose = require('mongoose');
const { isAdmin, isAuthenticated } = require('../middlewares/authMiddleware');
const router = express.Router();

// POST /api/reports/submit
// Toàn bộ logic xử lý được đặt trực tiếp vào hàm async (req, res) => { ... }
router.post('/submit', isAuthenticated, async (req, res) => {
    console.log('>>>>>> BODY YÊU CẦU NHẬN ĐƯỢC:', JSON.stringify(req.body, null, 2));
    // Lấy dữ liệu từ body request
    const {
        newsId,
        reporterUserId, // ID người báo cáo
        systemPrediction,
        userCorrection,
        sourceUrl,
        comments
    } = req.body;

    // --- Validation cơ bản ---
    if (!newsId || !reporterUserId || !systemPrediction || !userCorrection || !sourceUrl) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // QUAN TRỌNG: Kiểm tra xem reporterUserId trong body có khớp với ID người dùng đã đăng nhập không
    // Middleware 'protect' của bạn cần phải lấy được ID user và gắn vào đâu đó trong `req`, ví dụ `req.user.id` hoặc `req.user.userId`
    // Thay `req.user.userId` bằng đúng cách bạn lấy ID user từ middleware
    if (req.user && req.user.userId && req.user.userId !== reporterUserId) {
         console.warn(`Security Alert: User ${req.user.userId} attempted report submission claiming to be ${reporterUserId}`);
         // Không cho phép nếu ID không khớp -> tránh giả mạo người báo cáo
         return res.status(403).json({ success: false, error: 'Forbidden: User ID mismatch' });
    }
    // Nếu bạn không dùng middleware `protect` hoặc nó không cung cấp `userId`, bạn cần một cơ chế khác
    // hoặc chấp nhận rủi ro (không khuyến khích).


    // Tùy chọn: Kiểm tra định dạng URL cơ bản phía backend
    try {
        new URL(sourceUrl);
    } catch (_) {
         return res.status(400).json({ success: false, error: 'Invalid source URL format' });
    }


    try {
        // 1. Kiểm tra xem bài báo (newsId) có thực sự tồn tại không
        const newsExists = await News.findById(newsId);
        if (!newsExists) {
            // Nếu không tìm thấy bài báo, trả lỗi 404
            return res.status(404).json({ success: false, error: 'News article not found' });
        }

        // 3. Tạo một bản ghi Report mới với dữ liệu nhận được
        const newReport = new Report({
            newsId,
            reporterUserId,
            systemPrediction,
            userCorrection,
            sourceUrl,
            comments,
            status: 'pending' // Trạng thái ban đầu là chờ duyệt
        });

        // 4. Lưu bản ghi Report vào database
        await newReport.save();

        // 5. Trả về thông báo thành công cho client
        res.status(201).json({ success: true, message: 'Report submitted successfully' });

    } catch (error) {
        // Xử lý lỗi chung hoặc lỗi từ Mongoose
        console.error('Error submitting report:', error);
        // Nếu là lỗi validation của Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        }
        // Lỗi server chung
        res.status(500).json({ success: false, error: 'Server error while submitting report' });
    }
});

/**
* @route   GET /api/reports/admin/pending/:newsId
* @desc    Admin lấy danh sách report đang chờ xử lý cho một news ID cụ thể
* @access  Private (Chỉ Admin)
*/
router.get('/admin/pending/:newsId', isAdmin, async (req, res) => {
   const { newsId } = req.params; // Lấy newsId từ đường dẫn URL

   // --- Bước 1: Validate newsId ---
   if (!mongoose.Types.ObjectId.isValid(newsId)) {
       return res.status(400).json({ success: false, error: 'Invalid News ID format.' });
   }

   try {
       console.log(`Admin request: Fetching pending reports for newsId: ${newsId}`);

       // --- Bước 2: Tìm các reports khớp điều kiện ---
       // Tìm tất cả reports có newsId khớp và status là 'pending'
       // Lấy thêm thông tin người báo cáo và tiêu đề tin tức để hiển thị cho admin
       const pendingReports = await Report.find({ newsId: newsId, status: 'pending' })
                                      .populate('reporterUserId', 'username email') // Lấy username, email từ model User liên kết qua reporterUserId
                                      .populate('newsId', 'title') // Lấy title từ model News liên kết qua newsId
                                      .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất trước (tùy chọn)
                                      .lean(); // Trả về plain object để dễ xử lý nếu cần

       // --- Bước 3: Trả về kết quả ---
       // Nếu không có báo cáo nào đang chờ (kết quả là mảng rỗng), vẫn trả về 200 OK
       if (!pendingReports) { // Kiểm tra chặt chẽ hơn nếu find trả về null (dù hiếm)
            console.log(`Query returned null for pending reports for newsId: ${newsId}`);
            return res.status(200).json({ success: true, data: [] });
       }

       console.log(`Found ${pendingReports.length} pending reports for newsId: ${newsId}`);
       // Trả về danh sách các report đang chờ (có thể là mảng rỗng)
       res.status(200).json({ success: true, data: pendingReports });

   } catch (error) {
       // --- Bước 4: Xử lý lỗi ---
       console.error(`Error fetching pending reports for newsId ${newsId}:`, error);
       res.status(500).json({ success: false, error: 'Server error fetching pending reports.' });
   }
});

/**
 * @route   PUT /api/reports/admin/status/:reportId
 * @desc    Admin cập nhật trạng thái cho một report cụ thể
 * @access  Private (Chỉ Admin)
 */
router.put('/admin/status/:reportId', isAdmin, async (req, res) => {
    const { reportId } = req.params;     // Lấy reportId từ URL
    const { status: newStatus } = req.body; // Lấy status mới từ body của request PUT

    // --- Bước 1: Validate dữ liệu đầu vào ---
    // Kiểm tra định dạng reportId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return res.status(400).json({ success: false, error: 'Invalid Report ID format.' });
    }

    // Kiểm tra xem status mới có nằm trong danh sách các status hợp lệ không
    const allowedStatuses = ['verified_correct', 'verified_incorrect', 'rejected'];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
         return res.status(400).json({
             success: false,
             error: `Invalid status value provided. Status must be one of: ${allowedStatuses.join(', ')}`
         });
    }

    // Lấy ID của admin đang thực hiện thao tác (middleware 'isAdmin' phải đảm bảo req.user tồn tại)
    // Key có thể là req.user.id, req.user.userId, req.user._id tùy cách bạn thiết lập middleware
    const verifierUserId = req.user?.userId || req.user?._id?.toString() || 'unknown_admin';
    console.log(`Admin (${verifierUserId}) attempting to update report ${reportId} to status: ${newStatus}`);

    try {
        // --- Bước 2: Tìm và Cập nhật Report trong Database ---
        const updatedReport = await Report.findByIdAndUpdate(
            reportId, // ID của report cần cập nhật
            {
                // Các trường cần cập nhật
                status: newStatus,          // Trạng thái mới
                verifiedAt: new Date(),     // Thời gian admin xác minh
                verifierUserId: verifierUserId // ID của admin đã xác minh
            },
            {
                new: true, // Option để trả về document đã được cập nhật
                runValidators: true // Option để chạy các validator trong Schema (nếu có)
            }
        ).lean(); // Dùng lean nếu chỉ cần object thường

        // --- Bước 3: Kiểm tra kết quả cập nhật và trả về response ---
        if (!updatedReport) {
            // Nếu không tìm thấy report với ID cung cấp
             return res.status(404).json({ success: false, error: 'Report not found with the provided ID.' });
        }

        // Ghi log thành công
        console.log(`Successfully updated Report ${reportId} status to ${newStatus} by admin ${verifierUserId}`);
        // Trả về thông báo thành công và dữ liệu report đã cập nhật
        res.status(200).json({
            success: true,
            message: 'Report status updated successfully.',
            data: updatedReport // Trả về report đã cập nhật
        });

    } catch (error) {
        // --- Bước 4: Xử lý lỗi ---
        console.error(`Error updating status for reportId ${reportId}:`, error);
         // Xử lý lỗi validation từ Mongoose (nếu có validator trong schema Report)
         if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ success: false, error: "Validation error during update.", details: messages });
         }
         // Lỗi server chung
        res.status(500).json({ success: false, error: 'Server error while updating report status.' });
    }
});

/**
 * @route   GET /api/reports/admin/for-news/:newsId
 * @desc    Admin lấy report mới nhất cho một newsId (bất kể status)
 * @access  Private (Chỉ Admin)
 */
router.get('/admin/for-news/:newsId', isAdmin, async (req, res) => { // Sử dụng middleware isAdmin tương tự các route admin khác
    try {
        const newsId = req.params.newsId;

        // Validate newsId (có thể copy từ route pending)
        if (!mongoose.Types.ObjectId.isValid(newsId)) {
           return res.status(400).json({ success: false, error: 'Invalid News ID format.' });
        }

        console.log(`Admin request: Fetching latest report (any status) for newsId: ${newsId}`);

        // Tìm report mới nhất cho newsId này, không quan tâm status
        // Sắp xếp theo createdAt giảm dần (-1) để lấy cái mới nhất
        const report = await Report.findOne({ newsId: newsId })
                                    .sort({ createdAt: -1 }) // Lấy report mới nhất
                                    .populate('reporterUserId', 'username email') // Populate thông tin người report
                                    .populate('newsId', 'title'); // Populate tiêu đề tin tức (nếu cần)
                                    // .lean(); // Có thể thêm .lean() nếu chỉ cần plain object

        if (!report) {
            // Nếu không tìm thấy report nào cho newsId này
            console.log(`No report found for newsId: ${newsId}`);
            // Trả về 404 để frontend biết là không có report
            return res.status(404).json({ success: false, error: 'No report found for this news article.' });
            // Hoặc trả về 200 với data null nếu muốn frontend xử lý khác:
            // return res.status(200).json({ success: true, data: null });
        }

        // Trả về report tìm được (là report mới nhất)
        console.log(`Found latest report (ID: ${report._id}, Status: ${report.status}) for newsId: ${newsId}`);
        res.status(200).json({ success: true, data: report }); // Trả về object report

    } catch (error) {
        console.error(`Error fetching latest report for newsId ${newsId}:`, error);
        res.status(500).json({ success: false, error: 'Server error fetching report details.' });
    }
});

module.exports = router; // Export router để sử dụng trong file server chính