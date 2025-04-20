const jwt = require('jsonwebtoken');
const { User } = require('../models/User'); // Đảm bảo đường dẫn này đúng

const isAdmin = async (req, res, next) => {
  console.log('--- [isAdmin] BẮT ĐẦU Middleware ---'); // Log khi bắt đầu
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('[isAdmin] Token tồn tại:', !!token); // Log xem có token không
    if (!token) {
      console.log('[isAdmin] Từ chối: Không có token.');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('[isAdmin] Đang xác thực token...'); // Log trước khi verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[isAdmin] Token hợp lệ. Decoded ID:', decoded?._id); // Log ID từ token

    console.log('[isAdmin] Đang tìm user bằng ID:', decoded._id); // Log trước khi truy vấn DB
    const user = await User.findById(decoded._id); // <<< Điểm nghi ngờ chính
    console.log('[isAdmin] Đã tìm thấy user trong DB:', !!user); // Log sau khi truy vấn DB

    if (!user) {
      console.log('[isAdmin] Từ chối: Không tìm thấy user với ID này.');
      return res.status(401).json({ error: 'Invalid token - User not found.' });
    }

    console.log('[isAdmin] Đang kiểm tra role:', user.role); // Log trước khi kiểm tra role
    if (user.role !== 'admin') {
      console.log('[isAdmin] Từ chối: Role không phải admin.');
      return res.status(403).json({ error: 'Forbidden: Admin privileges required.' });
    }

    console.log('[isAdmin] User là admin. Gắn user vào req.'); // Log trước khi gán req.user
    req.user = user; // Gắn user vào request

    console.log('--- [isAdmin] Gọi next() ---'); // Log trước khi gọi next()
    next(); // Cho phép request đi tiếp

  } catch (error) {
    // Ghi log lỗi chi tiết hơn ở đây
    console.error("--- [isAdmin] LỖI Middleware ---:", error); // Log toàn bộ lỗi ra để xem xét
    // Trả về lỗi chung chung cho client
    res.status(401).json({ error: 'Authentication failed.' });
  }
};

// Nếu bạn cũng dùng isAuthenticated, hãy thêm log tương tự vào nó
const isAuthenticated = async (req, res, next) => {
  console.log('--- [isAuthenticated] BẮT ĐẦU Middleware ---');
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('[isAuthenticated] Token tồn tại:', !!token);
    if (!token) {
      console.log('[isAuthenticated] Từ chối: Không có token.');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('[isAuthenticated] Đang xác thực token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[isAuthenticated] Token hợp lệ. Decoded ID:', decoded?._id);

    // Quan trọng: Vẫn nên tìm user để đảm bảo user tồn tại
    console.log('[isAuthenticated] Đang tìm user bằng ID:', decoded._id);
    const user = await User.findById(decoded._id);
    console.log('[isAuthenticated] Đã tìm thấy user trong DB:', !!user);
    if (!user) {
       console.log('[isAuthenticated] Từ chối: Không tìm thấy user với ID này.');
       return res.status(401).json({ error: 'Invalid token - User not found.' });
    }

    console.log('[isAuthenticated] Gắn user vào req.');
    req.user = user; // Gắn user vào request

    console.log('--- [isAuthenticated] Gọi next() ---');
    next();

  } catch (error) {
    console.error("--- [isAuthenticated] LỖI Middleware ---:", error);
    res.status(401).json({ error: 'Authentication failed.' });
  }
};


module.exports = {
  isAdmin,
  isAuthenticated
};