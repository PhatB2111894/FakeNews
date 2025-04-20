const express = require('express');
const bcrypt = require('bcrypt');
const multer = require("multer");
const path = require("path");
const { User } = require('../models/User');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
// Cấu hình multer để lưu ảnh vào thư mục uploads/avatars
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/avatars/");
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.params.userId}${ext}`); // Lưu file theo userId
    },
  });
  
  const upload = multer({ storage });
  
  router.post("/upload/avatar/:userId", upload.single("avatar"), async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("📌 Nhận userId:", userId);
        
        const user = await User.findOne({ userId }); // 🔥 Sử dụng findOne thay vì findById
        if (!user) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng chọn ảnh!" });
        }

        user.avatar = req.file.filename;
        await user.save();

        res.json({ message: "Upload thành công!", avatar: req.file.filename });
    } catch (error) {
        console.error("❌ Lỗi khi upload avatar:", error);
        res.status(500).json({ message: "Lỗi khi upload avatar" });
    }
  });
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, username, password, gender, role } = req.body;

        // Kiểm tra email hoặc username đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email đã được sử dụng!" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = new User({
            fullName,
            email,
            phone,
            username,
            password: hashedPassword,
            gender,
            role: role || "user"  // Mặc định là user nếu không có role
        });

        // Lưu vào database
        await newUser.save();
        res.status(201).json({ message: "Đăng ký thành công!", userId: newUser.userId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
  try {
      // Dù frontend gửi lên là 'username', nhưng giờ nó có thể chứa username hoặc email
      const { username: loginIdentifier, password } = req.body;

      // Kiểm tra input cơ bản
      if (!loginIdentifier || !password) {
           return res.status(400).json({ error: "Vui lòng nhập tên đăng nhập/email và mật khẩu!" });
      }

      // --- THAY ĐỔI QUAN TRỌNG Ở ĐÂY ---
      // Tìm user bằng username HOẶC email
      // Dùng regex với option 'i' để tìm email không phân biệt chữ hoa/thường
      const user = await User.findOne({
          $or: [
              { username: loginIdentifier },
              { email: { $regex: new RegExp(`^${loginIdentifier}$`, 'i') } }
          ]
      });
      // --- KẾT THÚC THAY ĐỔI ---

      // Nếu không tìm thấy user bằng cả username hoặc email
      if (!user) {
          // Trả về lỗi chung chung để tăng bảo mật (không tiết lộ email/username có tồn tại hay không)
          return res.status(400).json({ error: "Tên đăng nhập/email hoặc mật khẩu không đúng!" });
      }

      // Kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
           // Trả về lỗi chung chung
          return res.status(400).json({ error: "Tên đăng nhập/email hoặc mật khẩu không đúng!" });
      }

      // --- Code tạo token và trả về response (Giữ nguyên như cũ) ---
      const payload = {
          _id: user._id,
          userId: user.userId, // Hoặc/và userId tùy chỉnh
          role: user.role
      };
      const token = jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '7d' } // Token hết hạn sau 7 ngày
      );
      // --- Kết thúc tạo token ---

      console.log(`✅ User logged in via ${user.username === loginIdentifier ? 'username' : 'email'}:`, user.username);

      // Trả về thông tin user và token
      res.json({
          message: "Đăng nhập thành công!",
          userId: user.userId || user._id.toString(),
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          avatar: user.avatar || null,
          role: user.role,
          token: token // <<< TRẢ TOKEN VỀ
      });

  } catch (error) {
      console.error("Lỗi API Login:", error);
      res.status(500).json({ error: "Lỗi máy chủ khi đăng nhập!" });
  }
});

router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId }).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User không tồn tại" });
        }
        res.json(user);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
        res.status(500).json({ error: "Lỗi máy chủ" });
    }
});

router.put("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { fullName, phone, gender } = req.body;
  
      console.log("UserID:", userId);
      console.log("Dữ liệu nhận được:", req.body);
  
      // Kiểm tra user có tồn tại không
      const user = await User.findOne({ userId: userId });
      if (!user) {
        return res.status(404).json({ message: "User không tồn tại" });
      }
  
      // Cập nhật thông tin user
      user.fullName = fullName || user.fullName;
      user.phone = phone || user.phone;
      user.gender = gender || user.gender;
  
      await user.save();
  
      res.json({ message: "Cập nhật thành công", user });
    } catch (error) {
      console.error("Lỗi cập nhật user:", error);
      res.status(500).json({ message: "Lỗi server khi cập nhật user" });
    }
  });
  
  router.put("/change-password/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { oldPassword, newPassword } = req.body;
  
      // Tìm user theo userId
      const user = await User.findOne({ userId: userId });
      if (!user) {
        return res.status(404).json({ message: "User không tồn tại" });
      }
  
      // Kiểm tra mật khẩu cũ
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
      }
  
      // Mã hóa mật khẩu mới và cập nhật
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
  
      res.json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      res.status(500).json({ message: "Lỗi server khi đổi mật khẩu" });
    }
  });
  /**
 * @route   GET /api/users/admin/list
 * @desc    Admin lấy danh sách người dùng (hỗ trợ phân trang, tìm kiếm)
 * @access  Private (Admin only)
 */
router.get('/admin/list', isAuthenticated, isAdmin, async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; // Mặc định 10 user/trang
      const searchTerm = req.query.search || '';
      const skip = (page - 1) * limit;

      // Tạo query tìm kiếm (không phân biệt hoa thường)
      let query = {};
      if (searchTerm) {
          const regex = new RegExp(searchTerm, 'i');
          query = {
              $or: [
                  { username: regex },
                  { email: regex },
                  { fullName: regex } // Tìm theo cả tên đầy đủ nếu muốn
              ]
          };
      }

      // Lấy tổng số user khớp điều kiện (để tính totalPages)
      const totalUsers = await User.countDocuments(query);
      const totalPages = Math.ceil(totalUsers / limit);

      // Lấy danh sách user cho trang hiện tại, bỏ qua mật khẩu
      const users = await User.find(query)
          .select('-password') // Loại bỏ trường password khỏi kết quả
          .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất
          .skip(skip)
          .limit(limit);

      res.json({
          success: true,
          users,
          currentPage: page,
          totalPages,
          totalUsers
      });

  } catch (error) {
      console.error("Admin Fetch Users Error:", error);
      res.status(500).json({ success: false, error: "Server error fetching users." });
  }
});

/**
* @route   POST /api/users/admin/add
* @desc    Admin thêm người dùng mới
* @access  Private (Admin only)
*/
router.post('/admin/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
      const { fullName, email, phone, username, password, gender, role } = req.body;

      // --- Validation cơ bản ---
      if (!username || !email || !password) {
          return res.status(400).json({ success: false, error: "Username, email, and password are required." });
      }
      const validRoles = ['user', 'admin']; // Các role hợp lệ
      if (role && !validRoles.includes(role)) {
           return res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      }

      // Kiểm tra email hoặc username đã tồn tại chưa
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
          return res.status(400).json({ success: false, error: "Email or Username already exists." });
      }

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo user mới
      const newUser = new User({
          fullName,
          email,
          phone,
          username,
          password: hashedPassword,
          gender,
          role: role || "user" // Mặc định là 'user' nếu admin không chỉ định
      });

      // Lưu vào database
      const savedUser = await newUser.save();

      // Trả về thông tin user mới (không có password)
      const userResponse = savedUser.toObject();
      delete userResponse.password;

      res.status(201).json({ success: true, message: "User created successfully.", user: userResponse });

  } catch (error) {
      console.error("Admin Add User Error:", error);
      if (error.name === 'ValidationError') {
          return res.status(400).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: "Server error creating user." });
  }
});

/**
* @route   PUT /api/users/admin/update/:userId
* @desc    Admin cập nhật thông tin người dùng (username, email, role, etc.)
* @access  Private (Admin only)
*/
router.put('/admin/update/:userId', isAuthenticated, isAdmin, async (req, res) => {
  try {
      const userIdToUpdate = req.params.userId; // Đây là _id của MongoDB hay userId tùy chỉnh? Giả sử là _id
      const { username, email, role, fullName, phone, gender } = req.body;

      // Validate ObjectId nếu dùng _id
       if (!mongoose.Types.ObjectId.isValid(userIdToUpdate)) {
          return res.status(400).json({ success: false, error: 'Invalid User ID format.' });
      }

      // Validate role nếu được cung cấp
      const validRoles = ['user', 'admin'];
      if (role && !validRoles.includes(role)) {
           return res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      }

      // Tìm user cần update
      const user = await User.findById(userIdToUpdate);
      if (!user) {
          return res.status(404).json({ success: false, error: "User not found." });
      }

      // Kiểm tra nếu username/email mới đã tồn tại ở user khác chưa?
      if (username && username !== user.username) {
          const existingUsername = await User.findOne({ username, _id: { $ne: userIdToUpdate } });
          if (existingUsername) return res.status(400).json({ success: false, error: 'Username already taken by another user.' });
          user.username = username;
      }
      if (email && email !== user.email) {
          const existingEmail = await User.findOne({ email, _id: { $ne: userIdToUpdate } });
          if (existingEmail) return res.status(400).json({ success: false, error: 'Email already used by another user.' });
          user.email = email;
      }

      // Cập nhật các trường khác nếu có trong request body
      if (role) user.role = role;
      if (fullName) user.fullName = fullName;
      if (phone) user.phone = phone;
      if (gender) user.gender = gender;

      // Lưu thay đổi
      const updatedUser = await user.save();

      // Trả về thông tin user đã cập nhật (không có password)
      const userResponse = updatedUser.toObject();
      delete userResponse.password;

      res.json({ success: true, message: "User updated successfully.", user: userResponse });

  } catch (error) {
      console.error("Admin Update User Error:", error);
       if (error.name === 'ValidationError') {
          return res.status(400).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: "Server error updating user." });
  }
});

/**
* @route   DELETE /api/users/admin/delete/:userId
* @desc    Admin xóa người dùng
* @access  Private (Admin only)
*/
router.delete('/admin/delete/:userId', isAuthenticated, isAdmin, async (req, res) => {
  try {
      const userIdToDelete = req.params.userId; // Giả sử là _id

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userIdToDelete)) {
         return res.status(400).json({ success: false, error: 'Invalid User ID format.' });
     }

      // Tùy chọn: Ngăn admin tự xóa chính mình
      const loggedInAdminId = req.user._id.toString(); // Lấy _id của admin đang đăng nhập
      if (userIdToDelete === loggedInAdminId) {
           return res.status(403).json({ success: false, error: "Admin cannot delete themselves." });
      }
      const userToDelete = await User.findById(userIdToDelete);
      if (userToDelete && userToDelete.role === 'admin') {
          const adminCount = await User.countDocuments({ role: 'admin' });
          if (adminCount <= 1) {
              return res.status(403).json({ success: false, error: "Cannot delete the last admin account." });
          }
      }

      const result = await User.findByIdAndDelete(userIdToDelete);

      if (!result) {
          return res.status(404).json({ success: false, error: "User not found." });
      }

      res.json({ success: true, message: "User deleted successfully." });

  } catch (error) {
      console.error("Admin Delete User Error:", error);
      res.status(500).json({ success: false, error: "Server error deleting user." });
  }
});
/**
 * @route   GET /api/users/admin/suggestions
 * @desc    Admin lấy gợi ý người dùng để tìm kiếm
 * @access  Private (Admin only)
 * @query   query - Chuỗi tìm kiếm (username, email, fullName)
 * @query   limit - Số lượng gợi ý tối đa (mặc định 7)
 */
router.get('/admin/suggestions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const query = (req.query.query || '').trim(); // Lấy query và loại bỏ khoảng trắng
      const limit = parseInt(req.query.limit, 10) || 7; // Lấy limit, mặc định 7
  
      // Chỉ tìm kiếm nếu query có ít nhất 2 ký tự
      if (query.length < 2) {
        return res.json({ success: true, data: [] }); // Trả về mảng rỗng nếu query quá ngắn
      }
  
      // Tạo điều kiện tìm kiếm không phân biệt hoa thường
      const regex = new RegExp(query, 'i');
      const mongoQuery = {
        $or: [
          { username: regex },
          { email: regex },
          { fullName: regex }
        ]
      };
  
      // Tìm kiếm user, chọn các trường cần thiết, giới hạn số lượng, sắp xếp
      const suggestions = await User.find(mongoQuery)
                                    .limit(limit)
                                    // Chọn các trường cần hiển thị ở gợi ý frontend
                                    .select('_id username email fullName avatar')
                                    // Sắp xếp theo username hoặc tên đầy đủ (tùy chọn)
                                    .sort({ username: 1 })
                                    .lean(); // Dùng lean() cho hiệu suất tốt hơn khi chỉ đọc
  
      res.json({ success: true, data: suggestions });
  
    } catch (error) {
      console.error("Admin Fetch User Suggestions Error:", error);
      res.status(500).json({ success: false, error: "Server error fetching user suggestions." });
    }
  });
module.exports = router;
