// src/Navbar.js (Phiên bản đầy đủ cập nhật)

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "./context/UserContext"; // Đảm bảo đường dẫn đúng

function Navbar() {
  // State cho menu mobile và dropdown user
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // Ref để xử lý click ngoài dropdown

  // Hooks từ React Router và Context
  const navigate = useNavigate();
  const { user, setUser } = useUser(); // Lấy state user và hàm cập nhật từ context

  // URL avatar mặc định
  const defaultAvatarUrl = "https://bookvexe.vn/wp-content/uploads/2023/04/chon-loc-25-avatar-facebook-mac-dinh-chat-nhat_7.jpg";

  // Effect để load thông tin user từ localStorage vào context khi component mount lần đầu hoặc khi refresh trang
  // Chỉ thực hiện nếu context hiện tại chưa có user
  useEffect(() => {
    if (!user) { // Chỉ chạy nếu context chưa có user
      try {
        const storedUser = localStorage.getItem("user"); // Lấy chuỗi JSON từ localStorage
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser); // Parse chuỗi JSON thành object
          // Kiểm tra dữ liệu parse được có hợp lệ không (có userId và role)
          // Quan trọng: Đảm bảo dữ liệu lưu trong localStorage chứa đủ thông tin (bao gồm role)
          if (parsedUser && parsedUser.userId && parsedUser.role) {
            setUser(parsedUser); // Cập nhật context nếu dữ liệu hợp lệ
          } else {
            // Nếu dữ liệu không hợp lệ (thiếu userId hoặc role), xóa khỏi localStorage
            console.warn("Invalid user data found in localStorage. Removing.");
            localStorage.removeItem("user");
            setUser(null); // Đảm bảo context là null
          }
        }
      } catch (error) {
        // Xử lý lỗi nếu parse JSON thất bại (dữ liệu bị hỏng)
        console.error("Error reading or parsing user from localStorage:", error);
        localStorage.removeItem("user"); // Xóa dữ liệu hỏng
        setUser(null); // Đảm bảo context là null
      }
    }
    // Dependencies: chỉ chạy lại nếu hàm setUser thay đổi (ít khi) hoặc state user thay đổi từ null -> có giá trị hoặc ngược lại
  }, [setUser, user]);

  // Hàm bật/tắt dropdown user
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Effect để xử lý việc đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Nếu click xảy ra bên ngoài phần tử dropdown (dropdownRef.current)
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false); // Đóng dropdown
      }
    };
    // Thêm event listener khi component mount
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup: Gỡ event listener khi component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Chạy một lần khi mount

  // Hàm xử lý logout
  const handleLogout = () => {
    localStorage.removeItem("user"); // Xóa thông tin user khỏi localStorage
    // localStorage.clear(); // Hoặc dùng clear() nếu muốn xóa tất cả localStorage của domain

    setUser(null); // Cập nhật context, báo cho ứng dụng biết user đã logout
    setDropdownOpen(false); // Đóng dropdown user (nếu đang mở)
    setIsOpen(false); // Đóng menu mobile (nếu đang mở)
    navigate("/login"); // Chuyển hướng về trang đăng nhập
  };

  // Hàm tạo URL avatar, bao gồm xử lý đường dẫn và thêm cache buster
  const getAvatarUrl = (avatarFilename) => {
    if (!avatarFilename) {
      return defaultAvatarUrl; // Trả về avatar mặc định nếu không có filename
    }
    // Đảm bảo avatarFilename là string trước khi replace và xử lý path separators
    const path = String(avatarFilename).replace(/\\/g, '/');
    // Thêm timestamp làm query param để tránh cache của trình duyệt
    return `http://localhost:5000/uploads/avatars/${path}?t=${new Date().getTime()}`;
  }

  // --- Phần Render JSX ---
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid">
        {/* Logo và Tên ứng dụng */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src="../fakenews1.jpg" // Đường dẫn tới logo, đảm bảo đúng
            alt="Logo"
            style={{ width: '70px', height: 'auto', marginRight: '10px' }}
          />
          Fake News Detector
        </Link>

        {/* Nút Toggler cho màn hình nhỏ */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)} // Bật/tắt state isOpen
          aria-controls="navbarNav"
          aria-expanded={isOpen ? "true" : "false"}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Nội dung Navbar có thể thu gọn */}
        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center"> {/* ms-auto đẩy về bên phải, align-items-center căn giữa dọc */}

            {/* --- LINKS CHO USER THƯỜNG / KHÁCH --- */}
            {/* Hiển thị nếu không phải admin (chưa đăng nhập hoặc là user thường) */}
            {(!user || user.role !== 'admin') && (
              <li className="nav-item">
                <Link className="nav-link" to="/classify" onClick={() => setIsOpen(false)}> {/* Đóng menu mobile khi click */}
                  <i className="fas fa-newspaper me-1"></i> News Classifier
                </Link>
              </li>
            )}
            {/* Hiển thị nếu đã đăng nhập VÀ không phải admin */}
            { user && user.role !== 'admin' && (
                <li className="nav-item">
                    <Link className="nav-link" to="/history" onClick={() => setIsOpen(false)}> {/* Đóng menu mobile khi click */}
                        <i className="fas fa-history me-1"></i> History
                    </Link>
                </li>
            )}
            {/* --- KẾT THÚC LINKS USER THƯỜNG / KHÁCH --- */}


            {/* --- LINKS CHỈ DÀNH CHO ADMIN --- */}
            {/* Hiển thị nếu đã đăng nhập VÀ là admin */}
            {user && user.role === 'admin' && (
              <> {/* Fragment để nhóm các link admin */}
                <li className="nav-item">
                  <Link className="nav-link text-warning fw-bold" to="/admin" onClick={() => setIsOpen(false)}> {/* Link Dashboard */}
                    <i className="fas fa-tachometer-alt me-1"></i> Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-warning" to="/admin/users" onClick={() => setIsOpen(false)}>
                    <i className="fas fa-users-cog me-1"></i> User Management
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-warning" to="/admin/news" onClick={() => setIsOpen(false)}>
                    <i className="fas fa-file-alt me-1"></i> News Management
                  </Link>
                </li>
                {/* Có thể thêm các link admin khác ở đây */}
              </>
            )}
            {/* --- KẾT THÚC LINKS ADMIN --- */}


            {/* --- PHẦN USER DROPDOWN HOẶC NÚT SIGN IN --- */}
            {user ? ( // Nếu đã đăng nhập
              <li className="nav-item dropdown" ref={dropdownRef}>
                {/* Nút bấm hiển thị avatar và username, toggle dropdown */}
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center "
                  href="#" // Dùng href="#" hoặc role="button"
                  id="navbarDropdownMenuLink"
                  role="button"
                  aria-expanded={dropdownOpen}
                  onClick={(e) => { e.preventDefault(); toggleDropdown(); }} // Ngăn hành vi mặc định của thẻ a và gọi toggleDropdown
                >
                  <img
                    src={getAvatarUrl(user.avatar)} // Lấy URL avatar (có cache buster)
                    alt="User Avatar"
                    className="rounded-circle me-2"
                    style={{ width: "30px", height: "30px", objectFit: "cover" }}
                    onError={(e) => { e.target.onerror = null; e.target.src=defaultAvatarUrl }} // Fallback nếu ảnh lỗi
                  />
                  {user.username}
                  {/* Hiển thị tag "Admin" nếu là admin */}
                  {user.role === 'admin' && <span className="badge bg-warning text-dark ms-2 small">Admin</span>}
                </a>
                {/* Menu dropdown */}
                <ul
                  className={`dropdown-menu dropdown-menu-start ${dropdownOpen ? "show" : ""}`} // dropdown-menu-end để căn phải
                  aria-labelledby="navbarDropdownMenuLink"
                >
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/profile" // Link đến trang Profile
                      onClick={() => { setDropdownOpen(false); setIsOpen(false); }} // Đóng dropdown và menu mobile
                    >
                      <i className="fas fa-user me-2"></i> Profile
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" /> {/* Đường kẻ phân cách */}
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger" // Nút Logout
                      onClick={() => { handleLogout(); /* setIsOpen đã có trong handleLogout nếu gọi navigate */ }} // Gọi hàm logout
                    >
                      <i className="fas fa-sign-out-alt me-2"></i> Log out
                    </button>
                  </li>
                </ul>
              </li>
            ) : ( // Nếu chưa đăng nhập
              <li className="nav-item">
                <Link className="nav-link" to="/login" onClick={() => setIsOpen(false)}> {/* Link đến trang Login */}
                  <i className="fas fa-sign-in-alt me-1"></i> Sign in
                </Link>
              </li>
            )}
            {/* --- KẾT THÚC PHẦN USER DROPDOWN / SIGN IN --- */}
          </ul>
        </div> {/* End .collapse */}
      </div> {/* End .container-fluid */}
    </nav> // End nav
  );
}

export default Navbar;