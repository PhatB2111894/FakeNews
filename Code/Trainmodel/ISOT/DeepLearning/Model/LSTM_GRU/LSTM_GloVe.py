#LTSM & Glove + Tokeni
# !wget http://nlp.stanford.edu/data/glove.6B.zip
# !unzip glove.6B.zip -d glove_data
# !rm glove.6B.zip

import pandas as pd
import re
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score

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
        i = re.sub(r'https?://\S+|www\.\S+', '', i)  # Loại bỏ URL
        i = re.sub(r'\W', ' ', i)  # Loại bỏ ký tự đặc biệt
        i = re.sub(r'\n', '', i)  # Loại bỏ xuống dòng
        i = re.sub(r' +', ' ', i)  # Loại bỏ khoảng trắng dư thừa
        i = i.strip()  # Xóa khoảng trắng đầu/cuối
        normalized.append(i)
    return normalized

X_train, X_test = normalize(X_train), normalize(X_test)

# Tokenization
max_words = 10000  # Số lượng từ tối đa trong từ điển
max_length = 256  # Độ dài tối đa của một câu

tokenizer = Tokenizer(num_words=max_words, oov_token="<OOV>")
tokenizer.fit_on_texts(X_train)

X_train_seq = tokenizer.texts_to_sequences(X_train)
X_test_seq = tokenizer.texts_to_sequences(X_test)

X_train_pad = pad_sequences(X_train_seq, maxlen=max_length, padding='post', truncating='post')
X_test_pad = pad_sequences(X_test_seq, maxlen=max_length, padding='post', truncating='post')

# Lưu tokenizer
with open(f"LSTM_GloVe_tokenizer.pkl", "wb") as f:
    pickle.dump(tokenizer, f)

# Load GloVe embeddings
embedding_dim = 100  # Kích thước vector word embedding
glove_path = '../working/glove_data/glove.6B.100d.txt'  # Đường dẫn đến file GloVe
embedding_index = {}

with open(glove_path, 'r', encoding='utf-8') as f:
    for line in f:
        values = line.split()
        word = values[0]
        vector = np.asarray(values[1:], dtype='float32')
        embedding_index[word] = vector

# Tạo embedding matrix
embedding_matrix = np.zeros((max_words, embedding_dim))
for word, i in tokenizer.word_index.items():
    if i < max_words:
        vector = embedding_index.get(word)
        if vector is not None:
            embedding_matrix[i] = vector

# Build LSTM model with GloVe embeddings
model = Sequential([
    Embedding(max_words, embedding_dim, weights=[embedding_matrix], input_length=max_length, trainable=False),
    LSTM(128, return_sequences=True),
    Dropout(0.5),
    LSTM(64, return_sequences=False),
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])

model.compile(loss='binary_crossentropy', optimizer=Adam(1e-5), metrics=['accuracy'])

# Train model
history = model.fit(X_train_pad, y_train, epochs=10, batch_size=128, validation_data=(X_test_pad, y_test), shuffle=True)

# Lấy thời gian hiện tại để gắn vào tên tệp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Lưu training log
history_df = pd.DataFrame(history.history)
history_df['Epoch'] = history_df.index + 1
history_df.to_csv(f"LSTM_GloVe_training_log_{timestamp}.csv", index=False)

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
plt.savefig(f"LSTM_GloVe_training_loss_{timestamp}.png")
plt.show()

plt.figure(figsize=(10, 6))
plt.plot(epochs, acc, 'g', label='Training Accuracy')
plt.plot(epochs, val_acc, 'b', label='Validation Accuracy')
plt.title('Accuracy', size=15)
plt.xlabel('Epochs', size=15)
plt.ylabel('Accuracy', size=15)
plt.legend()
plt.savefig(f"LSTM_GloVe_training_accuracy_{timestamp}.png")
plt.show()

# Model evaluation
test_loss, test_acc = model.evaluate(X_test_pad, y_test)
print(f"\n **Test Accuracy: {test_acc:.4f}**")

# Dự đoán
y_pred_prob = model.predict(X_test_pad)
y_pred = (y_pred_prob >= 0.5).astype(int)

# Tính các chỉ số đánh giá
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

# Lưu vào file CSV
metrics_df = pd.DataFrame({
    "Metric": ["Accuracy", "Precision", "Recall", "F1 Score"],
    "Value": [accuracy, precision, recall, f1]
})
metrics_df.to_csv(f"LSTM_GloVe_evaluation_metrics_{timestamp}.csv", index=False)

# Classification Report
report_df = pd.DataFrame(classification_report(y_test, y_pred, output_dict=True)).transpose()
report_df.to_csv(f"LSTM_GloVe__classification_report_{timestamp}.csv", index=True)

# Confusion Matrix
matrix = confusion_matrix(y_test, y_pred)
matrix_df = pd.DataFrame(matrix, index=["Actual 0", "Actual 1"], columns=["Predicted 0", "Predicted 1"])
matrix_df.to_csv(f"LSTM_GloVe_confusion_matrix_{timestamp}.csv", index=True)

# Confusion Matrix
matrix = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(10, 6))
sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues')

plt.xlabel('Predicted Labels', size=15)
plt.ylabel('True Labels', size=15)
plt.title('Confusion Matrix', size=15)
plt.xticks(ticks=[0.5, 1.5], labels=[0, 1], size=15)
plt.yticks(ticks=[0.5, 1.5], labels=[0, 1], size=15)

plt.savefig(f"LSTM_GloVe_confusion_matrix_{timestamp}.png")
plt.show()
