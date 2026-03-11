/**
 * Long setups scanner
 * Setups: gap_fill | oversold_bounce | catalyst_play
 * Score: 0–100
 */
const { getSnapshot, getDailyBars, getOptionsChain, midWithSlippage } = require('../polygon');
const { rsi, bollingerBands, detectGap, volumeRatio } = require('../technicals');

/**
 * Score a single ticker for long setups
 * Returns null if no qualifying setup found (score < minScore)
 */
async function scoreLong(ticker, minScore = 62) {
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

  // --- Gap Fill Long ---
  if (gap.direction === 'down' && Math.abs(gap.gapPct) >= 1.5) {
    setupType = 'gap_fill';
    score += 30; // base gap fill score
    if (Math.abs(gap.gapPct) >= 3) score += 15;
    if (currentRsi && currentRsi < 45) score += 10;
    if (volRatio && volRatio > 1.5) score += 10;
  }

  // --- Oversold Bounce ---
  if (currentRsi && currentRsi < 30) {
    const bounceScore = 40 + (30 - currentRsi);
    if (bounceScore > score) {
      score = bounceScore;
      setupType = 'oversold_bounce';
    }
    if (bb && price <= bb.lower) score += 15;
    if (volRatio && volRatio > 2) score += 10;
  }

  if (!setupType || score < minScore) return null;

  // Fetch options chain — calls near ATM
  const strikeMin = price * 0.95;
  const strikeMax = price * 1.1;
  const chain = await getOptionsChain(ticker, { strikeMin, strikeMax });
  const callContracts = chain.filter(c =>
    c.details?.contract_type === 'call' &&
    c.greeks?.delta > 0.3 &&
    c.greeks?.delta < 0.6
  );

  if (!callContracts.length) return null;
  const best = callContracts[0];
  const bid = best.last_quote?.bid || 0;
  const ask = best.last_quote?.ask || bid * 1.05;

  // Boost score for OI spike
  if (best.open_interest > 1000) score += 8;
  if (best.greeks?.iv < 0.4) score += 5; // low put skew = low IV → cheaper calls

  score = Math.min(score, 100);
  if (score < minScore) return null;

  const paperEntryPrice = midWithSlippage(bid, ask);

  const badges = [];
  if (best.details?.days_to_expiration < 30) badges.push('theta_burn');

  return {
    ticker,
    side: 'long',
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
      optionType: 'call',
      bid,
      ask,
      mid: (bid + ask) / 2,
      iv: best.greeks?.iv,
      oi: best.open_interest,
      delta: best.greeks?.delta,
      gamma: best.greeks?.gamma,
      theta: best.greeks?.theta,
      vega: best.greeks?.vega
    },
    paperEntryPrice,
    entryZone: `$${(price * 0.99).toFixed(2)} – $${(price * 1.02).toFixed(2)}`,
    badges,
    scannedAt: new Date()
  };
}

module.exports = { scoreLong };
