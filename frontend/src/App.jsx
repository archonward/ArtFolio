import './App.css';
import { useMemo } from 'react';
import LineGraph from './components/LineGraph';
import SummaryCards from './components/SummaryCards';
import SnapshotList from './components/SnapshotList';
import SnapshotForm from './components/SnapshotForm';
import { ExcelParser } from './utils/ExcelParser';
import {
  getTotalParsedWeight,
  getDuplicateCompanies,
  buildTotalValueData,
  buildWeightSeries,
} from './utils/snapshotHelpers';
import useSnapshotManager from './hooks/useSnapshotManager';

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
    </div>
  );
}

export default App;