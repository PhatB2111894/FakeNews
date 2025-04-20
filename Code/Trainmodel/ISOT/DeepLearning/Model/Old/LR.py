import pandas as pd
import re
from nltk.stem.porter import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
import pickle
from sklearn.linear_model import LogisticRegressionCV

# We load Fake.csv and True.csv
fake_df = pd.read_csv('../input/isot-fake-news-dataset/Fake.csv')
real_df = pd.read_csv('../input/isot-fake-news-dataset/True.csv')

fake_df = fake_df[['title', 'text']]
real_df = real_df[['title', 'text']]

fake_df['class'] = 0
real_df['class'] = 1

df = pd.concat([fake_df, real_df], ignore_index=True, sort=False)

df['title_text'] = df['title'] + ' ' + df['text']
df.drop(['title', 'text'], axis=1, inplace=True)

def preprocessor(text):

    text = re.sub('<[^>]*>', '', text)
    text = re.sub(r'[^\w\s]','', text)
    text = text.lower()

    return text

df['title_text'] = df['title_text'].apply(preprocessor)

porter = PorterStemmer()

def tokenizer_porter(text):
    return [porter.stem(word) for word in text.split()]

tfidf = TfidfVectorizer(strip_accents=None,
                        lowercase=False,
                        preprocessor=None,
                        tokenizer=tokenizer_porter,
                        use_idf=True,
                        norm='l2',
                        smooth_idf=True
                       )
X = tfidf.fit_transform(df['title_text'])
y = df['class'].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=0)

clf = LogisticRegressionCV(cv=5, scoring='accuracy', random_state=0, n_jobs=-1, verbose=2, max_iter=300).fit(X_train, y_train)

clf.score(X_test, y_test)

from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
y_pred = clf.predict(X_test)
print("Accuracy with Logreg: {}".format(accuracy_score(y_test, y_pred)))
print(classification_report(y_test, y_pred))

binary_predictions = []

for i in y_pred:
    if i >= 0.5:
        binary_predictions.append(1)
    else:
        binary_predictions.append(0)

import matplotlib.pyplot as plt
import seaborn as sns
matrix = confusion_matrix(binary_predictions, y_test, normalize='all')
plt.figure(figsize=(10, 6))
ax= plt.subplot()
sns.heatmap(matrix, annot=True, ax = ax)

# labels, title and ticks
ax.set_xlabel('Predicted Labels', size=15)
ax.set_ylabel('True Labels', size=15)
ax.set_title('Confusion Matrix', size=15)
ax.xaxis.set_ticklabels([0,1], size=15)
ax.yaxis.set_ticklabels([0,1], size=15)