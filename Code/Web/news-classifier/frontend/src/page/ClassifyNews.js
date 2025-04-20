import React, { useState, useEffect } from "react";
import axios from "axios";
import { useClassify } from "../context/ClassifyNewsContext";
import SentimentBar from './SentimentBar';
// Import thêm các component từ react-bootstrap
import {
    Container, Card, Form, Button, Spinner, Alert,
    ProgressBar, Badge, Stack, InputGroup, ListGroup
} from 'react-bootstrap';

function ClassifyNews() {
    // --- State Variables (Giữ nguyên) ---
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [result, setResult] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExplaining, setIsExplaining] = useState(false);
    const { classifyCount, setClassifyCount } = useClassify();

    // --- Effects (Giữ nguyên) ---
    useEffect(() => {
        const storedUserString = localStorage.getItem("user");
        let parsedUser = null;
        if (storedUserString) {
            try {
                parsedUser = JSON.parse(storedUserString);
                if (!parsedUser?._id && !parsedUser?.userId) {
                    console.warn("User object from localStorage is missing ID (_id or userId). Treating as guest.");
                    parsedUser = null;
                    localStorage.removeItem("user");
                }
                if (!parsedUser?.token) {
                    console.warn("User object from localStorage is missing token. User cannot save articles.");
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
                localStorage.removeItem("user");
                parsedUser = null;
            }
        }
        setCurrentUser(parsedUser);
        if (!parsedUser) {
            console.log("User is a guest.");
            const savedData = JSON.parse(localStorage.getItem("classifyData"));
            const today = new Date().toISOString().split("T")[0];
            if (savedData?.date === today) {
                setClassifyCount(savedData.count);
            } else {
                localStorage.setItem("classifyData", JSON.stringify({ count: 0, date: today }));
                setClassifyCount(0);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!currentUser) {
            const today = new Date().toISOString().split("T")[0];
            localStorage.setItem("classifyData", JSON.stringify({ count: classifyCount, date: today }));
        }
    }, [classifyCount, currentUser]);

    // --- Functions (Giữ nguyên) ---
    const classifyText = async (explain = false) => {
        if (!currentUser && classifyCount >= 3) {
            alert("You have reached the classification limit of 3 per day. Please log in to continue!");
            return;
        }
        if (!currentUser) {
            setClassifyCount(prevCount => prevCount + 1);
        }
        setResult(null);
        if (explain) setIsExplaining(true); else setIsLoading(true);
        try {
            const nodeApiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/news/classify` : "http://localhost:5000/api/news/classify"; // Sử dụng biến môi trường nếu có
            const response = await axios.post(nodeApiUrl, { text: content, explain: explain }, {
                headers: { 'Content-Type': 'application/json' }
            });
            setResult(response.data);
        } catch (error) {
            console.error("❌ Error calling API:", error.response?.data || error.message);
            const errorMsg = error.response?.data?.error || error.message || "An error occurred during classification. Please try again.";
            // Thêm chi tiết lỗi từ Flask nếu có
            const details = error.response?.data?.details;
            const finalError = details ? `${errorMsg} (Details: ${JSON.stringify(details)})` : errorMsg;
            setResult({ error: finalError });
        } finally {
            if (explain) setIsExplaining(false); else setIsLoading(false);
        }
    };

    const saveArticle = async () => {
        if (!result || result.error) {
            alert("No valid classification result to save.");
            return;
        }
        if (currentUser && currentUser.token) {
            const userIdToSend = currentUser.userId || currentUser._id?.toString();
            if (!userIdToSend) {
                alert("User ID is missing. Cannot save article.");
                console.error("Missing userId or _id in currentUser object:", currentUser);
                return;
            }
            try {
                 const nodeApiSaveUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/news/save` : "http://localhost:5000/api/news/save"; // Sử dụng biến môi trường
                const dataToSend = {
                    title: title || "Untitled",
                    content,
                    category: category || 'Uncategorized',
                    result: {
                        real_probability: result.real_probability,
                        fake_probability: result.fake_probability,
                        detected_language: result.detected_language,
                        top_fake_words: result.top_fake_words || [],
                        // Gửi cả sentiment score nếu backend có lưu
                        // sentiment_score: result.sentiment_score
                    },
                    // userId không cần gửi, backend sẽ lấy từ token
                };
                await axios.post(nodeApiSaveUrl, dataToSend, {
                    headers: { 'Authorization': `Bearer ${currentUser.token}` }
                });
                alert("News article saved to your history!"); // Đổi thông báo
            } catch (error) {
                console.error("❌ Error saving news article:", error.response?.status, error.response?.data || error.message);
                const errorMsg = error.response?.data?.error || error.message || "Failed to save. Please try again.";
                alert(`Error saving news article: ${errorMsg}`);
            }
        } else {
            if (!currentUser) alert("Please log in to save news articles!");
            else if (!currentUser.token) alert("Authentication token is missing. Please log in again to save.");
        }
    };


    const skipArticle = () => {
        setResult(null); setTitle(""); setContent(""); setCategory("");
    };

    // --- JSX Rendering (Đã cập nhật icon và thêm Verdict) ---
    return (
        <Container className="py-5">
            <Card className="shadow-sm p-4 p-md-5 mx-auto" style={{ maxWidth: '850px' }}>
                <h2 className="mb-4 text-center fw-bold text-dark">
                     {/* THAY ĐỔI ICON Ở ĐÂY */}
                    <i className="fas fa-newspaper me-2"></i> Automatic Fake News Classification
                </h2>

                {/* Form Inputs */}
                <Form>
                   <Form.Group className="mb-3" controlId="newsTitle">
                        <Form.Label><i className="fas fa-heading me-2 text-muted"></i>News Title</Form.Label>
                        <Form.Control
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter news title..."
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="newsContent">
                        <Form.Label><i className="fas fa-file-alt me-2 text-muted"></i>News Content</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={10}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter news content here... The system will attempt auto-detection and English translation if needed."
                            required
                        />
                        <Form.Text className="text-muted">
                            Enter the full article content for best results. Longer text yields more accurate classification.
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="newsCategory">
                        <Form.Label><i className="fas fa-tag me-2 text-muted"></i>Category (Optional)</Form.Label>
                         <Form.Control
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Politics, Society, Technology..."
                         />
                    </Form.Group>
                </Form>

                {/* Action Buttons */}
                <Stack direction="vertical" gap={3} className="mb-3">
                    <Button
                        variant="dark"
                        size="sm"
                        onClick={() => classifyText(false)}
                        disabled={isLoading || isExplaining || !content.trim()}
                    >
                        {isLoading ? (
                            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Checking...</>
                        ) : (
                            <><i className="fas fa-rocket me-2"></i> Quick Check</>
                        )}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => classifyText(true)}
                        disabled={isLoading || isExplaining || !content.trim()}
                        // className="text-white" /* <<< Bỏ class này vì secondary thường đi với chữ đen */
                    >
                        {isExplaining ? (
                            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Explaining...</>
                        ) : (
                            <><i className="fas fa-search-plus me-2"></i> Check & Explain (Slower)</>
                        )}
                    </Button>
                </Stack>

                {/* Guest Check Limit */}
                {!currentUser && (
                     <p className="text-muted mt-2 text-center small">
                       <i className="fas fa-user-clock me-1"></i> Checks today: {classifyCount}/3. <a href="/login">Log in</a> for unlimited checks.
                     </p>
                )}
            </Card>

            {/* --- Result Display Area --- */}
             {/* Bỏ spinner ở giữa nếu muốn
             { (isLoading || isExplaining) && !result && (
                 <div className="text-center mt-5">
                     <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                     <p className="text-muted fs-5 mt-3">Processing your request...</p>
                 </div>
             )}
             */}

            {result && (
                <Card className={`mt-4 shadow-sm mx-auto ${result.error ? 'border-danger' : 'border-light'}`} style={{ maxWidth: '850px' }}>
                    <Card.Header className="bg-light">
                        <h4 className="text-center mb-0 fw-bold">
                           <i className="fas fa-poll me-2"></i> Classification Result
                        </h4>
                    </Card.Header>

                    {result.error ? (
                        <Card.Body>
                            <Alert variant="danger" className="text-center">
                                <i className="fas fa-exclamation-triangle me-2"></i> <strong>Error:</strong> {result.error}
                            </Alert>
                        </Card.Body>
                    ) : (
                        <Card.Body className="p-4">

                             {/* Input Details Section */}
                            <Card className="mb-4 bg-light border">
                                <Card.Header className="py-2">
                                    <small className="text-muted fw-bold"><i className="fas fa-info-circle me-2"></i>Input Details</small>
                                </Card.Header>
                                <ListGroup variant="flush">
                                   <ListGroup.Item className="py-2">
                                        <small><strong><i className="fas fa-language me-2 text-muted"></i>Detected Language:</strong> <Badge bg="secondary">{result.detected_language || 'N/A'}</Badge></small>
                                    </ListGroup.Item>
                                    <ListGroup.Item className="py-2">
                                        <small><strong><i className="fas fa-paragraph me-2 text-muted"></i>Original Input:</strong></small>
                                        <p className="text-muted small bg-white p-2 mt-1 rounded border" style={{ maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85em' }}>
                                            {content || "(Not provided)"}
                                        </p>
                                    </ListGroup.Item>
                                     {result.detected_language && !['en', 'unknown_short', 'unknown_error'].includes(result.detected_language) && (
                                         <ListGroup.Item className="py-2">
                                             <small><strong><i className="fas fa-file-word me-2 text-muted"></i>Text Processed (English):</strong></small>
                                              <p className="text-muted small bg-white p-2 mt-1 rounded border" style={{ maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85em' }}>
                                                {result.processed_english_text || "(Processing error or not applicable)"}
                                              </p>
                                         </ListGroup.Item>
                                    )}
                                </ListGroup>
                            </Card>

                            <p><strong><i className="fas fa-heading me-2 text-muted"></i>Title:</strong> {title || <span className="text-muted fst-italic">(Not entered)</span>}</p>
                            <p className="mb-4"><strong><i className="fas fa-tag me-2 text-muted"></i>Category:</strong> {category || <span className="text-muted fst-italic">(Not entered)</span>}</p>

                             {/* THÊM KẾT LUẬN FAKE/REAL */}
                            { typeof result.fake_probability === 'number' && ( // Chỉ hiển thị nếu có xác suất
                                (() => {
                                    const verdict = result.fake_probability > 50 ? "Fake News" : "Real News";
                                    const verdictColor = verdict === "Fake News" ? "text-danger" : "text-success";
                                    const verdictIcon = verdict === "Fake News" ? "fa-times-circle" : "fa-check-circle";
                                    return (
                                        <div className={`text-center mb-4`}>
                                            <h3 className={`fw-bold ${verdictColor}`}>
                                                <i className={`fas ${verdictIcon} me-2`}></i>
                                                Verdict: {verdict}
                                            </h3>
                                        </div>
                                    );
                                })() // IIFE để tính toán và trả về JSX
                            )}
                             {/* KẾT THÚC PHẦN KẾT LUẬN */}


                            {/* Probabilities */}
                            <Alert variant="secondary" className="p-3 mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span><i className="fas fa-check-circle text-success me-2"></i><strong>Real News Probability:</strong></span>
                                    <span className="fw-bold fs-5 text-success">{result.real_probability?.toFixed(1)}%</span>
                                </div>
                                <ProgressBar now={result.real_probability} variant="success" style={{ height: '8px' }} className="mb-3" />

                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span><i className="fas fa-times-circle text-danger me-2"></i><strong>Fake News Probability:</strong></span>
                                    <span className="fw-bold fs-5 text-danger">{result.fake_probability?.toFixed(1)}%</span>
                                </div>
                                <ProgressBar now={result.fake_probability} variant="danger" style={{ height: '8px' }} />
                            </Alert>

                            {/* Sentiment */}
                             { typeof result.sentiment_score === 'number' && ( // Chỉ hiển thị nếu có điểm sentiment
                                <div className="mb-4">
                                    <SentimentBar score={result.sentiment_score} />
                                </div>
                             )}


                            {/* SHAP Words */}
                            {result.top_fake_words && Array.isArray(result.top_fake_words) && result.top_fake_words.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-primary mb-2">
                                        <i className="fas fa-tags me-2"></i> Top Influential Words for "Fake"
                                        <small className="text-muted fw-normal ms-2">(English)</small>
                                    </h5>
                                    <p className="text-muted small fst-italic mb-2">
                                        (Tokens identified by the model as most contributing to the 'Fake' prediction.)
                                    </p>
                                    <div className="p-3 border rounded bg-light">
                                        {result.top_fake_words.map((word, index) => (
                                            <Badge pill bg="danger" key={index} className="me-2 mb-2 p-2 fs-6 fw-normal">
                                                {word}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Save/Skip Buttons */}
                            {!result.error && (
                                <Stack direction="horizontal" gap={2} className="mt-4 pt-3 border-top justify-content-end">
                                    <Button variant="outline-secondary" onClick={skipArticle}>
                                        <i className="fas fa-redo me-1"></i> New Entry
                                    </Button>
                                    {currentUser && currentUser.token ? (
                                        <Button variant="success" onClick={saveArticle}>
                                            <i className="fas fa-save me-1"></i> Save Result
                                        </Button>
                                    ) : (
                                         <Button variant="success" disabled title={!currentUser ? "Log in to save" : "Token missing, cannot save"}>
                                            <i className="fas fa-save me-1"></i> Save Result
                                         </Button>
                                    )}
                                </Stack>
                            )}
                        </Card.Body>
                    )}
                </Card>
            )}
        </Container> // End container
    );
}

export default ClassifyNews;