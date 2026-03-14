function SnapshotForm({
  editingSnapshotId,
  date,
  setDate,
  totalValue,
  setTotalValue,
  fileInputRef,
  file,
  weights,
  parsingError,
  totalParsedWeight,
  duplicateCompanies,
  submitting,
  handleFileChange,
  handleSubmit,
  resetForm,
  setSubmitError,
  setSubmitSuccess,
}) {
  return (
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
  );
}

export default SnapshotForm;