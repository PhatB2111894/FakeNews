import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import logging
import os

# Set up logging
logging.basicConfig(
    filename='training_log.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logging.info("Starting the fake news classification script.")

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

# Preprocessing and splitting data
def preprocess_data(data):
    logging.info("Preprocessing data.")
    X = data['text']
    y = data['label']
    return train_test_split(X, y, test_size=0.2, random_state=42)

# Train and evaluate model
def train_and_evaluate(model_name, model, X_train, X_test, y_train, y_test):
    logging.info("Training and evaluating model: %s", model_name)
    try:
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(stop_words='english')),
            ('classifier', model)
        ])

        pipeline.fit(X_train, y_train)
        predictions = pipeline.predict(X_test)

        acc = accuracy_score(y_test, predictions)
        logging.info("Model: %s, Accuracy: %.4f", model_name, acc)
        print(f"\n{model_name} Classification Report:\n")
        print(classification_report(y_test, predictions))
    except Exception as e:
        logging.error("Error training model %s: %s", model_name, e)

# Main function
def main():
    fake_file_path = "D:/LuanVan/FakeNews/Dataset/ISOT/Fake.csv"  # Replace with your Fake dataset path
    true_file_path = "D:/LuanVan/FakeNews/Dataset/ISOT/True.csv"  # Replace with your True dataset path

    if not os.path.exists(fake_file_path) or not os.path.exists(true_file_path):
        logging.error("Dataset files do not exist: %s, %s", fake_file_path, true_file_path)
        return

    data = load_data(fake_file_path, true_file_path)
    X_train, X_test, y_train, y_test = preprocess_data(data)

    models = {
        'Logistic Regression': LogisticRegression(),
        'Support Vector Machine': SVC(),
        'Naive Bayes': MultinomialNB(),
        'Random Forest': RandomForestClassifier()
    }

    for model_name, model in models.items():
        train_and_evaluate(model_name, model, X_train, X_test, y_train, y_test)

if __name__ == "__main__":
    main()
    logging.info("Script finished.")
