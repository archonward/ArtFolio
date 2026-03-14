import { useEffect, useRef, useState } from 'react';
import { PortfolioSnapshot } from '../models/PortfolioSnapshot';
import {
  fetchSnapshots,
  createSnapshot,
  updateSnapshot,
  deleteSnapshot,
  deleteAllSnapshots,
} from '../services/snapshotService';

function useSnapshotManager() {
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
        const data = await fetchSnapshots();
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
    setWeights(
      snapshot.weights.map((w) => ({
        company: w.company,
        weight: Number(w.weight),
      }))
    );
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
      const savedSnapshot = isEditing
        ? await updateSnapshot(editingSnapshotId, snapshotData)
        : await createSnapshot(snapshotData);

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
      await deleteSnapshot(id);

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
      await deleteAllSnapshots();
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

  return {
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
    setSnapshots,
    loading,
    submitting,
    editingSnapshotId,
    resetForm,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleReset,
  };
}

export default useSnapshotManager;