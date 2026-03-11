/**
 * Agentic API Layer — read-only + paper sim
 * For AI agents (Claude, etc.) — no real money
 *
 * GET  /api/agent/scans?type=shorts&minScore=80&limit=10
 * GET  /api/agent/pnl?userId=xyz&period=week
 * POST /api/agent/paper-trade  Body: { ticker, strike, side, qty }
 */
const express = require('express');
const router = express.Router();
const { getCachedScans } = require('../services/scanner');
const { enterPaperTrade } = require('../services/paperTrade');
const PaperTrade = require('../models/PaperTrade');
const { verifyAgentToken } = require('../middleware/auth');

// Agent scans endpoint
router.get('/scans', verifyAgentToken, async (req, res) => {
  try {
    const type = req.query.type === 'shorts' ? 'short' : (req.query.type || 'long');
    const minScore = parseInt(req.query.minScore) || 62;
    const limit = Math.min(parseInt(req.query.limit) || 10, 25);

    const scans = await getCachedScans({ type, minScore, limit });

    // Return agent-optimized payload (clean, structured)
    res.json(scans.map(s => ({
      ticker: s.ticker,
      setup: s.setupType,
      side: s.side,
      score: s.score,
      price: s.price,
      chain: s.chain,
      entryZone: s.entryZone,
      paperEntryPrice: s.paperEntryPrice,
      badges: s.badges,
      scannedAt: s.scannedAt
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent P&L endpoint
router.get('/pnl', verifyAgentToken, async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const period = req.query.period || 'week';
    const days = period === 'month' ? 30 : period === 'all' ? 9999 : 7;
    const since = new Date(Date.now() - days * 86400000);

    const trades = await PaperTrade.find({
      userId,
      status: 'closed',
      exitTimestamp: { $gte: since }
    }).lean();

    const stats = side => {
      const t = trades.filter(x => x.side === side);
      if (!t.length) return { count: 0, winRate: '0%', net: '0%' };
      const wins = t.filter(x => x.pnl > 0).length;
      const netPnl = t.reduce((s, x) => s + (x.pnl || 0), 0);
      const avgEntry = t.reduce((s, x) => s + x.entryPrice, 0) / t.length;
      const netPct = (netPnl / (avgEntry * 100 * t.length)) * 100;
      return {
        count: t.length,
        winRate: `${((wins / t.length) * 100).toFixed(0)}%`,
        net: `${netPct >= 0 ? '+' : ''}${netPct.toFixed(1)}%`,
        totalPnl: parseFloat(netPnl.toFixed(2))
      };
    };

    res.json({
      userId,
      period,
      longs: stats('long'),
      shorts: stats('short')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent paper-trade simulation
router.post('/paper-trade', verifyAgentToken, async (req, res) => {
  try {
    const { ticker, strike, side, qty = 1, expiry, setupType = 'agent_trade' } = req.body;

    if (!ticker || !strike || !side) {
      return res.status(400).json({ error: 'ticker, strike, side required' });
    }
    if (!['long', 'short'].includes(side)) {
      return res.status(400).json({ error: 'side must be "long" or "short"' });
    }

    const optionType = side === 'long' ? 'call' : 'put';
    const expiryDate = expiry || getNextFriday();

    const trade = await enterPaperTrade({
      userId: `agent_${req.agentId}`,
      ticker: ticker.toUpperCase(),
      side,
      setupType,
      score: 0, // agent-initiated
      strike: parseFloat(strike),
      expiry: expiryDate,
      optionType,
      qty: parseInt(qty)
    });

    res.json({
      tradeId: trade._id,
      ticker: trade.ticker,
      strike: trade.strike,
      optionType: trade.optionType,
      entryPrice: trade.entryPrice,
      timestamp: trade.entryTimestamp,
      note: 'Paper trade simulated — no real broker execution'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getNextFriday() {
  const d = new Date();
  const day = d.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d.toISOString().slice(0, 10);
}

module.exports = router;
