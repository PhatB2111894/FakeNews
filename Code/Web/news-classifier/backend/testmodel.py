
from transformers import RobertaTokenizer, TFRobertaForSequenceClassification

# Đường dẫn đến thư mục chứa mô hình đã lưu
model_save_path = "D:/LuanVan/FakeNews/Result/ISOT Fake News Dataset/RoBERTa/Adamax/10poch/RoBERTa_pretrained_20250305_162139"
tokenizer_save_path = "D:/LuanVan/FakeNews/Result/ISOT Fake News Dataset/RoBERTa/Adamax/10poch/RoBERTa_token_pretrained_20250305_162139"

# Tải mô hình và tokenizer
model = TFRobertaForSequenceClassification.from_pretrained(model_save_path)
tokenizer = RobertaTokenizer.from_pretrained(tokenizer_save_path)

print("Model and tokenizer loaded successfully!")
