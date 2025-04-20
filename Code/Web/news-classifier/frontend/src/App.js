// App.js
import React from "react";
// Import Link nếu không dùng trong App.js nữa thì có thể bỏ
import { BrowserRouter as Router, Route, Routes /*, Link */ } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from './Footer';
import ClassifyNews from "./page/ClassifyNews";
import History from "./page/History";
import Login from "./page/Login";
import Register from "./page/Register";
import AboutPage from './page/AboutPage';
import PrivacyPage from './page/PrivacyPage';
import TermsPage from './page/TermsPage';
import ContactPage from './page/ContactPage';
import ForgotPassword from "./page/ForgotPassword";
import { UserProvider } from "./context/UserContext";
import { ClassifyProvider } from "./context/ClassifyNewsContext";
import Profile from "./page/Profile";
import ChangePassword from "./page/ChangePassword";
import AdminDashboard from "./page/admin/AdminDashboard";
import ManageUsers from "./page/admin/ManageUsers";
import ManageNews from "./page/admin/ManageNews";
import RequireAdminAuth from "./auth/RequireAdminAuth";

// *** Import DashboardCard ***
// Giả sử bạn đặt nó trong src/page/admin, nếu ở chỗ khác hãy sửa đường dẫn
import DashboardCard from "./page/admin/DashboardCard";
// Hoặc nếu bạn chuyển ra src/components: import DashboardCard from "./components/DashboardCard";

// Import CSS Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row } from "react-bootstrap"; // Import thêm Container, Row

function App() {
    // *** XÓA BỎ style và handlers bị lặp lại ***
    // const cardHoverStyle = { ... };
    // const handleMouseOver = (e) => { ... };
    // const handleMouseOut = (e) => { ... };

    return (
        <UserProvider>
            <ClassifyProvider>
                <Router>
                    <div className="d-flex flex-column min-vh-100">
                        <Navbar />
                        <main className="flex-grow-1">
                            <Routes>
                                {/* --- Route Trang chủ --- */}
                                <Route path="/" element={
                                  <Container className="mt-5 text-center">
                                      <h2 className="mb-3 fw-bold text-dark">Welcome to Fake News Detector</h2>
                                      <p className="lead text-muted mb-5">
                                          Analyze news content or review your classification history.
                                      </p>
                                      <Row className="justify-content-center g-4">
                                          {/* Card 1: Classify News - Màu xanh dương đậm hơn */}
                                          <DashboardCard
                                              to="/classify"
                                              bgColor="#0a58ca" // <<< MÀU XANH DƯƠNG ĐẬM HƠN
                                              icon="fa-search"
                                              title="Classify News"
                                              text="Input news text to check if it's Real or Fake."
                                          />
                                          {/* Card 2: View History - Màu xanh lá đậm hơn */}
                                          <DashboardCard
                                              to="/history"
                                              bgColor="#146c43" // <<< MÀU XANH LÁ ĐẬM HƠN
                                              icon="fa-history"
                                              title="View History"
                                              text="Review articles you have previously classified and manage your reports."
                                          />
                                      </Row>
                                  </Container>
                              } />

                                {/* --- Các Routes khác --- */}
                                <Route path="/classify" element={<ClassifyNews />} />
                                <Route path="/history" element={<History />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot" element={<ForgotPassword />} />
                                <Route path="/change-password" element={<ChangePassword />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/privacy" element={<PrivacyPage />} />
                                <Route path="/terms" element={<TermsPage />} />
                                <Route path="/contact" element={<ContactPage />} />

                                {/* --- ADMIN ROUTES --- */}
                                <Route element={<RequireAdminAuth />}>
                                    <Route path="/admin" element={<AdminDashboard />} />
                                    <Route path="/admin/users" element={<ManageUsers />} />
                                    <Route path="/admin/news" element={<ManageNews />} />
                                </Route>

                                {/* --- Catch-all Route --- */}
                                <Route path="*" element={
                                    <Container className='text-center mt-5'><h2>404 Not Found</h2><p>The page you are looking for does not exist.</p></Container> // Dùng Container
                                } />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </Router>
            </ClassifyProvider>
        </UserProvider>
    );
}

export default App;