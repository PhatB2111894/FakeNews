#XGB CO Gridsearch
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.metrics import (classification_report, accuracy_score, f1_score, precision_score, 
                             recall_score, roc_auc_score, confusion_matrix, ConfusionMatrixDisplay)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.utils import shuffle
import scipy.sparse as sp

# Load data from CSV files
df1 = pd.read_csv("/kaggle/input/isot-dataset/Fake.csv")
df2 = pd.read_csv("/kaggle/input/isot-dataset/True.csv")

# Add labels to each dataset
df1["label"] = 0
df2["label"] = 1

# Combine datasets
data = pd.concat([df1, df2], ignore_index=True)
data = shuffle(data, random_state=42)

# Preprocessing
data['text'] = data['title'] + " " + data['text']
data['subject'] = data['subject'].fillna("")
data['date'] = pd.to_datetime(data['date'], errors='coerce').fillna(pd.Timestamp("1970-01-01"))
data['date_feature'] = (data['date'] - pd.Timestamp("1970-01-01")).dt.days

# Combine additional features
X = data['text'] + " " + data['subject']
y = data['label']
additional_features = data[['date_feature']]

# Text vectorization using TF-IDF
tfidf = TfidfVectorizer(max_features=5000)
X_tfidf = tfidf.fit_transform(X)

# Combine additional features
X_combined = sp.hstack([X_tfidf, sp.csr_matrix(additional_features.values)])

# Grid search for hyperparameter tuning
param_grid = {
    'n_estimators': [50, 100, 150],
    'learning_rate': [0.01, 0.1, 0.2],
    'max_depth': [3, 6, 9],
    'subsample': [0.8, 1.0],
    'colsample_bytree': [0.8, 1.0]
}

xgb_model = XGBClassifier(objective='binary:logistic', eval_metric='logloss', use_label_encoder=False, random_state=42)

grid_search = GridSearchCV(estimator=xgb_model, param_grid=param_grid, scoring='accuracy', 
                           cv=3, verbose=1, n_jobs=-1)

grid_search.fit(X_combined, y)

print("Best parameters:", grid_search.best_params_)
print("Best cross-validation accuracy:", grid_search.best_score_)

# Use the best model from grid search for training and evaluation
best_model = grid_search.best_estimator_

# K-fold cross-validation
kfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
fold_results = []

# Initialize lists to store metrics for plotting
fold_acc = []
fold_loss = []

# Log metrics for all epochs
epoch_logs = []

for fold, (train_idx, test_idx) in enumerate(kfold.split(X_combined, y)):
    print(f"Fold {fold + 1}")

    X_train, X_test = X_combined[train_idx], X_combined[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    # Store logs during training
    eval_set = [(X_train, y_train), (X_test, y_test)]
    best_model.fit(X_train, y_train, eval_set=eval_set, verbose=False)

    # Extract metrics per epoch
    evals_result = best_model.evals_result()
    epochs = len(evals_result['validation_0']['logloss'])
    for epoch in range(epochs):
        epoch_logs.append({
            "fold": fold + 1,
            "epoch": epoch + 1,
            "train_logloss": evals_result['validation_0']['logloss'][epoch],
            "test_logloss": evals_result['validation_1']['logloss'][epoch]
        })

    # Predictions
    y_pred = best_model.predict(X_test)
    y_proba = best_model.predict_proba(X_test)[:, 1]

    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    roc_auc = roc_auc_score(y_test, y_proba)
    report = classification_report(y_test, y_pred)
    conf_matrix = confusion_matrix(y_test, y_pred)

    print(f"Fold {fold + 1} Accuracy: {accuracy:.4f}, F1: {f1:.4f}, Precision: {precision:.4f}, Recall: {recall:.4f}, AUC: {roc_auc:.4f}")

    # Store metrics for this fold
    fold_results.append({"fold": fold + 1, "accuracy": accuracy, "f1": f1, "precision": precision,
                         "recall": recall, "auc": roc_auc, "report": report, "conf_matrix": conf_matrix})

    fold_acc.append(accuracy)
    fold_loss.append(1 - accuracy)

    # Plot confusion matrix
    disp = ConfusionMatrixDisplay(confusion_matrix=conf_matrix, display_labels=best_model.classes_)
    disp.plot(cmap=plt.cm.Blues)
    plt.title(f"Confusion Matrix - Fold {fold + 1}")
    plt.show()

# Save results
summary = pd.DataFrame({"fold": [r["fold"] for r in fold_results],
                        "accuracy": [r["accuracy"] for r in fold_results],
                        "f1": [r["f1"] for r in fold_results],
                        "precision": [r["precision"] for r in fold_results],
                        "recall": [r["recall"] for r in fold_results],
                        "auc": [r["auc"] for r in fold_results]})
summary.to_csv("xgboost_kfold_results.csv", index=False)

# Save epoch logs to CSV
epoch_logs_df = pd.DataFrame(epoch_logs)
epoch_logs_df.to_csv("xgboost_epoch_logs.csv", index=False)

# Plot Accuracy and Loss
plt.figure(figsize=(12, 6))
plt.plot(range(1, len(fold_acc) + 1), fold_acc, label='Accuracy', marker='o')
plt.plot(range(1, len(fold_loss) + 1), fold_loss, label='Loss', marker='o', linestyle='--')
plt.title("Accuracy and Loss Across Folds")
plt.xlabel("Fold")
plt.ylabel("Metric")
plt.legend()

# Add grid lines
plt.grid(visible=True, which='both', linestyle='--', linewidth=0.7, alpha=0.7)

plt.show()

print("Training complete. Results saved to xgboost_kfold_results.csv and xgboost_epoch_logs.csv")
