# Thư viện cần thiết
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, f1_score
import seaborn as sns
from transformers import RobertaTokenizer, TFRobertaForSequenceClassification
import tensorflow as tf
import csv
import datetime
# Cài đặt kiểu hiển thị đồ thị
plt.style.use('ggplot')
# Lấy ngày giờ hiện tại
timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')

# Tên tệp có chứa ngày giờ
training_log_file = f'training_logs_{timestamp}.csv'
evaluation_metrics_file = f'evaluation_metrics_{timestamp}.csv'
confusion_matrix_file = f'confusion_matrix_{timestamp}.csv'
# Đọc dữ liệu từ file
fake_df = pd.read_csv('../input/isot-dataset/Fake.csv')
real_df = pd.read_csv('../input/isot-dataset/True.csv')

# Chỉ lấy các cột cần thiết
fake_df = fake_df[['title', 'text']]
real_df = real_df[['title', 'text']]

# Thêm nhãn cho dữ liệu
fake_df['class'] = 0  # Tin giả
real_df['class'] = 1  # Tin thật

# Kết hợp dữ liệu
df = pd.concat([fake_df, real_df], ignore_index=True, sort=False)
df['title_text'] = df['title'] + ' ' + df['text']
df.drop(['title', 'text'], axis=1, inplace=True)

# Chia tập dữ liệu thành đặc trưng và nhãn
X = df['title_text']
y = df['class']

# Chia dữ liệu thành tập huấn luyện và kiểm tra
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

# Khởi tạo tokenizer của RoBERTa
tokenizer = RobertaTokenizer.from_pretrained('roberta-base')

# Tokenize dữ liệu
train_encodings = tokenizer(list(X_train), truncation=True, padding=True, max_length=256, return_tensors="tf")
test_encodings = tokenizer(list(X_test), truncation=True, padding=True, max_length=256, return_tensors="tf")

# Chuyển nhãn thành tensor
train_labels = tf.convert_to_tensor(y_train.values)
test_labels = tf.convert_to_tensor(y_test.values)

# Tải mô hình RoBERTa đã được huấn luyện trước
model = TFRobertaForSequenceClassification.from_pretrained('roberta-base', num_labels=2)

# Hiển thị cấu trúc mô hình
model.summary()

# Compile mô hình
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=['accuracy']
)

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
    {'input_ids': train_encodings['input_ids'], 'attention_mask': train_encodings['attention_mask']},
    train_labels,
    validation_split=0.1,
    epochs=3,
    batch_size=32,
    callbacks=[LogEpochs()]
)

# Đánh giá mô hình
results = model.evaluate(
    x={'input_ids': test_encodings['input_ids'], 'attention_mask': test_encodings['attention_mask']},
    y=test_labels
)

# Dự đoán
predictions = model.predict({'input_ids': test_encodings['input_ids'], 'attention_mask': test_encodings['attention_mask']})
binary_predictions = tf.argmax(predictions['logits'], axis=1)

# Tính toán các chỉ số
accuracy = accuracy_score(binary_predictions, y_test)
precision = precision_score(binary_predictions, y_test)
recall = recall_score(binary_predictions, y_test)
f1 = f1_score(binary_predictions, y_test)

# Ghi các chỉ số và ma trận nhầm lẫn vào CSV
with open(evaluation_metrics_file, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Accuracy', accuracy])
    writer.writerow(['Precision', precision])
    writer.writerow(['Recall', recall])
    writer.writerow(['F1 Score', f1])

# Ma trận nhầm lẫn
matrix = confusion_matrix(binary_predictions, y_test)

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