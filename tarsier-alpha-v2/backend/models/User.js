const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true }, // Firebase UID
    email: { type: String, required: true },
    displayName: String,
    telegramChatId: String,
    preferences: {
      enableShorts: { type: Boolean, default: false },
      alertSound: { type: Boolean, default: true },
      telegramAlerts: { type: Boolean, default: false },
      minScore: { type: Number, default: 62 }
    },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
