function MarketCloseCard({
  symbol,
  history,
  loading,
  fetching,
  error,
  onFetchLatest,
}) {
  const latest = history.length > 0 ? history[0] : null;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{symbol}</div>
          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            Archived daily close
          </div>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => onFetchLatest(symbol)}
          disabled={fetching}
        >
          {fetching ? 'Fetching...' : 'Fetch Latest'}
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading...</div>
      ) : error ? (
        <div style={{ color: '#b42318' }}>{error}</div>
      ) : latest ? (
        <>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Latest Close</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {latest.close.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: 4 }}>
              {new Date(latest.date).toLocaleDateString()}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                color: latest.change >= 0 ? 'green' : 'red',
                background: latest.change >= 0 ? '#e6f9ec' : '#fdecea',
                padding: '3px 8px',
                borderRadius: 12,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {latest.change >= 0 ? '▲' : '▼'} {Math.abs(latest.change).toFixed(2)} (
              {latest.changePercent >= 0 ? '+' : ''}
              {latest.changePercent.toFixed(2)}%)
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
              Recent History
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {history.slice(0, 5).map((item, index) => (
                <li
                  key={item._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderBottom: index < Math.min(history.length, 5) - 1 ? '1px solid #f0f0f0' : 'none',
                    background: '#fafafa',
                    fontSize: '0.92rem',
                  }}
                >
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                  <span style={{ fontWeight: 600 }}>
                    {item.close.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div style={{ color: '#6b7280' }}>
          No archived closes yet.
        </div>
      )}
    </div>
  );
}

function MarketClosesSection({
  marketData,
  marketLoading,
  marketFetching,
  marketErrors,
  onFetchLatest,
  onFetchAll,
}) {
  return (
    <section className="section-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Market Closes</h2>
          <p style={{ margin: '6px 0 0 0', color: '#6b7280' }}>
            Tracks and archives recent daily closes for SPY and QQQ.
          </p>
        </div>

        <button
          type="button"
          className="button button-muted"
          onClick={onFetchAll}
          disabled={marketFetching.SPY || marketFetching.QQQ}
        >
          Fetch Both
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        <MarketCloseCard
          symbol="SPY"
          history={marketData.SPY}
          loading={marketLoading.SPY}
          fetching={marketFetching.SPY}
          error={marketErrors.SPY}
          onFetchLatest={onFetchLatest}
        />

        <MarketCloseCard
          symbol="QQQ"
          history={marketData.QQQ}
          loading={marketLoading.QQQ}
          fetching={marketFetching.QQQ}
          error={marketErrors.QQQ}
          onFetchLatest={onFetchLatest}
        />
      </div>
    </section>
  );
}

export default MarketClosesSection;