/**
 * Auth routes — Firebase token verification + user profile
 * POST /api/auth/verify   — verify Firebase ID token, create/update user
 * GET  /api/auth/profile  — get user profile + preferences
 * PUT  /api/auth/profile  — update preferences (shorts toggle, alerts)
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Verify Firebase token + upsert user
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const { uid, email, name } = req.user;

    const user = await User.findOneAndUpdate(
      { uid },
      { uid, email, displayName: name, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ userId: user.uid, displayName: user.displayName, preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update preferences (shorts toggle, Telegram ID, alerts)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { enableShorts, alertSound, telegramAlerts, telegramChatId, minScore } = req.body;
    const updates = {};

    if (enableShorts !== undefined) updates['preferences.enableShorts'] = !!enableShorts;
    if (alertSound !== undefined) updates['preferences.alertSound'] = !!alertSound;
    if (telegramAlerts !== undefined) updates['preferences.telegramAlerts'] = !!telegramAlerts;
    if (telegramChatId) updates.telegramChatId = telegramChatId;
    if (minScore) updates['preferences.minScore'] = Math.min(Math.max(parseInt(minScore), 50), 100);

    const user = await User.findOneAndUpdate({ uid: req.user.uid }, updates, { new: true });
    res.json({ preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
