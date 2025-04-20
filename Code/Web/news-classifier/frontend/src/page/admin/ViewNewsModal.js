// src/page/admin/ViewNewsModal.js
import React from 'react';
import { Modal, Button, ListGroup, Badge } from 'react-bootstrap';
import { format } from 'date-fns';

function ViewNewsModal({ show, handleClose, newsItem }) {

    // Hàm phụ để render an toàn, tránh lỗi nếu newsItem là null ban đầu
    const renderDetail = (label, value, formatFn = null) => (
        <ListGroup.Item className="d-flex justify-content-between align-items-start">
            <div className="ms-2 me-auto">
                <div className="fw-bold">{label}</div>
                {formatFn ? formatFn(value) : (value || <span className="text-muted fst-italic">N/A</span>)}
            </div>
        </ListGroup.Item>
    );

    // Hàm format đặc biệt cho content
    const renderContent = (value) => (
        <div style={{ maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} className="mt-1">
             {value || <span className="text-muted fst-italic">N/A</span>}
        </div>
    );

     // Hàm format đặc biệt cho top words
    const renderTopWords = (value) => (
        Array.isArray(value) && value.length > 0
            ? value.join(', ')
            : <span className="text-muted fst-italic">N/A</span>
    );

    // Hàm format đặc biệt cho Prediction
    const renderPrediction = (news) => (
        news ? (
            <>
                <Badge bg={news.predicted_label === 'Fake' ? 'danger' : 'success'} className="me-2">
                    {news.predicted_label}
                </Badge>
                <span className="small text-muted">
                    (Fake: {news.fake_probability?.toFixed(1) ?? 'N/A'}% | Real: {news.real_probability?.toFixed(1) ?? 'N/A'}%)
                </span>
            </>
        ) : <span className="text-muted fst-italic">N/A</span>
    );


    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                {/* Sử dụng optional chaining (?.) để tránh lỗi nếu newsItem là null */}
                <Modal.Title>News Details: {newsItem?.title?.substring(0, 50) || 'N/A'}{newsItem?.title?.length > 50 ? '...' : ''}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {newsItem ? (
                    <ListGroup variant="flush">
                        {renderDetail("ID", newsItem._id)}
                        {renderDetail("Title", newsItem.title)}
                        {renderDetail("Category", newsItem.category)}
                        {renderDetail("User ID", newsItem.userId)}
                        {renderDetail("Prediction", newsItem, renderPrediction)}
                        {renderDetail("Detected Language", newsItem.detected_language)}
                        {renderDetail("Top 'Fake' Words", newsItem.top_fake_words, renderTopWords)}
                        {renderDetail("Created At", newsItem.createdAt, (d) => d ? format(new Date(d), 'Pp dd/MM/yyyy') : 'N/A')}
                        {renderDetail("Updated At", newsItem.updatedAt, (d) => d ? format(new Date(d), 'Pp dd/MM/yyyy') : 'N/A')}
                        {renderDetail("Content", newsItem.content, renderContent)}
                    </ListGroup>
                ) : (
                    <p>No news data available.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ViewNewsModal;