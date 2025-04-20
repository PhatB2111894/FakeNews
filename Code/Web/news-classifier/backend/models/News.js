const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title cannot be empty'], // Giữ validation message tiếng Anh
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Content cannot be empty'], // Giữ validation message tiếng Anh
        trim: true
    },
    category: {
        type: String,
        default: 'Uncategorized', // Default tiếng Anh
        trim: true
        // Bỏ required: true ở đây
    },
    fake_probability: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    real_probability: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    predicted_label: { // <<<--- PHẢI CÓ TRƯỜNG NÀY
        type: String,
        required: true,
        enum: ['Fake', 'Real']
    },
    top_fake_words: {
        type: [String],
        default: []
    },
    detected_language: { // <<<--- PHẢI CÓ TRƯỜNG NÀY
        type: String,
        default: 'unknown'
    },
    userId: {
        type: String,
        required: [true, 'userId cannot be empty'] // Giữ validation message tiếng Anh
    },
    // !!! KHÔNG CÓ highlighted_text và language_received ở đây nữa !!!
 }, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);