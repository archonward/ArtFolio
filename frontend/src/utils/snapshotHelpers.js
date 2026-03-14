export function getTotalParsedWeight(weights) {
  return weights.reduce((sum, item) => sum + Number(item.weight || 0), 0);
}

export function getDuplicateCompanies(weights) {
  const counts = new Map();

  weights.forEach((item) => {
    const key = item.company.trim().toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return weights
    .map((item) => item.company.trim())
    .filter((name, index, arr) => {
      const key = name.toLowerCase();
      return counts.get(key) > 1 && arr.findIndex((n) => n.toLowerCase() === key) === index;
    });
}

export function buildTotalValueData(snapshots) {
  return snapshots.map((snapshot) => ({
    date: snapshot.date,
    value: snapshot.totalValue,
  }));
}

export function buildWeightSeries(snapshots) {
  const weightSeries = {};

  snapshots.forEach((snapshot) => {
    snapshot.weights.forEach((weightItem) => {
      if (!weightSeries[weightItem.company]) {
        weightSeries[weightItem.company] = [];
      }

      weightSeries[weightItem.company].push({
        date: snapshot.date,
        weight: weightItem.weight,
      });
    });
  });

  return weightSeries;
}