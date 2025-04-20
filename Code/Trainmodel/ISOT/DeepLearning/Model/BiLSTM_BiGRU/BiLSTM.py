#BiLSTM Embedding Layer & Tokenizer
import pandas as pd
import re
import pickle
import matplotlib.pyplot as plt
import tensorflow as tf
import seaborn as sns
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, f1_score, classification_report
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

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

# Tokenization
vocab_size = 10000
embedding_dim = 64
max_length = 256
padding_type, trunc_type, oov_tok = 'post', 'post', '<OOV>'

tokenizer = Tokenizer(num_words=vocab_size, oov_token=oov_tok)
tokenizer.fit_on_texts(X_train)

X_train = pad_sequences(tokenizer.texts_to_sequences(X_train), padding=padding_type, truncating=trunc_type, maxlen=max_length)
X_test = pad_sequences(tokenizer.texts_to_sequences(X_test), padding=padding_type, truncating=trunc_type, maxlen=max_length)

# Build model
model = tf.keras.Sequential([
    tf.keras.layers.Embedding(vocab_size, embedding_dim),
    tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(embedding_dim, return_sequences=True)),
    tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(16)),
    tf.keras.layers.Dense(embedding_dim, activation='relu'),
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

model.summary()

# Compile model
model.compile(loss='binary_crossentropy', optimizer=tf.keras.optimizers.Adam(1e-5), metrics=['accuracy'])

# Train model
early_stop = tf.keras.callbacks.EarlyStopping(monitor='loss', patience=5, restore_best_weights=True)
history = model.fit(X_train, y_train, epochs=10, batch_size=128, shuffle=True, callbacks=[early_stop])

# Lấy thời gian hiện tại để gắn vào tên tệp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Lưu training log
history_df = pd.DataFrame(history.history)
history_log_filename = f"BiLSTM_Tokenizer_training_log_{timestamp}.csv"
history_df['Epoch'] = history_df.index + 1
history_df.to_csv(history_log_filename, index=False)

# Vẽ biểu đồ Loss và Accuracy
epochs = history.epoch
loss, acc = history.history['loss'], history.history['accuracy']

plt.figure(figsize=(10, 6))
plt.plot(epochs, loss, 'r', label='Training loss')
plt.title('Training Loss', size=15)
plt.xlabel('Epochs', size=15)
plt.ylabel('Loss', size=15)
plt.legend(prop={'size': 15})
loss_plot_filename = f"BiLSTM_Tokenizer_training_loss_{timestamp}.png"
plt.savefig(loss_plot_filename)
plt.show()

plt.figure(figsize=(10, 6))
plt.plot(epochs, acc, 'g', label='Training Accuracy')
plt.title('Training Accuracy', size=15)
plt.xlabel('Epochs', size=15)
plt.ylabel('Accuracy', size=15)
plt.legend(prop={'size': 15})
plt.ylim((0.5, 1))
accuracy_plot_filename = f"BiLSTM_Tokenizer_training_accuracy_{timestamp}.png"
plt.savefig(accuracy_plot_filename)
plt.show()

# Model evaluation
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {test_acc:.4f}")

# Dự đoán
y_pred = (model.predict(X_test) >= 0.5).astype(int)

# Tính các chỉ số đánh giá
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")

# Lưu các chỉ số đánh giá
metrics_df = pd.DataFrame({
    "Metric": ["Accuracy", "Precision", "Recall", "F1 Score"],
    "Value": [accuracy, precision, recall, f1]
})
metrics_df.to_csv(f"BiLSTM_Tokenizer__evaluation_metrics_{timestamp}.csv", index=False)

# Classification Report
report_df = pd.DataFrame(classification_report(y_test, y_pred, output_dict=True)).transpose()
report_df.to_csv(f"BiLSTM_Tokenizer__classification_report_{timestamp}.csv", index=True)

# Confusion Matrix
matrix = confusion_matrix(y_test, y_pred)
matrix_df = pd.DataFrame(matrix, index=["Actual 0", "Actual 1"], columns=["Predicted 0", "Predicted 1"])
matrix_filename = f"BiLSTM_Tokenizer_confusion_matrix_{timestamp}.csv"
matrix_df.to_csv(matrix_filename, index=True)

# Vẽ & lưu Confusion Matrix
plt.figure(figsize=(10, 6))
ax = sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues')

ax.set_xlabel('Predicted Labels', size=15)
ax.set_ylabel('True Labels', size=15)
ax.set_title('Confusion Matrix', size=15)
ax.xaxis.set_ticklabels([0, 1], size=15)
ax.yaxis.set_ticklabels([0, 1], size=15)

confusion_matrix_plot_filename = f"BiLSTM_Tokenizer_confusion_matrix_{timestamp}.png"
plt.savefig(confusion_matrix_plot_filename)
plt.show()