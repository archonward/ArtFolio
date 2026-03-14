function SummaryCards({ snapshots }) {
  if (!snapshots || snapshots.length === 0) {
    return null;
  }

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
}

export default SummaryCards;