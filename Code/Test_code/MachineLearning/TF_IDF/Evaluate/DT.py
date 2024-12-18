import pandas as pd
import joblib
from sklearn.metrics import classification_report, accuracy_score, f1_score, precision_score, recall_score
from sklearn.preprocessing import LabelEncoder

# Tải lại mô hình và TF-IDF đã lưu
best_model = joblib.load("/kaggle/working/ffinal_decision_tree_model.pkl")
tfidf = joblib.load("/kaggle/working/ttfidf_vectorizer.pkl")  # Tải TF-IDF đã lưu

# Đọc dữ liệu từ tệp CSV mới
df = pd.read_csv("/kaggle/input/fakereal/fake_or_real_news.csv")

# Kiểm tra và xử lý nhãn (LabelEncoder để chuyển nhãn thành 0 và 1 nếu chưa có)
label_encoder = LabelEncoder()
df["label"] = label_encoder.fit_transform(df["label"])

# Tiền xử lý: kết hợp cột title và text thành cột 'text'
df['text'] = df['title'] + " " + df['text']

# Tiền xử lý dữ liệu mới
X_new = df['text']  # Đảm bảo đúng tên cột chứa văn bản
y_new = df['label']  # Đảm bảo cột chứa nhãn chính xác

# Chuyển đổi dữ liệu văn bản thành vector TF-IDF sử dụng TF-IDF đã huấn luyện
X_new_tfidf = tfidf.transform(X_new)

# Dự đoán với mô hình đã lưu
y_new_pred = best_model.predict(X_new_tfidf)

# Đánh giá kết quả
accuracy = accuracy_score(y_new, y_new_pred)
f1 = f1_score(y_new, y_new_pred, average='weighted')
precision = precision_score(y_new, y_new_pred, average='weighted')
recall = recall_score(y_new, y_new_pred, average='weighted')
report = classification_report(y_new, y_new_pred)

# In kết quả
print(f"Accuracy: {accuracy:.4f}, F1: {f1:.4f}, Precision: {precision:.4f}, Recall: {recall:.4f}")
print(report)

# Lưu kết quả vào CSV
evaluation_results = pd.DataFrame({
    "accuracy": [accuracy],
    "f1": [f1],
    "precision": [precision],
    "recall": [recall]
})
evaluation_results.to_csv("evaluation_results.csv", index=False)

# Lưu báo cáo phân loại vào tệp văn bản
with open("evaluate_classification_report.txt", "w") as f:
    f.write(report)
