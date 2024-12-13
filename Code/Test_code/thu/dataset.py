from torch.utils.data import Dataset
from transformers import BertTokenizer, RobertaTokenizer

# Dataset cho mô hình CNN và LSTM
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

# Dataset cho BERT và RoBERTa
class TextDatasetBERT(Dataset):
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
        return encoding['input_ids'].squeeze(0), encoding['attention_mask'].squeeze(0), label
import pandas as pd

def load_data_from_csv(class_0_path, class_1_path):
    # Đọc dữ liệu từ các tập CSV
    class_0_data = pd.read_csv(class_0_path)
    class_1_data = pd.read_csv(class_1_path)

    # Thêm nhãn vào dữ liệu
    class_0_data['label'] = 0  # Gán nhãn 0 cho lớp 0
    class_1_data['label'] = 1  # Gán nhãn 1 cho lớp 1

    # Kết hợp dữ liệu từ hai lớp
    data = pd.concat([class_0_data, class_1_data], ignore_index=True)

    # Kết hợp title và text thành một chuỗi duy nhất
    data['text_combined'] = data['title'] + " " + data['text']

    # Tách dữ liệu văn bản và nhãn
    train_texts = data['text_combined'].tolist()
    train_labels = data['label'].tolist()

    return train_texts, train_labels
