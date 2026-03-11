/**
 * Portfolio Hedge Mode — maps real-world exposure to correlated put baskets
 * "Whale Magnet" feature: logistics friend inputs $1M diesel cost → scanner suggests short XPO
 */
const { scoreShort } = require('./scanner/shorts');
const { getSnapshot } = require('./polygon');

// Industry → correlated tickers mapping
const INDUSTRY_MAP = {
  trucking:  { tickers: ['XPO', 'JBHT', 'ODFL', 'WERN', 'SAIA'], sector: 'Transportation' },
  retail:    { tickers: ['WMT', 'TGT', 'COST', 'AMZN', 'EBAY'], sector: 'Consumer Discretionary' },
  oil:       { tickers: ['CVX', 'XOM', 'OXY', 'HAL', 'SLB'],    sector: 'Energy' },
  tech:      { tickers: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'], sector: 'Technology' },
  airlines:  { tickers: ['DAL', 'UAL', 'AAL', 'LUV', 'JBLU'],   sector: 'Airlines' },
  housing:   { tickers: ['DHI', 'LEN', 'PHM', 'TOL', 'KBH'],    sector: 'Homebuilders' },
  banking:   { tickers: ['JPM', 'BAC', 'WFC', 'C', 'GS'],       sector: 'Financial' },
  healthcare:{ tickers: ['UNH', 'CVS', 'HCA', 'HUM', 'CI'],     sector: 'Healthcare' }
};

// Risk tolerance → hedge ratio (% of exposure to hedge)
const HEDGE_RATIOS = { low: 0.1, med: 0.2, high: 0.35 };

/**
 * Generate hedge basket suggestions
 * @param {Object} params
 * @param {string} params.industry - key from INDUSTRY_MAP
 * @param {number} params.exposureUsd - e.g. 1000000
 * @param {string} params.riskTolerance - 'low' | 'med' | 'high'
 */
async function generateHedge({ industry, exposureUsd, riskTolerance = 'med' }) {
  const industryData = INDUSTRY_MAP[industry.toLowerCase()];
  if (!industryData) throw new Error(`Unknown industry: ${industry}`);

  const hedgeRatio = HEDGE_RATIOS[riskTolerance] || 0.2;
  const hedgeTargetUsd = exposureUsd * hedgeRatio;

  // Scan correlated tickers for short setups
  const scanResults = await Promise.allSettled(
    industryData.tickers.map(ticker => scoreShort(ticker, 70)) // slightly lower threshold for hedge
  );

  const candidates = scanResults
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // top 5 for basket

  if (!candidates.length) {
    return { message: 'No qualifying short setups found for this industry right now.', basket: [] };
  }

  // Size each position
  const perPositionUsd = hedgeTargetUsd / candidates.length;
  const basket = candidates.map(c => {
    const premium = c.paperEntryPrice;
    const contracts = Math.max(1, Math.floor((perPositionUsd / 100) / premium));
    const expectedGainAt5PctDrop = contracts * 100 * premium * Math.abs(c.chain.delta) * 5; // rough: Δ × 5%
    return {
      ticker: c.ticker,
      strike: c.chain.strike,
      expiry: c.chain.expiry,
      optionType: 'put',
      premium: c.paperEntryPrice,
      contracts,
      totalCost: parseFloat((contracts * 100 * premium).toFixed(2)),
      expectedGainAt5pctDrop: parseFloat(expectedGainAt5PctDrop.toFixed(2)),
      greeks: c.chain,
      score: c.score,
      iv: c.chain.iv,
      badges: c.badges,
      // Delta-neutral hint
      hedgeHint: `Short ${c.ticker} put (Δ${c.chain.delta?.toFixed(2)}) → ~${(Math.abs(c.chain.delta) * 100).toFixed(0)}% correlated hedge on ${industry} exposure`
    };
  });

  const totalCost = basket.reduce((s, b) => s + b.totalCost, 0);
  const totalExpectedGain = basket.reduce((s, b) => s + b.expectedGainAt5pctDrop, 0);

  return {
    industry: industryData.sector,
    exposureUsd,
    hedgeTargetUsd,
    riskTolerance,
    totalCost: parseFloat(totalCost.toFixed(2)),
    totalExpectedGainAt5pctDrop: parseFloat(totalExpectedGain.toFixed(2)),
    coverageRatio: parseFloat(((totalExpectedGain / exposureUsd) * 100).toFixed(1)),
    basket,
    note: 'Paper hedge only — no real trades placed. Past performance does not guarantee future results.'
  };
}

module.exports = { generateHedge, INDUSTRY_MAP };
