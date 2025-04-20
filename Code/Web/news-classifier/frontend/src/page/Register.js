// src/page/Register.js (Phiên bản có Modal Điều khoản)

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
// Import components react-bootstrap (thêm Modal)
import { Container, Card, Form, Button, InputGroup, Alert, Spinner, Row, Col, Modal } from 'react-bootstrap';
// *** Import component Modal Điều khoản ***
import TermsModal from './TermsModal'; // <<< Sửa đường dẫn nếu bạn lưu ở chỗ khác

function Register() {
    // State cho dữ liệu form, lỗi, loading (giữ nguyên)
    const [formData, setFormData] = useState({
        username: "", password: "", confirmPassword: "", fullName: "",
        email: "", phone: "", gender: "male",
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // *** THÊM STATE VÀ HANDLER CHO TERMS MODAL ***
    const [showTermsModal, setShowTermsModal] = useState(false);
    // Hàm này được gọi khi bấm vào link "Terms of Service"
    const handleShowTerms = (e) => {
        // e.preventDefault(); // Không cần nếu dùng Button
        setShowTermsModal(true);
    };
    const handleCloseTerms = () => setShowTermsModal(false);
    // *** KẾT THÚC PHẦN THÊM CHO MODAL ***

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'agreeTerms') {
            setAgreedToTerms(checked);
            if (error === "You must agree to the Terms of Service before registering.") { setError(""); }
        } else {
            setFormData({ ...formData, [name]: value });
             if (error && error !== "You must agree to the Terms of Service before registering.") { setError(""); }
             if ((name === 'password' || name === 'confirmPassword') && error === 'Passwords do not match!') { setError(""); }
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        if (formData.password !== formData.confirmPassword) { setError("Passwords do not match!"); return; }
        if (formData.password.length < 6) { setError("Password must be at least 6 characters long."); return; }
        if (!agreedToTerms) { setError("You must agree to the Terms of Service before registering."); return; }

        setLoading(true);
        const { confirmPassword, ...submitData } = formData;
        try {
            const registerApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/users/register` : "http://localhost:5000/api/users/register";
            await axios.post(registerApiUrl, submitData);
            alert("Registration successful! Please log in.");
            navigate("/login");
        } catch (err) {
            console.error("Registration error:", err.response?.data || err.message || err);
            setError(err.response?.data?.error || "Registration failed. Please check your input.");
            setLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex justify-content-center align-items-center py-4" style={{ minHeight: 'calc(100vh - 110px)' }}>
            <Card className="shadow-lg border-0" style={{ width: "100%", maxWidth: "600px" }}>
                <Card.Body className="p-4 p-md-5">
                    <h3 className="text-center mb-4 fw-bold text-dark">
                        <i className="fas fa-user-plus me-2"></i> Create Account
                    </h3>
                    <Form noValidate onSubmit={handleRegister}>
                         {error && ( <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert> )}

                        {/* ... (Các Form.Group cho input giữ nguyên) ... */}
                         <Row>
                             <Col md={6}> <Form.Group className="mb-3" controlId="regFullName"> <Form.Label>Full Name</Form.Label> <InputGroup> <InputGroup.Text><i className="fas fa-user fa-fw"></i></InputGroup.Text> <Form.Control type="text" name="fullName" placeholder="Enter full name" required onChange={handleChange} value={formData.fullName} disabled={loading}/> </InputGroup> </Form.Group> </Col>
                             <Col md={6}> <Form.Group className="mb-3" controlId="regUsername"> <Form.Label>Username</Form.Label> <InputGroup> <InputGroup.Text><i className="fas fa-user-tag fa-fw"></i></InputGroup.Text> <Form.Control type="text" name="username" placeholder="Enter username" required onChange={handleChange} value={formData.username} disabled={loading}/> </InputGroup> </Form.Group> </Col>
                         </Row>
                         <Row>
                             <Col md={6}> <Form.Group className="mb-3" controlId="regEmail"> <Form.Label>Email</Form.Label> <InputGroup> <InputGroup.Text><i className="fas fa-envelope fa-fw"></i></InputGroup.Text> <Form.Control type="email" name="email" placeholder="Enter email" required onChange={handleChange} value={formData.email} disabled={loading}/> </InputGroup> </Form.Group> </Col>
                             <Col md={6}> <Form.Group className="mb-3" controlId="regPhone"> <Form.Label>Phone Number</Form.Label> <InputGroup> <InputGroup.Text><i className="fas fa-phone fa-fw"></i></InputGroup.Text> <Form.Control type="tel" name="phone" placeholder="Enter phone number" onChange={handleChange} value={formData.phone} disabled={loading}/> </InputGroup> </Form.Group> </Col>
                         </Row>
                         <Row>
                             <Col md={6}> <Form.Group className="mb-3" controlId="regPassword"> <Form.Label>Password</Form.Label> <InputGroup> <InputGroup.Text><i className="fas fa-lock fa-fw"></i></InputGroup.Text> <Form.Control type="password" name="password" placeholder="Enter password (min 6 chars)" required onChange={handleChange} value={formData.password} disabled={loading} isInvalid={error === "Password must be at least 6 characters long."}/> <Form.Control.Feedback type="invalid">{error === "Password must be at least 6 characters long." ? error : null}</Form.Control.Feedback> </InputGroup> </Form.Group> </Col>
                             <Col md={6}> <Form.Group className="mb-3" controlId="regConfirmPassword"> <Form.Label>Confirm Password</Form.Label> <InputGroup> <InputGroup.Text><i className="fas fa-key fa-fw"></i></InputGroup.Text> <Form.Control type="password" name="confirmPassword" placeholder="Confirm password" required onChange={handleChange} value={formData.confirmPassword} disabled={loading} isInvalid={error === "Passwords do not match!"}/> <Form.Control.Feedback type="invalid">{error === "Passwords do not match!" ? error : null}</Form.Control.Feedback> </InputGroup> </Form.Group> </Col>
                         </Row>
                         <Form.Group className="mb-3" controlId="regGender"> <Form.Label>Gender</Form.Label> <InputGroup> <InputGroup.Text><i className="fas fa-venus-mars fa-fw"></i></InputGroup.Text> <Form.Select name="gender" onChange={handleChange} value={formData.gender} disabled={loading}> <option value="male">Male</option> <option value="female">Female</option> <option value="other">Other</option> </Form.Select> </InputGroup> </Form.Group>

                        {/* *** CHECKBOX ĐỒNG Ý ĐIỀU KHOẢN (SỬA LABEL) *** */}
                        <Form.Group className="mb-4" controlId="termsCheckbox">
                            <Form.Check
                                type="checkbox"
                                name="agreeTerms"
                                checked={agreedToTerms}
                                onChange={handleChange}
                                isInvalid={!!error && error === "You must agree to the Terms of Service before registering."}
                                disabled={loading}
                                feedback="You must agree before submitting."
                                feedbackType="invalid"
                                label={
                                    <> {/* Dùng Fragment <>...</> */}
                                        I agree to the{' '}
                                        {/* <<< Dùng Button variant="link" để mở modal >>> */}
                                        <Button variant="link" size="sm" className="p-0 align-baseline" onClick={handleShowTerms}>
                                            Terms of Service
                                        </Button>
                                        <span className="text-danger">*</span>
                                    </>
                                }
                            />
                        </Form.Group>

                        {/* Nút Đăng ký */}
                        <div className="d-grid">
                            <Button variant="dark" type="submit" size="lg" disabled={!agreedToTerms || loading}>
                                {loading ? (
                                    <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Registering...</>
                                ) : (
                                    <><i className="fas fa-user-plus me-2"></i>Register</>
                                )}
                            </Button>
                        </div>
                    </Form>

                    {/* Link đến trang Đăng nhập */}
                    <div className="text-center mt-4">
                         <small className="text-muted">Already have an account? </small>
                        <Button variant="outline-secondary" size="sm" as={Link} to="/login"> Login Here </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* *** RENDER MODAL ĐIỀU KHOẢN *** */}
            {/* Component này chỉ hiện khi showTermsModal là true */}
            <TermsModal show={showTermsModal} handleClose={handleCloseTerms} />

        </Container>
    );
}

export default Register;