const mongoose = require('mongoose');

const paperTradeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    ticker: { type: String, required: true },
    side: { type: String, enum: ['long', 'short'], required: true },
    setupType: { type: String, required: true },
    score: { type: Number, required: true },

    // Option details
    strike: { type: Number, required: true },
    expiry: { type: String, required: true }, // "YYYY-MM-DD"
    optionType: { type: String, enum: ['call', 'put'], required: true },
    qty: { type: Number, default: 1 },

    // Entry
    entryPrice: { type: Number, required: true },
    entryTimestamp: { type: Date, required: true },
    underlyingAtEntry: { type: Number },

    // Greeks at entry
    greeks: {
      delta: Number,
      gamma: Number,
      theta: Number,
      vega: Number,
      iv: Number
    },

    // Exit
    exitPrice: { type: Number },
    exitTimestamp: { type: Date },
    exitReason: { type: String, enum: ['manual', 'target', 'stop', 'expiry'] },

    // P&L
    pnl: { type: Number },         // dollar
    pnlPct: { type: Number },      // percentage
    status: { type: String, enum: ['open', 'closed'], default: 'open' },

    // Hedge basket group ID (optional)
    hedgeGroupId: { type: String }
  },
  { timestamps: true }
);

// Compute P&L on exit
paperTradeSchema.methods.close = function (exitPrice, reason = 'manual') {
  const multiplier = 100; // 1 contract = 100 shares
  this.exitPrice = exitPrice;
  this.exitTimestamp = new Date();
  this.exitReason = reason;
  this.pnl = (exitPrice - this.entryPrice) * multiplier * this.qty;
  this.pnlPct = ((exitPrice - this.entryPrice) / this.entryPrice) * 100;
  this.status = 'closed';
};

module.exports = mongoose.model('PaperTrade', paperTradeSchema);
