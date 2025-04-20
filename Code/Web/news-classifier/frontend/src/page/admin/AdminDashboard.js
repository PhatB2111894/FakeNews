import React from 'react';
// Bỏ Link vì đã dùng trong DashboardCard, chỉ cần import Container, Row
import { Container, Row } from 'react-bootstrap';
// Import component DashboardCard vừa tạo
import DashboardCard from './DashboardCard';

function AdminDashboard() {

  // --- BỎ ĐỐI TƯỢNG STYLE VÀ CÁC HÀM HANDLER KHỎI ĐÂY ---

  return (
    // Sử dụng Container của react-bootstrap
    <Container className="mt-4 mb-5"> {/* Thêm padding top/bottom */}
        <h2 className="mb-3 fw-bold text-center text-dark"> {/* Đổi màu tiêu đề */}
            <i className="fas fa-tachometer-alt me-2"></i> Admin Dashboard
        </h2>
        <p className="lead text-muted mb-5 text-center">
            Welcome to the admin area. Choose a section to manage:
        </p>

        {/* Sử dụng Row để chứa các Card */}
        <Row className="justify-content-center g-4"> {/* g-4 tạo khoảng cách giữa các Col */}

            {/* Sử dụng Component DashboardCard */}
            <DashboardCard
                to="/admin/users"
                bgColor="#6c757d" // Secondary gray
                icon="fa-users-cog"
                title="User Management"
                text="View, add, edit, and manage user accounts and roles."
            />

            <DashboardCard
                to="/admin/news"
                bgColor="#17a2b8" // Info (màu gốc là #0dcaf0, có thể dùng #17a2b8 tối hơn chút)
                icon="fa-newspaper" // Đổi icon cho News
                title="News Management"
                text="Review reported news articles, view details, and manage content status." // Sửa text mô tả
            />

            {/* Thêm Card khác nếu cần */}
             {/* Ví dụ:
             <DashboardCard
                 to="/admin/reports" // Ví dụ link quản lý report riêng
                 bgColor="#ffc107" // Warning yellow
                 icon="fa-flag"
                 title="Report Management"
                 text="View and manage all user reports for news articles."
             />
             */}

         </Row> {/* End .row */}
     </Container> // End .container
  );
}

export default AdminDashboard;