const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PortfolioSnapshot = require('./models/PortfolioSnapshot');
const {
  archiveLatestClose,
  archiveLatestForAllSupportedSymbols,
  getArchivedHistory,
} = require('./services/marketCloseService');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Database connection error:', err));

app.get('/api/snapshots', async (req, res) => {
  try {
    const snapshots = await PortfolioSnapshot.find().sort({ date: 1 });
    res.json(snapshots);
  } catch (err) {
    console.error('GET /snapshots error:', err);
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

app.post('/api/snapshots', async (req, res) => {
  try {
    const { date, totalValue, weights } = req.body;

    if (!date || typeof totalValue !== 'number' || totalValue < 0) {
      return res.status(400).json({ error: 'Valid date and non-negative totalValue required' });
    }

    if (!Array.isArray(weights) || weights.length === 0) {
      return res.status(400).json({ error: 'Weights must be a non-empty array' });
    }

    const snapshot = new PortfolioSnapshot({ date, totalValue, weights });
    const saved = await snapshot.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('POST /snapshots error:', err);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

app.put('/api/snapshots/:id', async (req, res) => {
  try {
    const { date, totalValue, weights } = req.body;

    if (!date || typeof totalValue !== 'number' || totalValue < 0) {
      return res.status(400).json({ error: 'Valid date and non-negative totalValue required' });
    }

    if (!Array.isArray(weights) || weights.length === 0) {
      return res.status(400).json({ error: 'Weights must be a non-empty array' });
    }

    const updated = await PortfolioSnapshot.findByIdAndUpdate(
      req.params.id,
      { date, totalValue, weights },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('PUT /snapshots/:id error:', err);
    res.status(500).json({ error: 'Failed to update snapshot' });
  }
});

app.delete('/api/snapshots/:id', async (req, res) => {
  try {
    const result = await PortfolioSnapshot.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    res.json({ message: 'Snapshot deleted' });
  } catch (err) {
    console.error('DELETE /snapshots error:', err);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
});

app.delete('/api/snapshots', async (req, res) => {
  try {
    await PortfolioSnapshot.deleteMany({});
    res.json({ message: 'All snapshots deleted' });
  } catch (err) {
    console.error('DELETE ALL error:', err);
    res.status(500).json({ error: 'Failed to reset' });
  }
});

app.get('/api/market-closes', async (req, res) => {
  try {
    const symbol = req.query.symbol;

    if (!symbol) {
      return res.status(400).json({ error: 'Query parameter "symbol" is required.' });
    }

    const history = await getArchivedHistory(symbol, 30);
    res.json(history);
  } catch (err) {
    console.error('GET /api/market-closes error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch market close history.' });
  }
});

app.post('/api/market-closes/fetch-latest', async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Request body must include "symbol".' });
    }

    const result = await archiveLatestClose(symbol);
    res.json(result);
  } catch (err) {
    console.error('POST /api/market-closes/fetch-latest error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch latest market close.' });
  }
});

app.post('/api/market-closes/fetch-all', async (req, res) => {
  try {
    const results = await archiveLatestForAllSupportedSymbols();
    res.json({ results });
  } catch (err) {
    console.error('POST /api/market-closes/fetch-all error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch all market closes.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});