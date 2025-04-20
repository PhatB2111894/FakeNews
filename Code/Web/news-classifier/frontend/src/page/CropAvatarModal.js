// src/components/CropAvatarModal.js
import React, { useState, useRef, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Import CSS của thư viện

// Hàm helper để tạo crop mặc định (ví dụ: hình vuông giữa ảnh)
function centerAspectCrop(mediaWidth, mediaHeight, aspect = 1 / 1) { // aspect 1/1 cho hình vuông
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    );
}

function CropAvatarModal({ src, onComplete, onCancel }) {
    const [crop, setCrop] = useState(); // State lưu thông tin vùng crop hiện tại
    const [completedCrop, setCompletedCrop] = useState(null); // State lưu vùng crop cuối cùng (pixel)
    const imgRef = useRef(null); // Ref đến thẻ img gốc
    const previewCanvasRef = useRef(null); // Ref đến canvas để vẽ preview (tùy chọn)

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        // Set crop mặc định khi ảnh load xong
        setCrop(centerAspectCrop(width, height, 1 / 1)); // Crop hình vuông
        setCompletedCrop(centerAspectCrop(width, height, 1 / 1)); // Set cả completed để có giá trị ban đầu
    };

    // Hàm xử lý để lấy Blob ảnh đã cắt (Cần xem kỹ ví dụ của react-image-crop)
    const getCroppedImageBlob = useCallback(async () => {
        const image = imgRef.current;
        const canvas = document.createElement('canvas'); // Tạo canvas tạm
        if (!image || !completedCrop || !canvas) {
            throw new Error('Crop canvas does not exist');
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        // Đặt kích thước canvas bằng kích thước vùng crop thực tế trên ảnh gốc
        canvas.width = Math.floor(completedCrop.width * scaleX);
        canvas.height = Math.floor(completedCrop.height * scaleY);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('No 2d context');
        }

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
        canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);
        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;
        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        ctx.save();
        // Chỗ này phức tạp nếu muốn crop tròn, đơn giản là crop vuông trước
        ctx.translate(-cropX, -cropY);
        ctx.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight
        );
        ctx.restore();

        // Trả về Promise chứa Blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    // blob.name = 'cropped_avatar.png'; // Có thể đặt tên ở đây hoặc lúc append FormData
                    resolve(blob);
                },
                'image/png', // Hoặc 'image/jpeg'
                0.9 // Chất lượng ảnh (cho JPEG)
            );
        });

    }, [completedCrop]);

    // Hàm xử lý khi nhấn nút "Confirm Crop"
    const handleConfirmCrop = async () => {
        try {
            const blob = await getCroppedImageBlob();
            onComplete(blob); // Gọi callback của component cha với blob đã cắt
        } catch (e) {
            console.error("Error cropping image:", e);
            onComplete(null); // Báo lỗi về cho cha
        }
    };


    return (
        <Modal show={true} onHide={onCancel} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Crop Your Avatar</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                {src && (
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)} // Lưu vùng crop pixel
                        aspect={1 / 1} // Tỷ lệ 1:1 cho avatar vuông (hoặc bỏ nếu muốn tự do)
                        circularCrop={true} // <<--- Crop thành hình tròn
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={src}
                            onLoad={onImageLoad} // Set crop mặc định khi load
                            style={{ maxHeight: '70vh', maxWidth: '100%' }} // Giới hạn kích thước hiển thị
                        />
                    </ReactCrop>
                )}
                {/* Có thể thêm Canvas để preview nếu muốn */}
                {/* <canvas ref={previewCanvasRef} style={{ display: 'none' }} /> */}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleConfirmCrop} disabled={!completedCrop?.width || !completedCrop?.height}>
                    Confirm Crop
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default CropAvatarModal;