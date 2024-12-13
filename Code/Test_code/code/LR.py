import pandas as pd
from sklearn.model_selection import KFold, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import logging
import os

# Function to set up logging for Logistic Regression
def setup_logging():
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "logistic_regression_log.csv")
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        filemode='w'
    )
    logging.info("Starting Logistic Regression training.")

# Load dataset
def load_data(fake_file_path, true_file_path):
    logging.info("Loading datasets from: %s and %s", fake_file_path, true_file_path)
    try:
        fake_data = pd.read_csv(fake_file_path)
        true_data = pd.read_csv(true_file_path)

        fake_data['label'] = 'Fake'
        true_data['label'] = 'True'

        data = pd.concat([fake_data, true_data], ignore_index=True)
        return data
    except Exception as e:
        logging.error("Error loading datasets: %s", e)
        raise

# Preprocessing data
def preprocess_data(data):
    logging.info("Preprocessing data.")
    X = data['text']
    y = data['label']
    return X, y

# Train and evaluate Logistic Regression model with K-Fold
def train_and_evaluate_kfold(X, y):
    logging.info("Training Logistic Regression with K-Fold.")
    try:
        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        fold_results = []

        param_grid = {
            'classifier__C': [0.1, 1, 10],
            'classifier__penalty': ['l2'],
            'classifier__solver': ['saga'],
            'classifier__max_iter': [100, 200]
        }

        for fold, (train_idx, test_idx) in enumerate(kf.split(X)):
            logging.info("Processing Fold %d", fold + 1)
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

            pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(stop_words='english')),
                ('classifier', LogisticRegression())
            ])

            grid_search = GridSearchCV(pipeline, param_grid, cv=3, scoring='accuracy', n_jobs=-1, return_train_score=True)
            grid_search.fit(X_train, y_train)

            best_model = grid_search.best_estimator_
            predictions = best_model.predict(X_test)

            acc = accuracy_score(y_test, predictions)
            logging.info("Fold %d, Best Params: %s, Accuracy: %.4f", fold + 1, grid_search.best_params_, acc)

            fold_results.append({
                'fold': fold + 1,
                'accuracy': acc,
                'best_params': grid_search.best_params_
            })

            # Save results for each fold
            results_df = pd.DataFrame(grid_search.cv_results_)
            fold_results_file = f"logs/logistic_regression_results_fold_{fold + 1}.csv"
            results_df.to_csv(fold_results_file, index=False)
            logging.info("Fold %d results saved to %s", fold + 1, fold_results_file)

        # Summarize results
        summary_file = "logs/logistic_regression_summary.csv"
        pd.DataFrame(fold_results).to_csv(summary_file, index=False)
        logging.info("Summary of results saved to %s", summary_file)

    except Exception as e:
        logging.error("Error during Logistic Regression training with K-Fold: %s", e)

# Main function
def main():
    fake_file_path = "D:/LuanVan/FakeNews/Dataset/ISOT/Fake.csv"  # Replace with your Fake dataset path
    true_file_path = "D:/LuanVan/FakeNews/Dataset/ISOT/True.csv"  # Replace with your True dataset path

    if not os.path.exists(fake_file_path) or not os.path.exists(true_file_path):
        print("Dataset files do not exist.")
        return

    setup_logging()

    data = load_data(fake_file_path, true_file_path)
    X, y = preprocess_data(data)

    train_and_evaluate_kfold(X, y)

if __name__ == "__main__":
    main()
