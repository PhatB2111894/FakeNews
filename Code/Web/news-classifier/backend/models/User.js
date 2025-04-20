const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true }
});

const Counter = mongoose.model('Counter', CounterSchema);

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    userId: { type: String, unique: true },
    avatar: { type: String, default: null },
    role: { type: String, enum: ["admin", "user"], default: "user" }
}, { timestamps: true });

// Hàm tăng giá trị userId hoặc adminId
UserSchema.pre('save', async function (next) {
    if (!this.userId) { // Nếu chưa có userId
        const key = this.role === "admin" ? "adminId" : "userId";  // Phân biệt admin và user
        const counter = await Counter.findOneAndUpdate(
            { key }, 
            { $inc: { value: 1 } }, 
            { new: true, upsert: true }
        );
        this.userId = `${key === "adminId" ? "a" : "u"}${counter.value}`;
    }
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = { User, Counter };
