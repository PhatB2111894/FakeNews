import torch
import torch.optim as optim
from transformers import BertTokenizer
from model import CNN_Text, BERT_Text, RoBERTa_Text, LSTM_Text
from dataset import TextDatasetBERT, TextDatasetCNN,  load_data_from_csv
from utils import train_with_kfold

# Khởi tạo thiết bị
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Đọc dữ liệu từ các file CSV
train_texts, train_labels = load_data_from_csv('/kaggle/working/FakeNews/Dataset/ISOT/Fake.csv', '/kaggle/working/FakeNews/Dataset/ISOT/True.csv')

# Tokenizer cho mô hình BERT hoặc RoBERTa
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

# Dataset và DataLoader
dataset = TextDatasetCNN(train_texts, train_labels, tokenizer, max_len=100)

# Khởi tạo mô hình
vocab_size = 5000  # Điều chỉnh theo từ điển của bạn
embed_size = 300
num_classes = 2  # Số lớp (ví dụ: phân loại nhị phân)

# Chọn mô hình
model = CNN_Text(vocab_size, embed_size, num_classes).to(device)
# model = BERT_Text(num_classes).to(device)
# model = RoBERTa_Text(num_classes).to(device)
# model = LSTM_Text(vocab_size, embed_size, 128, num_classes).to(device)

optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = torch.nn.CrossEntropyLoss()

# Huấn luyện với K-Fold
train_with_kfold(model, dataset, tokenizer, optimizer, criterion)
