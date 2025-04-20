import React from 'react';

const SentimentBar = ({ score }) => {
  // --- Tính toán cơ bản ---
  const clampedScore = Math.max(-1, Math.min(1, score));
  const percentage = ((clampedScore + 1) / 2) * 100; // Vị trí % của điểm số hiện tại

  // --- Xác định màu cho điểm số và mô tả chữ ---
  let scoreColor = '#6c757d'; // Màu chữ xám trung tính
  let scoreDescription = 'Neutral';
  if (clampedScore >= 0.05) {
    scoreColor = '#198754'; // Xanh lá
    scoreDescription = 'Positive';
  } else if (clampedScore <= -0.05) {
    scoreColor = '#dc3545'; // Đỏ
    scoreDescription = 'Negative';
  }

  // --- Style ---
  const containerStyle = { marginBottom: '30px' };
  const textContainerStyle = { fontSize: '0.9em', marginBottom: '5px' };
  const scoreLineStyle = { marginBottom: '4px' };
  const scoreValueStyle = { color: scoreColor, fontWeight: 'bold', marginLeft: '5px' };
  const descriptionLineStyle = { color: scoreColor };
  const barContainerStyle = { position: 'relative', width: '100%', height: '20px', marginTop: '5px' };
  const barBackgroundStyle = { position: 'absolute', top: '5px', left: '0', height: '10px', width: '100%', background: 'linear-gradient(to right, #dc3545, #ffc107, #198754)', borderRadius: '5px' };
  const zeroMarkerStyle = { position: 'absolute', left: '50%', top: '0', width: '2px', height: '20px', backgroundColor: 'black', transform: 'translateX(-50%)', zIndex: 2 };
  const scoreMarkerStyle = { position: 'absolute', left: `${percentage}%`, top: '0', width: '4px', height: '20px', backgroundColor: 'white', border: '1px solid black', transform: 'translateX(-50%)', borderRadius: '2px', zIndex: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' };

  // Style cho khu vực chứa nhãn text (-1, 0, +1, Negative, Positive, và điểm số động)
   const axisLabelContainerStyle = {
       position: 'relative', // Dùng relative để chứa các absolute con
       width: '100%',
       marginTop: '8px', // Khoảng cách từ bar xuống nhãn
       height: 'auto', // Tự động chiều cao
       fontSize: '0.75em', // Font size chung cho các nhãn dưới bar
   };
   // Style cho chữ Negative/Positive
   const textLabelStyle = (align) => ({
       display: 'block',
       width: '48%',
       textAlign: align,
       color: '#343a40' // Màu chữ đậm hơn chút
   });
   // Style cho số cố định -1, 0, +1
   const numericMarkerLabelStyle = (pos) => ({
       position: 'absolute',
       left: `${pos}%`,
       transform: 'translateX(-50%)',
       color: '#6c757d', // Màu xám
       marginTop: '16px' // Đẩy xuống dưới dòng Negative/Positive
   });
   // !!! THÊM STYLE CHO NHÃN ĐIỂM SỐ ĐỘNG !!!
   const scoreAxisLabelStyle = {
        position: 'absolute',
        left: `${percentage}%`, // Vị trí động
        transform: 'translateX(-50%)', // Căn giữa số tại vị trí đó
        marginTop: '16px', // Đặt cùng hàng dọc với -1, 0, +1
        color: scoreColor, // Màu theo cảm xúc
        fontWeight: 'bold', // In đậm cho nổi bật
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Nền trắng mờ để đọc rõ nếu đè lên vạch 0
        padding: '0 3px',
        borderRadius: '3px',
        zIndex: 1 // Nằm trên các thành phần khác nhưng dưới marker chính nếu cần
   };


  // --- JSX để render ---
  return (
    <div style={containerStyle}>
      {/* Phần Text: Điểm số và Mô tả */}
      <div style={textContainerStyle}>
         <div style={scoreLineStyle}><strong>Sentiment Score (VADER):</strong><span style={scoreValueStyle}>{score.toFixed(4)}</span></div>
         {/* <div style={descriptionLineStyle}>{scoreDescription}</div> */}
        {/* Dòng chữ Negative / Positive */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
               <span style={textLabelStyle('left')}>Negative</span>
               <span style={textLabelStyle('right')}>Positive</span>
          </div>
      </div>

      {/* Thanh Bar và các Marker */}
      <div style={barContainerStyle}>
          <div style={barBackgroundStyle}></div>
          <div style={zeroMarkerStyle}></div>
          <div style={scoreMarkerStyle}></div>
      </div>

      {/* Khu vực Nhãn dưới thanh bar */}
      <div style={axisLabelContainerStyle}>
          
          {/* Dòng số -1 / 0 / +1 VÀ ĐIỂM SỐ ĐỘNG */}
          {/* Container cần đủ cao để chứa các nhãn */}
          <div style={{position: 'relative', width: '100%', height: '20px'}}>
              {/* Nhãn cố định */}
              <span style={numericMarkerLabelStyle(0)}>-1</span>
              <span style={numericMarkerLabelStyle(50)}>0</span>
              <span style={numericMarkerLabelStyle(100)}>+1</span>

              {/* !!! THÊM NHÃN ĐIỂM SỐ ĐỘNG !!! */}
              {/* Hiển thị điểm số làm tròn 2 chữ số */}
              <span style={scoreAxisLabelStyle}>
                  {clampedScore.toFixed(4)}
              </span>
          </div>
      </div>
    </div>
  );
};

export default SentimentBar;