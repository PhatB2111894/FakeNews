import React, { useState } from 'react'; // <<< Import thêm useState
import { Link } from 'react-router-dom';
import { Card, Col } from 'react-bootstrap';

// Không cần import file CSS nữa

function DashboardCard({ to, bgColor, icon, title, text, colProps = { md: 5, lg: 4 } }) {
  // State để theo dõi trạng thái hover
  const [isHovered, setIsHovered] = useState(false);

  // Style cơ bản của Card (dạng object JavaScript)
  const baseStyle = {
    transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out', // Giữ hiệu ứng chuyển động mượt
    border: 'none',        // Không viền
    height: '100%',        // Cao bằng nhau
    overflow: 'hidden',    // Tránh nội dung tràn
    backgroundColor: bgColor, // Màu nền từ props
    position: 'relative',  // Cần cho z-index nếu muốn nổi lên
    boxShadow: '0 .125rem .25rem rgba(0,0,0,.075)', // Shadow mặc định nhẹ của Bootstrap (shadow-sm)
  };

  // Style sẽ được áp dụng KHI hover (dạng object JavaScript)
  const hoveredStyle = {
    transform: 'translateY(-6px) scale(1.02)', // Hiệu ứng nhấc lên và phóng to nhẹ
    boxShadow: '0 0.8rem 1.8rem rgba(0, 0, 0, 0.18)', // Shadow đậm hơn khi hover
    zIndex: 10,              // Nổi lên trên các card khác
  };

  // Kết hợp style: áp dụng baseStyle và thêm hoveredStyle nếu isHovered là true
  const currentStyle = {
    ...baseStyle,
    ...(isHovered ? hoveredStyle : {}) // Toán tử spread (...) để gộp object
  };

  return (
    <Col {...colProps} className="mb-4">
      <Link to={to} className="text-decoration-none">
        <Card
          className="text-white" // Chỉ cần text-white ở đây
          style={currentStyle} // <<< Áp dụng style động vào đây
          onMouseEnter={() => setIsHovered(true)} // <<< Khi chuột vào -> set hover true
          onMouseLeave={() => setIsHovered(false)} // <<< Khi chuột ra -> set hover false
        >
          <Card.Body className="d-flex flex-column justify-content-center align-items-center p-4 text-center">
            {icon && <i className={`fas ${icon} fa-3x mb-3`}></i>}
            <Card.Title as="h4" className="mb-2 fw-bold">{title}</Card.Title>
            <Card.Text className="small">
              {text}
            </Card.Text>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  );
}

export default DashboardCard;