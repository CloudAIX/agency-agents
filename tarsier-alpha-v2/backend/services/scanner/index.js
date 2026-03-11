/**
 * Main scanner — runs longs and/or shorts across S&P 500 tickers
 * Caches results in MongoDB (TTL 24h)
 */
const { scoreLong } = require('./longs');
const { scoreShort } = require('./shorts');
const Scan = require('../../models/Scan');

// S&P 500 tickers (top 50 liquids shown — expand to full 500 via env or DB)
const SP500_SAMPLE = [
  'AAPL','MSFT','AMZN','NVDA','GOOGL','META','TSLA','AVGO','JPM','UNH',
  'LLY','V','XOM','MA','HD','CVX','ABBV','MRK','COST','PEP',
  'BAC','KO','WMT','PFE','NFLX','TMO','CSCO','MCD','CRM','ACN',
  'ABT','LIN','ADBE','DIS','WFC','NKE','TXN','VZ','NEE','PM',
  'DHR','ORCL','RTX','BMY','AMGN','LOW','QCOM','CAT','HON','UPS',
  'XPO','JBHT','CVX','OXY','HAL'
];

/**
 * Run a full scan pass
 * @param {Object} opts
 * @param {string} opts.type - 'long' | 'short' | 'both'
 * @param {number} opts.minScore
 * @param {number} opts.limit
 * @param {string[]} opts.tickers - override ticker list
 */
async function runScan({ type = 'long', minScore = 62, limit = 20, tickers } = {}) {
  const tickerList = tickers || SP500_SAMPLE;
  const results = [];
  const shortMinScore = type === 'short' ? Math.max(minScore, 80) : 80; // beta: shorts cap at 80

  const batchSize = 10; // avoid rate-limiting Polygon
  for (let i = 0; i < tickerList.length; i += batchSize) {
    const batch = tickerList.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(async ticker => {
        try {
          if (type === 'long' || type === 'both') {
            const long = await scoreLong(ticker, minScore);
            if (long) return long;
          }
          if (type === 'short' || type === 'both') {
            const short = await scoreShort(ticker, shortMinScore);
            if (short) return short;
          }
        } catch (err) {
          // Skip tickers with data errors silently
          return null;
        }
      })
    );

    batchResults.forEach(r => {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    });

    if (results.length >= limit) break;
  }

  // Sort by score desc, cap shorts at 20% of results
  const longs = results.filter(r => r.side === 'long').sort((a, b) => b.score - a.score);
  const shorts = results.filter(r => r.side === 'short').sort((a, b) => b.score - a.score);
  const maxShorts = Math.ceil(limit * 0.2);
  const combined = [...longs, ...shorts.slice(0, maxShorts)]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Persist to MongoDB
  if (combined.length) {
    await Scan.insertMany(combined, { ordered: false }).catch(() => {});
  }

  return combined;
}

/**
 * Fetch cached scans from DB
 */
async function getCachedScans({ type, minScore = 62, limit = 20 } = {}) {
  const query = {};
  if (type && type !== 'both') query.side = type;
  if (type === 'short') minScore = Math.max(minScore, 80);
  query.score = { $gte: minScore };

  return Scan.find(query).sort({ score: -1 }).limit(limit).lean();
}

module.exports = { runScan, getCachedScans, SP500_SAMPLE };
