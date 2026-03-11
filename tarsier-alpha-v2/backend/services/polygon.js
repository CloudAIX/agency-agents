/**
 * Polygon.io data service
 * Handles: quotes, options chains, Greeks, OI, vol
 */
const axios = require('axios');

const BASE = 'https://api.polygon.io';
const KEY = () => process.env.POLYGON_API_KEY;

// Axios instance with auth header
const poly = axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${KEY()}` },
  timeout: 10000
});

/**
 * Last trade / quote snapshot for a ticker
 */
async function getSnapshot(ticker) {
  const { data } = await poly.get(`/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`);
  return data.ticker;
}

/**
 * Aggregate bars (for RSI, Bollinger, gap detection)
 * @param {string} ticker
 * @param {number} days - lookback days
 */
async function getDailyBars(ticker, days = 30) {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { data } = await poly.get(
    `/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=${days}`
  );
  return data.results || [];
}

/**
 * Options chain snapshot — returns all contracts with Greeks
 */
async function getOptionsChain(ticker, { strikeMin, strikeMax, expiry } = {}) {
  const params = {
    underlying_asset: ticker,
    limit: 250,
    sort: 'expiration_date',
    order: 'asc'
  };
  if (strikeMin) params.strike_price_gte = strikeMin;
  if (strikeMax) params.strike_price_lte = strikeMax;
  if (expiry) params.expiration_date = expiry;

  const { data } = await poly.get('/v3/snapshot/options/' + ticker, { params });
  return data.results || [];
}

/**
 * Real-time quote (bid/ask) for specific option contract
 */
async function getOptionQuote(optionTicker) {
  const { data } = await poly.get(`/v3/snapshot/options/${optionTicker}`);
  return data.results;
}

/**
 * Compute mid price with slippage
 * @param {number} bid
 * @param {number} ask
 * @param {number} slippagePct - default 0.5%
 */
function midWithSlippage(bid, ask, slippagePct = 0.5) {
  const mid = (bid + ask) / 2;
  return parseFloat((mid * (1 + slippagePct / 100)).toFixed(4));
}

module.exports = { getSnapshot, getDailyBars, getOptionsChain, getOptionQuote, midWithSlippage };
