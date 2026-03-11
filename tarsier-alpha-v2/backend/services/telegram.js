/**
 * Telegram alert service
 * Longs → "#LONG AAPL $155.00 📈 Score: 78"
 * Shorts → "#SHORT XPO $58.50 📉 Score: 84"
 */
const TelegramBot = require('node-telegram-bot-api');

let bot = null;

function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return bot;
}

/**
 * Send scan alert to a user's Telegram chat
 */
async function sendScanAlert(chatId, setup) {
  const b = getBot();
  if (!b || !chatId) return;

  const arrow = setup.side === 'long' ? '📈' : '📉';
  const tag = setup.side === 'long' ? '#LONG' : '#SHORT';
  const optType = setup.chain.optionType === 'call' ? 'CALL' : 'PUT';

  const msg = [
    `${tag} ${setup.ticker} ${arrow}`,
    `Score: ${setup.score}/100 | Setup: ${setup.setupType.replace('_', ' ').toUpperCase()}`,
    `Price: $${setup.price} | ${optType} $${setup.chain.strike} exp ${setup.chain.expiry}`,
    `Paper Entry: $${setup.paperEntryPrice} | IV: ${((setup.chain.iv || 0) * 100).toFixed(0)}%`,
    setup.badges.includes('theta_burn') ? '⚠️ Theta Burn Risk (DTE <30)' : '',
    setup.badges.includes('margin_alert') ? '⚠️ Margin Alert: puts carry unlimited upside risk' : ''
  ].filter(Boolean).join('\n');

  try {
    await b.sendMessage(chatId, msg);
  } catch (err) {
    console.error(`Telegram send failed for chatId ${chatId}:`, err.message);
  }
}

/**
 * Weekly P&L broadcast (anonymized)
 */
async function sendWeeklyPnL(chatId, pnlSummary) {
  const b = getBot();
  if (!b || !chatId) return;

  const { longs, shorts, net } = pnlSummary;
  const sign = n => n >= 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;

  const msg = [
    `📊 TarsierAlpha Weekly P&L`,
    `Longs: ${sign(longs.netPct)} (${longs.winRate.toFixed(0)}% win rate)`,
    `Shorts: ${sign(shorts.netPct)} (${shorts.winRate.toFixed(0)}% win rate)`,
    `Net: ${sign(net.netPct)}`,
    `─────────────────`,
    `Paper trades only — not financial advice.`
  ].join('\n');

  await b.sendMessage(chatId, msg).catch(err =>
    console.error('Weekly P&L Telegram send failed:', err.message)
  );
}

module.exports = { sendScanAlert, sendWeeklyPnL };
