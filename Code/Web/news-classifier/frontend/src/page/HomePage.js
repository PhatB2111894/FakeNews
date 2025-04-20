// src/components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import file CSS tùy chỉnh (sẽ tạo sau)

function HomePage() {
  return (
    <div className="container mt-5 text-center"> {/* Canh giữa nội dung */}
      {/* Tiêu đề và mô tả ngắn */}
      <h2 className="mb-3 fw-bold">Welcome to News Classifier</h2>
      <p className="lead text-muted mb-5">
        Analyze news content or review your classification history.
      </p>

      {/* Hàng chứa 2 thẻ */}
      <div className="row justify-content-center g-4"> {/* g-4 thêm khoảng cách giữa các cột */}

        {/* Thẻ 1: Classify News */}
        <div className="col-md-5 col-lg-4"> {/* Điều chỉnh kích thước cột */}
          <Link to="/classify" className="text-decoration-none"> {/* Link bao quanh thẻ */}
            {/* Thêm class homepage-card để tùy chỉnh style */}
            <div className="card homepage-card h-100 shadow border-0 text-white" style={{ backgroundColor: '#0d6efd' /* Màu xanh dương của Primary */ }}>
              <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
                {/* Icon lớn */}
                <i className="fas fa-search fa-3x mb-3"></i>
                {/* Tiêu đề thẻ */}
                <h4 className="card-title mb-3">Classify News</h4>
                {/* Mô tả ngắn */}
                <p className="card-text small">
                  Input news text or URL to check if it's Real or Fake.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Thẻ 2: View History */}
        <div className="col-md-5 col-lg-4"> {/* Điều chỉnh kích thước cột */}
          <Link to="/history" className="text-decoration-none">
            <div className="card homepage-card h-100 shadow border-0 text-white" style={{ backgroundColor: '#198754' /* Màu xanh lá của Success */ }}>
              <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
                {/* Icon lớn */}
                <i className="fas fa-history fa-3x mb-3"></i>
                {/* Tiêu đề thẻ */}
                <h4 className="card-title mb-3">View History</h4>
                {/* Mô tả ngắn */}
                <p className="card-text small">
                  Review articles you have previously classified and manage your reports.
                </p>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default HomePage;