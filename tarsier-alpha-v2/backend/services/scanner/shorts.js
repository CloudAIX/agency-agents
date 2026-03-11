/**
 * Short setups scanner
 * Setups: gap_fill_short | overbought_short | catalyst_short
 * Short Score: 0–100 (beta: only surface 80+)
 *
 * IMPORTANT: All entries are PUT options — paper trades only.
 * Badges: "theta_burn" (DTE < 30), "margin_alert" (naked put risk)
 */
const { getSnapshot, getDailyBars, getOptionsChain, midWithSlippage } = require('../polygon');
const { rsi, bollingerBands, detectGap, volumeRatio } = require('../technicals');

/**
 * Score a single ticker for short setups
 * @param {string} ticker
 * @param {number} minScore - default 80 (beta cap)
 */
async function scoreShort(ticker, minScore = 80) {
  const [bars, snapshot] = await Promise.all([
    getDailyBars(ticker, 30),
    getSnapshot(ticker)
  ]);

  if (!bars.length || !snapshot) return null;

  const currentRsi = rsi(bars);
  const bb = bollingerBands(bars);
  const gap = detectGap(bars);
  const volRatio = volumeRatio(bars);
  const price = snapshot.day?.c || snapshot.prevDay?.c;
  if (!price) return null;

  let setupType = null;
  let score = 0;

  // --- Gap Fill Short: Gap UP → stall/fakeout down ---
  if (gap.direction === 'up' && gap.gapPct >= 2) {
    setupType = 'gap_fill_short';
    score += 35;
    if (gap.gapPct >= 4) score += 15; // larger gap = more likely to fade
    if (currentRsi && currentRsi > 65) score += 10; // already stretched
    if (volRatio && volRatio < 0.8) score += 10; // volume fade = no follow-through
  }

  // --- Overbought Short: RSI > 75, upper Bollinger, vol fade ---
  if (currentRsi && currentRsi > 75) {
    const overboughtScore = 45 + (currentRsi - 75);
    if (overboughtScore > score) {
      score = overboughtScore;
      setupType = 'overbought_short';
    }
    if (bb && price >= bb.upper) score += 15; // at upper BB
    if (volRatio && volRatio < 0.7) score += 10; // volume fading = momentum dying
  }

  if (!setupType || score < minScore) return null;

  // Fetch options chain — PUTS near ATM -5% or OTM +10% premium
  const atmStrike = price;
  const otmStrike = price * 0.95; // ATM -5%
  const strikeMin = price * 0.85;
  const strikeMax = price * 1.02;

  const chain = await getOptionsChain(ticker, { strikeMin, strikeMax });
  const putContracts = chain.filter(c =>
    c.details?.contract_type === 'put' &&
    c.greeks?.delta < -0.2 &&
    c.greeks?.delta > -0.55
  );

  if (!putContracts.length) return null;

  // Prefer high-IV puts (cheaper protection, more upside on move)
  putContracts.sort((a, b) => (b.greeks?.iv || 0) - (a.greeks?.iv || 0));
  const best = putContracts[0];
  const bid = best.last_quote?.bid || 0;
  const ask = best.last_quote?.ask || bid * 1.05;

  // Boost score for high put OI (institutional hedging = confirms direction)
  if (best.open_interest > 500) score += 8;
  // High IV = more expensive but bigger payout
  if (best.greeks?.iv > 0.5) score += 5;

  score = Math.min(score, 100);
  if (score < minScore) return null;

  const paperEntryPrice = midWithSlippage(bid, ask);
  const dte = best.details?.days_to_expiration || 0;

  const badges = [];
  if (dte < 30) badges.push('theta_burn');
  // Always warn on puts — stock +10% → ~300% loss
  badges.push('margin_alert');

  const leverage = price / paperEntryPrice; // rough leverage estimate
  const premiumPct = (paperEntryPrice / price) * 100;

  return {
    ticker,
    side: 'short',
    setupType,
    score,
    price,
    rsi: currentRsi,
    change1d: snapshot.todaysChangePerc,
    volume: snapshot.day?.v,
    avgVolume: snapshot.prevDay?.v,
    chain: {
      strike: best.details?.strike_price,
      expiry: best.details?.expiration_date,
      optionType: 'put',
      bid,
      ask,
      mid: (bid + ask) / 2,
      iv: best.greeks?.iv,
      oi: best.open_interest,
      delta: best.greeks?.delta,
      gamma: best.greeks?.gamma,
      theta: best.greeks?.theta,
      vega: best.greeks?.vega,
      dte
    },
    paperEntryPrice,
    entryZone: `$${otmStrike.toFixed(2)} put (${premiumPct.toFixed(1)}% of stock)`,
    leverage: parseFloat(leverage.toFixed(1)),
    badges,
    riskNote: `Stock +10% → est. ${(leverage * 10 * -1).toFixed(0)}% loss on put`,
    scannedAt: new Date()
  };
}

module.exports = { scoreShort };
