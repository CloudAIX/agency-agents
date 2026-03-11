/**
 * Trade management routes
 * GET  /api/trades?status=open
 * POST /api/trades/:id/exit
 */
const express = require('express');
const router = express.Router();
const PaperTrade = require('../models/PaperTrade');
const { exitPaperTrade } = require('../services/paperTrade');
const { verifyToken } = require('../middleware/auth');

// Get user trades
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = { userId: req.user.uid };
    if (status) query.status = status;

    const trades = await PaperTrade.find(query)
      .sort({ entryTimestamp: -1 })
      .limit(Number(limit))
      .lean();

    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exit a trade
router.post('/:id/exit', verifyToken, async (req, res) => {
  try {
    const trade = await exitPaperTrade(req.params.id, req.user.uid, req.body.reason || 'manual');
    res.json({
      tradeId: trade._id,
      ticker: trade.ticker,
      exitPrice: trade.exitPrice,
      pnl: trade.pnl,
      pnlPct: trade.pnlPct,
      exitTimestamp: trade.exitTimestamp
    });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

module.exports = router;
