/**
 * Technical indicator calculations (RSI, Bollinger Bands, gap detection)
 * Input: array of daily bar objects { o, h, l, c, v }
 */

/**
 * RSI — Relative Strength Index (14-period default)
 */
function rsi(bars, period = 14) {
  if (bars.length < period + 1) return null;
  const closes = bars.map(b => b.c);
  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

/**
 * Bollinger Bands (20-period, 2 std devs)
 */
function bollingerBands(bars, period = 20) {
  if (bars.length < period) return null;
  const slice = bars.slice(-period).map(b => b.c);
  const mean = slice.reduce((s, v) => s + v, 0) / period;
  const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: parseFloat((mean + 2 * std).toFixed(4)),
    middle: parseFloat(mean.toFixed(4)),
    lower: parseFloat((mean - 2 * std).toFixed(4))
  };
}

/**
 * Gap detection — compare today's open to yesterday's close
 * Returns { gapPct, direction: 'up'|'down'|'none' }
 */
function detectGap(bars, minGapPct = 0.5) {
  if (bars.length < 2) return { gapPct: 0, direction: 'none' };
  const prev = bars[bars.length - 2];
  const today = bars[bars.length - 1];
  const gapPct = ((today.o - prev.c) / prev.c) * 100;

  if (gapPct >= minGapPct) return { gapPct: parseFloat(gapPct.toFixed(2)), direction: 'up' };
  if (gapPct <= -minGapPct) return { gapPct: parseFloat(gapPct.toFixed(2)), direction: 'down' };
  return { gapPct: 0, direction: 'none' };
}

/**
 * Volume ratio vs 20-day average
 */
function volumeRatio(bars) {
  if (bars.length < 20) return null;
  const avgVol = bars.slice(-20).reduce((s, b) => s + b.v, 0) / 20;
  const todayVol = bars[bars.length - 1].v;
  return parseFloat((todayVol / avgVol).toFixed(2));
}

module.exports = { rsi, bollingerBands, detectGap, volumeRatio };
