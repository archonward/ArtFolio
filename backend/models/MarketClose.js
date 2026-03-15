const mongoose = require('mongoose');

const marketCloseSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: ['SPY', 'QQQ'],
    },
    date: {
      type: Date,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
    change: {
      type: Number,
      required: true,
      default: 0,
    },
    changePercent: {
      type: Number,
      required: true,
      default: 0,
    },
    source: {
      type: String,
      required: true,
      default: 'stooq',
    },
  },
  {
    timestamps: true,
  }
);

marketCloseSchema.index({ symbol: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MarketClose', marketCloseSchema);