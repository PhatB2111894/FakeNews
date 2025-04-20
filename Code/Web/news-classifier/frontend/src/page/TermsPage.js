import React from 'react';
import { Container, Card } from 'react-bootstrap';

function TermsPage() {
  return (
    <Container className="mt-4 mb-5">
       <Card className="p-4 shadow-sm">
        <Card.Body>
          <Card.Title as="h2" className="mb-3 text-dark"><i className="fas fa-file-contract me-2"></i>Terms of Service</Card.Title>
           {/* Nhớ cập nhật ngày này khi có thay đổi điều khoản */}
           <p className="text-muted">Last Updated: April 14, 2025</p>
          <hr/>

          {/* Đã cập nhật tên App */}
          <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Fake News Detector application (the "Service") operated by Fake News Detector ("us", "we", or "our").</p>
          <p>Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who wish to access or use the Service.</p>
          <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you do not have permission to access the Service.</p>

          <h4 className="mt-4">Use License</h4>
           {/* Đã cập nhật tên App */}
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on Fake News Detector's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul>
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on the Service;</li>
             <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            {/* Consider adding more specific restrictions relevant to your service */}
          </ul>
          <p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.</p>

          <h4 className="mt-4">Disclaimer</h4>
          <p>The materials provided on the Service are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          <p>Further, we do not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the classification materials on its website or otherwise relating to such materials or on any sites linked to this site. The classification is probabilistic and for informational purposes only. Users should use their own judgment and verify information from multiple sources.</p> {/* Thêm ý nhắc nhở người dùng */}

           {/* Consider adding specific sections on User Content (if users generate content), Account Termination, Limitations of Liability etc. */}

           <h4 className="mt-4">Governing Law</h4>
            {/* Đã cập nhật quốc gia */}
            <p>These terms and conditions are governed by and construed in accordance with the laws of Vietnam and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>


           <h4 className="mt-4">Contact Us</h4>
          <p>
            {/* Đã cập nhật email */}
            If you have any questions about these Terms, please contact us at: <a href="mailto:nguyenhongtuanphat24@gmail.com">nguyenhongtuanphat24@gmail.com</a>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default TermsPage;