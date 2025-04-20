
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  // State và setters cho giá trị debounced
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Cập nhật giá trị debounced sau khoảng thời gian delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Hủy timeout nếu value thay đổi (nghĩa là user vẫn đang gõ)
      // Hoặc nếu delay thay đổi hoặc component unmount
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Chỉ chạy lại effect nếu value hoặc delay thay đổi
  );

  return debouncedValue;
}

export default useDebounce;
