const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema(
  {
    ticker: { type: String, required: true },
    side: { type: String, enum: ['long', 'short'], required: true },
    setupType: {
      type: String,
      enum: [
        // Longs
        'gap_fill',
        'oversold_bounce',
        'catalyst_play',
        // Shorts
        'gap_fill_short',
        'overbought_short',
        'catalyst_short'
      ],
      required: true
    },
    score: { type: Number, required: true },

    // Market snapshot
    price: Number,
    change1d: Number,   // % change today
    volume: Number,
    avgVolume: Number,
    rsi: Number,

    // Option data
    chain: {
      strike: Number,
      expiry: String,
      optionType: String,
      bid: Number,
      ask: Number,
      mid: Number,
      iv: Number,
      oi: Number,
      delta: Number,
      gamma: Number,
      theta: Number,
      vega: Number
    },

    // Paper entry price (mid + slippage)
    paperEntryPrice: Number,
    entryZone: String,   // e.g. "$58.00 – $59.50"

    // Badges / warnings
    badges: [{ type: String }],   // e.g. "theta_burn", "margin_alert"

    scannedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Auto-expire scans after 24h — keeps DB lean
scanSchema.index({ scannedAt: 1 }, { expireAfterSeconds: 86400 });
scanSchema.index({ side: 1, score: -1 });

module.exports = mongoose.model('Scan', scanSchema);
