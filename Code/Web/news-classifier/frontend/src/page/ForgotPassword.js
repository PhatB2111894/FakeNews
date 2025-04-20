import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/forgot-password", { email });
      setMessage("✔ Kiểm tra email để đặt lại mật khẩu.");
    } catch (error) {
      setMessage("❌ Email không tồn tại trong hệ thống.");
    }
  };

  return (
    <div className="container d-flex justify-content-center" style={{ marginTop: "50px" }}>
      <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
        <h3 className="text-center mb-3">🔑 Quên mật khẩu</h3>
        <form onSubmit={handleForgotPassword}>
          <div className="mb-3">
            <label className="form-label"><i className="fas fa-envelope"></i> Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Nhập email của bạn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {message && <p className={`text-center ${message.includes('✔') ? 'text-success' : 'text-danger'}`}>{message}</p>}
          <button type="submit" className="btn btn-primary w-100">
            <i className="fas fa-paper-plane"></i> Gửi yêu cầu
          </button>
        </form>
        <p className="mt-3 text-center">
          <Link to="/login" className="text-dark text-decoration-none">🔙 Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
