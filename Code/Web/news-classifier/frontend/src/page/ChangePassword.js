import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).userId : null;

  const handleChangePassword = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!userId) {
      setErrorMessage("Không tìm thấy userId!");
      return;
    }
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/users/change-password/${userId}`, {
        oldPassword,
        newPassword,
      });

      setSuccessMessage("Đổi mật khẩu thành công!");
      setTimeout(() => navigate(-1), 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Đổi mật khẩu thất bại!");
    }
  };

  return (
    <div className="container mt-5 p-4 bg-white rounded shadow" style={{ maxWidth: "400px" }}>
      <h3 className="text-center mb-4">
        <i className="fas fa-lock"></i> Đổi mật khẩu
      </h3>

      {/* Mật khẩu cũ */}
      <div className="mb-3 input-group">
        <span className="input-group-text">
          <i className="fas fa-key"></i>
        </span>
        <input
          type={showPassword.old ? "text" : "password"}
          className="form-control"
          placeholder="Nhập mật khẩu cũ"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <span className="input-group-text" onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}>
          <i className={`fa ${showPassword.old ? "fa-eye" : "fa-eye-slash"}`}></i>
        </span>
      </div>

      {/* Mật khẩu mới */}
      <div className="mb-3 input-group">
        <span className="input-group-text">
          <i className="fas fa-lock"></i>
        </span>
        <input
          type={showPassword.new ? "text" : "password"}
          className="form-control"
          placeholder="Nhập mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <span className="input-group-text" onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}>
          <i className={`fa ${showPassword.new ? "fa-eye" : "fa-eye-slash"}`}></i>
        </span>
      </div>

      {/* Xác nhận mật khẩu mới */}
      <div className="mb-3 input-group">
        <span className="input-group-text">
          <i className="fas fa-lock"></i>
        </span>
        <input
          type={showPassword.confirm ? "text" : "password"}
          className="form-control"
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <span className="input-group-text" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}>
          <i className={`fa ${showPassword.confirm ? "fa-eye" : "fa-eye-slash"}`}></i>
        </span>
      </div>

      {/* Hiển thị lỗi hoặc thông báo thành công */}
      {errorMessage && <div className="alert alert-danger text-center p-2">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success text-center p-2">{successMessage}</div>}

      {/* Nút Cập nhật & Hủy */}
      <div className="d-flex justify-content-between">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Hủy
        </button>
        <button className="btn btn-primary" onClick={handleChangePassword}>
          <i className="fas fa-check-circle"></i> Cập nhật mật khẩu
        </button>
      </div>
    </div>
  );
}

export default ChangePassword;
