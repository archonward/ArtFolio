export async function fetchMarketCloseHistory(symbol) {
  const res = await fetch(`/api/market-closes?symbol=${encodeURIComponent(symbol)}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load ${symbol} history.`);
  }

  return res.json();
}

export async function fetchLatestMarketClose(symbol) {
  const res = await fetch('/api/market-closes/fetch-latest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch latest ${symbol} close.`);
  }

  return data;
}

export async function fetchAllLatestMarketCloses() {
  const res = await fetch('/api/market-closes/fetch-all', {
    method: 'POST',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch all market closes.');
  }

  return data;
}