#TF-IDF vs LSTM
import pandas as pd
import re
import pickle
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam

plt.style.use('ggplot')

# Load dataset
fake_df = pd.read_csv('../input/isot-dataset/Fake.csv')[['title', 'text']]
real_df = pd.read_csv('../input/isot-dataset/True.csv')[['title', 'text']]

fake_df['class'] = 0
real_df['class'] = 1

df = pd.concat([fake_df, real_df], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
df['title_text'] = df['title'] + ' ' + df['text']
df.drop(['title', 'text'], axis=1, inplace=True)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(df['title_text'], df['class'], test_size=0.2, random_state=42)

# Tiền xử lý dữ liệu
def normalize(data):
    normalized = []
    for i in data:
        i = i.lower()
        i = re.sub('https?://\S+|www\.\S+', '', i)  # Loại bỏ URL
        i = re.sub('\\W', ' ', i)  # Loại bỏ ký tự đặc biệt
        i = re.sub('\n', '', i)  # Loại bỏ xuống dòng
        i = re.sub(' +', ' ', i)  # Loại bỏ khoảng trắng dư thừa
        i = re.sub('^ ', '', i)  # Xóa khoảng trắng đầu câu
        i = re.sub(' $', '', i)  # Xóa khoảng trắng cuối câu
        normalized.append(i)
    return normalized

X_train, X_test = normalize(X_train), normalize(X_test)

# TF-IDF
vectorizer = TfidfVectorizer(max_features=10000)
X_train = vectorizer.fit_transform(X_train).toarray()
X_test = vectorizer.transform(X_test).toarray()

# Save vectorizer
with open(f"LSTM_TDIDF_tfidf_vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

# Chuyển đổi cho LSTM: reshape thành (samples, time_steps, features)
sequence_length = X_train.shape[1]  # TF-IDF vector size
X_train = np.reshape(X_train, (X_train.shape[0], sequence_length, 1))
X_test = np.reshape(X_test, (X_test.shape[0], sequence_length, 1))

# Build LSTM model
model = Sequential([
    LSTM(128, return_sequences=True, input_shape=(sequence_length, 1)),  
    Dropout(0.5),
    LSTM(64, return_sequences=False),  
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])

model.compile(loss='binary_crossentropy', optimizer=Adam(1e-4), metrics=['accuracy'])

# Train model
history = model.fit(X_train, y_train, epochs=10, batch_size=128, validation_data=(X_test, y_test), shuffle=True)

# Lấy thời gian hiện tại để gắn vào tên tệp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Lưu training log (có thêm Epoch)
history_df = pd.DataFrame(history.history)
history_df['Epoch'] = history_df.index + 1  # Thêm cột Epoch
history_df.to_csv(f"LSTM_TDIDF_training_log_{timestamp}.csv", index=False)

# Vẽ biểu đồ Loss và Accuracy
epochs = history.epoch
loss, acc = history.history['loss'], history.history['accuracy']
val_loss, val_acc = history.history['val_loss'], history.history['val_accuracy']

plt.figure(figsize=(10, 6))
plt.plot(epochs, loss, 'r', label='Training loss')
plt.plot(epochs, val_loss, 'b', label='Validation loss')
plt.title('Loss', size=15)
plt.xlabel('Epochs', size=15)
plt.ylabel('Loss', size=15)
plt.legend()
plt.savefig(f"LSTM_TDIDF_training_loss_{timestamp}.png")
plt.show()

plt.figure(figsize=(10, 6))
plt.plot(epochs, acc, 'g', label='Training Accuracy')
plt.plot(epochs, val_acc, 'b', label='Validation Accuracy')
plt.title('Accuracy', size=15)
plt.xlabel('Epochs', size=15)
plt.ylabel('Accuracy', size=15)
plt.legend()
plt.savefig(f"LSTM_TDIDF_training_accuracy_{timestamp}.png")
plt.show()

# Model evaluation
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"\n **Test Accuracy: {test_acc:.4f}**")

# Dự đoán
y_pred_prob = model.predict(X_test)
y_pred = (y_pred_prob >= 0.5).astype(int)

# Tính các chỉ số đánh giá
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

# Hiển thị các chỉ số
print(f"\n **Evaluation Metrics:**")
print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")

# Lưu vào file CSV
metrics_df = pd.DataFrame({
    "Metric": ["Accuracy", "Precision", "Recall", "F1 Score"],
    "Value": [accuracy, precision, recall, f1]
})
metrics_df.to_csv(f"LSTM_TDIDF_evaluation_metrics_{timestamp}.csv", index=False)

# Classification Report
report = classification_report(y_test, y_pred, output_dict=True)
report_df = pd.DataFrame(report).transpose()
report_df.to_csv(f"LSTM_TDIDF_classification_report_{timestamp}.csv", index=True)

# Confusion Matrix
matrix = confusion_matrix(y_test, y_pred)
matrix_df = pd.DataFrame(matrix, index=["Actual 0", "Actual 1"], columns=["Predicted 0", "Predicted 1"])
matrix_df.to_csv(f"LSTM_TDIDF_confusion_matrix_{timestamp}.csv", index=True)

# Vẽ & lưu Confusion Matrix
plt.figure(figsize=(10, 6))
ax = sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues')

ax.set_xlabel('Predicted Labels', size=15)
ax.set_ylabel('True Labels', size=15)
ax.set_title('Confusion Matrix', size=15)
ax.xaxis.set_ticklabels([0, 1], size=15)
ax.yaxis.set_ticklabels([0, 1], size=15)

plt.savefig(f"LSTM_TDIDF_confusion_matrix_{timestamp}.png")
plt.show()
