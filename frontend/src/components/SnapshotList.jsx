function SnapshotList({ snapshots, onEdit, onDelete }) {
  if (!snapshots || snapshots.length === 0) {
    return null;
  }

  return (
    <>
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
                  <span
                    style={{
                      color: valueDelta >= 0 ? 'green' : 'red',
                      background: valueDelta >= 0 ? '#e6f9ec' : '#fdecea',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.85em',
                      fontWeight: 600,
                    }}
                  >
                    {valueDelta >= 0 ? '▲' : '▼'} ${Math.abs(valueDelta).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({valuePct}%)
                  </span>
                )}

                {i === 0 && (
                  <span style={{ fontSize: '0.8em', color: '#999' }}>baseline</span>
                )}

                <button
                  type="button"
                  onClick={() => onEdit(s)}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(s._id)}
                  style={{
                    color: 'red',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ❌
                </button>
              </div>

              <div style={{ fontSize: '0.85em', marginTop: 4, color: '#555' }}>
                Top: {s.weights.slice(0, 3).map((w) => `${w.company} (${w.weight}%)`).join(', ')}
              </div>

              {movers.length > 0 && (
                <div style={{ fontSize: '0.82em', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#888' }}>Weight movers:</span>
                  {movers.map((m) => (
                    <span
                      key={m.company}
                      style={{
                        color: m.delta >= 0 ? 'green' : 'red',
                        background: m.delta >= 0 ? '#e6f9ec' : '#fdecea',
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 500,
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
  );
}

export default SnapshotList;