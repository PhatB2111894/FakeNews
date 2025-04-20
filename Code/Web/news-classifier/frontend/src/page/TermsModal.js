// src/components/TermsModal.js
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

// Component hiển thị nội dung Điều khoản trong Modal
function TermsModal({ show, handleClose }) {

  // *** NỘI DUNG ĐIỀU KHOẢN DỊCH VỤ ***
  // Bạn copy nội dung từ file TermsPage.js vào đây
  // Hoặc có thể fetch nội dung từ đâu đó nếu muốn linh hoạt hơn
  const termsContent = (
    <>
      {/* Thêm ngày cập nhật ở đây nếu muốn */}
      {/* <p className="text-muted small">Last Updated: April 15, 2025</p> */}
      {/* <hr/> */}
      <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Fake News Detector application (the "Service") operated by Fake News Detector ("us", "we", or "our").</p>
      <p>Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who wish to access or use the Service.</p>
      <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you do not have permission to access the Service.</p>

      <h5 className="mt-3">Use License</h5> {/* Dùng h5 cho gọn trong modal */}
      <p><small>Permission is granted to temporarily download one copy of the materials (information or software) on Fake News Detector's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</small></p>
      <ul>
         <li><small>modify or copy the materials;</small></li>
         <li><small>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</small></li>
         <li><small>attempt to decompile or reverse engineer any software contained on the Service;</small></li>
         <li><small>remove any copyright or other proprietary notations from the materials; or</small></li>
         <li><small>transfer the materials to another person or "mirror" the materials on any other server.</small></li>
      </ul>
      <p><small>This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.</small></p>

      <h5 className="mt-3">Disclaimer</h5>
       <p><small>The materials provided on the Service are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</small></p>
      <p><small>Further, we do not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the classification materials on its website or otherwise relating to such materials or on any sites linked to this site. The classification is probabilistic and for informational purposes only. Users should use their own judgment and verify information from multiple sources.</small></p>

      <h5 className="mt-3">Governing Law</h5>
       <p><small>These terms and conditions are governed by and construed in accordance with the laws of Vietnam and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</small></p>

      <h5 className="mt-3">Contact Us</h5>
       <p><small>If you have any questions about these Terms, please contact us at: <a href="mailto:nguyenhongtuanphat24@gmail.com">nguyenhongtuanphat24@gmail.com</a></small></p>
       {/* Nhắc nhở người dùng đọc kỹ */}
       <p className="mt-3 text-center text-danger fw-bold"><small>Please read these terms carefully before agreeing.</small></p>
    </>
  );

  return (
    // size="lg" để modal rộng hơn, scrollable cho phép cuộn nếu nội dung dài
    <Modal show={show} onHide={handleClose} centered size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title><i className="fas fa-file-contract me-2"></i>Terms of Service</Modal.Title>
      </Modal.Header>
      {/* style={{ fontSize: '0.9rem' }} để chữ nhỏ hơn chút */}
      <Modal.Body style={{ fontSize: '0.9rem' }}>
        {termsContent}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          I Understand & Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TermsModal;