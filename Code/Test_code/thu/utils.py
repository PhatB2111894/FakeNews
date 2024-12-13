import torch
import numpy as np
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt
import logging
from torch.utils.data import DataLoader  # Thêm dòng này
import torch.nn as nn
# Thiết lập logging
logging.basicConfig(filename='training_log.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def reset_weights(m):
    if isinstance(m, (nn.Conv2d, nn.Linear)):  # Kiểm tra loại lớp
        m.reset_parameters()  # Khôi phục lại trọng số của lớp

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
    running_loss = 0.0
    with torch.no_grad():
        for inputs, attention_mask, labels in dataloader:
            inputs, attention_mask, labels = inputs.to(device), attention_mask.to(device), labels.to(device)
            outputs = model(inputs, attention_mask)
            loss = criterion(outputs, labels)
            running_loss += loss.item()
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    precision = precision_score(all_labels, all_preds, average='weighted')
    recall = recall_score(all_labels, all_preds, average='weighted')
    f1 = f1_score(all_labels, all_preds, average='weighted')
    accuracy = np.mean(np.array(all_preds) == np.array(all_labels))

    logging.info(f'Accuracy: {accuracy:.4f}, Precision: {precision:.4f}, Recall: {recall:.4f}, F1 Score: {f1:.4f}')

    cm = confusion_matrix(all_labels, all_preds)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.show()

    # Trả về loss và accuracy
    val_loss = running_loss / len(dataloader)
    val_accuracy = accuracy
    return val_loss, val_accuracy


# Hàm huấn luyện với K-Fold Cross Validation
def train_with_kfold(model, dataset, tokenizer, optimizer, criterion, num_epochs=5, k_folds=5, max_len=100):
    from sklearn.model_selection import KFold
    kfold = KFold(n_splits=k_folds, shuffle=True, random_state=42)
    fold_results = []

    for fold, (train_idx, val_idx) in enumerate(kfold.split(dataset)):
        logging.info(f'Fold {fold + 1}/{k_folds}')
        
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

            logging.info(f'Epoch {epoch+1}/{num_epochs}, Loss: {running_loss/len(train_loader)}, Accuracy: {correct/total}')
            
            # Đánh giá trên tập validation
            val_loss, val_accuracy = evaluate(model, val_loader)
            logging.info(f'Validation Loss: {val_loss:.4f}, Validation Accuracy: {val_accuracy:.4f}')
            
            # Gọi EarlyStopping
            early_stopping(val_loss, model)
            
            if early_stopping.early_stop:
                logging.info("Early stopping triggered!")
                break
        
        # Đánh giá trên tập validation
        val_loss, val_accuracy = evaluate(model, val_loader)
        fold_results.append(val_accuracy)
        logging.info(f'Fold {fold + 1} Accuracy: {val_accuracy:.4f}')
    
    logging.info(f'Average Accuracy across all folds: {np.mean(fold_results):.4f}')