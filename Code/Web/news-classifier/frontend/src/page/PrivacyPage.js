import React from 'react';
import { Container, Card } from 'react-bootstrap';

function PrivacyPage() {
  return (
    <Container className="mt-4 mb-5">
       <Card className="p-4 shadow-sm">
        <Card.Body>
           <Card.Title as="h2" className="mb-3 text-dark"><i className="fas fa-user-secret me-2"></i>Privacy Policy</Card.Title>
           {/* Nhớ cập nhật ngày này khi có thay đổi chính sách */}
           <p className="text-muted">Last Updated: April 14, 2025</p>
           <hr/>

          <p>
             {/* Đã cập nhật tên App */}
            Your privacy is important to us. This Privacy Policy explains how Fake News Detector ("we," "us," or "our") collects, uses, discloses, and safeguards your information when you use our Fake News Detector application (the "Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.
          </p>

          <h4 className="mt-4">Information We Collect</h4>
          <p>We may collect information about you in a variety of ways. The information we may collect via the Service includes:</p>
          <ul>
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the Service. You are under no obligation to provide us with personal information of any kind, however your refusal to do so may prevent you from using certain features of the Service (like saving history).</li>
            <li><strong>Usage Data:</strong> Information your browser sends whenever you visit our Service or when you access the Service ("Usage Data"). This may include information such as your computer's IP address, browser type, browser version, pages visited, time and date of visit, time spent on pages, and other diagnostic data. We may use this data for analytics and service improvement.</li>
            <li><strong>News Content Data:</strong> The news titles and content you submit for classification. We may store this data (potentially linked to your user ID if logged in) primarily to provide you with your classification history and to improve our machine learning models' accuracy and the overall Service quality. We commit not to sell or share the specific content you classify with unrelated third parties for their marketing purposes.</li>
             {/* !!! Cần làm rõ thêm về lưu trữ ẩn danh/có định danh, thời gian lưu, có dùng cookies không?, etc. !!! */}
          </ul>

          <h4 className="mt-4">Use of Your Information</h4>
           <p>Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:</p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Provide and maintain the classification Service.</li>
            <li>Improve the accuracy and performance of our machine learning models and the Service features.</li>
            <li>Monitor and analyze usage patterns and trends to enhance user experience.</li>
            <li>Respond to your comments, questions, and provide user support.</li>
            <li>Notify you about changes to our Service (if applicable).</li>
             {/* !!! Cần liệt kê TẤT CẢ các mục đích sử dụng dữ liệu !!! */}
          </ul>

           {/* !!! Cần bổ sung các mục quan trọng: Disclosure of Your Information (Chia sẻ thông tin), Data Retention (Lưu trữ dữ liệu), Your Data Rights (Quyền của bạn), Cookies Policy, Children's Privacy, International Transfers (nếu có) !!! */}

           <h4 className="mt-4">Security of Your Information</h4>
           <p>We implement administrative, technical, and physical security measures designed to protect your personal information. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security as no method of transmission over the Internet or method of electronic storage is 100% secure.</p>

           <h4 className="mt-4">Changes to This Privacy Policy</h4>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>


           <h4 className="mt-4">Contact Us</h4>
          <p>
             {/* Đã cập nhật email */}
            If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:nguyenhongtuanphat24@gmail.com">nguyenhongtuanphat24@gmail.com</a>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PrivacyPage;