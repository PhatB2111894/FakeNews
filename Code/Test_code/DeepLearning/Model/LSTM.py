import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.utils import to_categorical
from sklearn.metrics import classification_report, confusion_matrix

# Đọc dữ liệu từ hai tệp CSV
df1 = pd.read_csv("/kaggle/input/isot-dataset/Fake.csv")
df2 = pd.read_csv("/kaggle/input/isot-dataset/True.csv")

# Thêm nhãn vào từng tập dữ liệu
df1["label"] = 0
df2["label"] = 1

# Gộp hai tập dữ liệu
data = pd.concat([df1, df2], ignore_index=True)

# Tiền xử lý văn bản
data['text'] = data['title'] + " " + data['text']

# Chia dữ liệu thành X (văn bản) và y (nhãn)
X = data['text']
y = data['label']

# Chuyển nhãn thành dạng số (0, 1)
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y)

# Vector hóa văn bản bằng cách sử dụng Tokenizer từ Keras
tokenizer = tf.keras.preprocessing.text.Tokenizer(num_words=5000)
tokenizer.fit_on_texts(X)
X_seq = tokenizer.texts_to_sequences(X)

# Padding các câu để chúng có độ dài bằng nhau
X_pad = pad_sequences(X_seq, maxlen=100)

# Chia dữ liệu thành tập huấn luyện và kiểm tra (80% huấn luyện, 20% kiểm tra)
X_train, X_test, y_train, y_test = train_test_split(X_pad, y, test_size=0.2, random_state=42)

# Xây dựng mô hình LSTM
model = models.Sequential()
model.add(layers.Embedding(input_dim=5000, output_dim=128, input_length=100))
model.add(layers.LSTM(64, dropout=0.2, recurrent_dropout=0.2))
model.add(layers.Dense(1, activation='sigmoid'))  # Sử dụng 'sigmoid' cho phân loại nhị phân

# Biên dịch mô hình
model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

# Huấn luyện mô hình và lưu lại lịch sử
history = model.fit(X_train, y_train, epochs=5, batch_size=64, validation_data=(X_test, y_test))

# Ghi lại các kết quả huấn luyện vào CSV
epoch_log = pd.DataFrame({
    "epoch": list(range(1, len(history.history['loss']) + 1)),
    "train_loss": history.history['loss'],
    "train_accuracy": history.history['accuracy'],
    "val_loss": history.history['val_loss'],
    "val_accuracy": history.history['val_accuracy']
})

epoch_log.to_csv("epoch_log.csv", index=False)

# Đánh giá mô hình trên tập kiểm tra
test_loss, test_accuracy = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {test_accuracy:.4f}")

# Dự đoán nhãn trên tập kiểm tra
y_pred = model.predict(X_test)
y_pred = (y_pred > 0.5)  # Chuyển đổi xác suất thành nhãn 0 hoặc 1

# In kết quả đánh giá
print("Classification Report:")
report = classification_report(y_test, y_pred)
print(report)

# Lưu classification report vào tệp văn bản
with open("classification_report.txt", "w") as f:
    f.write(report)

# Tính toán và lưu ma trận nhầm lẫn
conf_matrix = confusion_matrix(y_test, y_pred)
conf_matrix_df = pd.DataFrame(conf_matrix, index=label_encoder.classes_, columns=label_encoder.classes_)

# Lưu ma trận nhầm lẫn vào CSV
conf_matrix_df.to_csv("confusion_matrix.csv")

# Tính các chỉ số khác và lưu vào CSV
accuracy = test_accuracy
f1 = f1_score(y_test, y_pred, average='weighted')
precision = precision_score(y_test, y_pred, average='weighted')
recall = recall_score(y_test, y_pred, average='weighted')

evaluation_results = pd.DataFrame({
    "accuracy": [accuracy],
    "f1": [f1],
    "precision": [precision],
    "recall": [recall]
})

evaluation_results.to_csv("evaluation_results.csv", index=False)
