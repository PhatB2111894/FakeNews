// src/page/admin/ManageUsers.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
// Import đầy đủ các component cần thiết
import { Container, Card, Button, Pagination, Spinner, Alert, InputGroup, Table, Badge, Modal, Form, ListGroup, Image, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import useDebounce from './useDebounce'; // Giả sử hook nằm trong src/hooks/

// --- START: UserFormModal Component ---
// *** KHUYẾN NGHỊ: TÁCH RA FILE RIÊNG ***
function UserFormModal({ show, handleClose, onSave, initialData, isLoading }) {
    const isEditMode = Boolean(initialData);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            if (isEditMode) {
                setFormData({
                    username: initialData.username || '', email: initialData.email || '',
                    role: initialData.role || 'user', fullName: initialData.fullName || '',
                    phone: initialData.phone || '', gender: initialData.gender || '',
                    // Không load password vào form khi edit
                });
            } else {
                setFormData({
                    username: '', email: '', password: '', confirmPassword: '',
                    role: 'user', fullName: '', phone: '', gender: '',
                });
            }
            setErrors({});
        }
    }, [show, initialData, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (name === 'password' || name === 'confirmPassword') {
            if (errors.passwordMatch) setErrors(prev => ({ ...prev, passwordMatch: null }));
            if (errors.password) setErrors(prev => ({ ...prev, password: null }));
        }
    };

    const validateForm = () => {
        // ... (Giữ nguyên logic validate) ...
        const newErrors = {};
        if (!formData.username?.trim()) newErrors.username = "Username is required.";
        if (!formData.email?.trim()) newErrors.email = "Email is required.";
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
             newErrors.email = "Email address is invalid.";
        }
        if (!isEditMode) {
             if (!formData.password) {
                 newErrors.password = "Password is required.";
             } else if (formData.password.length < 6) {
                 newErrors.password = "Password must be at least 6 characters long.";
             }
             if (!formData.confirmPassword) {
                 newErrors.passwordMatch = "Please confirm your password.";
             } else if (formData.password && formData.password !== formData.confirmPassword) {
                 newErrors.passwordMatch = "Passwords do not match.";
             }
        }
         // Thêm validate cho các trường khác nếu cần (ví dụ: phone format)
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const dataToSend = { ...formData };
            delete dataToSend.confirmPassword;
            if (isEditMode && !dataToSend.password?.trim()) { // Kiểm tra trim() nếu edit
                delete dataToSend.password;
            }
            onSave(dataToSend);
        }
    };

    return (
        <Modal show={show} onHide={!isLoading ? handleClose : undefined} centered backdrop={isLoading ? 'static' : true}>
            <Modal.Header closeButton={!isLoading}>
                 <Modal.Title>
                    <i className={`fas ${isEditMode ? 'fa-user-edit' : 'fa-user-plus'} me-2`}></i>
                    {isEditMode ? `Edit User: ${initialData?.username}` : 'Add New User'}
                 </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Body>
                     {/* Sử dụng Row/Col để bố cục form đẹp hơn */}
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="modalFormUsername">
                                <Form.Label>Username</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text><i className="fas fa-user fa-fw"></i></InputGroup.Text>
                                    <Form.Control type="text" placeholder="Enter username" name="username" value={formData.username || ''} onChange={handleChange} isInvalid={!!errors.username} required disabled={isLoading}/>
                                    <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="modalFormEmail">
                                <Form.Label>Email address</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text><i className="fas fa-envelope fa-fw"></i></InputGroup.Text>
                                    <Form.Control type="email" placeholder="Enter email" name="email" value={formData.email || ''} onChange={handleChange} isInvalid={!!errors.email} required disabled={isLoading}/>
                                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                </InputGroup>
                             </Form.Group>
                        </Col>
                    </Row>

                    {!isEditMode && (
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="modalFormPassword">
                                    <Form.Label>Password</Form.Label>
                                     <InputGroup hasValidation>
                                        <InputGroup.Text><i className="fas fa-key fa-fw"></i></InputGroup.Text>
                                        <Form.Control type="password" placeholder="Password (min 6 chars)" name="password" value={formData.password || ''} onChange={handleChange} isInvalid={!!errors.password} required disabled={isLoading}/>
                                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="modalFormConfirmPassword">
                                    <Form.Label>Confirm Password</Form.Label>
                                     <InputGroup hasValidation>
                                         <InputGroup.Text><i className="fas fa-key fa-fw"></i></InputGroup.Text>
                                         <Form.Control type="password" placeholder="Confirm Password" name="confirmPassword" value={formData.confirmPassword || ''} onChange={handleChange} isInvalid={!!errors.passwordMatch} required disabled={isLoading}/>
                                         <Form.Control.Feedback type="invalid">{errors.passwordMatch}</Form.Control.Feedback>
                                     </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                     {/* Có thể thêm mục đổi password riêng khi Edit */}

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="modalFormFullName">
                                <Form.Label>Full Name</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><i className="fas fa-id-card fa-fw"></i></InputGroup.Text>
                                    <Form.Control type="text" placeholder="Enter full name" name="fullName" value={formData.fullName || ''} onChange={handleChange} disabled={isLoading}/>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="modalFormPhone">
                                <Form.Label>Phone</Form.Label>
                                <InputGroup>
                                     <InputGroup.Text><i className="fas fa-phone fa-fw"></i></InputGroup.Text>
                                     <Form.Control type="tel" placeholder="Enter phone number" name="phone" value={formData.phone || ''} onChange={handleChange} disabled={isLoading}/>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                         <Col md={6}>
                            <Form.Group className="mb-3" controlId="modalFormGender">
                                <Form.Label>Gender</Form.Label>
                                 <InputGroup>
                                    <InputGroup.Text><i className="fas fa-venus-mars fa-fw"></i></InputGroup.Text>
                                    <Form.Select name="gender" value={formData.gender || ''} onChange={handleChange} disabled={isLoading} aria-label="Select gender">
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="modalFormRole">
                                <Form.Label>Role</Form.Label>
                                 <InputGroup>
                                      <InputGroup.Text><i className="fas fa-user-tag fa-fw"></i></InputGroup.Text>
                                      <Form.Select name="role" value={formData.role || 'user'} onChange={handleChange} disabled={isLoading} aria-label="Select user role">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                      </Form.Select>
                                 </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={isLoading}>
                        {isLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Saving...</> : (isEditMode ? 'Save Changes' : 'Add User')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
// --- END: UserFormModal Component ---


// --- START: ConfirmDeleteModal Component ---
// *** KHUYẾN NGHỊ: TÁCH RA FILE RIÊNG ***
function ConfirmDeleteModal({ show, handleClose, onConfirm, userName, isLoading }) {
     return (
        <Modal show={show} onHide={!isLoading ? handleClose : undefined} centered backdrop={isLoading ? 'static' : true} size="sm"> {/* Size nhỏ hơn */}
            <Modal.Header closeButton={!isLoading}>
                 <Modal.Title><i className="fas fa-exclamation-triangle text-danger me-2"></i>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you sure you want to delete user <strong>{userName || 'this user'}</strong>? This action cannot be undone.</Modal.Body>
            <Modal.Footer>
                 <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                 <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
                     {isLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Deleting...</> : 'Delete User'}
                 </Button>
            </Modal.Footer>
        </Modal>
     );
}
// --- END: ConfirmDeleteModal Component ---


// --- START: UserDetailsModal Component ---
// *** KHUYẾN NGHỊ: TÁCH RA FILE RIÊNG ***
function UserDetailsModal({ show, handleClose, user, renderRoleBadge }) {
    const renderInfo = (label, value, iconClass, formatFn) => { // Thêm iconClass
        const displayValue = value ? (formatFn ? formatFn(value) : value) : <span className="text-muted fst-italic">N/A</span>;
        return (
            <ListGroup.Item className="px-0 py-2"> {/* Bỏ padding mặc định, dùng py-2 */}
                <Row>
                    <Col xs={4} md={3} className="text-muted d-flex align-items-center"> {/* Cột label */}
                         <i className={`fas ${iconClass} fa-fw me-2`}></i> {label}
                     </Col>
                    <Col xs={8} md={9}> {/* Cột value */}
                        {displayValue}
                         {label === 'Email' && value && <Button variant="link" size="sm" className="p-0 ms-2" onClick={() => navigator.clipboard.writeText(value)} title="Copy email"><i className="far fa-copy"></i></Button>}
                         {label === 'Database ID' && value && <Button variant="link" size="sm" className="p-0 ms-2" onClick={() => navigator.clipboard.writeText(value)} title="Copy ID"><i className="far fa-copy"></i></Button>}
                    </Col>
                </Row>
             </ListGroup.Item>
         );
    };
    const formatDate = (dateString) => {
       try {
           // Định dạng ngày giờ theo chuẩn Việt Nam
            return format(new Date(dateString), 'HH:mm:ss dd/MM/yyyy');
       } catch (e) { return dateString; }
     };

     // Xử lý link avatar
     const serverBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"; // Lấy từ env
     const defaultPlaceholder = 'https://via.placeholder.com/120?text=No+Avatar';
     const avatarUrl = user?.avatar
         ? `${serverBaseUrl}/uploads/avatars/${user.avatar.replace(/\\/g, '/')}?t=${new Date().getTime()}` // Thêm cache buster
         : defaultPlaceholder;

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                 <Modal.Title><i className="fas fa-address-card me-2"></i>User Details: {user?.username}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {user ? (
                    <Row>
                        <Col md={4} className="text-center mb-3 mb-md-0">
                            <Image
                                src={avatarUrl}
                                roundedCircle
                                fluid // Responsive hơn
                                thumbnail // Thêm viền
                                alt={`${user.username}'s avatar`}
                                className="mb-2 shadow-sm"
                                style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }} // Giới hạn kích thước
                                onError={(e) => { e.target.onerror = null; e.target.src = defaultPlaceholder; }}
                             />
                            <div>{renderRoleBadge(user.role)}</div>
                        </Col>
                        <Col md={8}>
                            <ListGroup variant="flush">
                                {renderInfo("Username", user.username, "fa-user-tag")}
                                {renderInfo("Email", user.email, "fa-envelope")}
                                {renderInfo("Full Name", user.fullName, "fa-id-card")}
                                {renderInfo("Phone", user.phone, "fa-phone")}
                                {renderInfo("Gender", user.gender, "fa-venus-mars")}
                                {renderInfo("User ID (Custom)", user.userId, "fa-fingerprint")}
                                {renderInfo("Database ID", user._id, "fa-database")}
                                {renderInfo("Joined", user.createdAt, "fa-calendar-plus", formatDate)}
                                {renderInfo("Last Updated", user.updatedAt, "fa-calendar-check", formatDate)}
                            </ListGroup>
                        </Col>
                    </Row>
                ) : ( <Alert variant="warning">No user data available.</Alert> )}
            </Modal.Body>
            <Modal.Footer> <Button variant="outline-secondary" onClick={handleClose}> Close </Button> </Modal.Footer>
        </Modal>
    );
}
// --- END: UserDetailsModal Component ---


// --- START: ManageUsers Component ---
function ManageUsers() {
    // --- State Hooks (Giữ nguyên) ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const USERS_PER_PAGE = 10;
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionLoading, setSuggestionLoading] = useState(false);
    const searchWrapperRef = useRef(null);
    const debouncedSearchInput = useDebounce(searchInput, 400);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
    const fetchUsersDataRef = useRef();


    // --- Helper Render Role Badge (Giữ nguyên) ---
    const renderRoleBadge = useCallback((role) => {
       switch (role?.toLowerCase()) {
           case 'admin': return <Badge bg="danger" pill>Admin</Badge>;
           case 'user': return <Badge bg="primary" pill>User</Badge>;
           default: return <Badge bg="secondary" pill>{role || 'Unknown'}</Badge>;
       }
    }, []);

    // --- API URL Builder ---
    const getApiUrl = useCallback((endpoint) => {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        return `${baseUrl}/api/users/admin${endpoint}`; // Thêm /admin vào base
    }, []);


    // --- Hàm Fetch Users (Cập nhật URL) ---
    const fetchUsersData = useCallback(async (pageToFetch, searchToUse) => {
       setLoading(true);
       console.log(`Workspaceing users: page=${pageToFetch}, search='${searchToUse}'`);
       try {
           const tokenData = localStorage.getItem('user');
           const token = tokenData ? JSON.parse(tokenData)?.token : null;
           if (!token) throw new Error("Token not found. Please login.");

           const response = await axios.get(getApiUrl('/list'), { // Dùng getApiUrl
               params: { page: pageToFetch, limit: USERS_PER_PAGE, search: searchToUse },
               headers: { 'Authorization': `Bearer ${token}` },
               timeout: 15000
           });
           setError(null);
           setUsers(response.data.users || []);
           const receivedTotalPages = response.data.totalPages || 1;
           setTotalPages(receivedTotalPages);
           if (pageToFetch > receivedTotalPages && receivedTotalPages > 0) {
               setCurrentPage(receivedTotalPages);
           }
       } catch (err) { /* ... (Giữ nguyên xử lý lỗi) ... */
            console.error("Error fetching users:", err);
            let errorMsg = "Failed to fetch users.";
            if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) { errorMsg = "Request timed out."; }
            else if (err.response) { errorMsg = err.response.data?.error || `Server error (${err.response.status})`; if(err.response.status === 401 || err.response.status === 403){ errorMsg += " Please login again."; } }
            else if (err.request) { errorMsg = "No response from server."; }
            else { errorMsg = err.message; }
            setError(errorMsg);
            setUsers([]); setTotalPages(1);
        } finally {
           setLoading(false);
       }
    }, [USERS_PER_PAGE, getApiUrl]); // Thêm getApiUrl vào dependency

    // ... (Các useEffect, handlers khác giữ nguyên logic nhưng cập nhật API URL dùng getApiUrl) ...

     useEffect(() => { fetchUsersDataRef.current = fetchUsersData; });

      const fetchUserSuggestions = useCallback(async (query) => {
        if (!query || query.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        setSuggestionLoading(true);
        try {
            const tokenData = localStorage.getItem('user'); const token = tokenData ? JSON.parse(tokenData)?.token : null; if (!token) throw new Error("Token not found.");
            const response = await axios.get(getApiUrl('/suggestions'), { // Dùng getApiUrl
                params: { query: query, limit: 7 }, headers: { 'Authorization': `Bearer ${token}` }, timeout: 8000
            });
            const fetchedSuggestions = response.data?.data || [];
            setSuggestions(fetchedSuggestions); setShowSuggestions(fetchedSuggestions.length > 0);
        } catch (err) { console.error("Error fetching user suggestions:", err); setSuggestions([]); setShowSuggestions(false); }
        finally { setSuggestionLoading(false); }
    }, [getApiUrl]); // Thêm getApiUrl

     useEffect(() => { fetchUsersDataRef.current(currentPage, searchTerm); }, [currentPage, refreshKey, searchTerm]); // Thêm searchTerm vào dependency để fetch lại khi search term thay đổi trực tiếp từ useEffect
     useEffect(() => { if (debouncedSearchInput) { fetchUserSuggestions(debouncedSearchInput); } else { setSuggestions([]); setShowSuggestions(false); } }, [debouncedSearchInput, fetchUserSuggestions]);
     useEffect(() => { function handleClickOutside(event) { if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) { setShowSuggestions(false); } } document.addEventListener("mousedown", handleClickOutside); return () => { document.removeEventListener("mousedown", handleClickOutside); }; }, [searchWrapperRef]);

    const handleAddUser = useCallback(() => { setEditingUser(null); setShowUserModal(true); }, []);
    const handleEditUser = useCallback((user) => { setEditingUser(user); setShowUserModal(true); }, []);
    const handleCloseUserModal = useCallback(() => { setShowUserModal(false); setEditingUser(null); }, []);
    const handleDeleteUser = useCallback((user) => { setDeletingUser(user); setShowConfirmDeleteModal(true); }, []);
    const handleCloseConfirmDeleteModal = useCallback(() => { setShowConfirmDeleteModal(false); setDeletingUser(null); }, []);
    const handleViewDetails = useCallback((user) => { setViewingUser(user); setShowDetailsModal(true); }, []);
    const handleCloseDetailsModal = useCallback(() => { setShowDetailsModal(false); setViewingUser(null); }, []);

    const handleSaveUser = useCallback(async (userData) => {
        const isEdit = Boolean(editingUser); const loadingIndicatorId = isEdit ? editingUser._id : 'add-user-loading'; setActionLoadingId(loadingIndicatorId);
        try {
            const tokenData = localStorage.getItem('user'); const token = tokenData ? JSON.parse(tokenData)?.token : null; if (!token) throw new Error("Token not found.");
            const url = isEdit ? getApiUrl(`/update/${editingUser._id}`) : getApiUrl('/add'); // Dùng getApiUrl
            const method = isEdit ? 'put' : 'post';
            const response = await axios[method](url, userData, { headers: { 'Authorization': `Bearer ${token}` } });
            alert(response.data.message || `User ${isEdit ? 'updated' : 'added'} successfully!`); setError(null); handleCloseUserModal(); setRefreshKey(prevKey => prevKey + 1);
        } catch (err) { /* ... (Giữ nguyên xử lý lỗi) ... */
             console.error(`Error ${isEdit ? 'updating' : 'adding'} user:`, err);
             const errorMsg = err.response?.data?.error || err.response?.data?.details?.map(d => d.message).join(', ') || err.message || `Failed to ${isEdit ? 'update' : 'add'} user.`;
             alert(`Error: ${errorMsg}`); setError(errorMsg);
         } finally { setActionLoadingId(null); }
    }, [editingUser, handleCloseUserModal, getApiUrl]); // Thêm getApiUrl

    const confirmDeleteUser = useCallback(async () => {
        if (!deletingUser?._id) return; const userIdToDelete = deletingUser._id; setActionLoadingId(userIdToDelete);
        try {
            const tokenData = localStorage.getItem('user'); const token = tokenData ? JSON.parse(tokenData)?.token : null; if (!token) throw new Error("Token not found.");
            const response = await axios.delete(getApiUrl(`/delete/${userIdToDelete}`), { headers: { 'Authorization': `Bearer ${token}` } }); // Dùng getApiUrl
            alert(response.data.message || "User deleted successfully!"); setError(null); handleCloseConfirmDeleteModal();
            if (users.length === 1 && currentPage > 1) { setCurrentPage(currentPage - 1); }
            else { setRefreshKey(prevKey => prevKey + 1); }
        } catch (err) { /* ... (Giữ nguyên xử lý lỗi) ... */
            console.error("Error deleting user:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to delete user.";
            setError(errorMsg); alert(`Error: ${errorMsg}`);
        } finally { setActionLoadingId(null); }
    }, [deletingUser, users.length, currentPage, handleCloseConfirmDeleteModal, getApiUrl]); // Thêm getApiUrl

     const handleInputChange = useCallback((e) => { setSearchInput(e.target.value); }, []);
     const handleSuggestionClick = useCallback((suggestion) => { setSearchInput(suggestion.username); setSuggestions([]); setShowSuggestions(false); }, []);
     const handleSearchClick = useCallback(() => { if (searchInput !== searchTerm || currentPage !== 1) { setSearchTerm(searchInput); setCurrentPage(1); } else { setRefreshKey(prev => prev + 1); } setShowSuggestions(false); }, [searchInput, searchTerm, currentPage]);
     const handleClearSearch = useCallback(() => { if (searchInput || searchTerm) { setSearchInput(''); setSearchTerm(''); setCurrentPage(1); } setSuggestions([]); setShowSuggestions(false); }, [searchInput, searchTerm]);
     const handlePageChange = useCallback((pageNumber) => { if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) { setCurrentPage(pageNumber); } }, [totalPages, currentPage]);


    // --- JSX Rendering (Nâng cấp) ---
    return (
        // Thêm padding tổng thể cho Container
        <Container fluid="lg" className="mt-4 mb-5"> {/* fluid="lg" để rộng hơn trên màn lớn */}
            {/* Tiêu đề trang */}
             <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0 text-dark"> {/* Đổi màu tiêu đề */}
                    <i className="fas fa-users-cog me-2"></i> User Management
                </h2>
                 {/* Nút Add User tách biệt */}
                 <Button variant="success" onClick={handleAddUser} disabled={loading && users.length === 0}>
                    <i className="fas fa-user-plus me-1"></i> Add New User
                 </Button>
            </div>

            {/* Card chứa Controls và Table */}
            <Card className="shadow-sm">
                <Card.Header className="bg-light p-3">
                    {/* Search Controls */}
                     <Row className="g-2 align-items-center">
                        <Col md={8} lg={9}> {/* Tăng độ rộng cột search */}
                             <div ref={searchWrapperRef} style={{ position: 'relative' }}>
                                <InputGroup>
                                    <InputGroup.Text style={{backgroundColor: 'transparent', borderRight: 'none'}}>
                                        <i className="fas fa-search text-muted"></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by Username, Email, or Full Name..." // Placeholder rõ hơn
                                        value={searchInput}
                                        onChange={handleInputChange}
                                        onFocus={() => debouncedSearchInput && suggestions.length > 0 && setShowSuggestions(true)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                                        disabled={loading && users.length === 0}
                                        aria-label="Search users"
                                        autoComplete="off"
                                        style={{borderLeft: 'none', boxShadow: 'none'}} // Bỏ shadow focus mặc định
                                    />
                                    {searchInput && <Button variant="outline-secondary" onClick={handleClearSearch} disabled={loading || suggestionLoading} size="sm" className="border-start-0" style={{ zIndex: 3 }} title="Clear Search"><i className="fas fa-times"></i></Button>} {/* Dùng icon X */}
                                     {suggestionLoading && (
                                        <InputGroup.Text><Spinner animation="border" size="sm" variant="secondary" /></InputGroup.Text>
                                    )}
                                </InputGroup>
                                {/* Suggestion List */}
                                {showSuggestions && suggestions.length > 0 && (
                                     <ListGroup style={{ position: 'absolute', zIndex: 1050, width: '100%', maxHeight: '250px', overflowY: 'auto', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 .25rem .25rem', boxShadow: '0 .5rem 1rem rgba(0,0,0,.15)' }}>
                                        {suggestions.map((user) => (
                                            <ListGroup.Item key={user._id} action onClick={() => handleSuggestionClick(user)} className="py-2 px-3">
                                                 <div>
                                                    <strong>{user.fullName ? `${user.fullName} (${user.username})` : user.username}</strong>
                                                 </div>
                                                 <small className="text-muted">{user.email}</small>
                                             </ListGroup.Item>
                                        ))}
                                     </ListGroup>
                                )}
                            </div>
                         </Col>
                         <Col md={4} lg={3}> {/* Cột nút Search */}
                             <Button
                                variant="primary"
                                type="button"
                                onClick={handleSearchClick}
                                disabled={loading || suggestionLoading}
                                className="w-100" // Chiếm hết cột
                            >
                                 {loading && !suggestionLoading ? <Spinner as="span" animation="border" size="sm" /> : <><i className="fas fa-search me-1"></i> Search</>}
                            </Button>
                        </Col>
                    </Row>
                </Card.Header>

                <Card.Body className="p-0"> {/* Bỏ padding của Card.Body để Table chiếm hết */}
                     {/* Loading and Error Display */}
                     {(loading && users.length === 0 && !error) && <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p className="mt-2 text-muted">Loading users...</p></div>}
                     {error && (<Alert variant="danger" onClose={() => setError(null)} dismissible className="m-3 d-flex align-items-center"> <i className="fas fa-exclamation-triangle me-2"></i> <strong>Error:</strong> {error}</Alert>)} {/* Đặt Alert trong Card */}

                    {/* Users Table */}
                    {!(error && users.length === 0) && ( // Chỉ hiện table khi không có lỗi VÀ/HOẶC có user
                        <div className={`table-responsive ${loading && users.length > 0 ? 'opacity-75 position-relative' : ''}`}>
                             {/* Spinner overlay khi loading */}
                            {loading && users.length > 0 && (
                                <div className="position-absolute top-50 start-50 translate-middle" style={{zIndex: 10}}>
                                    <Spinner animation="border" variant="secondary" />
                                 </div>
                            )}
                            <Table striped bordered hover responsive="lg" className="align-middle mb-0"> {/* Bỏ size="sm" cho thoáng */}
                                <thead className="table-dark"> {/* Bỏ sticky-top nếu không cần thiết */}
                                    <tr>
                                        <th style={{width: '60px'}} className="text-center">Avatar</th> {/* Thêm cột Avatar */}
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Full Name</th>
                                        <th className='text-center'>Role</th>
                                        <th style={{ minWidth: '130px', width: '130px' }} className="text-center">Actions</th> {/* Tăng nhẹ width */}
                                     </tr>
                                </thead>
                                <tbody>
                                    {!loading && users.length === 0 && !error && ( <tr><td colSpan="6" className="text-center text-muted py-4">No users found matching your criteria.</td></tr> )}
                                     {users.map((user) => {
                                        const userAvatarUrl = user.avatar
                                            ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/avatars/${user.avatar.replace(/\\/g, '/')}?t=${new Date().getTime()}`
                                            : 'https://via.placeholder.com/40?text=N/A'; // Placeholder nhỏ hơn
                                        return (
                                            <tr key={user._id} className={actionLoadingId === user._id ? 'table-warning' : ''}>
                                                <td className="text-center">
                                                     <Image src={userAvatarUrl} roundedCircle width={40} height={40} style={{objectFit:'cover'}} onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/40?text=Err'; }} />
                                                 </td>
                                                <td>{user.username}</td>
                                                <td>{user.email}</td>
                                                <td>{user.fullName || <span className="text-muted fst-italic">N/A</span>}</td>
                                                <td className='text-center'>{renderRoleBadge(user.role)}</td>
                                                <td className="text-center">
                                                     {/* Sử dụng ButtonGroup cho đẹp hơn */}
                                                     {/* <ButtonGroup size="sm"> */}
                                                        <Button variant="outline-info" size="sm" className="me-1 rounded-circle p-1 lh-1" onClick={() => handleViewDetails(user)} title="View Details" disabled={loading}>
                                                             <i className="fas fa-eye fa-fw"></i>
                                                        </Button>
                                                        <Button variant="outline-warning" size="sm" className="me-1 rounded-circle p-1 lh-1" onClick={() => handleEditUser(user)} title="Edit User" disabled={actionLoadingId === user._id || loading}>
                                                             <i className="fas fa-edit fa-fw"></i>
                                                        </Button>
                                                        <Button variant="outline-danger" size="sm" className="rounded-circle p-1 lh-1" onClick={() => handleDeleteUser(user)} title="Delete User" disabled={actionLoadingId === user._id || loading}>
                                                            {actionLoadingId === user._id ? <Spinner as="span" animation="border" size="sm" /> : <i className="fas fa-trash fa-fw"></i>}
                                                         </Button>
                                                     {/* </ButtonGroup> */}
                                                </td>
                                            </tr>
                                         );
                                     })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>

                 {/* Pagination đặt trong Footer của Card hoặc bên ngoài tùy ý */}
                {!error && totalPages > 1 && (
                     <Card.Footer className="d-flex justify-content-center border-top-0 pt-3 bg-light"> {/* bg-light cho footer */}
                        <Pagination size="sm">
                            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} />
                             <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} />
                             {(() => { /* ... (Giữ nguyên logic render page items) ... */
                                const items = []; const pageNeighbours = 1; const totalNumbers = (pageNeighbours * 2) + 3; const totalBlocks = totalNumbers + 2;
                                if (totalPages > totalBlocks) { let startPage = Math.max(2, currentPage - pageNeighbours); let endPage = Math.min(totalPages - 1, currentPage + pageNeighbours); let hasLeftSpill = startPage > 2; let hasRightSpill = (totalPages - endPage) > 1; let offset = totalNumbers - (endPage - startPage + 1); if (hasLeftSpill && !hasRightSpill) { startPage -= offset; } else if (!hasLeftSpill && hasRightSpill) { endPage += offset; } items.push(<Pagination.Item key={1} active={currentPage === 1} onClick={() => handlePageChange(1)} disabled={loading}>1</Pagination.Item>); if (hasLeftSpill) items.push(<Pagination.Ellipsis key="ellipsis-start" disabled />); for (let i = startPage; i <= endPage; i++) { items.push(<Pagination.Item key={i} active={currentPage === i} onClick={() => handlePageChange(i)} disabled={loading}>{i}</Pagination.Item>); } if (hasRightSpill) items.push(<Pagination.Ellipsis key="ellipsis-end" disabled />); items.push(<Pagination.Item key={totalPages} active={currentPage === totalPages} onClick={() => handlePageChange(totalPages)} disabled={loading}>{totalPages}</Pagination.Item>); } else { for (let i = 1; i <= totalPages; i++) { items.push(<Pagination.Item key={i} active={currentPage === i} onClick={() => handlePageChange(i)} disabled={loading}>{i}</Pagination.Item>); } } return items;
                             })()}
                            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} />
                            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || loading} />
                         </Pagination>
                     </Card.Footer>
                )}
            </Card>

            {/* Hiển thị thông tin số lượng user nếu cần (có thể bỏ nếu không thích) */}
             {!loading && !error && users.length > 0 && totalPages > 1 && (
                 <div className="text-center text-muted mt-2 small">
                     Showing {users.length} user(s) on page {currentPage} of {totalPages}.
                 </div>
             )}


            {/* --- Render Modals (Giữ nguyên) --- */}
            <UserFormModal show={showUserModal} handleClose={handleCloseUserModal} onSave={handleSaveUser} initialData={editingUser} isLoading={actionLoadingId === 'add-user-loading' || actionLoadingId === editingUser?._id} />
            <ConfirmDeleteModal show={showConfirmDeleteModal} handleClose={handleCloseConfirmDeleteModal} onConfirm={confirmDeleteUser} userName={deletingUser?.username} isLoading={actionLoadingId === deletingUser?._id} />
            <UserDetailsModal show={showDetailsModal} handleClose={handleCloseDetailsModal} user={viewingUser} renderRoleBadge={renderRoleBadge} />

        </Container> // End container
    );
}

export default ManageUsers;