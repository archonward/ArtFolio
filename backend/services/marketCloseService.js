const MarketClose = require('../models/MarketClose');

const SUPPORTED_SYMBOLS = {
  SPY: 'SPY',
  QQQ: 'QQQ',
};

function normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

function getYahooChartUrl(symbol) {
  const normalized = normalizeSymbol(symbol);

  if (!SUPPORTED_SYMBOLS[normalized]) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }

  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?interval=1d&range=10d`;
}

function toUtcDateOnly(unixSeconds) {
  const date = new Date(unixSeconds * 1000);
  const utcDateOnly = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  return utcDateOnly;
}

async function fetchLatestCloseFromYahoo(symbol) {
  const normalized = normalizeSymbol(symbol);
  const url = getYahooChartUrl(normalized);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json,text/plain,*/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${normalized} close data from Yahoo Finance.`);
  }

  const data = await response.json();

  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];

  if (!result || timestamps.length === 0 || closes.length === 0) {
    throw new Error(`No chart data returned for ${normalized}.`);
  }

  const validPoints = timestamps
    .map((ts, index) => ({
      timestamp: ts,
      close: closes[index],
    }))
    .filter((point) => typeof point.close === 'number' && !Number.isNaN(point.close));

  if (validPoints.length === 0) {
    throw new Error(`No valid closing prices returned for ${normalized}.`);
  }

  const latestPoint = validPoints[validPoints.length - 1];
  const previousPoint =
    validPoints.length >= 2 ? validPoints[validPoints.length - 2] : null;

  const latestClose = Number(latestPoint.close.toFixed(2));
  const previousClose =
    previousPoint && typeof previousPoint.close === 'number'
      ? Number(previousPoint.close.toFixed(2))
      : null;

  const change =
    previousClose != null
      ? Number((latestClose - previousClose).toFixed(2))
      : 0;

  const changePercent =
    previousClose != null && previousClose !== 0
      ? Number((((latestClose - previousClose) / previousClose) * 100).toFixed(2))
      : 0;

  return {
    symbol: normalized,
    date: toUtcDateOnly(latestPoint.timestamp),
    close: latestClose,
    change,
    changePercent,
    source: 'yahoo-finance',
  };
}

async function archiveLatestClose(symbol) {
  const latest = await fetchLatestCloseFromYahoo(symbol);

  const existing = await MarketClose.findOne({
    symbol: latest.symbol,
    date: latest.date,
  });

  if (existing) {
    return {
      saved: false,
      record: existing,
      message: `${latest.symbol} close for this date is already archived.`,
    };
  }

  const created = await MarketClose.create(latest);

  return {
    saved: true,
    record: created,
    message: `${latest.symbol} close archived successfully.`,
  };
}

async function archiveLatestForAllSupportedSymbols() {
  const symbols = Object.keys(SUPPORTED_SYMBOLS);
  const results = [];

  for (const symbol of symbols) {
    try {
      const result = await archiveLatestClose(symbol);
      results.push({
        symbol,
        success: true,
        ...result,
      });
    } catch (err) {
      results.push({
        symbol,
        success: false,
        message: err.message,
      });
    }
  }

  return results;
}

async function getArchivedHistory(symbol, limit = 30) {
  const normalized = normalizeSymbol(symbol);

  if (!SUPPORTED_SYMBOLS[normalized]) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }

  return MarketClose.find({ symbol: normalized })
    .sort({ date: -1 })
    .limit(limit);
}

module.exports = {
  archiveLatestClose,
  archiveLatestForAllSupportedSymbols,
  getArchivedHistory,
};