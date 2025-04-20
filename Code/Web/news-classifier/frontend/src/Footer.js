import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';

function Footer() {
  const currentYear = new Date().getFullYear(); // Lấy năm hiện tại

  return (
    // Sử dụng class của Bootstrap: nền tối, chữ sáng, padding dọc, tự động đẩy xuống dưới cùng
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container>
        <Row>
          {/* Cột bên trái: Copyright */}
          <Col md={6} className="text-center text-md-start mb-2 mb-md-0">
            <small>&copy; {currentYear} Fake News Detector App. All Rights Reserved.</small>
          </Col>

          {/* Cột bên phải: Links */}
          <Col md={6}>
            <Nav className="justify-content-center justify-content-md-end">
              {/* Thay đổi href thành đường dẫn thực tế của bạn nếu có */}
              <Nav.Link href="/about" className="text-white-50 px-2 py-1"><small>About</small></Nav.Link>
              <Nav.Link href="/privacy" className="text-white-50 px-2 py-1"><small>Privacy Policy</small></Nav.Link>
              <Nav.Link href="/terms" className="text-white-50 px-2 py-1"><small>Terms of Service</small></Nav.Link>
            </Nav>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;