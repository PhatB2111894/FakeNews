// src/page/Login.js (Đã bỏ trạng thái loading)

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Container, Card, Form, Button, InputGroup, Alert, Spinner, Stack } from 'react-bootstrap';

function Login() {
    const [formData, setFormData] = useState({ username: "", password: "", rememberMe: false });
    const [error, setError] = useState("");
    // const [loading, setLoading] = useState(false); // <<< XÓA STATE LOADING
    const navigate = useNavigate();
    const { user, setUser } = useUser();

    // --- Effect kiểm tra login/remember me ---
    useEffect(() => {
        const savedUserString = localStorage.getItem("user");
        if (savedUserString) {
            try {
                const savedUserInfo = JSON.parse(savedUserString);
                if (savedUserInfo && savedUserInfo.userId && savedUserInfo.role && savedUserInfo.token) {
                    // console.log("User session found, navigating away:", savedUserInfo); // Có thể bỏ log này
                    // setUser(savedUserInfo); // Không cần set lại nếu đã có trong context
                    if (user?.userId !== savedUserInfo.userId) { // Chỉ set nếu user context chưa có hoặc khác
                        setUser(savedUserInfo);
                    }
                    if (savedUserInfo.role === 'admin') { navigate("/admin", { replace: true }); }
                    else { navigate("/", { replace: true }); }
                } else { localStorage.removeItem("user"); }
            } catch (e) { localStorage.removeItem("user"); }
        } else {
            const rememberedData = JSON.parse(localStorage.getItem("rememberedUser"));
            if (rememberedData && rememberedData.username) {
                setFormData(prev => ({ ...prev, username: rememberedData.username, rememberMe: true }));
            }
        }
    }, [navigate, setUser, user]);


    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: type === "checkbox" ? checked : value
        }));
        if (error) setError("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        // setLoading(true); // <<< BỎ LỆNH NÀY
        try {
            const loginApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/users/login` : "http://localhost:5000/api/users/login";
            const response = await axios.post(loginApiUrl, {
                username: formData.username, // Backend sẽ xử lý đây là username hoặc email
                password: formData.password
            });

            if (!response.data || !response.data.userId || !response.data.role || !response.data.token) {
                throw new Error("Login failed: Invalid response data from server.");
            }

            const { userId, username, avatar, role, token } = response.data;
            const userInfo = { userId, username, avatar, role, token };

            localStorage.setItem("user", JSON.stringify(userInfo));
            setUser(userInfo); // Cập nhật Context

            if (formData.rememberMe) {
                localStorage.setItem("rememberedUser", JSON.stringify({ username: formData.username }));
            } else {
                localStorage.removeItem("rememberedUser");
            }

            // Chuyển hướng
            if (userInfo.role === 'admin') { navigate("/admin"); }
            else { navigate("/"); }

        } catch (err) {
            console.error("Login error:", err.response?.data || err.message || err);
            setError(err.response?.data?.error || "Login failed. Please check credentials.");
            // setLoading(false); // <<< BỎ LỆNH NÀY
        }
    };

    // --- JSX Rendering (Bỏ loading khỏi nút) ---
    return (
        <Container fluid className="d-flex justify-content-center align-items-center py-4" style={{ minHeight: 'calc(100vh - 110px)' }}>
            <Card className="shadow-lg border-0" style={{ width: "100%", maxWidth: "480px" }}>
                <Card.Body className="p-4 p-md-5">
                    <h3 className="text-center mb-4 fw-bold text-dark">
                         <i className="fas fa-sign-in-alt me-2"></i> Login
                     </h3>
                    <Form noValidate onSubmit={handleLogin}>
                         {error && (
                             <Alert variant="danger" onClose={() => setError("")} dismissible className="d-flex align-items-center">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </Alert>
                         )}

                        <Form.Group className="mb-3" controlId="loginUsername">
                            <Form.Label>Username or Email</Form.Label>
                            <InputGroup hasValidation>
                                <InputGroup.Text><i className="fas fa-user fa-fw"></i></InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    name="username"
                                    placeholder="Enter username or email"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="loginPassword">
                            <Form.Label>Password</Form.Label>
                            <InputGroup hasValidation>
                                 <InputGroup.Text><i className="fas fa-lock fa-fw"></i></InputGroup.Text>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder="Enter password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                        </Form.Group>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <Form.Check
                                type="checkbox"
                                name="rememberMe"
                                label="Remember me"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                id="rememberMeCheck"
                            />
                            <Link to="/forgot" className="text-decoration-none small">Forgot password?</Link>
                        </div>

                         <div className="d-grid">
                            {/* <<< BỎ LOGIC LOADING VÀ DISABLED={LOADING} */}
                            <Button variant="dark" type="submit" size="lg">
                                <i className="fas fa-sign-in-alt me-2"></i>Login
                            </Button>
                        </div>

                        <div className="text-center mt-4">
                             <small className="text-muted">Don't have an account? </small>
                            <Button variant="outline-secondary" size="sm" as={Link} to="/register">
                                 Register Now
                             </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Login;