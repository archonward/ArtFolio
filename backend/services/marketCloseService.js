const MarketClose = require('../models/MarketClose');

const SYMBOL_TO_STOOQ = {
  SPY: 'spy.us',
  QQQ: 'qqq.us',
};

function normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

function getStooqCsvUrl(symbol) {
  const normalized = normalizeSymbol(symbol);
  const stooqSymbol = SYMBOL_TO_STOOQ[normalized];

  if (!stooqSymbol) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }

  return `https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`;
}

function parseCsvLine(line) {
  return line.split(',').map((part) => part.trim());
}

function toUtcDateOnly(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid market date received: ${dateString}`);
  }
  return date;
}

async function fetchLatestCloseFromStooq(symbol) {
  const normalized = normalizeSymbol(symbol);
  const url = getStooqCsvUrl(normalized);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'text/csv,text/plain;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${normalized} close data from Stooq.`);
  }

  const csvText = await response.text();
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(`No historical rows returned for ${normalized}.`);
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const expectedHeader = ['date', 'open', 'high', 'low', 'close', 'volume'];

  const headerLooksValid = expectedHeader.every((field, index) => header[index] === field);
  if (!headerLooksValid) {
    throw new Error(`Unexpected CSV format returned for ${normalized}.`);
  }

  const latestRow = parseCsvLine(lines[lines.length - 1]);
  const previousRow = lines.length >= 3 ? parseCsvLine(lines[lines.length - 2]) : null;

  const latestDateString = latestRow[0];
  const latestClose = Number(latestRow[4]);
  const previousClose = previousRow ? Number(previousRow[4]) : null;

  if (!latestDateString || Number.isNaN(latestClose)) {
    throw new Error(`Incomplete latest close data for ${normalized}.`);
  }

  const change =
    previousClose != null && !Number.isNaN(previousClose)
      ? Number((latestClose - previousClose).toFixed(2))
      : 0;

  const changePercent =
    previousClose != null && !Number.isNaN(previousClose) && previousClose !== 0
      ? Number((((latestClose - previousClose) / previousClose) * 100).toFixed(2))
      : 0;

  return {
    symbol: normalized,
    date: toUtcDateOnly(latestDateString),
    close: Number(latestClose.toFixed(2)),
    change,
    changePercent,
    source: 'stooq',
  };
}

async function archiveLatestClose(symbol) {
  const latest = await fetchLatestCloseFromStooq(symbol);

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
  const symbols = Object.keys(SYMBOL_TO_STOOQ);
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

  if (!SYMBOL_TO_STOOQ[normalized]) {
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