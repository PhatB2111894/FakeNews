// src/page/admin/ManageNews.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
// Import các component cần thiết từ react-bootstrap
import {
    Container, Card, Button, Pagination, Spinner, Alert, Form, Table, Badge, ListGroup, InputGroup, Row, Col, Stack,
    Modal // <--- Thêm Modal
} from 'react-bootstrap';
import { format } from 'date-fns';
import ViewNewsModal from './ViewNewsModal';       // Giả định component này tồn tại
import ReviewReportModal from './ReviewReportModal'; // Giả định component này tồn tại
import useDebounce from './useDebounce'; // **Đảm bảo đường dẫn đúng**

function ManageNews() {
    // --- State Hooks (Thêm state cho modal xóa) ---
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null); // ID cho spinner khi thực hiện action (delete, review)
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingNewsItem, setViewingNewsItem] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingReportDetails, setReviewingReportDetails] = useState(null);
    const ITEMS_PER_PAGE = 10;
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionLoading, setSuggestionLoading] = useState(false);
    const searchWrapperRef = useRef(null);
    const debouncedSearchInput = useDebounce(searchInput, 400);
    const fetchNewsRef = useRef();

    // State mới cho Modal xác nhận xóa
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [deletingNewsItem, setDeletingNewsItem] = useState(null); // Lưu trữ news item sắp xóa

    // --- API URL Builder (Giữ nguyên) ---
    const getApiUrl = useCallback((endpoint) => {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        return `${baseUrl}/api/news/admin${endpoint}`;
    }, []);

    // --- Hàm Fetch News (Giữ nguyên) ---
    const fetchNewsData = useCallback(async (pageToFetch, searchToUse) => {
        setLoading(true);
        console.log("Fetching news with params:", { page: pageToFetch, limit: ITEMS_PER_PAGE, search: searchToUse });
        try {
            let token = null;
            const storedUserString = localStorage.getItem('user');
            if (storedUserString) { try { token = JSON.parse(storedUserString)?.token; } catch (e) { /* Handle */ } }
            if (!token) { throw new Error("Auth token is missing."); }

            const response = await axios.get(getApiUrl('/list'), {
                params: { page: pageToFetch, limit: ITEMS_PER_PAGE, search: searchToUse },
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            });

            setError(null);
            setNewsList(response.data.news || []);
            const receivedTotalPages = response.data.totalPages || 1;
            setTotalPages(receivedTotalPages);

            if (pageToFetch > receivedTotalPages && receivedTotalPages > 0) {
                setCurrentPage(receivedTotalPages);
            }
        } catch (err) {
             console.error("Error fetching news:", err);
             let errorMsg = "Failed to fetch news data.";
             if (err.code === 'ECONNABORTED') errorMsg = "Request timed out.";
             else if (err.response) errorMsg = `Error ${err.response.status}: ${err.response.data?.error || 'Server error'}`;
             else if (err.request) errorMsg = "No response from server.";
             else errorMsg = err.message;
             setError(errorMsg);
             setNewsList([]); setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [ITEMS_PER_PAGE, getApiUrl]);

    // --- Các hooks và handlers khác (Giữ nguyên logic, cập nhật URL nếu cần) ---
    useEffect(() => { fetchNewsRef.current = fetchNewsData; });
    const fetchSuggestions = useCallback(async (query) => { /* ... (Giữ nguyên) ... */ }, [getApiUrl]);
    useEffect(() => { fetchNewsRef.current(currentPage, searchTerm); }, [currentPage, refreshKey, searchTerm]);
    useEffect(() => { if (debouncedSearchInput) { fetchSuggestions(debouncedSearchInput); } else { setSuggestions([]); setShowSuggestions(false); } }, [debouncedSearchInput, fetchSuggestions]);
    useEffect(() => { function handleClickOutside(event) { if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) { setShowSuggestions(false); } } document.addEventListener("mousedown", handleClickOutside); return () => { document.removeEventListener("mousedown", handleClickOutside); }; }, [searchWrapperRef]);
    const handleInputChange = useCallback((e) => { setSearchInput(e.target.value); }, []);
    const handleSuggestionClick = useCallback((suggestion) => { setSearchInput(suggestion.title); setSuggestions([]); setShowSuggestions(false); }, []);
    const handleSearchClick = useCallback(() => { if (searchInput !== searchTerm || currentPage !== 1) { setSearchTerm(searchInput); setCurrentPage(1); } else { setRefreshKey(prev => prev + 1); } setShowSuggestions(false); }, [searchInput, searchTerm, currentPage]);
    const handleClearSearch = useCallback(() => { if (searchInput || searchTerm) { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); } setSuggestions([]); setShowSuggestions(false); }, [searchInput, searchTerm]);
    const handlePageChange = useCallback((pageNumber) => { if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) { setCurrentPage(pageNumber); } }, [totalPages, currentPage]);

    // --- Modal Handlers (View, Review - Giữ nguyên) ---
    const handleOpenViewModal = useCallback((newsItem) => { setViewingNewsItem(newsItem); setShowViewModal(true); }, []);
    const handleCloseViewModal = useCallback(() => { setShowViewModal(false); setViewingNewsItem(null); }, []);
    const handleOpenReviewModal = useCallback(async (newsItem) => { /* ... (Giữ nguyên) ... */ }, []);
    const handleCloseReviewModal = useCallback(() => { setShowReviewModal(false); setReviewingReportDetails(null); setActionLoadingId(null); }, []);
    const handleUpdateReportStatus = useCallback(async (reportId, newStatus) => { /* ... (Giữ nguyên) ... */ }, [reviewingReportDetails, handleCloseReviewModal]);
    const renderReportStatus = useCallback((status) => { /* ... (Giữ nguyên) ... */ }, []);

    // --- Delete Handlers (Cập nhật để dùng Modal) ---

    // 1. Hàm mở Modal xác nhận xóa
    const handleOpenDeleteConfirmModal = useCallback((newsItem) => {
        setDeletingNewsItem(newsItem);      // Lưu item cần xóa
        setShowDeleteConfirmModal(true);    // Hiển thị modal
    }, []);

    // 2. Hàm đóng Modal xác nhận xóa
    const handleCloseDeleteConfirmModal = useCallback(() => {
        setShowDeleteConfirmModal(false);
        // Không cần reset deletingNewsItem ngay lập tức, nó sẽ được ghi đè lần sau
        // Chỉ reset actionLoadingId nếu quá trình xóa chưa bắt đầu hoặc đã hoàn tất
        if (actionLoadingId === deletingNewsItem?._id) {
             // Có thể reset actionLoadingId ở đây nếu muốn, nhưng thường làm trong finally của confirmDelete
        }
    }, [actionLoadingId, deletingNewsItem]); // Thêm dependency

    // 3. Hàm thực hiện việc xóa (được gọi từ Modal)
    const confirmDelete = useCallback(async () => {
        if (!deletingNewsItem) return; // Thoát nếu không có item nào được chọn

        setActionLoadingId(deletingNewsItem._id); // Bắt đầu loading cho item này
        setError(null);

        try {
            let token = null;
            const storedUserString = localStorage.getItem('user');
            if (storedUserString) { try { token = JSON.parse(storedUserString)?.token; } catch (e) { /* Handle */ } }
            if (!token) throw new Error("Token not found.");

            // !! Endpoint xóa tin tức (Giữ nguyên logic URL)
            const deleteUrl = process.env.REACT_APP_API_URL
                ? `${process.env.REACT_APP_API_URL}/api/news/${deletingNewsItem._id}`
                : `http://localhost:5000/api/news/${deletingNewsItem._id}`;

            await axios.delete(deleteUrl, { headers: { 'Authorization': `Bearer ${token}` } });

            // alert(`News article "${deletingNewsItem.title}" deleted successfully.`); // Có thể bỏ alert này nếu không muốn
            setError(null); // Xóa lỗi cũ nếu có

            // Logic làm mới danh sách sau khi xóa thành công
            if (newsList.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1); // Quay về trang trước nếu là item cuối cùng của trang > 1
            } else {
                setRefreshKey(prevKey => prevKey + 1); // Tải lại trang hiện tại
            }

        } catch (err) {
            console.error("Error deleting news:", err);
            const errorMsg = err.response?.data?.error || "Failed to delete news.";
            setError(errorMsg); // Hiển thị lỗi ở Alert chính
            // alert(`Error: ${errorMsg}`); // Có thể bỏ alert lỗi, vì đã có Alert component
        } finally {
            handleCloseDeleteConfirmModal(); // Đóng modal sau khi xử lý xong (thành công hoặc thất bại)
            setActionLoadingId(null);        // Dừng loading
            setDeletingNewsItem(null);       // Xóa item đang chờ xóa khỏi state
        }
    }, [deletingNewsItem, newsList.length, currentPage, handleCloseDeleteConfirmModal, getApiUrl]); // Thêm dependencies


    // --- JSX Rendering ---
    return (
        <Container fluid="lg" className="mt-4 mb-5">
            {/* Tiêu đề trang (Giữ nguyên) */}
            <h2 className="mb-4 text-dark">
                <i className="fas fa-newspaper me-2"></i> News Management
            </h2>

            {/* Card chứa Controls và Table (Giữ nguyên Search) */}
            <Card className="shadow-sm">
                 <Card.Header className="bg-light p-3">
                    {/* Search Controls (Giữ nguyên) */}
                    <Row className="g-2 align-items-center">
                        <Col md={10}>
                            <div ref={searchWrapperRef} style={{ position: 'relative' }}>
                                <InputGroup>
                                     {/* ... InputGroup JSX ... */}
                                    <InputGroup.Text style={{backgroundColor: 'transparent', borderRight: 'none'}}>
                                        <i className="fas fa-search text-muted"></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by News Title..."
                                        value={searchInput}
                                        onChange={handleInputChange}
                                        onFocus={() => debouncedSearchInput && suggestions.length > 0 && setShowSuggestions(true)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                                        disabled={loading && !newsList.length}
                                        aria-label="Search news title"
                                        autoComplete="off"
                                        style={{borderLeft: 'none', boxShadow: 'none'}}
                                    />
                                    {searchInput && <Button variant="outline-secondary" onClick={handleClearSearch} disabled={loading || suggestionLoading} size="sm" className="border-start-0" style={{ zIndex: 3 }} title="Clear Search"><i className="fas fa-times"></i></Button>}
                                    {suggestionLoading && (
                                        <InputGroup.Text><Spinner animation="border" size="sm" variant="secondary" /></InputGroup.Text>
                                    )}
                                </InputGroup>
                                {/* Suggestion List (Giữ nguyên) */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <ListGroup style={{ position: 'absolute', zIndex: 1050, width: '100%', maxHeight: '250px', overflowY: 'auto', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 .25rem .25rem', boxShadow: '0 .5rem 1rem rgba(0,0,0,.15)' }}>
                                        {suggestions.map((suggestion) => (
                                            <ListGroup.Item key={suggestion._id} action onClick={() => handleSuggestionClick(suggestion)} className="py-2 px-3 text-truncate">
                                                {suggestion.title}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </div>
                        </Col>
                        <Col md={2}>
                            <Button variant="primary" type="button" onClick={handleSearchClick} disabled={loading || suggestionLoading} className="w-100">
                                {loading && !suggestionLoading ? <Spinner as="span" animation="border" size="sm" /> : <><i className="fas fa-search me-1"></i> Search</>}
                            </Button>
                        </Col>
                    </Row>
                 </Card.Header>

                 <Card.Body className="p-0">
                    {/* Loading / Error (Giữ nguyên) */}
                    {(loading && newsList.length === 0 && !error) && <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p className="mt-2 text-muted">Loading news articles...</p></div>}
                    {error && (<Alert variant="danger" onClose={() => setError(null)} dismissible className="m-3 d-flex align-items-center"> <i className="fas fa-exclamation-triangle me-2"></i> <strong>Error:</strong> {error}</Alert>)}

                    {/* News Table */}
                    {!(error && newsList.length === 0) && (
                        <div className={`table-responsive ${loading && newsList.length > 0 ? 'opacity-75 position-relative' : ''}`}>
                            {loading && newsList.length > 0 && ( /* Spinner overlay */
                                <div className="position-absolute top-50 start-50 translate-middle" style={{zIndex: 10}}>
                                    <Spinner animation="border" variant="secondary" />
                                </div>
                            )}
                            <Table striped hover responsive="lg" className="align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{width:'40%'}}>Title</th>
                                        <th>Category</th>
                                        <th className='text-center'>Prediction</th>
                                        <th>Created At</th>
                                        <th className='text-center'>Report Status</th>
                                        <th style={{ minWidth: '130px', width: '130px' }} className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && newsList.length === 0 && !error && ( <tr><td colSpan="6" className="text-center text-muted py-4">No news articles found matching your criteria.</td></tr> )}
                                    {newsList.map((news) => (
                                        <tr key={news._id} className={actionLoadingId === news._id ? 'table-warning' : ''}>
                                            {/* Title, Category, Prediction, Created At, Report Status (Giữ nguyên) */}
                                            <td>
                                                <span title={news.title} className="d-inline-block text-truncate" style={{ maxWidth: '350px' }}>
                                                    {news.title}
                                                </span>
                                            </td>
                                            <td>{news.category || <span className="text-muted small">N/A</span>}</td>
                                            <td className='text-center'>
                                                 {news.predicted_label ? (
                                                     <Stack direction="vertical" gap={1} className="align-items-center">
                                                         <Badge bg={news.predicted_label === 'Fake' ? 'danger' : 'success'} pill>{news.predicted_label}</Badge>
                                                         <small className="text-muted">
                                                             ({news.fake_probability?.toFixed(1)}% F|{news.real_probability?.toFixed(1)}% R)
                                                         </small>
                                                     </Stack>
                                                 ) : <span className="text-muted small">N/A</span>}
                                            </td>
                                             <td>
                                                 <span title={news.createdAt ? format(new Date(news.createdAt), 'PPPPpp') : ''}>
                                                      {news.createdAt ? format(new Date(news.createdAt), 'dd/MM/yy HH:mm') : <span className="text-muted small">N/A</span>}
                                                  </span>
                                              </td>
                                              <td className='text-center'>{renderReportStatus(news.reportStatus)}</td>
                                              <td className="text-center">
                                                  <Stack direction="horizontal" gap={1} className="justify-content-center">
                                                      {/* View Button (Giữ nguyên) */}
                                                      <Button variant="outline-info" size="sm" className="rounded-circle p-1 lh-1" onClick={() => handleOpenViewModal(news)} title="View Details" disabled={loading || actionLoadingId === news._id}>
                                                          <i className="fas fa-eye fa-fw"></i>
                                                      </Button>
                                                      {/* Review/Edit Button (Giữ nguyên) */}
                                                      {news.reportStatus && news.reportStatus !== 'no_report' ? (
                                                          news.reportStatus === 'pending' ? (
                                                              <Button variant="outline-warning" size="sm" className="rounded-circle p-1 lh-1" onClick={() => handleOpenReviewModal(news)} title="Review Pending Report" disabled={actionLoadingId === news._id || loading}>
                                                                  {actionLoadingId === news._id && reviewingReportDetails?.newsInfo?._id === news._id ? <Spinner as="span" animation="border" size="sm"/> : <i className="fas fa-flag-checkered fa-fw"></i>}
                                                              </Button>
                                                          ) : (
                                                              <Button variant="outline-secondary" size="sm" className="rounded-circle p-1 lh-1" onClick={() => handleOpenReviewModal(news)} title="Edit Report Status" disabled={actionLoadingId === news._id || loading}>
                                                                  {actionLoadingId === news._id && reviewingReportDetails?.newsInfo?._id === news._id ? <Spinner as="span" animation="border" size="sm"/> : <i className="fas fa-edit fa-fw"></i>}
                                                              </Button>
                                                          )
                                                      ) : null}

                                                      {/* === Delete Button (Cập nhật onClick) === */}
                                                      <Button
                                                          variant="outline-danger"
                                                          size="sm"
                                                          className="rounded-circle p-1 lh-1"
                                                          onClick={() => handleOpenDeleteConfirmModal(news)} // <--- Gọi hàm mở modal
                                                          title="Delete News"
                                                          // Disable nếu đang loading chung hoặc action khác đang chạy trên item này
                                                          disabled={loading || (actionLoadingId && actionLoadingId !== news._id)}
                                                      >
                                                          {/* Spinner chỉ hiện khi đang xóa CHÍNH XÁC item này (kiểm tra trong modal) */}
                                                          <i className="fas fa-trash fa-fw"></i>
                                                      </Button>
                                                  </Stack>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </Table>
                          </div>
                      )}
                   </Card.Body>

                   {/* Pagination (Giữ nguyên) */}
                   {!error && totalPages > 1 && (
                        <Card.Footer className="d-flex justify-content-center border-top-0 pt-3 bg-light">
                            <Pagination size="sm">
                                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} />
                                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} />
                                {(() => { /* ... Pagination logic ... */ })()}
                                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} />
                                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || loading} />
                            </Pagination>
                        </Card.Footer>
                   )}
            </Card>

            {/* Thông tin số lượng (Giữ nguyên) */}
            {!loading && !error && newsList.length > 0 && totalPages > 1 && (
                 <div className="text-center text-muted mt-2 small">
                     Showing {newsList.length} news article(s) on page {currentPage} of {totalPages}.
                 </div>
             )}

            {/* === Render Modals === */}
            {/* View Modal (Giữ nguyên) */}
            {showViewModal && viewingNewsItem && ( <ViewNewsModal show={showViewModal} handleClose={handleCloseViewModal} newsItem={viewingNewsItem} /> )}
            {/* Review Modal (Giữ nguyên) */}
            {showReviewModal && reviewingReportDetails && ( <ReviewReportModal show={showReviewModal} handleClose={handleCloseReviewModal} reportDetails={reviewingReportDetails} onUpdateStatus={handleUpdateReportStatus} isLoading={actionLoadingId === reviewingReportDetails?.newsInfo?._id || actionLoadingId === reviewingReportDetails?._id} /> )}

            {/* === Delete Confirmation Modal === */}
            <Modal show={showDeleteConfirmModal} onHide={handleCloseDeleteConfirmModal} centered>
                 <Modal.Header closeButton>
                     <Modal.Title>
                         <i className="fas fa-exclamation-triangle text-danger me-2"></i> Confirm Deletion
                     </Modal.Title>
                 </Modal.Header>
                 <Modal.Body>
                     Are you sure you want to permanently delete the news article:
                     <br />
                     <strong>"{deletingNewsItem?.title}"</strong>?
                     <p className="text-danger mt-2 mb-0">This action cannot be undone.</p>
                 </Modal.Body>
                 <Modal.Footer>
                     <Button
                         variant="secondary"
                         onClick={handleCloseDeleteConfirmModal}
                         // Disable nút Cancel nếu đang trong quá trình xóa item này
                         disabled={actionLoadingId === deletingNewsItem?._id}
                     >
                         Cancel
                     </Button>
                     <Button
                         variant="danger"
                         onClick={confirmDelete}
                         // Disable nút Delete nếu đang trong quá trình xóa item này
                         disabled={actionLoadingId === deletingNewsItem?._id}
                     >
                         {actionLoadingId === deletingNewsItem?._id ? (
                             <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Deleting...</>
                         ) : (
                             'Delete Permanently'
                         )}
                     </Button>
                 </Modal.Footer>
             </Modal>

        </Container> // End container
    );
}

export default ManageNews;