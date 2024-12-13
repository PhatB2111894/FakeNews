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

# Định nghĩa mô hình BERT
class BERT_Text(nn.Module):
    def __init__(self, num_classes):
        super(BERT_Text, self).__init__()
        self.bert = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=num_classes)

    def forward(self, input_ids, attention_mask):
        return self.bert(input_ids, attention_mask=attention_mask).logits

# Định nghĩa mô hình RoBERTa
class RoBERTa_Text(nn.Module):
    def __init__(self, num_classes):
        super(RoBERTa_Text, self).__init__()
        self.roberta = RobertaForSequenceClassification.from_pretrained('roberta-base', num_labels=num_classes)

    def forward(self, input_ids, attention_mask):
        return self.roberta(input_ids, attention_mask=attention_mask).logits

# Định nghĩa mô hình LSTM
class LSTM_Text(nn.Module):
    def __init__(self, vocab_size, embed_size, hidden_size, num_classes):
        super(LSTM_Text, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_size)
        self.lstm = nn.LSTM(embed_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, num_classes)

    def forward(self, x):
        x = self.embedding(x)
        _, (hn, _) = self.lstm(x)
        return self.fc(hn[-1])
