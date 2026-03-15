import './App.css';
import { useEffect, useMemo, useState } from 'react';
import LineGraph from './components/LineGraph';
import SummaryCards from './components/SummaryCards';
import SnapshotList from './components/SnapshotList';
import SnapshotForm from './components/SnapshotForm';
import MarketClosesSection from './components/MarketClosesSection';
import SidebarNav from './components/SidebarNav';
import { ExcelParser } from './utils/ExcelParser';
import {
  getTotalParsedWeight,
  getDuplicateCompanies,
  buildTotalValueData,
  buildWeightSeries,
} from './utils/snapshotHelpers';
import useSnapshotManager from './hooks/useSnapshotManager';
import {
  fetchMarketCloseHistory,
  fetchLatestMarketClose,
  fetchAllLatestMarketCloses,
} from './services/marketCloseService';

function App() {
  const {
    fileInputRef,
    date,
    setDate,
    totalValue,
    setTotalValue,
    file,
    setFile,
    weights,
    setWeights,
    parsingError,
    setParsingError,
    submitError,
    setSubmitError,
    submitSuccess,
    setSubmitSuccess,
    snapshots,
    loading,
    submitting,
    editingSnapshotId,
    resetForm,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleReset,
  } = useSnapshotManager();

  const [currentPage, setCurrentPage] = useState('home');

  const [marketData, setMarketData] = useState({
    SPY: [],
    QQQ: [],
  });

  const [marketLoading, setMarketLoading] = useState({
    SPY: true,
    QQQ: true,
  });

  const [marketFetching, setMarketFetching] = useState({
    SPY: false,
    QQQ: false,
  });

  const [marketErrors, setMarketErrors] = useState({
    SPY: '',
    QQQ: '',
  });

  useEffect(() => {
    const loadSymbolHistory = async (symbol) => {
      try {
        setMarketLoading((prev) => ({ ...prev, [symbol]: true }));
        setMarketErrors((prev) => ({ ...prev, [symbol]: '' }));

        const history = await fetchMarketCloseHistory(symbol);

        setMarketData((prev) => ({
          ...prev,
          [symbol]: history,
        }));
      } catch (err) {
        console.error(`Load ${symbol} history failed:`, err);
        setMarketErrors((prev) => ({
          ...prev,
          [symbol]: err.message || `Failed to load ${symbol} history.`,
        }));
      } finally {
        setMarketLoading((prev) => ({ ...prev, [symbol]: false }));
      }
    };

    loadSymbolHistory('SPY');
    loadSymbolHistory('QQQ');
  }, []);

  const totalParsedWeight = useMemo(() => {
    return getTotalParsedWeight(weights);
  }, [weights]);

  const duplicateCompanies = useMemo(() => {
    return getDuplicateCompanies(weights);
  }, [weights]);

  const totalValueData = useMemo(() => {
    return buildTotalValueData(snapshots);
  }, [snapshots]);

  const weightSeries = useMemo(() => {
    return buildWeightSeries(snapshots);
  }, [snapshots]);

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

  const handleFetchLatestMarket = async (symbol) => {
    try {
      setMarketFetching((prev) => ({ ...prev, [symbol]: true }));
      setMarketErrors((prev) => ({ ...prev, [symbol]: '' }));

      const result = await fetchLatestMarketClose(symbol);
      const record = result.record;

      setMarketData((prev) => {
        const existing = prev[symbol];
        const exists = existing.some(
          (item) =>
            new Date(item.date).toISOString().split('T')[0] ===
            new Date(record.date).toISOString().split('T')[0]
        );

        const updated = exists
          ? existing.map((item) => (item._id === record._id ? record : item))
          : [record, ...existing];

        return {
          ...prev,
          [symbol]: updated.sort((a, b) => new Date(b.date) - new Date(a.date)),
        };
      });
    } catch (err) {
      console.error(`Fetch latest ${symbol} failed:`, err);
      setMarketErrors((prev) => ({
        ...prev,
        [symbol]: err.message || `Failed to fetch latest ${symbol} close.`,
      }));
    } finally {
      setMarketFetching((prev) => ({ ...prev, [symbol]: false }));
    }
  };

  const handleFetchAllMarkets = async () => {
    try {
      setMarketFetching({ SPY: true, QQQ: true });
      setMarketErrors({ SPY: '', QQQ: '' });

      const data = await fetchAllLatestMarketCloses();

      const successful = Array.isArray(data.results)
        ? data.results.filter((item) => item.success && item.record)
        : [];
      const failures = Array.isArray(data.results)
        ? data.results.filter((item) => !item.success)
        : [];

      setMarketData((prev) => {
        const next = { ...prev };

        successful.forEach((item) => {
          const symbol = item.symbol;
          const record = item.record;
          const existing = next[symbol] || [];

          const exists = existing.some(
            (historyItem) =>
              new Date(historyItem.date).toISOString().split('T')[0] ===
              new Date(record.date).toISOString().split('T')[0]
          );

          next[symbol] = exists
            ? existing.map((historyItem) => (historyItem._id === record._id ? record : historyItem))
            : [record, ...existing];

          next[symbol] = next[symbol].sort((a, b) => new Date(b.date) - new Date(a.date));
        });

        return next;
      });

      if (failures.length > 0) {
        const nextErrors = { SPY: '', QQQ: '' };
        failures.forEach((item) => {
          nextErrors[item.symbol] = item.message || `Failed to fetch ${item.symbol}.`;
        });
        setMarketErrors(nextErrors);
      }
    } catch (err) {
      console.error('Fetch all markets failed:', err);
      setMarketErrors({
        SPY: err.message || 'Failed to fetch SPY.',
        QQQ: err.message || 'Failed to fetch QQQ.',
      });
    } finally {
      setMarketFetching({ SPY: false, QQQ: false });
    }
  };

  if (loading) {
    return <div className="App loading-state">Loading...</div>;
  }

  return (
    <div className="app-shell">
      <SidebarNav currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="app-main">
        <div className="App">
          <h1 className="app-title">📈 ArtFolio Tracker</h1>

          {currentPage === 'home' && (
            <>
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

              <SnapshotForm
                editingSnapshotId={editingSnapshotId}
                date={date}
                setDate={setDate}
                totalValue={totalValue}
                setTotalValue={setTotalValue}
                fileInputRef={fileInputRef}
                file={file}
                weights={weights}
                parsingError={parsingError}
                totalParsedWeight={totalParsedWeight}
                duplicateCompanies={duplicateCompanies}
                submitting={submitting}
                handleFileChange={handleFileChange}
                handleSubmit={handleSubmit}
                resetForm={resetForm}
                setSubmitError={setSubmitError}
                setSubmitSuccess={setSubmitSuccess}
              />

              <SummaryCards snapshots={snapshots} />

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

                  <SnapshotList
                    snapshots={snapshots}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </>
              )}
            </>
          )}

          {currentPage === 'markets' && (
            <MarketClosesSection
              marketData={marketData}
              marketLoading={marketLoading}
              marketFetching={marketFetching}
              marketErrors={marketErrors}
              onFetchLatest={handleFetchLatestMarket}
              onFetchAll={handleFetchAllMarkets}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;