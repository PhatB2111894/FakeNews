import re
import string
import numpy as np
import pandas as pd
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
import nltk

# Đặt device cho GPU nếu có
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Tải các tài nguyên cần thiết của nltk
nltk.download('stopwords')
nltk.download('punkt')

# 1. Đọc dữ liệu
df1 = pd.read_csv("/kaggle/input/isot-dataset/Fake.csv")  # Thay đổi đường dẫn nếu cần
df2 = pd.read_csv("/kaggle/input/isot-dataset/True.csv")  # Thay đổi đường dẫn nếu cần

# Gán nhãn cho dữ liệu
df1['label'] = 'Fake'
df2['label'] = 'True'

# Gộp hai tập dữ liệu
data = pd.concat([df1, df2], ignore_index=True)

# 2. Tiền xử lý văn bản
def preprocess_text(text):
    text = text.lower()  # Chuyển văn bản thành chữ thường
    text = text.translate(str.maketrans('', '', string.punctuation))  # Loại bỏ dấu câu
    text = re.sub(r'\d+', '', text)  # Loại bỏ các ký tự số
    tokens = word_tokenize(text)  # Tokenize (phân tách từ)
    tokens = [word for word in tokens if word not in stopwords.words('english')]  # Loại bỏ từ dừng
    return ' '.join(tokens)

# Áp dụng tiền xử lý cho dữ liệu
data['text'] = data['text'].apply(preprocess_text)

# Tách đặc trưng và nhãn
X = data['text']
y = data['label']

# Mã hóa nhãn
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y)

# Tách dữ liệu thành tập huấn luyện và kiểm tra
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Chuẩn bị vector hóa TF-IDF
tfidf_vectorizer = TfidfVectorizer(max_features=5000)
X_train_tfidf = tfidf_vectorizer.fit_transform(X_train).toarray()
X_test_tfidf = tfidf_vectorizer.transform(X_test).toarray()

# 4. Định nghĩa Dataset và DataLoader trong PyTorch
class TextDataset(Dataset):
    def __init__(self, features, labels):
        self.features = torch.tensor(features, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.long)
    
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]

train_dataset = TextDataset(X_train_tfidf, y_train)
test_dataset = TextDataset(X_test_tfidf, y_test)

# Sử dụng DataLoader
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

# 5. Xây dựng mô hình mạng nơ-ron
class TextClassificationModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(TextClassificationModel, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_dim, output_dim)
        self.softmax = nn.Softmax(dim=1)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return self.softmax(x)

# Khởi tạo mô hình
input_dim = X_train_tfidf.shape[1]
hidden_dim = 128
output_dim = 2
model = TextClassificationModel(input_dim, hidden_dim, output_dim).to(device)  # Chuyển mô hình sang GPU nếu có

# 6. Huấn luyện mô hình
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# Huấn luyện
num_epochs = 10
for epoch in range(num_epochs):
    model.train()
    total_loss = 0
    for features, labels in train_loader:
        features, labels = features.to(device), labels.to(device)  # Chuyển dữ liệu sang GPU
        
        # Forward pass
        outputs = model(features)
        loss = criterion(outputs, labels)
        
        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    print(f"Epoch {epoch+1}/{num_epochs}, Loss: {total_loss:.4f}")

# 7. Huấn luyện mô hình SVM với TF-IDF
svm_model_tfidf = SVC(kernel='linear')
svm_model_tfidf.fit(X_train_tfidf, y_train)

# 8. Huấn luyện mô hình Logistic Regression với TF-IDF
logreg_model_tfidf = LogisticRegression(max_iter=1000)
logreg_model_tfidf.fit(X_train_tfidf, y_train)

# 9. Đánh giá mô hình trên tập kiểm tra
def evaluate_model(model, X_test, y_test, model_type='torch'):
    if model_type == 'torch':
        model.eval()
        y_true, y_pred = [], []
        with torch.no_grad():
            for features, labels in test_loader:
                features, labels = features.to(device), labels.to(device)  # Chuyển dữ liệu sang GPU
                outputs = model(features)
                _, predicted = torch.max(outputs, 1)
                y_true.extend(labels.cpu().numpy())
                y_pred.extend(predicted.cpu().numpy())
    else:
        y_pred = model.predict(X_test)
        y_true = y_test
    
    return y_true, y_pred

# Đánh giá mô hình mạng nơ-ron
y_true_nn, y_pred_nn = evaluate_model(model, X_test_tfidf, y_test, model_type='torch')
print("\nEvaluation on Neural Network:")
print("Confusion Matrix:\n", confusion_matrix(y_true_nn, y_pred_nn))
print("Classification Report:\n", classification_report(y_true_nn, y_pred_nn))
print("Accuracy:", accuracy_score(y_true_nn, y_pred_nn))

# Đánh giá mô hình SVM
y_true_svm, y_pred_svm = evaluate_model(svm_model_tfidf, X_test_tfidf, y_test, model_type='sklearn')
print("\nEvaluation on SVM:")
print("Confusion Matrix:\n", confusion_matrix(y_true_svm, y_pred_svm))
print("Classification Report:\n", classification_report(y_true_svm, y_pred_svm))
print("Accuracy:", accuracy_score(y_true_svm, y_pred_svm))

# Đánh giá mô hình Logistic Regression
y_true_logreg, y_pred_logreg = evaluate_model(logreg_model_tfidf, X_test_tfidf, y_test, model_type='sklearn')
print("\nEvaluation on Logistic Regression:")
print("Confusion Matrix:\n", confusion_matrix(y_true_logreg, y_pred_logreg))
print("Classification Report:\n", classification_report(y_true_logreg, y_pred_logreg))
print("Accuracy:", accuracy_score(y_true_logreg, y_pred_logreg))

# 10. Kiểm tra mô hình với dữ liệu mới
new_data = pd.read_csv("/kaggle/input/fakereal/fake_or_real_news.csv")  # Thay đổi đường dẫn nếu cần
new_data['text'] = new_data['text'].apply(preprocess_text)

# Tách đặc trưng và nhãn
new_X = new_data['text']
new_y = new_data['label']

# Chuyển nhãn thành dạng số
label_mapping = {'FAKE': 0, 'REAL': 1}  # Định nghĩa ánh xạ nhãn cho tập dữ liệu mới
new_y = new_y.map(label_mapping)

# Trích xuất đặc trưng từ TF-IDF cho dữ liệu mới
X_new_tfidf = tfidf_vectorizer.transform(new_X).toarray()

# Dự đoán với mô hình mạng nơ-ron
model.eval()
new_predictions_nn = []
with torch.no_grad():
    new_features = torch.tensor(X_new_tfidf, dtype=torch.float32).to(device)  # Chuyển dữ liệu sang GPU
    new_outputs = model(new_features)
    _, predicted_nn = torch.max(new_outputs, 1)
    new_predictions_nn = predicted_nn.cpu().numpy()

# Đánh giá mô hình mạng nơ-ron với dữ liệu mới
print("\nEvaluation on New Data (Neural Network):")
print("Confusion Matrix:\n", confusion_matrix(new_y, new_predictions_nn))
print("Classification Report:\n", classification_report(new_y, new_predictions_nn))
print("Accuracy:", accuracy_score(new_y, new_predictions_nn))

# Dự đoán với mô hình SVM
new_predictions_svm = svm_model_tfidf.predict(X_new_tfidf)

# Đánh giá mô hình SVM với dữ liệu mới
print("\nEvaluation on New Data (SVM):")
print("Confusion Matrix:\n", confusion_matrix(new_y, new_predictions_svm))
print("Classification Report:\n", classification_report(new_y, new_predictions_svm))
print("Accuracy:", accuracy_score(new_y, new_predictions_svm))

# Dự đoán với mô hình Logistic Regression
new_predictions_logreg = logreg_model_tfidf.predict(X_new_tfidf)

# Đánh giá mô hình Logistic Regression với dữ liệu mới
print("\nEvaluation on New Data (Logistic Regression):")
print("Confusion Matrix:\n", confusion_matrix(new_y, new_predictions_logreg))
print("Classification Report:\n", classification_report(new_y, new_predictions_logreg))
print("Accuracy:", accuracy_score(new_y, new_predictions_logreg))

# Hiển thị kết quả dự đoán
new_data['predicted_label_nn'] = label_encoder.inverse_transform(new_predictions_nn)
new_data['predicted_label_svm'] = label_encoder.inverse_transform(new_predictions_svm)
new_data['predicted_label_logreg'] = label_encoder.inverse_transform(new_predictions_logreg)

print("\nPredictions on New Data (First 5 Rows):")
print(new_data[['text', 'label', 'predicted_label_nn', 'predicted_label_svm', 'predicted_label_logreg']].head())
