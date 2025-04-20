require('dotenv').config();
const express = require('express');
const nodemailer = require("nodemailer");
const cors = require('cors');
const path = require("path");
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const connectDB = require('./config/db');
const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const app = express();
const PORT = process.env.PORT || 5000;
const axios = require('axios');
connectDB();

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use('/api/news', newsRoutes);
app.use('/api/users', userRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/reports', reportRoutes);
let otpStorage = {}; // Lưu OTP tạm thời

// Cấu hình transporter với Gmail (hoặc SMTP khác)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL, // Email gửi OTP
      pass: process.env.EMAIL_PASSWORD, // Mật khẩu ứng dụng (App Password)
    },
  });

  // API gửi OTP
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email không hợp lệ" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Tạo OTP 6 số
    otpStorage[email] = otp; // Lưu OTP tạm thời

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Mã OTP xác thực",
        text: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`,
    };

    try {
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: req.body.email,
            subject: "Mã OTP của bạn",
            text: `Mã OTP của bạn là: ${otp}`
        });
        res.json({ message: "OTP đã được gửi!" });
    } catch (error) {
        console.error("Lỗi gửi email:", error);
        res.status(500).json({ error: "Gửi OTP thất bại", details: error.message });
    }
});

// API xác thực OTP
app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (otpStorage[email] && otpStorage[email] === otp) {
        delete otpStorage[email]; // Xóa OTP sau khi xác thực thành công
        res.json({ message: "Xác thực thành công!" });
    } else {
        res.status(400).json({ error: "Mã OTP không đúng hoặc hết hạn" });
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
