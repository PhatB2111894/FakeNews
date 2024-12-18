#DT
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score, f1_score, precision_score, recall_score
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
import scipy.sparse as sp

# Đọc dữ liệu từ hai tệp CSV
df1 = pd.read_csv("/kaggle/input/isot-dataset/Fake.csv")
df2 = pd.read_csv("/kaggle/input/isot-dataset/True.csv")

# Thêm nhãn vào từng tập dữ liệu
df1["label"] = 0
df2["label"] = 1

# Gộp hai tập dữ liệu
data = pd.concat([df1, df2], ignore_index=True)

# Tiền xử lý
data['text'] = data['title'] + " " + data['text']
# data['subject'] = data['subject'].fillna("")
# data['date'] = pd.to_datetime(data['date'], errors='coerce').fillna(pd.Timestamp("1970-01-01"))
# data['date_feature'] = (data['date'] - pd.Timestamp("1970-01-01")).dt.days

# Kết hợp các đặc trưng bổ sung
X = data['text'] #+ " " + data['subject']
y = data['label']
#additional_features = data[['date_feature']]

# Vector hóa văn bản sử dụng TF-IDF
tfidf = TfidfVectorizer(max_features=5000)
X_tfidf = tfidf.fit_transform(X)

# Kết hợp đặc trưng bổ sung
#X_combined = sp.hstack([X_tfidf, sp.csr_matrix(additional_features.values)])

# Cấu hình siêu tham số cho GridSearchCV
param_grid = {
    'criterion': ['gini', 'entropy'],
    'max_depth': [None, 10, 20, 30],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

# K-fold cross-validation
kfold = StratifiedKFold(n_splits=15, shuffle=True, random_state=42)
fold_results = []

for fold, (train_idx, test_idx) in enumerate(kfold.split(X_tfidf, y)):
    print(f"Fold {fold + 1}")

    X_train, X_test = X_tfidf[train_idx], X_tfidf[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    # Tạo mô hình Decision Tree và GridSearchCV
    model = DecisionTreeClassifier(random_state=42)
    grid_search = GridSearchCV(model, param_grid, cv=3, scoring='accuracy', n_jobs=-1)

    # Huấn luyện mô hình với GridSearchCV
    grid_search.fit(X_train, y_train)

    # Lấy mô hình tốt nhất
    best_model = grid_search.best_estimator_

    # Dự đoán trên tập kiểm tra
    y_pred = best_model.predict(X_test)

    # Đánh giá kết quả
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"Fold {fold + 1} Best Parameters: {grid_search.best_params_}")
    print(f"Fold {fold + 1} Accuracy: {accuracy:.4f}, F1: {f1:.4f}, Precision: {precision:.4f}, Recall: {recall:.4f}")

    fold_results.append({"fold": fold + 1, "best_params": grid_search.best_params_, "accuracy": accuracy, "f1": f1, "precision": precision, "recall": recall, "report": report})

# Ghi log summary vào file CSV
summary = pd.DataFrame({"fold": [r["fold"] for r in fold_results],
                        "accuracy": [r["accuracy"] for r in fold_results],
                        "f1": [r["f1"] for r in fold_results],
                        "precision": [r["precision"] for r in fold_results],
                        "recall": [r["recall"] for r in fold_results]})
summary.to_csv("decision_tree_kfold_results.csv", index=False)

# Ghi report đầy đủ
with open("decision_tree_classification_reports.txt", "w") as f:
    for result in fold_results:
        f.write(f"Fold {result['fold']}\n")
        f.write(result['report'] + "\n\n")

print("Training complete. Results saved to decision_tree_kfold_results.csv and decision_tree_classification_reports.txt")
