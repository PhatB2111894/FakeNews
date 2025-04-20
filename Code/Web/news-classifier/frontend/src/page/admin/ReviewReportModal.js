// src/page/admin/ReviewReportModal.js
import React from 'react';
import { Modal, Button, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';
// --- Hàm helper để render Badge Status ---
// (Có thể đặt bên ngoài hoặc bên trong component, hoặc import nếu dùng chung)
const renderStatusBadge = (status) => {
    switch (status) {
        case 'pending': return <Badge bg="warning" text="dark">Pending Review</Badge>;
        case 'verified_correct': return <Badge bg="success">Verified (Correct)</Badge>;
        case 'verified_incorrect': return <Badge bg="secondary">Verified (Incorrect)</Badge>;
        case 'rejected': return <Badge bg="danger">Rejected</Badge>;
        case 'processed': return <Badge bg="info">Processed</Badge>;
        // Thêm các trường hợp khác nếu có
        default: return <Badge bg="light" text="dark">{status || 'Unknown'}</Badge>; // Hiển thị trạng thái không xác định hoặc không có
    }
};

// --- Component ReviewReportModal ---
function ReviewReportModal({ show, handleClose, reportDetails, onUpdateStatus, loading }) {
    // Props:
    // show: boolean - Điều khiển hiển thị modal
    // handleClose: function - Hàm để đóng modal
    // reportDetails: object - Chứa thông tin chi tiết của report cần review
    // onUpdateStatus: function - Hàm gọi khi admin bấm nút cập nhật status (truyền reportId và newStatus)
    // loading: boolean - Trạng thái loading khi đang thực hiện action (true/false)

    // Hàm gọi update status với giá trị tương ứng
    const handleStatusUpdate = (newStatus) => {
        if (reportDetails?._id) {
            onUpdateStatus(reportDetails._id, newStatus);
        } else {
            console.error("Cannot update status: Report ID is missing.");
            alert("Error: Report ID is missing. Cannot update status."); // Thông báo cho admin
        }
    };

    // Helper để hiển thị badge cho User Correction (Giữ nguyên)
    const renderUserCorrectionBadge = (correction) => {
        if (!correction) return <span className="text-muted">N/A</span>;
        return (
            <Badge bg={correction === 'Fake' ? 'danger' : 'success'}>
                {correction}
            </Badge>
        );
    };

    return (
        // size="lg" để modal rộng hơn một chút
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {/* Thay đổi tiêu đề tùy thuộc vào trạng thái ban đầu? (Tùy chọn) */}
                    {reportDetails?.status === 'pending' ? 'Review Report for Article:' : 'Edit Report Status for Article:'}
                    <span className="fw-normal fst-italic ms-2">{reportDetails?.newsInfo?.title || 'N/A'}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Hiển thị thông tin chi tiết của report */}
                {reportDetails ? (
                    <ListGroup variant="flush">
                        <ListGroup.Item>
                            <strong>Report ID:</strong> {reportDetails._id || 'N/A'}
                        </ListGroup.Item>
                         <ListGroup.Item>
                             {/* Hiển thị thêm thông tin người report nếu có */}
                             <strong>Reported by User:</strong> {reportDetails.reporterDisplay || reportDetails.reporterUserId || 'N/A'}
                         </ListGroup.Item>
                        <ListGroup.Item>
                             <strong>Article ID:</strong> {reportDetails.newsInfo?._id || 'N/A'}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong>System's Original Prediction:</strong> {/* Giả sử bạn có trường này */}
                            {reportDetails.systemPrediction ? (
                                <Badge bg={reportDetails.systemPrediction === 'Fake' ? 'danger' : 'success'}>
                                    {reportDetails.systemPrediction}
                                </Badge>
                             ) : <span className="text-muted">N/A</span>}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong>User's Claimed Correction:</strong> {renderUserCorrectionBadge(reportDetails.userCorrection)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong>Provided Source URL:</strong>{' '}
                            {reportDetails.sourceUrl ? (
                                <a href={reportDetails.sourceUrl} target="_blank" rel="noopener noreferrer">
                                    {reportDetails.sourceUrl}
                                </a>
                            ) : <span className="text-muted">N/A</span> }
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong>User Comments:</strong>
                            <p className="mt-1 mb-0 fst-italic text-muted bg-light p-2 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                                {reportDetails.comments || '(No comments provided)'}
                            </p>
                        </ListGroup.Item>
                        {/* --- DÒNG ĐÃ SỬA --- */}
                        <ListGroup.Item>
                            <strong>Current Status:</strong> {renderStatusBadge(reportDetails.status)}
                        </ListGroup.Item>
                        {/* Hiển thị thêm thông tin nếu report đã được xử lý */}
                        {reportDetails.status !== 'pending' && reportDetails.verifiedAt && (
                             <ListGroup.Item>
                                 <strong>Processed At:</strong> {format(new Date(reportDetails.verifiedAt), 'dd/MM/yyyy HH:mm')} by Admin ID: {reportDetails.verifierUserId || 'N/A'}
                             </ListGroup.Item>
                        )}
                    </ListGroup>
                ) : (
                    <p className="text-center text-danger">Could not load report details.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                {/* Nút Cancel luôn hiển thị */}
                <Button variant="secondary" onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                {/* Các nút cập nhật status - bị disable khi đang loading */}
                {/* Tùy chọn: disable nút tương ứng với trạng thái hiện tại */}
                <Button
                    variant="success"
                    onClick={() => handleStatusUpdate('verified_correct')}
                    disabled={loading || reportDetails?.status === 'verified_correct'} // Disable nếu đang load HOẶC status đã là correct
                    title="Confirm the user's report is correct">
                    {loading ? <Spinner as="span" animation="border" size="sm"/> : "Mark User Correct"}
                </Button>
                <Button
                    variant="dark" // Trước là secondary, đổi thành dark cho khác biệt
                    onClick={() => handleStatusUpdate('verified_incorrect')}
                    disabled={loading || reportDetails?.status === 'verified_incorrect'} // Disable nếu đang load HOẶC status đã là incorrect
                    title="Confirm the system's original prediction was correct">
                     {loading ? <Spinner as="span" animation="border" size="sm"/> : "Mark System Correct"}
                </Button>
                <Button
                     variant="danger" // Đổi thành danger cho rõ nghĩa reject
                     onClick={() => handleStatusUpdate('rejected')}
                     disabled={loading || reportDetails?.status === 'rejected'} // Disable nếu đang load HOẶC status đã là rejected
                     title="Reject this report (e.g., spam, invalid source)">
                      {loading ? <Spinner as="span" animation="border" size="sm"/> : "Reject Report"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ReviewReportModal;