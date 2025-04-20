import React, { useState } from 'react';
import { Badge, Modal, Button, Form, Alert, Spinner } from 'react-bootstrap'; // Thêm Spinner
import axios from 'axios';
import { useUser } from '../context/UserContext';
function ReportModal({ show, handleClose, newsItem }) {
    const { user } = useUser(); // <<< Lấy user từ context
    const [formData, setFormData] = useState({
        userCorrection: '', // 'Real' or 'Fake'
        sourceUrl: '',
        comments: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
         // Xóa lỗi/thành công khi người dùng bắt đầu sửa
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation cơ bản
        if (!formData.userCorrection) {
            setError('Please select the correct classification.');
            return;
        }
        if (!formData.sourceUrl.trim()) {
            setError('Please provide a source URL for verification.');
            return;
        }
        // Optional: Basic URL format check
        try {
            // Check if it's a potentially valid URL structure (doesn't guarantee reachability)
             if (!/^https?:\/\/.+/.test(formData.sourceUrl.trim())) {
                 throw new Error("Invalid URL format");
             }
             // Attempting new URL is okay but might be too strict for some valid local/internal URLs
             // new URL(formData.sourceUrl.trim());
        } catch (_) {
             setError('Please enter a valid URL starting with http:// or https://.');
            return;
        }

        // --- LẤY USER ID TỪ CONTEXT ---
        const reporterUserId = user?.userId; // Dùng optional chaining

        if (!reporterUserId) {
            // Lỗi này giờ sẽ ít xảy ra hơn nếu người dùng đã đăng nhập
            setError("Could not identify reporter. Please ensure you are logged in.");
            return;
        }
        // --- KẾT THÚC LẤY TỪ CONTEXT ---

        setLoading(true);

        const reportData = {
            newsId: newsItem._id,
            reporterUserId: reporterUserId, // ID lấy từ context
            systemPrediction: newsItem.systemPrediction,
            userCorrection: formData.userCorrection,
            sourceUrl: formData.sourceUrl.trim(),
            comments: formData.comments.trim()
        };

        console.log('Submitting report data:', JSON.stringify(reportData, null, 2));

        try {
             // Sử dụng biến môi trường cho API URL
            const reportApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/reports/submit` : 'http://localhost:5000/api/reports/submit';

             // **Quan trọng:** Cần gửi token để xác thực người dùng báo cáo ở backend
             let token = null;
             const storedUserString = localStorage.getItem('user'); // Lấy lại user string để lấy token
              if (storedUserString) { try { token = JSON.parse(storedUserString)?.token; } catch (e) {} }

              if (!token) {
                  throw new Error("Authentication token not found. Cannot submit report.");
              }

            await axios.post(reportApiUrl, reportData, {
                 headers: {
                    'Authorization': `Bearer ${token}` // <<< GỬI TOKEN
                 }
             });

            setSuccess('Report submitted successfully. Thank you for your feedback!');
            setFormData({ userCorrection: '', sourceUrl: '', comments: '' }); // Reset form

            // Tự động đóng modal sau vài giây
            const timer = setTimeout(() => {
                handleClose();
            }, 2500); // Đóng sau 2.5 giây

             // Cleanup timer nếu component unmount trước khi timeout kết thúc
             return () => clearTimeout(timer);


        } catch (err) {
            console.error("Error submitting report:", err.response?.data || err.message);
             // Hiển thị lỗi cụ thể từ server nếu có
            setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Reset state khi modal bị đóng từ bên ngoài
    const handleExited = () => {
        setError('');
        setSuccess('');
        setLoading(false);
        setFormData({ userCorrection: '', sourceUrl: '', comments: '' });
    }

    return (
        // Thêm onExited để reset khi modal đóng hoàn toàn
        <Modal show={show} onHide={!loading ? handleClose : undefined} centered onExited={handleExited} backdrop={loading ? 'static' : true}>
            <Modal.Header closeButton={!loading}> {/* Disable nút X khi đang loading */}
                <Modal.Title><i className="fas fa-flag me-2"></i>Report Classification</Modal.Title> {/* Thêm icon */}
            </Modal.Header>
            <Modal.Body>
                 {/* Đặt Alert bên ngoài Form để không bị reset khi submit */}
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                {/* Chỉ hiển thị form nếu chưa gửi thành công */}
                {!success && (
                    <>
                        <p className='mb-1'><strong>Article:</strong></p>
                        <p className='text-muted border p-2 rounded bg-light mb-3'>{newsItem?.title || '(No Title)'}</p> {/* Hiển thị title rõ hơn */}
                        <p><strong>System Prediction:</strong> <Badge bg={newsItem?.systemPrediction === 'Fake' ? 'danger' : 'success'}>{newsItem?.systemPrediction}</Badge></p>
                        <hr />
                        <Form onSubmit={handleSubmit} noValidate> {/* Thêm noValidate */}
                            {/* Correct Classification */}
                            <Form.Group className="mb-3" controlId="formUserCorrection">
                                <Form.Label>What is the correct classification? <span className="text-danger">*</span></Form.Label>
                                <div>
                                    <Form.Check inline type="radio" label="Real" name="userCorrection" value="Real" id="radioReal" checked={formData.userCorrection === 'Real'} onChange={handleChange} required disabled={loading} />
                                    <Form.Check inline type="radio" label="Fake" name="userCorrection" value="Fake" id="radioFake" checked={formData.userCorrection === 'Fake'} onChange={handleChange} required disabled={loading} />
                                </div>
                            </Form.Group>

                            {/* Source URL */}
                            <Form.Group className="mb-3" controlId="formSourceUrl">
                                <Form.Label>Source URL (for verification) <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="url" name="sourceUrl" placeholder="https://example.com/news_source_or_debunk" value={formData.sourceUrl} onChange={handleChange} required disabled={loading} />
                                <Form.Text className="text-muted"> Please provide a link to the original article or a reliable source. </Form.Text>
                            </Form.Group>

                            {/* Comments */}
                            <Form.Group className="mb-3" controlId="formComments">
                                <Form.Label>Additional Comments (Optional)</Form.Label>
                                <Form.Control as="textarea" rows={3} name="comments" placeholder="Explain why you think the classification is incorrect..." value={formData.comments} onChange={handleChange} disabled={loading} />
                            </Form.Group>

                            <div className="d-flex justify-content-end mt-4"> {/* Thêm khoảng cách trên */}
                                <Button variant="secondary" onClick={handleClose} className="me-2" disabled={loading}> Cancel </Button>
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Submitting...</> : 'Submit Report'}
                                </Button>
                            </div>
                        </Form>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}

export default ReportModal;