import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score
import seaborn as sns
from transformers import BertTokenizer, TFBertForSequenceClassification
from transformers import InputExample, InputFeatures
import tensorflow as tf

# Set plot style
plt.style.use('ggplot')

# Load the data
fake_df = pd.read_csv('../input/isot-dataset/Fake.csv')
real_df = pd.read_csv('../input/isot-dataset/True.csv')

# Keep only relevant columns
fake_df = fake_df[['title', 'text']]
real_df = real_df[['title', 'text']]

# Assign labels
fake_df['class'] = 0
real_df['class'] = 1

# Plot distribution of classes
# plt.figure(figsize=(10, 5))
# plt.bar('Fake News', len(fake_df), color='orange')
# plt.bar('Real News', len(real_df), color='green')
# plt.title('Distribution of Fake News and Real News', size=12)
# plt.xlabel('News Type', size=12)
# plt.ylabel('# of News Articles', size=12)
# plt.show()

# Combine datasets
df = pd.concat([fake_df, real_df], ignore_index=True, sort=False)
df['title_text'] = df['title'] + ' ' + df['text']
df.drop(['title', 'text'], axis=1, inplace=True)

# Split data into features and labels
X = df['title_text']
y = df['class']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

# Load BERT tokenizer
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

# Tokenize data
train_encodings = tokenizer(list(X_train), truncation=True, padding=True, max_length=256, return_tensors="tf")
test_encodings = tokenizer(list(X_test), truncation=True, padding=True, max_length=256, return_tensors="tf")
# Convert labels to tensors
train_labels = tf.convert_to_tensor(y_train.values)
test_labels = tf.convert_to_tensor(y_test.values)
# Chuyển kiểu dữ liệu nếu cần
train_labels = tf.cast(train_labels, dtype=tf.float32)
test_labels = tf.cast(test_labels, dtype=tf.float32)

# Load pre-trained BERT model
model = TFBertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)
# Compile mô hình
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),  # Hàm mất mát đa lớp
    metrics=['accuracy']
)
# Huấn luyện mô hình
history = model.fit(
    {'input_ids': train_encodings['input_ids'], 'attention_mask': train_encodings['attention_mask']},
    train_labels,
    validation_split=0.1,
    epochs=3,
    batch_size=128  # Giảm batch size
)

# Evaluate the model
results = model.evaluate(
    x={'input_ids': test_encodings['input_ids'], 'attention_mask': test_encodings['attention_mask']},
    y=test_labels
)
# Make predictions
predictions = model.predict({'input_ids': test_encodings['input_ids'], 'attention_mask': test_encodings['attention_mask']})
binary_predictions = tf.argmax(predictions['logits'], axis=1)

# Metrics
print('Accuracy on testing set:', accuracy_score(binary_predictions, y_test))
print('Precision on testing set:', precision_score(binary_predictions, y_test))
print('Recall on testing set:', recall_score(binary_predictions, y_test))
from sklearn.metrics import f1_score

print('F1 on testing set:', f1_score(binary_predictions, y_test))
# Confusion matrix
matrix = confusion_matrix(binary_predictions, y_test, normalize='all')
plt.figure(figsize=(10, 6))
ax = plt.subplot()
sns.heatmap(matrix, annot=True, ax=ax)

ax.set_xlabel('Predicted Labels', size=15)
ax.set_ylabel('True Labels', size=15)
ax.set_title('Confusion Matrix', size=15)
ax.xaxis.set_ticklabels([0, 1], size=15)
ax.yaxis.set_ticklabels([0, 1], size=15)
plt.show()
