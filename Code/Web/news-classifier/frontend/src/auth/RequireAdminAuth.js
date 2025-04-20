import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Đảm bảo đường dẫn đúng

function RequireAdminAuth() {
  const { user } = useUser(); // Lấy user từ context
  const location = useLocation(); // Lấy vị trí hiện tại

  // Kiểm tra:
  // 1. Có user đăng nhập không?
  // 2. User đó có role là 'admin' không?
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    // Nếu không phải admin:
    // 1. Ghi log hoặc hiển thị thông báo (tùy chọn)
    console.warn("RequireAdminAuth: Access denied. User is not an admin or not logged in.");
    // 2. Chuyển hướng về trang đăng nhập (hoặc trang chủ/lỗi)
    //    - state={{ from: location }} giúp chuyển hướng người dùng trở lại trang họ muốn vào sau khi đăng nhập thành công
    return <Navigate to="/login" state={{ from: location }} replace />;
    //    - Hoặc hiển thị component báo lỗi: return <UnauthorizedPage />;
  }

  // Nếu là admin, cho phép render component con (trang admin cụ thể)
  return <Outlet />;
}

export default RequireAdminAuth;