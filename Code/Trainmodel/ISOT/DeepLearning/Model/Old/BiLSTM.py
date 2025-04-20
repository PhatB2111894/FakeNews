import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, f1_score
import seaborn as sns
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Bidirectional, Dropout
from tensorflow.keras.optimizers import Adam
import csv
import datetime

# Lấy ngày giờ hiện tại
timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')

# Tên tệp có chứa ngày giờ
training_log_file = f'bilstm_training_logs_{timestamp}.csv'
evaluation_metrics_file = f'bilstm_evaluation_metrics_{timestamp}.csv'
confusion_matrix_file = f'bilstm_confusion_matrix_{timestamp}.csv'

# Đọc dữ liệu
fake_df = pd.read_csv('../input/isot-dataset/Fake.csv')
real_df = pd.read_csv('../input/isot-dataset/True.csv')

# Chỉ giữ lại các cột cần thiết
fake_df = fake_df[['title', 'text']]
real_df = real_df[['title', 'text']]

# Gán nhãn cho từng loại dữ liệu
fake_df['class'] = 0
real_df['class'] = 1

# Kết hợp hai tập dữ liệu
df = pd.concat([fake_df, real_df], ignore_index=True, sort=False)
df['title_text'] = df['title'] + ' ' + df['text']
df.drop(['title', 'text'], axis=1, inplace=True)

# Chia dữ liệu thành đặc trưng và nhãn
X = df['title_text']
y = df['class']

# Chia dữ liệu thành tập huấn luyện và kiểm tra
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

# Tiền xử lý: Token hóa và padding
max_words = 10000  # Số từ tối đa trong từ điển
max_len = 256      # Độ dài tối đa của mỗi chuỗi

tokenizer = Tokenizer(num_words=max_words, oov_token="<OOV>")
tokenizer.fit_on_texts(X_train)

X_train_seq = tokenizer.texts_to_sequences(X_train)
X_test_seq = tokenizer.texts_to_sequences(X_test)

X_train_padded = pad_sequences(X_train_seq, maxlen=max_len, padding='post', truncating='post')
X_test_padded = pad_sequences(X_test_seq, maxlen=max_len, padding='post', truncating='post')

# Xây dựng mô hình BiLSTM
embedding_dim = 128

model = Sequential([
    Embedding(input_dim=max_words, output_dim=embedding_dim, input_length=max_len),
    Bidirectional(LSTM(64, return_sequences=False)),
    Dropout(0.5),
    Dense(64, activation='relu'),
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])

# Biên dịch mô hình
model.compile(optimizer=Adam(learning_rate=1e-4),
              loss='binary_crossentropy',
              metrics=['accuracy'])

# Callback lưu log đào tạo
class LogEpochs(tf.keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        with open(training_log_file, mode='a', newline='') as file:
            writer = csv.writer(file)
            if epoch == 0:
                writer.writerow(['Epoch', 'Loss', 'Accuracy', 'Val_Loss', 'Val_Accuracy'])
            writer.writerow([epoch + 1, logs['loss'], logs['accuracy'], logs['val_loss'], logs['val_accuracy']])

# Huấn luyện mô hình
history = model.fit(
    X_train_padded,
    y_train,
    validation_split=0.1,
    epochs=5,
    batch_size=32,
    verbose=1,
    callbacks=[LogEpochs()]
)

# Đánh giá mô hình
results = model.evaluate(X_test_padded, y_test, verbose=1)
test_accuracy = results[1]

# Dự đoán
predictions = (model.predict(X_test_padded) > 0.5).astype(int)

# Tính toán các chỉ số
accuracy = accuracy_score(predictions, y_test)
precision = precision_score(predictions, y_test)
recall = recall_score(predictions, y_test)
f1 = f1_score(predictions, y_test)

# Lưu các chỉ số đánh giá vào CSV
with open(evaluation_metrics_file, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Test Accuracy', test_accuracy])
    writer.writerow(['Accuracy', accuracy])
    writer.writerow(['Precision', precision])
    writer.writerow(['Recall', recall])
    writer.writerow(['F1 Score', f1])

# Ma trận nhầm lẫn
matrix = confusion_matrix(predictions, y_test)

# Lưu ma trận nhầm lẫn vào CSV
with open(confusion_matrix_file, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['', 'Predicted 0', 'Predicted 1'])
    writer.writerow(['Actual 0', matrix[0][0], matrix[0][1]])
    writer.writerow(['Actual 1', matrix[1][0], matrix[1][1]])

# Vẽ ma trận nhầm lẫn
plt.figure(figsize=(10, 6))
ax = plt.subplot()
sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues')

ax.set_xlabel('Dự đoán', size=15)
ax.set_ylabel('Thực tế', size=15)
ax.set_title('Ma Trận Nhầm Lẫn', size=15)
ax.xaxis.set_ticklabels(['Giả', 'Thật'], size=15)
ax.yaxis.set_ticklabels(['Giả', 'Thật'], size=15)
plt.show()

print(f"Log đào tạo được lưu trong: {training_log_file}")
print(f"Các chỉ số đánh giá được lưu trong: {evaluation_metrics_file}")
print(f"Ma trận nhầm lẫn được lưu trong: {confusion_matrix_file}")
