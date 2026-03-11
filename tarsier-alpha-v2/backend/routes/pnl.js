/**
 * GET /api/pnl
 * Returns P&L summary split by longs vs shorts
 * Query: userId, period=week|month|all
 *
 * GET /api/pnl/public
 * Anonymized public P&L for the weekly leaderboard post
 */
const express = require('express');
const router = express.Router();
const PaperTrade = require('../models/PaperTrade');
const { verifyToken } = require('../middleware/auth');

/**
 * Compute summary stats from closed trades
 */
function computeSummary(trades) {
  if (!trades.length) return { count: 0, winRate: 0, netPct: 0, totalPnl: 0, avgHoldHrs: 0, maxDrawdown: 0 };

  const wins = trades.filter(t => t.pnl > 0);
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const avgEntry = trades.reduce((s, t) => s + t.entryPrice, 0) / trades.length;
  const netPct = (totalPnl / (avgEntry * 100 * trades.reduce((s, t) => s + t.qty, 0))) * 100;

  const holdTimes = trades
    .filter(t => t.exitTimestamp)
    .map(t => (new Date(t.exitTimestamp) - new Date(t.entryTimestamp)) / 3600000);
  const avgHoldHrs = holdTimes.length
    ? holdTimes.reduce((s, v) => s + v, 0) / holdTimes.length
    : 0;

  // Max drawdown — peak-to-trough on cumulative P&L
  let peak = 0, runningPnl = 0, maxDrawdown = 0;
  trades.forEach(t => {
    runningPnl += t.pnl || 0;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  return {
    count: trades.length,
    winRate: parseFloat(((wins.length / trades.length) * 100).toFixed(1)),
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    netPct: parseFloat(netPct.toFixed(2)),
    avgHoldHrs: parseFloat(avgHoldHrs.toFixed(1)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2))
  };
}

// User P&L
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const period = req.query.period || 'week';

    const periodMs = { week: 7, month: 30, all: 99999 };
    const days = periodMs[period] || 7;
    const since = new Date(Date.now() - days * 86400000);

    const trades = await PaperTrade.find({
      userId,
      status: 'closed',
      exitTimestamp: { $gte: since }
    }).lean();

    const longs = trades.filter(t => t.side === 'long');
    const shorts = trades.filter(t => t.side === 'short');

    res.json({
      period,
      longs: computeSummary(longs),
      shorts: computeSummary(shorts),
      net: computeSummary(trades),
      openTrades: await PaperTrade.countDocuments({ userId, status: 'open' })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public anonymized weekly P&L
router.get('/public', async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 86400000);
    const trades = await PaperTrade.find({
      status: 'closed',
      exitTimestamp: { $gte: since }
    }).lean();

    const longs = trades.filter(t => t.side === 'long');
    const shorts = trades.filter(t => t.side === 'short');
    const longsStats = computeSummary(longs);
    const shortsStats = computeSummary(shorts);
    const netStats = computeSummary(trades);

    const sign = n => n >= 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;

    res.json({
      week: new Date().toISOString().slice(0, 10),
      summary: `Longs: ${sign(longsStats.netPct)} | Shorts: ${sign(shortsStats.netPct)} | Net: ${sign(netStats.netPct)}`,
      longs: longsStats,
      shorts: shortsStats,
      net: netStats,
      disclaimer: 'Paper trades only — not financial advice.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
