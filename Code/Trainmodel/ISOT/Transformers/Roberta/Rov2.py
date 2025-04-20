# Import thư viện
import pandas as pd
import numpy as np
import tensorflow as tf
import seaborn as sns
import matplotlib.pyplot as plt
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, f1_score, classification_report
from transformers import RobertaTokenizer, TFRobertaForSequenceClassification

plt.style.use('ggplot')

# # Load dataset
# fake_df = pd.read_csv('../input/isot-dataset/Fake.csv')[['title', 'text']]
# real_df = pd.read_csv('../input/isot-dataset/True.csv')[['title', 'text']]

# fake_df['class'] = 0
# real_df['class'] = 1

# df = pd.concat([fake_df, real_df], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
# df['title_text'] = df['title'] + ' ' + df['text']
# df.drop(['title', 'text'], axis=1, inplace=True)

# # Train-test split
# X_train, X_test, y_train, y_test = train_test_split(df['title_text'], df['class'], test_size=0.2, random_state=42)

# df = pd.read_csv('../input/fakereal/fake_or_real_news.csv')[['title', 'text', 'label']]

# df['title_text'] = df['title'] + ' ' + df['text']
# df.drop(['title', 'text'], axis=1, inplace=True)

# # Train-test split
# X_train, X_test, y_train, y_test = train_test_split(df['title_text'], df['label'], test_size=0.2, random_state=42)
# y_train = y_train.map({'FAKE': 0, 'REAL': 1}).astype(int)
# y_test = y_test.map({'FAKE': 0, 'REAL': 1}).astype(int)


df1 = pd.read_csv("../input/fndataset/train.csv", delimiter=";", names=["text", "label"], skiprows=1)
X_train = df1["text"]
y_train = df1["label"]

df2 = pd.read_csv("../input/fndataset/test.csv", delimiter=";", names=["text", "label"], skiprows=1)
X_test = df2["text"]
y_test = df2["label"]

# Tokenizer RoBERTa
tokenizer = RobertaTokenizer.from_pretrained('roberta-base')

def encode_texts(texts, tokenizer, max_length=256):
    return tokenizer(list(texts), padding='max_length', truncation=True, max_length=max_length, return_tensors='tf')

X_train_enc = encode_texts(X_train, tokenizer)
X_test_enc = encode_texts(X_test, tokenizer)

# Load mô hình RoBERTa
model = TFRobertaForSequenceClassification.from_pretrained('roberta-base', num_labels=2)

# Compile model với AdamW
optimizer = tf.keras.optimizers.Adamax(learning_rate=1e-5)
loss_fn = tf.keras.losses.CategoricalCrossentropy(from_logits=True)

model.compile(optimizer=optimizer, loss=loss_fn, metrics=['accuracy'])

# Huấn luyện
early_stop = tf.keras.callbacks.EarlyStopping(monitor='loss', patience=3, restore_best_weights=True)
history = model.fit(
    [X_train_enc['input_ids'], X_train_enc['attention_mask']], 
    tf.keras.utils.to_categorical(y_train, num_classes=2),
    validation_data=([X_test_enc['input_ids'], X_test_enc['attention_mask']], tf.keras.utils.to_categorical(y_test, num_classes=2)),
    epochs=10, batch_size=16, shuffle=True, callbacks=[early_stop]
)

# Lấy timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Lưu training log
history_df = pd.DataFrame(history.history)
history_df.to_csv(f"RoBERTa_training_log_{timestamp}.csv", index=False)

# Vẽ biểu đồ Loss & Accuracy
plt.figure(figsize=(10, 6))
plt.plot(history.history['loss'], 'r', label='Training Loss')
plt.plot(history.history['val_loss'], 'b', label='Validation Loss')
plt.title('Training & Validation Loss', size=15)
plt.legend()
plt.savefig(f"RoBERTa_loss_{timestamp}.png")
plt.show()

plt.figure(figsize=(10, 6))
plt.plot(history.history['accuracy'], 'g', label='Training Accuracy')
plt.plot(history.history['val_accuracy'], 'orange', label='Validation Accuracy')
plt.title('Training & Validation Accuracy', size=15)
plt.legend()
plt.savefig(f"RoBERTa_accuracy_{timestamp}.png")
plt.show()

# Dự đoán
y_pred_logits = model.predict([X_test_enc['input_ids'], X_test_enc['attention_mask']])[0]
y_pred = np.argmax(y_pred_logits, axis=1)

# Tính các chỉ số đánh giá
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

# Lưu kết quả đánh giá
metrics_df = pd.DataFrame({
    "Metric": ["Accuracy", "Precision", "Recall", "F1 Score"],
    "Value": [accuracy, precision, recall, f1]
})
metrics_df.to_csv(f"RoBERTa_evaluation_metrics_{timestamp}.csv", index=False)

# Classification Report
report_df = pd.DataFrame(classification_report(y_test, y_pred, output_dict=True)).transpose()
report_df.to_csv(f"RoBERTa_classification_report_{timestamp}.csv", index=True)

# Confusion Matrix
matrix = confusion_matrix(y_test, y_pred)
matrix_df = pd.DataFrame(matrix, index=["Actual 0", "Actual 1"], columns=["Predicted 0", "Predicted 1"])
matrix_df.to_csv(f"RoBERTa_confusion_matrix_{timestamp}.csv", index=True)

# Vẽ & lưu Confusion Matrix
plt.figure(figsize=(10, 6))
sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues')
plt.xlabel('Predicted Labels', size=15)
plt.ylabel('True Labels', size=15)
plt.title('Confusion Matrix', size=15)
plt.savefig(f"RoBERTa_confusion_matrix_{timestamp}.png")
plt.show()
