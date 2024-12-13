import torch
import torch.nn as nn
from transformers import BertForSequenceClassification, RobertaForSequenceClassification

# Định nghĩa mô hình CNN
class CNN_Text(nn.Module):
    def __init__(self, vocab_size, embed_size, num_classes, kernel_sizes=[3, 4, 5], num_filters=100):
        super(CNN_Text, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_size)
        self.convs = nn.ModuleList([nn.Conv2d(1, num_filters, (K, embed_size)) for K in kernel_sizes])
        self.fc = nn.Linear(num_filters * len(kernel_sizes), num_classes)

    def forward(self, x):
        x = self.embedding(x).unsqueeze(1)
        conv_results = [torch.relu(conv(x)).squeeze(3) for conv in self.convs]
        pool_results = [torch.max_pool1d(conv, conv.size(2)).squeeze(2) for conv in conv_results]
        x = torch.cat(pool_results, 1)
        return self.fc(x)
from torch.utils.data import Dataset
from transformers import BertTokenizer, RobertaTokenizer

# Dataset cho CNN và LSTM
class TextDatasetCNN(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        encoding = self.tokenizer(text, truncation=True, padding='max_length', max_length=self.max_len, return_tensors='pt')
        return encoding['input_ids'].squeeze(0), label
import torch
import torch.optim as optim
import numpy as np
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# Định nghĩa EarlyStopping
class EarlyStopping:
    def __init__(self, patience=5, delta=0):
        self.patience = patience
        self.delta = delta
        self.best_loss = None
        self.counter = 0
        self.early_stop = False

    def __call__(self, val_loss, model):
        if self.best_loss is None:
            self.best_loss = val_loss
        elif val_loss < self.best_loss - self.delta:
            self.best_loss = val_loss
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True

# Đánh giá mô hình
def evaluate(model, dataloader):
    model.eval()
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for inputs, attention_mask, labels in dataloader:
            inputs, attention_mask, labels = inputs.to(device), attention_mask.to(device), labels.to(device)
            outputs = model(inputs, attention_mask)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    precision = precision_score(all_labels, all_preds, average='weighted')
    recall = recall_score(all_labels, all_preds, average='weighted')
    f1 = f1_score(all_labels, all_preds, average='weighted')
    accuracy = np.mean(np.array(all_preds) == np.array(all_labels))

    print(f'Accuracy: {accuracy:.4f}, Precision: {precision:.4f}, Recall: {recall:.4f}, F1 Score: {f1:.4f}')

    cm = confusion_matrix(all_labels, all_preds)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.show()

# Hàm huấn luyện với K-Fold Cross Validation
def train_with_kfold(model, dataset, tokenizer, optimizer, criterion, num_epochs=5, k_folds=5, max_len=100):
    from sklearn.model_selection import KFold
    kfold = KFold(n_splits=k_folds, shuffle=True, random_state=42)
    fold_results = []

    for fold, (train_idx, val_idx) in enumerate(kfold.split(dataset)):
        print(f'Fold {fold + 1}/{k_folds}')
        
        # Chia dữ liệu thành train và val
        train_subset = torch.utils.data.Subset(dataset, train_idx)
        val_subset = torch.utils.data.Subset(dataset, val_idx)
        
        train_loader = DataLoader(train_subset, batch_size=64, shuffle=True)
        val_loader = DataLoader(val_subset, batch_size=64, shuffle=False)
        
        # Reset mô hình
        model.apply(reset_weights)
        
        early_stopping = EarlyStopping(patience=3)
        
        for epoch in range(num_epochs):
            model.train()
            running_loss = 0.0
            correct = 0
            total = 0
            for inputs, attention_mask, labels in train_loader:
                inputs, attention_mask, labels = inputs.to(device), attention_mask.to(device), labels.to(device)
                optimizer.zero_grad()
                outputs = model(inputs, attention_mask)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()

                running_loss += loss.item()
                _, preds = torch.max(outputs, 1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)

            print(f'Epoch {epoch+1}/{num_epochs}, Loss: {running_loss/len(train_loader)}, Accuracy: {correct/total}')
            
            # Đánh giá trên tập validation
            val_loss, val_accuracy = evaluate(model, val_loader)
            print(f'Validation Loss: {val_loss:.4f}, Validation Accuracy: {val_accuracy:.4f}')
            
            # Gọi EarlyStopping
            early_stopping(val_loss, model)
            
            if early_stopping.early_stop:
                print("Early stopping triggered!")
                break
        
        # Đánh giá trên tập validation
        val_loss, val_accuracy = evaluate(model, val_loader)
        fold_results.append(val_accuracy)
        print(f'Fold {fold + 1} Accuracy: {val_accuracy:.4f}')
    
    print(f'Average Accuracy across all folds: {np.mean(fold_results):.4f}')
import torch
import torch.optim as optim
from transformers import BertTokenizer
from model import CNN_Text, BERT_Text, RoBERTa_Text, LSTM_Text
from dataset import TextDataset, TextDatasetCNN
from utils import train_with_kfold

# Khởi tạo thiết bị
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Dữ liệu mẫu
train_texts = ["sample text"] * 100  # Thay thế bằng dữ liệu thực tế
train_labels = [0] * 50 + [1] * 50  # Thay thế bằng nhãn thực tế

# Tokenizer cho mô hình BERT hoặc RoBERTa
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

# Dataset và DataLoader
dataset = TextDataset(train_texts, train_labels, tokenizer, max_len=100)

# Khởi tạo mô hình
vocab_size = 5000  # Điều chỉnh theo từ điển của bạn
embed_size = 300
num_classes = 2  # Số lớp (ví dụ: phân loại nhị phân)

# Chọn mô hình
model = CNN_Text(vocab_size, embed_size, num_classes).to(device)
# model = BERT_Text().to(device)
# model = RoBERTa_Text().to(device)
# model = LSTM_Text(vocab_size, embed_size, 128, num_classes).to(device)

optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = torch.nn.CrossEntropyLoss()

# Huấn luyện với K-Fold
train_with_kfold(model, dataset, tokenizer, optimizer, criterion)
