// src/components/History.js (Đã sửa Delete Confirmation)

import React, { useState, useEffect, useCallback } from "react"; // Bỏ useRef nếu không dùng
import axios from "axios";
import { format } from 'date-fns';
// Import thêm Modal từ react-bootstrap
import { Container, Card, Button, Spinner, Alert, Badge, Stack, Collapse, Modal } from 'react-bootstrap';
import ReportModal from './ReportModal';
import { Link } from 'react-router-dom'; // Import Link nếu dùng trong Alert lỗi

// --- START: ConfirmDeleteModal Component ---
// *** KHUYẾN NGHỊ: TÁCH RA FILE RIÊNG ConfirmDeleteModal.js ***
function ConfirmDeleteModal({ show, handleClose, onConfirm, newsTitle, isLoading }) {
     return (
        // size="sm" cho modal nhỏ hơn
        <Modal show={show} onHide={!isLoading ? handleClose : undefined} centered backdrop={isLoading ? 'static' : true} size="sm">
            <Modal.Header closeButton={!isLoading}>
                 <Modal.Title><i className="fas fa-exclamation-triangle text-danger me-2"></i>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                 <p>Are you sure you want to delete this news entry?</p>
                 {/* Hiển thị tiêu đề tin tức cần xóa */}
                 <p className="fw-bold fst-italic">"{newsTitle || 'this item'}"</p>
                 <p className="text-danger small">This action cannot be undone.</p>
             </Modal.Body>
            <Modal.Footer>
                 <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                 <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
                     {isLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Deleting...</> : 'Delete'}
                 </Button>
            </Modal.Footer>
        </Modal>
     );
}
// --- END: ConfirmDeleteModal Component ---


function History() {
    // --- State Hooks ---
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedNewsId, setExpandedNewsId] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingNewsItem, setReportingNewsItem] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null); // Vẫn dùng cho Report/Delete loading

    // *** THÊM STATE CHO CONFIRM DELETE MODAL ***
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deletingNewsItem, setDeletingNewsItem] = useState(null); // Lưu tin tức cần xóa

    // --- Fetch Data Effect (Giữ nguyên) ---
    useEffect(() => {
        setLoading(true);
        setError(null);
        const savedUserString = localStorage.getItem("user");
        let parsedUser = null;
        let token = null;
        let userIdToFetch = null;

        if (savedUserString) {
            try {
                parsedUser = JSON.parse(savedUserString);
                token = parsedUser?.token;
                userIdToFetch = parsedUser?.userId || parsedUser?._id?.toString();
            } catch (e) {
                setError("Invalid user data found. Please log in again.");
                setLoading(false);
                return;
            }
        }

        if (userIdToFetch && token) {
            const historyApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/news/history/${userIdToFetch}` : `http://localhost:5000/api/news/history/${userIdToFetch}`;
            axios.get(historyApiUrl, { headers: { 'Authorization': `Bearer ${token}` } })
                .then((response) => { setNewsList(response.data); setError(null); })
                .catch((err) => {
                    console.error("❌ Lỗi khi lấy lịch sử:", err.response?.data || err.message);
                    if (err.response?.status === 401 || err.response?.status === 403) { setError("Authentication failed or session expired. Please log in again."); }
                    else { setError(err.response?.data?.error || "Failed to load classification history."); }
                    setNewsList([]);
                })
                .finally(() => { setLoading(false); });
        } else {
            setError("Please log in to view classification history.");
            setLoading(false);
        }
    }, []);


    // --- Event Handlers ---

    // *** HÀM MỞ MODAL XÁC NHẬN KHI BẤM NÚT DELETE ***
    const handleDeleteClick = (newsItem) => {
        setDeletingNewsItem(newsItem); // Lưu thông tin item cần xóa (bao gồm cả title)
        setShowConfirmDelete(true);    // Mở modal
    };

     // *** HÀM ĐÓNG MODAL XÁC NHẬN ***
    const handleCloseConfirmDelete = () => {
        setShowConfirmDelete(false);
        setDeletingNewsItem(null); // Reset item cần xóa
        setActionLoadingId(null); // Đảm bảo tắt loading nếu modal bị đóng ngang
    };

    // *** HÀM THỰC HIỆN XÓA KHI USER XÁC NHẬN TRÊN MODAL ***
    const confirmDeleteHandler = async () => {
        if (!deletingNewsItem?._id) return; // Kiểm tra lại

        const newsId = deletingNewsItem._id;
        setActionLoadingId(newsId); // Bật loading cho nút trong modal
        // Không cần setError(null) ở đây, giữ lỗi cũ nếu có thể

        const savedUserString = localStorage.getItem("user");
        let token = null;
        if (savedUserString) { try { token = JSON.parse(savedUserString)?.token; } catch (e) {} }

        if (!token) {
            alert("Authentication token not found. Please log in again.");
            setActionLoadingId(null);
            handleCloseConfirmDelete(); // Đóng modal nếu lỗi xác thực
            return;
        }

        try {
            const deleteApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/news/${newsId}` : `http://localhost:5000/api/news/${newsId}`;
            await axios.delete(deleteApiUrl, { headers: { 'Authorization': `Bearer ${token}` } });

            // Thành công: Cập nhật list, đóng modal, reset state, báo thành công
            setNewsList(currentList => currentList.filter((item) => item._id !== newsId));
            handleCloseConfirmDelete(); // Đóng modal và reset state
            alert("News entry deleted successfully."); // Có thể dùng toast đẹp hơn

        } catch (err) {
            console.error("❌ Error deleting news article:", err.response?.data || err.message);
            let errorMsg = "Failed to delete news entry.";
            if (err.response?.status === 401 || err.response?.status === 403) { errorMsg = "Authentication failed or permission denied."; }
            else if (err.response?.status === 404) { errorMsg = "News entry not found."; }
            else { errorMsg = err.response?.data?.error || "Please try again."; }
            alert(`Error: ${errorMsg}`); // Hiển thị lỗi
            setError(errorMsg); // Có thể set lỗi chung nếu muốn
            // Giữ modal mở khi lỗi để user biết
        } finally {
            // Tắt loading cho nút trong modal DÙ thành công hay thất bại
             // (Trường hợp thành công thì modal đã đóng nên không thấy)
            setActionLoadingId(null);
        }
    };

    // Các handlers khác giữ nguyên
    const handleToggleContent = (newsId) => { /* ... */ setExpandedNewsId(currentId => (currentId === newsId ? null : newsId));};
    const handleOpenReportModal = (newsItem) => { /* ... */ setActionLoadingId(newsItem._id); setReportingNewsItem({ _id: newsItem._id, title: newsItem.title, systemPrediction: newsItem.predicted_label }); setShowReportModal(true);};
    const handleCloseReportModal = () => { /* ... */ setShowReportModal(false); setReportingNewsItem(null); setActionLoadingId(null);};


    // --- Render Logic ---
    if (loading) { /* ... Loading state ... */
        return ( <Container className="text-center mt-5"> <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} /> <p className="text-muted fs-5 mt-3">Loading classification history...</p> </Container> );
    }
    if (error && newsList.length === 0) { /* ... Error state (chỉ hiện lỗi to nếu ko load được list) ... */
        return ( <Container className="mt-5"> <Alert variant="danger" className="d-flex align-items-center shadow-sm"> <i className="fas fa-exclamation-triangle fa-2x me-3"></i> <div> <Alert.Heading as="h5">Error Loading History</Alert.Heading> <p className="mb-0">{error}</p> {error.includes("log in") && <Link to="/login" className="btn btn-sm btn-danger mt-2">Go to Login</Link>} </div> </Alert> </Container> );
    }

    return (
        <Container className="mt-4 mb-5">
            <h2 className="mb-4 fw-bold text-dark">
                <i className="fas fa-history me-2"></i> Classification History
            </h2>
             {/* Hiển thị lỗi nhỏ nếu có lỗi phát sinh khi đang xem list (vd: lỗi xóa) */}
            {error && newsList.length > 0 && (
                 <Alert variant="warning" onClose={() => setError(null)} dismissible className="d-flex align-items-center mb-3">
                    <i className="fas fa-exclamation-circle me-2"></i> {error}
                 </Alert>
            )}

            {newsList.length === 0 && !loading ? ( // Thêm !loading để chắc chắn ko phải đang load
                <Alert variant="info" className="mt-3 shadow-sm">
                    <i className="fas fa-info-circle me-2"></i>
                    You haven't classified any news articles yet. <Alert.Link as={Link} to="/classify">Classify one now!</Alert.Link>
                </Alert>
            ) : (
                newsList.map((news) => {
                    const isExpanded = expandedNewsId === news._id;
                    const predictedLabel = news.predicted_label;
                    // ... (lấy các biến khác)
                    const topFakeWords = news.top_fake_words;

                    return (
                        <Card key={news._id} className="mb-3 shadow-sm">
                            <Card.Header className="d-flex justify-content-between align-items-center bg-light py-2">
                                 <h5 className="mb-0 fw-bold">{news.title || "(No Title)"}</h5>
                                <small className="text-muted flex-shrink-0 ms-2">
                                    {news.createdAt ? format(new Date(news.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                                </small>
                            </Card.Header>
                            <Card.Body className="p-3">
                                 {/* ... (Phần hiển thị Category, Prediction, Top Words giữ nguyên) ... */}
                                 <p className="mb-2 small text-muted"> <strong>Category:</strong> {news.category || "N/A"} </p>
                                 <div className="mb-3"> {/* Kết quả phân loại */}
                                     {predictedLabel && ( <Badge pill bg={predictedLabel === 'Fake' ? 'danger' : 'success'} className="me-2 fs-6">{predictedLabel}</Badge> )}
                                     <small className="text-muted align-middle"> (Fake: {typeof news.fake_probability === 'number' ? news.fake_probability.toFixed(1) : 'N/A'}% | Real: {typeof news.real_probability === 'number' ? news.real_probability.toFixed(1) : 'N/A'}%) </small>
                                     {news.detected_language && <small className="text-muted ms-3 align-middle"><i className="fas fa-language me-1"></i>{news.detected_language}</small>}
                                 </div>
                                 {topFakeWords && Array.isArray(topFakeWords) && topFakeWords.length > 0 && ( /* Top Words */
                                     <div className="mb-3"> <p className="mb-1 small text-primary fw-bold"><i className="fas fa-tags me-1"></i> Influential Words (for "Fake"):</p> <div className="mt-1"> {topFakeWords.slice(0, 7).map((word, index) => ( <Badge bg="secondary" key={index} className="me-1 mb-1 fw-normal">{word}</Badge> ))} {topFakeWords.length > 7 && <Badge bg="light" text="dark" className="mb-1 fw-normal">...</Badge>} </div> </div>
                                 )}

                                <Collapse in={isExpanded}>
                                    <div id={`collapse-${news._id}`} className="mt-2">
                                        <Card className="bg-light border">
                                            <Card.Header className="py-1 px-3 small text-muted text-uppercase fw-bold"> Full Content </Card.Header>
                                            <Card.Body className="p-3" style={{ maxHeight: '250px', overflowY: 'auto', fontSize: '0.9em' }}>
                                                 <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}> {news.content || "(Content not available)"} </p>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                </Collapse>

                                {/* Các nút chức năng */}
                                <Stack direction="horizontal" gap={2} className="mt-3 pt-3 border-top justify-content-end">
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleToggleContent(news._id)} aria-controls={`collapse-${news._id}`} aria-expanded={isExpanded} >
                                         <i className={`fas ${isExpanded ? 'fa-eye-slash' : 'fa-eye'} me-1`}></i> {isExpanded ? 'Hide' : 'Show'} Content
                                    </Button>
                                    {predictedLabel && (
                                        <Button variant="outline-warning" size="sm" title="Report incorrect classification" onClick={() => handleOpenReportModal(news)} disabled={actionLoadingId === news._id} >
                                             {actionLoadingId === news._id && showReportModal ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1"/> : <i className="fas fa-flag me-1"></i> } Report
                                         </Button>
                                    )}
                                    {/* *** SỬA onClick CỦA NÚT DELETE *** */}
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(news)} /* Truyền cả news item */ disabled={actionLoadingId === news._id && !showReportModal && !showConfirmDelete} >
                                        {/* Vẫn giữ spinner loading nếu đang xóa hoặc đang mở modal report/confirm */}
                                        {actionLoadingId === news._id && !showReportModal && !showConfirmDelete ?
                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1"/>
                                            : <i className="fas fa-trash me-1"></i>
                                        }
                                        Delete
                                    </Button>
                                </Stack>
                            </Card.Body>
                        </Card>
                    );
                })
            )}

            {/* --- RENDER MODALS --- */}
            {/* Report Modal */}
            {showReportModal && reportingNewsItem && (
                <ReportModal
                    show={showReportModal}
                    handleClose={handleCloseReportModal}
                    newsItem={reportingNewsItem}
                />
            )}
            {/* *** THÊM CONFIRM DELETE MODAL *** */}
            {showConfirmDelete && deletingNewsItem && (
                 <ConfirmDeleteModal
                     show={showConfirmDelete}
                     handleClose={handleCloseConfirmDelete}
                     onConfirm={confirmDeleteHandler}
                     newsTitle={deletingNewsItem.title} // Truyền title vào modal
                     isLoading={actionLoadingId === deletingNewsItem._id} // Lấy loading từ actionLoadingId
                 />
            )}

        </Container>
    );
}

export default History;