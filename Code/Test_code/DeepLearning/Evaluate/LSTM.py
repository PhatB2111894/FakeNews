import pandas as pd
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.metrics import classification_report, accuracy_score
import joblib
# Giả sử new_data là DataFrame chứa dữ liệu mới với cột 'text' chứa văn bản cần phân loại
# Dữ liệu mới của bạn cần phải có cột 'text' và 'label' nếu có sẵn nhãn thực tế

# Tiền xử lý dữ liệu mới
new_data = pd.read_csv("/kaggle/input/fakereal/fake_or_real_news.csv")  # Đọc dữ liệu mới từ tệp CSV
new_data['text'] = new_data['title'] + " " + new_data['text']
# Tải lại tokenizer
tokenizer = joblib.load("tokenizer.pkl")
tokenizer.fit_on_texts(new_data['text'])

# Tokenization và chuyển đổi văn bản thành chuỗi số (sequence)
new_data_seq = tokenizer.texts_to_sequences(new_data['text'])

# Padding các chuỗi để chúng có cùng độ dài
new_data_pad = pad_sequences(new_data_seq, maxlen=100)  # Đảm bảo maxlen giống như khi huấn luyện

# Tải lại mô hình LSTM đã lưu
from tensorflow.keras.models import load_model
model = load_model("lstm_model.h5")  # Đảm bảo tên mô hình giống với tên bạn đã lưu

# Dự đoán với dữ liệu mới
y_new_pred = model.predict(new_data_pad)
y_new_pred = (y_new_pred > 0.5)  # Chuyển đổi xác suất thành nhãn 0 hoặc 1

# Đánh giá mô hình trên dữ liệu mới nếu có nhãn thực tế
if 'label' in new_data.columns:
    print("Classification Report:")
    print(classification_report(new_data['label'], y_new_pred))

    # Tính độ chính xác
    accuracy = accuracy_score(new_data['label'], y_new_pred)
    print(f"Accuracy: {accuracy:.4f}")
else:
    print("No true labels provided in the new data.")

# Lưu kết quả dự đoán vào DataFrame
results = pd.DataFrame({
    'text': new_data['text'],
    'actual_label': new_data['label'] if 'label' in new_data.columns else ['Not Provided']*len(new_data),
    'predicted_label': y_new_pred.flatten()
})

# Lưu vào tệp CSV
results.to_csv("new_data_predictions.csv", index=False)

# Optional: If you want to save the classification report and confusion matrix as well
from sklearn.metrics import confusion_matrix

# In confusion matrix
conf_matrix = confusion_matrix(new_data['label'], y_new_pred) if 'label' in new_data.columns else None
print("Confusion Matrix:")
print(conf_matrix)

# Lưu confusion matrix vào tệp CSV (nếu cần)
if conf_matrix is not None:
    cm_df = pd.DataFrame(conf_matrix, index=['0', '1'], columns=['0', '1'])
    cm_df.to_csv("confusion_matrix.csv", index=True)
