import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from imblearn.over_sampling import SMOTE

# Đọc dữ liệu từ hai tệp CSV
df1 = pd.read_csv("/kaggle/input/isot-dataset/Fake.csv")
df2 = pd.read_csv("/kaggle/input/isot-dataset/True.csv")

# Thêm nhãn vào từng tập dữ liệu
df1["label"] = 0
df2["label"] = 1

# Gộp hai tập dữ liệu
data = pd.concat([df1, df2], ignore_index=True)

# Tiền xử lý
data['text'] = data['title'] + " " + data['text']

# Kết hợp các đặc trưng bổ sung
X = data['text']
y = data['label']

# Vector hóa văn bản sử dụng TF-IDF
tfidf = TfidfVectorizer(max_features=5000)
X_tfidf = tfidf.fit_transform(X)

# Chia dữ liệu thành tập huấn luyện và kiểm tra (80% huấn luyện, 20% kiểm tra)
X_train, X_test, y_train, y_test = train_test_split(X_tfidf, y, test_size=0.2, random_state=42)

# Áp dụng SMOTE để cân bằng dữ liệu
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

# Tạo mô hình với tham số tốt nhất
model = DecisionTreeClassifier(criterion='entropy', max_depth=None, min_samples_leaf=2, min_samples_split=10, random_state=42)

# Huấn luyện mô hình trên dữ liệu đã được cân bằng
model.fit(X_train_resampled, y_train_resampled)

# Chạy cross-validation để đánh giá mô hình
cv_scores = cross_val_score(model, X_train_resampled, y_train_resampled, cv=3, scoring='accuracy', n_jobs=-1)

# In kết quả cross-validation
print(f"Accuracy for each fold: {cv_scores}")
print(f"Mean Accuracy: {cv_scores.mean():.4f}")

# Lưu mô hình và vectorizer đã huấn luyện
joblib.dump(model, "final_decision_tree_model_with_smote.pkl")
joblib.dump(tfidf, "tfidf_vectorizer_with_smote.pkl")

# Kiểm tra hiệu suất trên tập kiểm tra
test_accuracy = model.score(X_test, y_test)
print(f"Test Accuracy: {test_accuracy:.4f}")
