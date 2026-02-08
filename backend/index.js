const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PortfolioSnapshot = require('./models/PortfolioSnapshot');

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

app.delete('/api/snapshots/:id', async (req, res) => {
  try {
    const result = await PortfolioSnapshot.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Snapshot not found' });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});