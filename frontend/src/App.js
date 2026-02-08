import './App.css';
import LineGraph from './components/LineGraph';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

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

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        const res = await fetch('/api/snapshots');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setSnapshots(data);
      } catch (err) {
        console.error('Load failed:', err);
        alert('Could not load data. Check backend.');
      } finally {
        setLoading(false);
      }
    };
    loadSnapshots();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setParsingError(null);
    setWeights([]);

    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let parsed = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!Array.isArray(row) || row.length < 2) continue;

          const rawCompany = row[0];
          const rawWeight = row[1];

          if (!rawCompany || typeof rawCompany !== 'string') continue;
          const company = rawCompany.toString().trim();
          if (!company || /total|sum/i.test(company)) continue;

          const weight = parseFloat(rawWeight);
          if (isNaN(weight) || weight < 0) continue;

          parsed.push({ company, weight });
        }

        if (parsed.length === 0) {
          throw new Error('No valid company/weight data found.');
        }

        parsed.sort((a, b) => b.weight - a.weight);
        setWeights(parsed);
      } catch (err) {
        console.error('Parse error:', err);
        setParsingError('Failed to parse Excel. Check format.');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!date) return alert('Please select a date.');
    const valueNum = parseFloat(totalValue);
    if (isNaN(valueNum) || valueNum <= 0) return alert('Valid total value required.');
    if (weights.length === 0) return alert('Upload and parse an Excel file first.');

    setSubmitting(true);

    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, totalValue: valueNum, weights }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Submission failed');
      }

      const newSnapshot = await res.json();
      setSnapshots((prev) => [...prev, newSnapshot].sort((a, b) => new Date(a.date) - new Date(b.date)));
      
      setTotalValue('');
      setFile(null);
      setWeights([]);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this snapshot?')) return;
    try {
      const res = await fetch(`/api/snapshots/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setSnapshots((prev) => prev.filter(s => s._id !== id));
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

  const totalValueData = snapshots.map(s => ({
    date: s.date,
    value: s.totalValue
  }));

  const weightSeries = {};
  snapshots.forEach(snapshot => {
    snapshot.weights.forEach(w => {
      if (!weightSeries[w.company]) weightSeries[w.company] = [];
      weightSeries[w.company].push({
        date: snapshot.date,
        weight: w.weight
      });
    });
  });

  if (loading) return <div className="App" style={{ padding: 20 }}>Loading...</div>;

  return (
    <div className="App" style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>ArtFolio Tracker</h1>

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
            {submitting ? 'Saving...' : 'Save Snapshot'}
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
          <h2>Total Portfolio Value Over Time</h2>
          <LineGraph data={totalValueData} type="value" />

          <h2>Company Weight Evolution Over Time</h2>
          <LineGraph data={weightSeries} type="weight" />
        </>
      )}

      {snapshots.length > 0 && (
        <>
          <h2>Snapshots</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {snapshots.map((s) => (
              <li key={s._id} style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
                <strong>{new Date(s.date).toLocaleDateString()}</strong> — 
                ${s.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} — 
                {s.weights.length} companies
                <button
                  onClick={() => handleDelete(s._id)}
                  style={{ marginLeft: 10, color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Delete
                </button>
                <div style={{ fontSize: '0.85em', marginTop: 4 }}>
                  Top: {s.weights.slice(0, 3).map(w => `${w.company} (${w.weight}%)`).join(', ')}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;