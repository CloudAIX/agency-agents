/**
 * POST /api/hedge/suggest   — generate hedge basket
 * POST /api/hedge/enter     — paper-enter hedge basket
 * GET  /api/hedge/basket/:groupId — track a hedge group
 */
const express = require('express');
const router = express.Router();
const { generateHedge, INDUSTRY_MAP } = require('../services/hedge');
const { enterHedgeBasket } = require('../services/paperTrade');
const PaperTrade = require('../models/PaperTrade');
const { verifyToken } = require('../middleware/auth');

// List available industries
router.get('/industries', (req, res) => {
  res.json(Object.keys(INDUSTRY_MAP));
});

// Suggest hedge basket
router.post('/suggest', async (req, res) => {
  try {
    const { industry, exposureUsd, riskTolerance = 'med' } = req.body;

    if (!industry || !exposureUsd) {
      return res.status(400).json({ error: 'industry and exposureUsd required' });
    }
    if (!['low', 'med', 'high'].includes(riskTolerance)) {
      return res.status(400).json({ error: 'riskTolerance must be low, med, or high' });
    }

    const hedge = await generateHedge({ industry, exposureUsd: parseFloat(exposureUsd), riskTolerance });
    res.json(hedge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Paper-enter hedge basket
router.post('/enter', verifyToken, async (req, res) => {
  try {
    const { industry, exposureUsd, riskTolerance, underlyingPrices = {} } = req.body;
    const userId = req.user.uid;

    const hedge = await generateHedge({ industry, exposureUsd: parseFloat(exposureUsd), riskTolerance });
    if (!hedge.basket.length) {
      return res.status(422).json({ error: 'No qualifying setups for hedge basket' });
    }

    const tradesToEnter = hedge.basket.map(b => ({
      ticker: b.ticker,
      side: 'short',
      setupType: 'hedge',
      score: b.score,
      strike: b.strike,
      expiry: b.expiry,
      optionType: 'put',
      qty: b.contracts,
      greeks: b.greeks,
      underlyingPrice: underlyingPrices[b.ticker] || b.greeks?.underlyingPrice
    }));

    const result = await enterHedgeBasket(userId, tradesToEnter);
    res.json({
      groupId: result.groupId,
      tradesEntered: result.trades.length,
      totalCost: hedge.totalCost,
      trades: result.trades.map(t => ({
        tradeId: t._id,
        ticker: t.ticker,
        strike: t.strike,
        qty: t.qty,
        entryPrice: t.entryPrice
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track hedge group
router.get('/basket/:groupId', verifyToken, async (req, res) => {
  try {
    const trades = await PaperTrade.find({
      userId: req.user.uid,
      hedgeGroupId: req.params.groupId
    }).lean();

    if (!trades.length) return res.status(404).json({ error: 'Hedge group not found' });

    const totalCost = trades.reduce((s, t) => s + t.entryPrice * t.qty * 100, 0);
    const currentPnl = trades
      .filter(t => t.status === 'closed')
      .reduce((s, t) => s + (t.pnl || 0), 0);

    res.json({
      groupId: req.params.groupId,
      status: trades.every(t => t.status === 'closed') ? 'closed' : 'open',
      trades,
      totalCost: parseFloat(totalCost.toFixed(2)),
      realizedPnl: parseFloat(currentPnl.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
