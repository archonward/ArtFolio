export async function fetchSnapshots() {
  const res = await fetch('/api/snapshots');

  if (!res.ok) {
    throw new Error('Failed to load snapshots.');
  }

  return res.json();
}

export async function createSnapshot(snapshotData) {
  const res = await fetch('/api/snapshots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshotData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Submission failed.');
  }

  return res.json();
}

export async function updateSnapshot(snapshotId, snapshotData) {
  const res = await fetch(`/api/snapshots/${snapshotId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshotData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Update failed.');
  }

  return res.json();
}

export async function deleteSnapshot(snapshotId) {
  const res = await fetch(`/api/snapshots/${snapshotId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Delete failed.');
  }
}

export async function deleteAllSnapshots() {
  const res = await fetch('/api/snapshots', {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Reset failed.');
  }
}