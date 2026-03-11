/**
 * GET /api/scans
 * Query params:
 *   type=long|short|both  (default: long)
 *   minScore=62           (short default: 80)
 *   limit=20
 *   refresh=true          (force re-scan instead of cache)
 */
const express = require('express');
const router = express.Router();
const { runScan, getCachedScans } = require('../services/scanner');

router.get('/', async (req, res) => {
  try {
    const type = req.query.type || 'long';
    const minScore = parseInt(req.query.minScore) || (type === 'short' ? 80 : 62);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const refresh = req.query.refresh === 'true';

    const validTypes = ['long', 'short', 'both'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    let scans;
    if (refresh) {
      scans = await runScan({ type, minScore, limit });
    } else {
      scans = await getCachedScans({ type, minScore, limit });
      // Fall back to live scan if cache is empty
      if (!scans.length) {
        scans = await runScan({ type, minScore, limit });
      }
    }

    res.json({
      count: scans.length,
      type,
      minScore,
      scans
    });
  } catch (err) {
    console.error('Scans route error:', err);
    res.status(500).json({ error: 'Scanner error', detail: err.message });
  }
});

module.exports = router;
