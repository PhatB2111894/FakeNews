# -*- coding: utf-8 -*-
# --- Các thư viện cần thiết ---
import pandas as pd
import numpy as np
import tensorflow as tf
# import seaborn as sns
# import matplotlib.pyplot as plt
# from datetime import datetime
# from sklearn.metrics import ...
from transformers import RobertaTokenizer, TFRobertaForSequenceClassification
from flask_cors import CORS
from flask import Flask, request, jsonify
import re
import unicodedata
import nltk
from deep_translator import GoogleTranslator
import shap
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import traceback
from langdetect import detect, LangDetectException
import os

# --- Cài đặt NLTK (nếu cần) ---
try: nltk.data.find('tokenizers/punkt'); nltk.data.find('corpora/stopwords')
except nltk.downloader.DownloadError:
    print("Đang tải NLTK data (có thể mất vài phút)...")
    nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)
from nltk.corpus import stopwords # Tạm thời không dùng stopwords
stop_words_en = set(stopwords.words("english"))

# --- Các Hằng số và Tải Mô hình ---
MODEL_BASE_PATH = "D:/LuanVan/FakeNews/Code/Web/news-classifier/backend/Model/"
MODEL_NAME = "RoBERTa_pretrained_20250405_171143"
TOKENIZER_NAME = "RoBERTa_token_pretrained_20250405_171143"
# 20250305_162139 íot
# 20250405_171143 fakedetecnews
MODEL_PATH = os.path.join(MODEL_BASE_PATH, MODEL_NAME)
TOKENIZER_PATH = os.path.join(MODEL_BASE_PATH, TOKENIZER_NAME)

MAX_LEN_PREDICT = 512
SHAP_MAX_LEN = 256

print("--- Tải Mô hình và Tokenizer ---")
print("🔄 Đang tải mô hình vào bộ nhớ cache...")
# ... (Phần try...except để load model giữ nguyên như trước) ...
try:
    if not os.path.exists(MODEL_PATH) or not os.path.exists(TOKENIZER_PATH):
         raise FileNotFoundError(f"Không tìm thấy mô hình hoặc tokenizer tại đường dẫn: {MODEL_BASE_PATH}")
    MODEL = TFRobertaForSequenceClassification.from_pretrained(MODEL_PATH)
    TOKENIZER = RobertaTokenizer.from_pretrained(TOKENIZER_PATH)
    print(f"✅ Mô hình từ '{MODEL_NAME}' và Tokenizer từ '{TOKENIZER_NAME}' đã tải thành công!")
except FileNotFoundError as fnf_error:
    print(f"❌ Lỗi nghiêm trọng: {fnf_error}"); MODEL = None; TOKENIZER = None
except Exception as e:
    print(f"❌ Lỗi không xác định khi tải mô hình: {e}"); MODEL = None; TOKENIZER = None
print("--- Tải Mô hình và Tokenizer Hoàn tất ---")


# --- Các Hàm Hỗ trợ ---
def preprocess_text(text):
    """Tiền xử lý văn bản cơ bản cho tiếng Anh, BAO GỒM xóa stopwords."""
    if not isinstance(text, str) or not text.strip():
        print("⚠️ Văn bản đầu vào rỗng hoặc không hợp lệ cho tiền xử lý.")
        return ""
    try:
        text = text.lower() # Chuyển thành chữ thường
        text = unicodedata.normalize("NFKC", text) # Chuẩn hóa Unicode
        text = re.sub(r"https?://\S+|www\.\S+", "", text) # Xóa URL
        text = re.sub(r"<.*?>+", "", text) # Xóa thẻ HTML (nếu có)
        # Giữ lại chữ cái, số, khoảng trắng và một số dấu câu cơ bản
        text = re.sub(r"[^\w\s.,!?']", "", text)
        text = re.sub(r"\s+", " ", text).strip() # Chuẩn hóa khoảng trắng

        # !!! BỎ COMMENT ĐỂ XÓA STOPWORDS !!!
        words = text.split()
        # Lọc bỏ các từ trong danh sách stop_words_en đã định nghĩa ở đầu file
        filtered_words = [word for word in words if word not in stop_words_en]
        # Nối các từ còn lại thành chuỗi mới
        text = " ".join(filtered_words)

        # !!! TRẢ VỀ TEXT ĐÃ LỌC STOPWORDS !!!
        return text
    except Exception as e:
        print(f"❌ Lỗi trong hàm preprocess_text: {e}")
        return "" # Trả về chuỗi rỗng nếu có lỗi

def translate_text(text, src_lang="auto", target_lang="en"):
    """Dịch văn bản sử dụng GoogleTranslator."""
    if not text or not isinstance(text, str) or not text.strip(): return text
    max_translate_len = 1500; text_to_translate = text[:max_translate_len]
    try:
        translated = GoogleTranslator(source=src_lang, target=target_lang).translate(text_to_translate)
        return translated if translated and isinstance(translated, str) and translated.strip() else text
    except Exception as e: print(f"❌ Lỗi khi dịch từ '{src_lang}' sang '{target_lang}': {e}"); return text

analyzer = SentimentIntensityAnalyzer()

# --- Khởi tạo Flask App ---
app = Flask(__name__)
CORS(app)

# --- Định nghĩa API Endpoint ---
@app.route('/classify', methods=['POST'])
def classify_text():
    """API endpoint chính để phân loại tin tức."""
    if MODEL is None or TOKENIZER is None: return jsonify({"error": "Lỗi Server: Mô hình chưa được tải thành công!"}), 503

    try:
        data = request.get_json(); original_text = data.get('text', ''); explain_flag = data.get('explain', False)
        print(f"\n--- Yêu cầu mới ---"); print(f"📥 Đã nhận: Explain={explain_flag}, Text='{original_text[:100]}...'")
        if not original_text or not isinstance(original_text, str) or not original_text.strip(): return jsonify({"error": "Lỗi: Văn bản đầu vào không hợp lệ hoặc bị rỗng."}), 400
    except Exception as e: return jsonify({"error": f"Lỗi định dạng yêu cầu: {str(e)}"}), 400

    detected_lang = 'en'; text_to_process = original_text
    try:
        min_len_detect = 15
        if len(original_text) >= min_len_detect: detected_lang = detect(original_text)
        else: detected_lang = 'unknown_short'
        print(f"🔍 Ngôn ngữ phát hiện (hoặc giả định): '{detected_lang}'")
        if detected_lang != 'en' and detected_lang != 'unknown_short':
            print(f"🔄 Đang dịch từ '{detected_lang}' sang 'en'...")
            translated = translate_text(original_text, src_lang=detected_lang, target_lang='en')
            if translated != original_text and translated.strip(): text_to_process = translated; print(f"✅ Đã dịch sang tiếng Anh: '{text_to_process[:100]}...'")
            else: print(f"⚠️ Dịch không thành công hoặc kết quả rỗng, tiếp tục xử lý bằng văn bản gốc.")
    except LangDetectException: print("⚠️ Không thể phát hiện ngôn ngữ, giả định là tiếng Anh."); detected_lang = 'unknown_error'
    except Exception as e: print(f"❌ Lỗi trong quá trình xử lý ngôn ngữ: {e}")

    print("⚙️ Tiền xử lý văn bản...")
    processed_text = preprocess_text(text_to_process)
    if not processed_text: print("❌ Văn bản trở nên rỗng sau tiền xử lý."); return jsonify({"error": "Lỗi: Văn bản không hợp lệ sau tiền xử lý."}), 400

    print("🧠 Thực hiện dự đoán...")
    try:
        inputs = TOKENIZER([processed_text], padding='max_length', truncation=True, max_length=MAX_LEN_PREDICT, return_tensors='tf')
        outputs = MODEL(inputs); logits = outputs.logits[0].numpy(); probabilities = tf.nn.softmax(logits).numpy()
    except Exception as e: print(f"❌ Lỗi khi mô hình dự đoán: {e}"); traceback.print_exc(); return jsonify({"error": f"Lỗi khi mô hình dự đoán: {str(e)}"}), 500

    fake_prob_percent = float(probabilities[0] * 100); real_prob_percent = float(probabilities[1] * 100)
    print(f"📊 Kết quả dự đoán - P(Fake): {fake_prob_percent:.2f}%, P(Real): {real_prob_percent:.2f}%")

    print("😊 Tính toán điểm cảm xúc...")
    sentiment_score = analyzer.polarity_scores(processed_text)['compound']
    print(f"Sentiment score: {sentiment_score:.4f}")

    top_words_en = []
    if explain_flag:
        print(f"⏳ Tính toán SHAP (max_length={SHAP_MAX_LEN})...")
        try:
            def shap_predict_fn(texts_for_shap):
                if isinstance(texts_for_shap, np.ndarray): texts_for_shap = texts_for_shap.tolist()
                if isinstance(texts_for_shap, str): texts_for_shap = [texts_for_shap]
                shap_inputs = TOKENIZER(texts_for_shap, padding=True, truncation=True, return_tensors="tf", max_length=SHAP_MAX_LEN)
                return MODEL(input_ids=shap_inputs['input_ids'], attention_mask=shap_inputs['attention_mask']).logits.numpy()

            explainer = shap.Explainer(shap_predict_fn, TOKENIZER); shap_values = explainer([processed_text])
            class_index_fake = 0; shap_values_for_fake = shap_values.values[0, :, class_index_fake]; tokens_or_ids = shap_values.data[0]
            positive_contribs = [(shap_values_for_fake[i], i) for i in range(len(shap_values_for_fake)) if shap_values_for_fake[i] > 0]
            positive_contribs.sort(key=lambda item: item[0], reverse=True)
            num_top_words = 10; top_indices = [index for shap_val, index in positive_contribs[:num_top_words]]
            
            processed_tokens_shap = set(); special_tokens = [ # Danh sách các token đặc biệt cần loại bỏ hoàn toàn
                TOKENIZER.cls_token, TOKENIZER.sep_token, TOKENIZER.pad_token,
                TOKENIZER.unk_token, TOKENIZER.mask_token, '<s>', '</s>', '<pad>', ' '
            ]
            # Đảm bảo các token đặc biệt không None
            special_tokens = [tok for tok in special_tokens if tok is not None]

            for idx in top_indices:
                token_data = tokens_or_ids[idx]
                token_text = "" # Khởi tạo lại cho mỗi token
                try:
                    # --- Bước 1: Decode token ID hoặc lấy token string ---
                    if isinstance(token_data, (int, np.integer)):
                         # Decode IDs, giữ lại ký tự đặc biệt ban đầu để kiểm tra
                         decoded_token = TOKENIZER.decode([token_data], skip_special_tokens=False, clean_up_tokenization_spaces=False)
                    elif isinstance(token_data, str):
                         decoded_token = token_data # Nếu SHAP data đã là string
                    else:
                         continue # Bỏ qua nếu không phải int hoặc string

                    # --- Bước 2: Kiểm tra và loại bỏ token đặc biệt ---
                    # Loại bỏ khoảng trắng thừa trước/sau do decode
                    cleaned_token = decoded_token.strip()
                    if cleaned_token in special_tokens or not cleaned_token: # Nếu là token đặc biệt hoặc rỗng thì bỏ qua
                         continue

                    # --- !!! Bước 3: Bỏ ký tự Ġ ở đầu (nếu có) !!! ---
                    if cleaned_token.startswith('Ġ'):
                        token_text = cleaned_token[1:] # Lấy chuỗi từ ký tự thứ 2 trở đi
                    else:
                        token_text = cleaned_token # Giữ nguyên nếu không có Ġ

                    # --- Bước 4: Làm sạch khoảng trắng lần cuối (phòng trường hợp decode tạo ra) ---
                    token_text = token_text.strip()

                except Exception as decode_err:
                    print(f"⚠️ Lỗi decode/clean token SHAP tại index {idx}: {decode_err}")
                    continue # Bỏ qua token này nếu có lỗi

                # --- Bước 5: Thêm vào list nếu hợp lệ và chưa có ---
                # Đảm bảo token không rỗng sau khi xử lý và có độ dài tối thiểu (vd: > 1)
                if token_text and len(token_text) > 1 and token_text not in processed_tokens_shap:
                     top_words_en.append(token_text)
                     processed_tokens_shap.add(token_text)
                     if len(top_words_en) >= num_top_words:
                        break # Đủ 10 từ thì dừng

            print(f"✅ SHAP hoàn tất. Top words/subwords (EN, đã bỏ Ġ) làm tăng độ giả: {top_words_en}")
        except Exception as e: print(f"❌ Lỗi nghiêm trọng trong quá trình tính toán SHAP: {e}"); traceback.print_exc()
    else: print("ℹ️ Bỏ qua tính toán SHAP theo yêu cầu.")

    # Luôn sử dụng kết quả tiếng Anh từ SHAP
    top_words_final = top_words_en
    print("ℹ️ Trả về top words bằng tiếng Anh.")


    # 8. Chuẩn bị và Trả về Kết quả JSON
    try:
        response_data = {
            "original_text": original_text,
            "processed_english_text": text_to_process,
            "detected_language": detected_lang,
            "real_probability": round(real_prob_percent, 2),
            "fake_probability": round(fake_prob_percent, 2),
            "sentiment_score": round(sentiment_score, 4),
            "top_fake_words": top_words_final, # Luôn là list tiếng Anh
        }
        print(f"✅ Chuẩn bị gửi phản hồi: {response_data}")
        return jsonify(response_data)
    except Exception as e:
        print(f"❌ Lỗi khi tạo JSON response: {e}")
        return jsonify({"error": f"Lỗi khi tạo phản hồi: {str(e)}"}), 500

# --- Xử lý lỗi chung của Flask ---
@app.errorhandler(Exception)
def handle_exception(e):
    """Xử lý các lỗi không mong muốn khác."""
    error_message = traceback.format_exc(); print(f"💥 Lỗi Server không xác định:\n{error_message}")
    response = jsonify(error="Đã xảy ra lỗi không mong muốn trên server."); response.status_code = 500
    return response

# --- Chạy App ---
if __name__ == "__main__":
    APP_PORT = 5001; print(f"--- Khởi chạy Flask App trên cổng {APP_PORT} ---")
    # app.run(host='0.0.0.0', port=APP_PORT, debug=True)
    app.run(host='0.0.0.0', port=APP_PORT, debug=False)