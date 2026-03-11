/**
 * Paper trade service
 * Simulates fills using Polygon real-time quote + 0.5% slippage
 * No real broker connections — educational only
 */
const { getOptionQuote, midWithSlippage } = require('./polygon');
const PaperTrade = require('../models/PaperTrade');

/**
 * Enter a paper trade
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.ticker
 * @param {string} params.side - 'long' | 'short'
 * @param {string} params.setupType
 * @param {number} params.score
 * @param {number} params.strike
 * @param {string} params.expiry  - 'YYYY-MM-DD'
 * @param {string} params.optionType - 'call' | 'put'
 * @param {number} params.qty
 * @param {Object} params.greeks
 * @param {number} params.underlyingPrice
 * @param {string} params.hedgeGroupId - optional
 */
async function enterPaperTrade(params) {
  const {
    userId, ticker, side, setupType, score,
    strike, expiry, optionType, qty = 1,
    greeks, underlyingPrice, hedgeGroupId
  } = params;

  // Build Polygon option ticker format: O:AAPL230915C00150000
  const polyTicker = buildOptionTicker(ticker, expiry, optionType, strike);

  let entryPrice;
  try {
    const quote = await getOptionQuote(polyTicker);
    const bid = quote?.last_quote?.bid || quote?.day?.close || 0;
    const ask = quote?.last_quote?.ask || bid * 1.05;
    entryPrice = midWithSlippage(bid, ask);
  } catch {
    // Fallback — use Greeks to estimate (Black-Scholes rough)
    entryPrice = greeks?.theoreticalValue || strike * 0.03;
  }

  const trade = new PaperTrade({
    userId,
    ticker,
    side,
    setupType,
    score,
    strike,
    expiry,
    optionType,
    qty,
    entryPrice,
    entryTimestamp: new Date(),
    underlyingAtEntry: underlyingPrice,
    greeks: greeks || {},
    hedgeGroupId
  });

  await trade.save();
  return trade;
}

/**
 * Exit a paper trade (manual or auto)
 */
async function exitPaperTrade(tradeId, userId, reason = 'manual') {
  const trade = await PaperTrade.findOne({ _id: tradeId, userId });
  if (!trade) throw new Error('Trade not found');
  if (trade.status === 'closed') throw new Error('Trade already closed');

  // Fetch current price
  const polyTicker = buildOptionTicker(trade.ticker, trade.expiry, trade.optionType, trade.strike);
  let exitPrice;
  try {
    const quote = await getOptionQuote(polyTicker);
    const bid = quote?.last_quote?.bid || 0;
    const ask = quote?.last_quote?.ask || bid * 1.05;
    exitPrice = (bid + ask) / 2;
  } catch {
    exitPrice = trade.entryPrice; // flat if can't fetch
  }

  trade.close(exitPrice, reason);
  await trade.save();
  return trade;
}

/**
 * Enter a hedge basket — multiple puts as a group
 */
async function enterHedgeBasket(userId, hedgeTrades) {
  const groupId = `hedge_${Date.now()}_${userId}`;
  const entered = await Promise.all(
    hedgeTrades.map(t => enterPaperTrade({ ...t, userId, hedgeGroupId: groupId }))
  );
  return { groupId, trades: entered };
}

/**
 * Build Polygon option ticker string
 * Format: O:AAPL230915C00150000
 */
function buildOptionTicker(ticker, expiry, type, strike) {
  const dateStr = expiry.replace(/-/g, '').slice(2); // YYMMDD
  const typeChar = type === 'call' ? 'C' : 'P';
  const strikeStr = String(Math.round(strike * 1000)).padStart(8, '0');
  return `O:${ticker}${dateStr}${typeChar}${strikeStr}`;
}

module.exports = { enterPaperTrade, exitPaperTrade, enterHedgeBasket };
