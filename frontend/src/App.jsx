import './App.css';
import LineGraph from './components/LineGraph';
import { useState, useEffect, useMemo, useRef } from 'react';
import { ExcelParser } from './utils/ExcelParser';
import { PortfolioSnapshot } from './models/PortfolioSnapshot';

function App() {
  const fileInputRef = useRef(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalValue, setTotalValue] = useState('');
  const [file, setFile] = useState(null);
  const [weights, setWeights] = useState([]);
  const [parsingError, setParsingError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingSnapshotId, setEditingSnapshotId] = useState(null);

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        const res = await fetch('/api/snapshots');
        if (!res.ok) {
          throw new Error('Failed to load snapshots.');
        }
        const data = await res.json();
        setSnapshots(data);
      } catch (err) {
        console.error('Load failed:', err);
        setSubmitError('Could not load saved snapshots. Please check whether the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    loadSnapshots();
  }, []);

  const totalParsedWeight = useMemo(() => {
    return weights.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  }, [weights]);

  const duplicateCompanies = useMemo(() => {
    const counts = new Map();

    weights.forEach((item) => {
      const key = item.company.trim().toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return weights
      .map((item) => item.company.trim())
      .filter((name, index, arr) => {
        const key = name.toLowerCase();
        return counts.get(key) > 1 && arr.findIndex((n) => n.toLowerCase() === key) === index;
      });
  }, [weights]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    setFile(selectedFile || null);
    setParsingError('');
    setSubmitError('');
    setSubmitSuccess('');
    setWeights([]);

    if (!selectedFile) {
      return;
    }

    const lowerName = selectedFile.name.toLowerCase();
    const isExcelFile = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    if (!isExcelFile) {
      setFile(null);
      setParsingError('Please upload an Excel file in .xlsx or .xls format.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      const parsedWeights = await ExcelParser.parse(selectedFile);
      setWeights(parsedWeights);
    } catch (err) {
      console.error('Parse error:', err);
      setParsingError('Failed to parse Excel. Make sure column A is Company and column B is Weight %.');
    }
  };

  const resetForm = () => {
    setTotalValue('');
    setFile(null);
    setWeights([]);
    setParsingError('');
    setDate(new Date().toISOString().split('T')[0]);
    setEditingSnapshotId(null);
    setSubmitError('');
    setSubmitSuccess('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (snapshot) => {
    setDate(new Date(snapshot.date).toISOString().split('T')[0]);
    setTotalValue(String(snapshot.totalValue));
    setWeights(snapshot.weights.map((w) => ({
      company: w.company,
      weight: Number(w.weight),
    })));
    setFile(null);
    setParsingError('');
    setSubmitError('');
    setSubmitSuccess('');
    setEditingSnapshotId(snapshot._id);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitError('');
    setSubmitSuccess('');

    const valueNum = parseFloat(totalValue);

    const duplicateDateExists = snapshots.some((snapshot) => {
      const snapshotDate = new Date(snapshot.date).toISOString().split('T')[0];
      const isSameDate = snapshotDate === date;
      const isDifferentSnapshot = snapshot._id !== editingSnapshotId;
      return isSameDate && isDifferentSnapshot;
    });

    if (duplicateDateExists) {
      setSubmitError('A snapshot for this date already exists. Delete the old one first or choose another date.');
      return;
    }

    const snapshotData = { date, totalValue: valueNum, weights };
    const snapshot = new PortfolioSnapshot(snapshotData);
    const validationErrors = snapshot.getValidationErrors();

    if (validationErrors.length > 0) {
      setSubmitError(validationErrors[0]);
      return;
    }

    setSubmitting(true);

    try {
      const isEditing = Boolean(editingSnapshotId);
      const url = isEditing
        ? `/api/snapshots/${editingSnapshotId}`
        : '/api/snapshots';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshotData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || (isEditing ? 'Update failed.' : 'Submission failed.'));
      }

      const savedSnapshot = await res.json();

      if (isEditing) {
        setSnapshots((prev) =>
          prev
            .map((snapshotItem) =>
              snapshotItem._id === editingSnapshotId ? savedSnapshot : snapshotItem
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        );
        setSubmitSuccess('Snapshot updated successfully.');
      } else {
        setSnapshots((prev) =>
          [...prev, savedSnapshot].sort((a, b) => new Date(a.date) - new Date(b.date))
        );
        setSubmitSuccess('Snapshot saved successfully.');
      }

      setTotalValue('');
      setFile(null);
      setWeights([]);
      setParsingError('');
      setDate(new Date().toISOString().split('T')[0]);
      setEditingSnapshotId(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSubmitError(err.message || 'Failed to save snapshot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this snapshot?');
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/snapshots/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Delete failed.');
      }

      setSnapshots((prev) => prev.filter((s) => s._id !== id));

      if (editingSnapshotId === id) {
        resetForm();
      }

      setSubmitSuccess('Snapshot deleted.');
      setSubmitError('');
    } catch (err) {
      console.error(err);
      setSubmitError('Delete failed.');
      setSubmitSuccess('');
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm('Clear all snapshots?');
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch('/api/snapshots', { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Reset failed.');
      }
      setSnapshots([]);
      resetForm();
      setSubmitSuccess('All snapshots cleared.');
      setSubmitError('');
    } catch (err) {
      console.error(err);
      setSubmitError('Reset failed.');
      setSubmitSuccess('');
    }
  };

  const totalValueData = snapshots.map((s) => ({
    date: s.date,
    value: s.totalValue,
  }));

  const weightSeries = {};
  snapshots.forEach((snapshot) => {
    snapshot.weights.forEach((w) => {
      if (!weightSeries[w.company]) {
        weightSeries[w.company] = [];
      }
      weightSeries[w.company].push({ date: snapshot.date, weight: w.weight });
    });
  });

  if (loading) {
    return <div className="App loading-state">Loading...</div>;
  }

  return (
    <div className="App">
      <h1 className="app-title">📈 ArtFolio Tracker</h1>

      {submitError && (
        <div className="feedback-banner error">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="feedback-banner success">
          {submitSuccess}
        </div>
      )}

      <section className="section-card">
        <h2>
          {editingSnapshotId ? 'Edit Portfolio Snapshot' : 'Add Portfolio Snapshot'}
          {editingSnapshotId && <span className="edit-mode-badge">Editing</span>}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label" htmlFor="snapshot-date">
              Date:
            </label>
            <input
              id="snapshot-date"
              className="form-input date-input"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSubmitError('');
                setSubmitSuccess('');
              }}
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="total-value">
              Total Portfolio Value ($):
            </label>
            <input
              id="total-value"
              className="form-input value-input"
              type="number"
              step="0.01"
              value={totalValue}
              onChange={(e) => {
                setTotalValue(e.target.value);
                setSubmitError('');
                setSubmitSuccess('');
              }}
              placeholder="e.g. 100000"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="weights-file">
              Upload Excel (Weights):
            </label>
            <input
              id="weights-file"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            {file && <span className="file-name">✓ {file.name}</span>}
            {!file && editingSnapshotId && weights.length > 0 && (
              <span className="existing-weights-note">Using existing uploaded weights</span>
            )}
          </div>

          {parsingError && (
            <p className="helper-error">{parsingError}</p>
          )}

          {weights.length > 0 && (
            <div className="parsed-summary">
              <strong>Parsed {weights.length} companies</strong>
              <p className="parsed-summary-text">
                Total parsed weight: <strong>{totalParsedWeight.toFixed(2)}%</strong>
              </p>

              {duplicateCompanies.length > 0 && (
                <p className="warning-text">
                  Duplicate companies found: {duplicateCompanies.join(', ')}
                </p>
              )}

              {totalParsedWeight > 100.5 && (
                <p className="warning-text">
                  Warning: the parsed weights add up to more than 100%.
                </p>
              )}

              <ul className="preview-list">
                {weights.slice(0, 5).map((w, i) => (
                  <li key={i}>
                    {w.company}: {w.weight}%
                  </li>
                ))}
                {weights.length > 5 && <li>... and {weights.length - 5} more</li>}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={submitting || weights.length === 0}
            >
              {submitting
                ? (editingSnapshotId ? 'Updating...' : 'Saving...')
                : (editingSnapshotId ? 'Update Snapshot' : 'Save Snapshot')}
            </button>

            {editingSnapshotId && (
              <button
                type="button"
                className="button button-muted"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

    {snapshots.length > 0 && (() => {
            const latestSnapshot = snapshots[snapshots.length - 1];
            const firstSnapshot = snapshots[0];
            const overallValueChange = latestSnapshot.totalValue - firstSnapshot.totalValue;
            const overallValueChangePct = firstSnapshot.totalValue > 0
              ? ((overallValueChange / firstSnapshot.totalValue) * 100).toFixed(1)
              : null;
            const latestTopHolding = latestSnapshot.weights.length > 0
              ? latestSnapshot.weights.reduce((top, current) =>
                  current.weight > top.weight ? current : top
                )
              : null;

            return (
              <section className="summary-grid">
                <div className="summary-card">
                  <div className="summary-label">Latest Portfolio Value</div>
                  <div className="summary-value">
                    ${latestSnapshot.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="summary-subtext">
                    {new Date(latestSnapshot.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-label">Overall Change</div>
                  <div className={`summary-value ${overallValueChange >= 0 ? 'summary-positive' : 'summary-negative'}`}>
                    {overallValueChange >= 0 ? '+' : ''}
                    ${overallValueChange.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="summary-subtext">
                    {overallValueChangePct}% since first snapshot
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-label">Snapshots Recorded</div>
                  <div className="summary-value">{snapshots.length}</div>
                  <div className="summary-subtext">Total saved history points</div>
                </div>

                <div className="summary-card">
                  <div className="summary-label">Top Holding (Latest)</div>
                  <div className="summary-value">{latestTopHolding?.company || '-'}</div>
                  <div className="summary-subtext">
                    {latestTopHolding ? `${latestTopHolding.weight}% of portfolio` : 'No data'}
                  </div>
                </div>
              </section>
            );
          })()}

      <div className="actions-row">
        <button
          onClick={handleReset}
          className="button button-danger"
        >
          Reset All
        </button>
        <span className="snapshot-count">{snapshots.length} snapshot(s)</span>
      </div>

      {snapshots.length > 0 && (
        <>
          <LineGraph data={totalValueData} type="value" />
          <LineGraph data={weightSeries} type="weight" />

          <h2>📅 Snapshots</h2>
          <ul className="snapshot-list">
            {snapshots.map((s, i) => {
              const prev = snapshots[i - 1];

              const valueDelta = prev ? s.totalValue - prev.totalValue : null;
              const valuePct = prev ? ((valueDelta / prev.totalValue) * 100).toFixed(1) : null;

              const movers = prev
                ? s.weights
                    .map((w) => {
                      const prevW = prev.weights.find((p) => p.company === w.company);
                      return prevW
                        ? {
                            company: w.company,
                            delta: +(w.weight - prevW.weight).toFixed(2),
                          }
                        : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                    .slice(0, 2)
                : [];

              return (
                <li key={s._id} className="snapshot-card">
                  <div className="snapshot-header">
                    <strong>{new Date(s.date).toLocaleDateString()}</strong>
                    <span>
                      — $
                      {s.totalValue.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>

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
                      type="button"
                      onClick={() => handleEdit(s)}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(s._id)}
                      style={{
                        color: 'red',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      ❌
                    </button>
                  </div>

                  <div style={{ fontSize: '0.85em', marginTop: 4, color: '#555' }}>
                    Top: {s.weights.slice(0, 3).map(w => `${w.company} (${w.weight}%)`).join(', ')}
                  </div>

                  {movers.length > 0 && (
                    <div style={{ fontSize: '0.82em', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: '#888' }}>Weight movers:</span>
                      {movers.map(m => (
                        <span
                          key={m.company}
                          style={{
                            color: m.delta >= 0 ? 'green' : 'red',
                            background: m.delta >= 0 ? '#e6f9ec' : '#fdecea',
                            padding: '1px 6px',
                            borderRadius: 10,
                            fontWeight: 500
                          }}
                        >
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