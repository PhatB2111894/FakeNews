import pandas as pd
import matplotlib.pyplot as plt
import plotly.express as px
import nltk
from nltk import tokenize
import seaborn as sns

df = pd.read_csv('/kaggle/input/fakenews-csv/fakenews.csv')
# Combine all text elements in the 'text' column of DataFrame 'df' into a single string
words = ' '.join([text for text in df.text])

# Initialize a WhitespaceTokenizer object from the tokenize module
tk = tokenize.WhitespaceTokenizer()

# Tokenize the combined text using whitespace as the delimiter
token_sentence = tk.tokenize(words)
def freq_gen(text, text_column, n):
    # Combine all texts in the specified column into a single string
    words = ' '.join([text for text in text[text_column]])

    # Tokenize the combined text into individual words
    tk = tokenize.WhitespaceTokenizer()
    token_sentence = tk.tokenize(words)

    # Calculate the frequency distribution of the tokens
    frequence = nltk.FreqDist(token_sentence)

    # Convert the frequency distribution into a DataFrame
    df_frequence = pd.DataFrame({
        "Words": list(frequence.keys()),
        "Frequence": list(frequence.values())
    })

    # Select the top 'n' most frequent words
    top_words = df_frequence.nlargest(columns='Frequence', n=n)
    