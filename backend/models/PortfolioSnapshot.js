// models/PortfolioSnapshot.js
const mongoose = require('mongoose');

const weightSchema = new mongoose.Schema({
  company: { type: String, required: true },
  weight: { type: Number, required: true, min: 0, max: 100 }
});

const portfolioSnapshotSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true,
    index: true
  },
  totalValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  weights: [weightSchema] 
}, {
  timestamps: true
});

module.exports = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);