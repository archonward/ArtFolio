import './App.css';
import LineGraph from './components/LineGraph';
import { useState, useEffect } from 'react';
import { ExcelParser } from './utils/ExcelParser';
import { PortfolioSnapshot } from './models/PortfolioSnapshot';

function App() {
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalValue, setTotalValue] = useState('');
  const [file, setFile] = useState(null);
  const [weights, setWeights] = useState([]);
  const [parsingError, setParsingError] = useState(null);

  // App state
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load snapshots on mount
  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        const res = await fetch('/api/snapshots');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setSnapshots(data);
      } catch (err) {
        console.error('Load failed:', err);
        alert(' Could not load data. Check backend.');
      } finally {
        setLoading(false);
      }
    };
    loadSnapshots();
  }, []);

  // Parse Excel using OOP class
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setParsingError(null);
    setWeights([]);

    if (!selectedFile) return;

    try {
      const parsedWeights = await ExcelParser.parse(selectedFile);
      setWeights(parsedWeights);
    } catch (err) {
      console.error('Parse error:', err);
      setParsingError(' Failed to parse Excel. Ensure columns: A=Company, B=Weight %');
    }
  };

  // Submit using OOP validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const valueNum = parseFloat(totalValue);
    if (!date) return alert('Please select a date.');
    if (isNaN(valueNum) || valueNum <= 0) return alert('Valid total value required.');
    if (weights.length === 0) return alert('Upload and parse an Excel file first.');

    const snapshotData = { date, totalValue: valueNum, weights };
    const snapshot = new PortfolioSnapshot(snapshotData);

    if (!snapshot.isValid()) {
      return alert('Invalid snapshot data. Please check inputs.');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshotData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Submission failed');
      }

      const newSnapshot = await res.json();
      setSnapshots(prev =>
        [...prev, newSnapshot].sort((a, b) => new Date(a.date) - new Date(b.date))
      );

      // Reset form
      setTotalValue('');
      setFile(null);
      setWeights([]);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      alert(` ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this snapshot?')) return;
    try {
      const res = await fetch(`/api/snapshots/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setSnapshots(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Clear all snapshots?')) {
      fetch('/api/snapshots', { method: 'DELETE' })
        .then(() => setSnapshots([]))
        .catch(() => alert('Reset failed.'));
    }
  };

  // Prepare graph data
  const totalValueData = snapshots.map(s => ({ date: s.date, value: s.totalValue }));

  const weightSeries = {};
  snapshots.forEach(snapshot => {
    snapshot.weights.forEach(w => {
      if (!weightSeries[w.company]) weightSeries[w.company] = [];
      weightSeries[w.company].push({ date: snapshot.date, weight: w.weight });
    });
  });

  if (loading) {
    return <div className="App" style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div className="App" style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>📈 ArtFolio Tracker</h1>

      <section style={{ background: '#f9f9f9', padding: 20, borderRadius: 8, marginBottom: 30 }}>
        <h2>Add Portfolio Snapshot</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label>Date: </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: '6px', marginLeft: 8 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Total Portfolio Value ($): </label>
            <input
              type="number"
              step="0.01"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="e.g. 100000"
              required
              style={{ padding: '6px', width: '200px', marginLeft: 8 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Upload Excel (Weights): </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ marginLeft: 8 }}
            />
            {file && <span style={{ marginLeft: 8, color: 'green' }}>✓ {file.name}</span>}
          </div>

          {parsingError && <p style={{ color: 'red' }}>{parsingError}</p>}

          {weights.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <strong>Parsed {weights.length} companies:</strong>
              <ul style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #eee', padding: 8 }}>
                {weights.slice(0, 5).map((w, i) => (
                  <li key={i}>{w.company}: {w.weight}%</li>
                ))}
                {weights.length > 5 && <li>... and {weights.length - 5} more</li>}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || weights.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: submitting ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Saving...' : ' Save Snapshot'}
          </button>
        </form>
      </section>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handleReset}
          style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', marginRight: 10 }}
        >
           Reset All
        </button>
        <span>{snapshots.length} snapshot(s)</span>
      </div>

      {snapshots.length > 0 && (
        <>
          <LineGraph data={totalValueData} type="value" />
          <LineGraph data={weightSeries} type="weight" />

          {/* Snapshot List */}
          <h2>📅 Snapshots</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {snapshots.map((s, i) => {
              const prev = snapshots[i - 1];

              // Value delta
              const valueDelta = prev ? s.totalValue - prev.totalValue : null;
              const valuePct = prev ? ((valueDelta / prev.totalValue) * 100).toFixed(1) : null;

              // Top weight movers
              const movers = prev
                ? s.weights
                    .map(w => {
                      const prevW = prev.weights.find(p => p.company === w.company);
                      return prevW ? { company: w.company, delta: +(w.weight - prevW.weight).toFixed(2) } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                    .slice(0, 2)
                : [];

              return (
                <li key={s._id} style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>

                  {/* Row 1: Date, value, delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{new Date(s.date).toLocaleDateString()}</strong>
                    <span>— ${s.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>

                    {/* Value delta badge */}
                    {valueDelta !== null && (
                      <span style={{
                        color: valueDelta >= 0 ? 'green' : 'red',
                        background: valueDelta >= 0 ? '#e6f9ec' : '#fdecea',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.85em',
                        fontWeight: 600
                      }}>
                        {valueDelta >= 0 ? '▲' : '▼'} ${Math.abs(valueDelta).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({valuePct}%)
                      </span>
                    )}

                    {i === 0 && (
                      <span style={{ fontSize: '0.8em', color: '#999' }}>baseline</span>
                    )}

                    <button
                      onClick={() => handleDelete(s._id)}
                      style={{ marginLeft: 'auto', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ❌
                    </button>
                  </div>

                  {/* Row 2: Top holdings */}
                  <div style={{ fontSize: '0.85em', marginTop: 4, color: '#555' }}>
                    Top: {s.weights.slice(0, 3).map(w => `${w.company} (${w.weight}%)`).join(', ')}
                  </div>

                  {/* Row 3: Weight movers */}
                  {movers.length > 0 && (
                    <div style={{ fontSize: '0.82em', marginTop: 4, display: 'flex', gap: 8 }}>
                      <span style={{ color: '#888' }}>Weight movers:</span>
                      {movers.map(m => (
                        <span key={m.company} style={{
                          color: m.delta >= 0 ? 'green' : 'red',
                          background: m.delta >= 0 ? '#e6f9ec' : '#fdecea',
                          padding: '1px 6px',
                          borderRadius: 10,
                          fontWeight: 500
                        }}>
                          {m.delta >= 0 ? '▲' : '▼'} {m.company} ({m.delta > 0 ? '+' : ''}{m.delta}%)
                        </span>
                      ))}
                    </div>
                  )}

                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;