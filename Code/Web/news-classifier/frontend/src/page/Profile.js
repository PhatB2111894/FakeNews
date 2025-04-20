import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CropAvatarModal from './CropAvatarModal'; // Đảm bảo đường dẫn đúng
import { useUser } from '../context/UserContext'; // Đảm bảo đường dẫn đúng

// Import components từ react-bootstrap và react-router-dom
import { Container, Card, Form, Button, Image, InputGroup, Spinner, Alert, Stack } from 'react-bootstrap';
import { Link } from "react-router-dom"; // Import Link

function Profile() {
    // --- State Hooks (Giữ nguyên) ---
    const { user: globalUser, setUser: setGlobalUser } = useUser();
    const [user, setUser] = useState({});
    const [originalAvatarSrc, setOriginalAvatarSrc] = useState(null);
    const [croppedAvatarBlob, setCroppedAvatarBlob] = useState(null);
    const defaultAvatar = "https://bookvexe.vn/wp-content/uploads/2023/04/chon-loc-25-avatar-facebook-mac-dinh-chat-nhat_7.jpg";
    const [previewAvatar, setPreviewAvatar] = useState(defaultAvatar);
    const [showCropModal, setShowCropModal] = useState(false);
    const [loading, setLoading] = useState(false); // Loading cho Update Info / Upload Avatar
    const [fetchLoading, setFetchLoading] = useState(true); // Loading riêng cho việc fetch dữ liệu ban đầu
    const [error, setError] = useState(null); // State cho lỗi fetch hoặc update

    // --- Lấy userId (Giữ nguyên) ---
    const storedUser = localStorage.getItem("user");
     // Lấy userId từ context trước, sau đó mới đến localStorage
    const userId = globalUser?.userId || (storedUser ? JSON.parse(storedUser).userId : null);

    // --- Effects ---
    // Tải thông tin user ban đầu
    useEffect(() => {
        if (!userId) {
            console.warn("Profile: User ID not found.");
            setError("User not identified. Please log in again."); // Set lỗi rõ ràng
            setFetchLoading(false);
            return;
        }

        setError(null); // Reset lỗi cũ
        setFetchLoading(true);
        const fetchUser = async () => {
            try {
                const profileApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/users/${userId}` : `http://localhost:5000/api/users/${userId}`;
                const response = await axios.get(profileApiUrl);
                setUser(response.data);

                const avatarFileName = response.data.avatar;
                 // Lấy Base URL từ biến môi trường hoặc mặc định localhost
                 const serverBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
                const avatarPath = avatarFileName ? `/uploads/avatars/${avatarFileName.replace(/\\/g, "/")}` : null;
                const initialAvatarUrl = avatarFileName ? `${serverBaseUrl}${avatarPath}?t=${new Date().getTime()}` : defaultAvatar;
                setPreviewAvatar(initialAvatarUrl);

                 // Đồng bộ context nếu user trong context là null hoặc userId khác
                 if (!globalUser || globalUser.userId !== response.data.userId) {
                     // Lấy token từ localStorage để đảm bảo object user trong context đầy đủ
                     const storedToken = storedUser ? JSON.parse(storedUser).token : null;
                     const userDataForContext = { ...response.data, token: globalUser?.token || storedToken };
                    setGlobalUser(userDataForContext);
                 }

            } catch (error) {
                console.error("Error loading user info:", error);
                 setError(error.response?.data?.error || "Failed to load user profile.");
            } finally {
                 setFetchLoading(false);
            }
        };

        fetchUser();
     // Chạy lại khi userId thay đổi (ví dụ: login user khác)
    }, [userId, setGlobalUser, globalUser, storedUser]);

    // --- Handlers (Giữ nguyên logic, chỉ cập nhật API URL và xử lý lỗi/state) ---

    const handleChange = (e) => {
        setUser(prevUser => ({ ...prevUser, [e.target.name]: e.target.value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalAvatarSrc(reader.result);
                setShowCropModal(true);
                setCroppedAvatarBlob(null);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = null;
    };

    const handleCropComplete = (croppedBlob) => {
        if (croppedBlob) {
            setCroppedAvatarBlob(croppedBlob);
            const objectUrl = URL.createObjectURL(croppedBlob);
            setPreviewAvatar(objectUrl);
            // Không cần revoke ngay, sẽ revoke khi component unmount hoặc thay đổi ảnh khác
        }
        setShowCropModal(false);
        setOriginalAvatarSrc(null);
    }

    const handleUpdate = async () => {
        if (!userId) return alert("User ID not found.");
        setError(null); // Reset lỗi cũ
        setLoading(true);

        const updateData = {
            fullName: user.fullName,
            phone: user.phone,
            gender: user.gender,
        };

        try {
            const updateApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/users/${userId}` : `http://localhost:5000/api/users/${userId}`;
            const response = await axios.put(updateApiUrl, updateData);
            alert("Profile updated successfully!");

            // Tạo object user mới nhất dựa trên globalUser và data trả về
            const updatedUserInfo = { ...globalUser, ...response.data };
            localStorage.setItem("user", JSON.stringify(updatedUserInfo));
            setGlobalUser(updatedUserInfo);
            setUser(updatedUserInfo); // Đồng bộ state cục bộ

        } catch (error) {
            console.error("Update error:", error.response ? error.response.data : error.message);
             const errorMsg = error.response?.data?.error || "Update failed! Please try again.";
             setError(errorMsg); // Hiển thị lỗi bằng Alert
            alert(errorMsg); // Vẫn alert để thông báo nhanh
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async () => {
        if (!croppedAvatarBlob) return alert("Please select and crop an image first!");
        if (!userId) return alert("User ID not found. Cannot upload avatar.");
        setError(null); // Reset lỗi cũ
        setLoading(true);

        const formData = new FormData();
        formData.append("avatar", croppedAvatarBlob, `avatar_${userId}_${Date.now()}.png`);

        try {
             const uploadApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/users/upload/avatar/${userId}` : `http://localhost:5000/api/users/upload/avatar/${userId}`;
            const response = await axios.post(uploadApiUrl, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            alert("Avatar updated successfully!");

            const currentUserInfo = globalUser || JSON.parse(localStorage.getItem("user") || '{}');
            const updatedUserInfoWithAvatar = { ...currentUserInfo, avatar: response.data.avatar };

            localStorage.setItem("user", JSON.stringify(updatedUserInfoWithAvatar));
            setGlobalUser(updatedUserInfoWithAvatar);

            const serverBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
            const newAvatarPath = response.data.avatar ? `/uploads/avatars/${response.data.avatar.replace(/\\/g, "/")}` : null;
            const newAvatarUrl = newAvatarPath ? `${serverBaseUrl}${newAvatarPath}?t=${new Date().getTime()}` : defaultAvatar;

            // Revoke URL cũ nếu nó là blob URL
             if (previewAvatar && previewAvatar.startsWith('blob:')) {
                URL.revokeObjectURL(previewAvatar);
            }

            setPreviewAvatar(newAvatarUrl);
            setUser(updatedUserInfoWithAvatar);
            setCroppedAvatarBlob(null);

        } catch (error) {
            console.error("Error uploading avatar:", error.response ? error.response.data : error.message);
             const errorMsg = error.response?.data?.error || "Avatar update failed! Please try again.";
             setError(errorMsg); // Hiển thị lỗi bằng Alert
            alert(errorMsg);
             // Không reset preview về ảnh cũ ngay, giữ ảnh đã cắt để user thử lại nếu muốn, hoặc reset về ảnh cũ từ globalUser
             // const oldAvatarPath = globalUser?.avatar ? `/uploads/avatars/${globalUser.avatar.replace(/\\/g, "/")}` : null;
             // const oldAvatarUrl = oldAvatarPath ? `${serverBaseUrl}${oldAvatarPath}?t=${new Date().getTime()}` : defaultAvatar;
             // setPreviewAvatar(oldAvatarUrl);
        } finally {
            setLoading(false);
        }
    };

     // Cleanup blob URL khi component unmount
     useEffect(() => {
         return () => {
             if (previewAvatar && previewAvatar.startsWith('blob:')) {
                 URL.revokeObjectURL(previewAvatar);
             }
         };
     }, [previewAvatar]);

    // --- Render Logic (Nâng cấp giao diện) ---

     // Hiển thị loading ban đầu
     if (fetchLoading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                <p className="text-muted fs-5 mt-3">Loading profile...</p>
            </Container>
        );
    }

    // Hiển thị lỗi fetch ban đầu
    if (error && !user.userId) { // Chỉ hiển thị lỗi này nếu không fetch được user ban đầu
         return (
             <Container className="mt-5">
                 <Alert variant="danger" className="shadow-sm">
                     <Alert.Heading as="h5">Error Loading Profile</Alert.Heading>
                     <p>{error}</p>
                     <Link to="/login" className="btn btn-sm btn-danger">Go to Login</Link>
                 </Alert>
             </Container>
         );
     }


    return (
        <Container className="mt-4 mb-5" style={{ maxWidth: "700px" }}> {/* Tăng max width */}
            <Card className="shadow-lg"> {/* Giữ shadow-lg nếu muốn nổi bật */}
                <Card.Header className="bg-light p-3"> {/* Thêm Header cho Card */}
                    <h2 className="text-center mb-0 fw-bold text-dark">
                         <i className="fas fa-user-edit me-2"></i> User Profile
                     </h2>
                </Card.Header>
                <Card.Body className="p-4"> {/* Tăng padding */}

                    {/* Hiển thị lỗi update */}
                     {error && user.userId && ( // Chỉ hiển thị lỗi update khi đã có user
                        <Alert variant="danger" onClose={() => setError(null)} dismissible>
                             {error}
                         </Alert>
                     )}

                    {/* Phần Avatar */}
                    <div className="text-center mb-4">
                        <div className="position-relative d-inline-block group-avatar">
                            <Image
                                src={previewAvatar}
                                alt="Avatar"
                                roundedCircle
                                thumbnail // Thêm viền nhẹ và padding
                                style={{ width: "150px", height: "150px", objectFit: "cover", border: '3px solid #dee2e6' }} // Tăng border
                                onError={(e) => { e.target.onerror = null; e.target.src=defaultAvatar }}
                            />
                            {/* Nút camera overlay */}
                            <Form.Label
                                htmlFor="avatarInput"
                                className="position-absolute bottom-0 end-0 mb-1 me-1 bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm" // Màu primary, shadow nhẹ
                                style={{ cursor: 'pointer', width: '38px', height: '38px' }}
                                title="Change Avatar"
                             >
                                <i className="fas fa-camera fa-fw"></i> {/* Icon căn giữa */}
                            </Form.Label>
                            <Form.Control
                                type="file"
                                id="avatarInput"
                                className="d-none" // Vẫn ẩn đi
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleAvatarChange}
                            />
                        </div>
                         {/* Nút Upload */}
                         <div className="mt-3">
                            {croppedAvatarBlob && (
                                <Button variant="success" size="sm" onClick={handleAvatarUpload} disabled={loading}>
                                    {loading ?
                                        <><Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" className="me-1"/>Uploading...</>
                                        : <><i className="fas fa-upload me-1"></i>Upload Cropped</>
                                     }
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Form Thông tin User */}
                    <Form className="mt-4">
                        <Form.Group className="mb-3" controlId="profileFullName">
                            <Form.Label>Full Name</Form.Label>
                            <InputGroup>
                                <InputGroup.Text style={{ width: "45px"}}><i className="fas fa-user fa-fw"></i></InputGroup.Text>
                                <Form.Control type="text" name="fullName" value={user.fullName || ""} onChange={handleChange} placeholder="Enter your full name" />
                            </InputGroup>
                        </Form.Group>

                         <Form.Group className="mb-3" controlId="profileEmail">
                            <Form.Label>Email</Form.Label>
                            <InputGroup>
                                <InputGroup.Text style={{ width: "45px"}}><i className="fas fa-envelope fa-fw"></i></InputGroup.Text>
                                <Form.Control type="email" value={user.email || ""} placeholder="Email" readOnly disabled /> {/* Thêm readOnly */}
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="profileUsername">
                            <Form.Label>Username</Form.Label>
                            <InputGroup>
                                <InputGroup.Text style={{ width: "45px"}}><i className="fas fa-user-tag fa-fw"></i></InputGroup.Text>
                                <Form.Control type="text" value={user.username || ""} placeholder="Username" readOnly disabled /> {/* Thêm readOnly */}
                             </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="profilePhone">
                            <Form.Label>Phone Number</Form.Label>
                            <InputGroup>
                                <InputGroup.Text style={{ width: "45px"}}><i className="fas fa-phone fa-fw"></i></InputGroup.Text>
                                <Form.Control type="tel" name="phone" value={user.phone || ""} onChange={handleChange} placeholder="Enter your phone number (optional)" /> {/* Đổi type thành tel */}
                            </InputGroup>
                        </Form.Group>

                         <Form.Group className="mb-3" controlId="profileGender">
                             <Form.Label>Gender</Form.Label>
                             <InputGroup>
                                <InputGroup.Text style={{ width: "45px"}}><i className="fas fa-venus-mars fa-fw"></i></InputGroup.Text>
                                <Form.Select name="gender" value={user.gender || "male"} onChange={handleChange}>
                                     <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                 </Form.Select>
                             </InputGroup>
                        </Form.Group>
                    </Form>

                    {/* Các nút chức năng khác */}
                     {/* Sử dụng Stack để căn chỉnh nút */}
                    <Stack direction="horizontal" gap={2} className="mt-4 pt-3 border-top justify-content-end">
                        <Button variant="outline-secondary" as={Link} to="/change-password"> {/* Sử dụng Link để điều hướng */}
                            <i className="fas fa-key me-1"></i> Change Password
                        </Button>
                         <Button variant="primary" onClick={handleUpdate} disabled={loading}> {/* Đổi thành primary */}
                             {loading && !croppedAvatarBlob ? // Chỉ hiện spinner update nếu không phải đang loading upload
                                 <><Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" className="me-1"/>Updating Info...</>
                                : <><i className="fas fa-save me-1"></i> Update Info</>
                             }
                         </Button>
                     </Stack>

                </Card.Body>
            </Card>

             {/* --- Render Modal Crop (Giữ nguyên) --- */}
             {showCropModal && originalAvatarSrc && (
               <CropAvatarModal
                  src={originalAvatarSrc}
                  onComplete={handleCropComplete}
                  onCancel={() => { setShowCropModal(false); setOriginalAvatarSrc(null); }}
               />
             )}

        </Container> // div.container
    );
}

export default Profile;