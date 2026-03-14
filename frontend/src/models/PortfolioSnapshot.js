export class PortfolioSnapshot {
  constructor({ date, totalValue, weights }) {
    this.date = new Date(date);
    this.totalValue = Number(totalValue);
    this.weights = Array.isArray(weights)
      ? weights.map((w) => ({
          company: String(w.company ?? '').trim(),
          weight: Number(w.weight),
        }))
      : [];
  }

  getValidationErrors() {
    const errors = [];

    if (isNaN(this.date.getTime())) {
      errors.push('Please provide a valid snapshot date.');
    }

    if (isNaN(this.totalValue) || this.totalValue <= 0) {
      errors.push('Total portfolio value must be a positive number.');
    }

    if (!Array.isArray(this.weights) || this.weights.length === 0) {
      errors.push('At least one holding must be present.');
      return errors;
    }

    const seenCompanies = new Set();
    let weightTotal = 0;

    this.weights.forEach((w, index) => {
      if (!w.company) {
        errors.push(`Row ${index + 1}: company name is missing.`);
      }

      if (seenCompanies.has(w.company.toLowerCase())) {
        errors.push(`Duplicate company detected: ${w.company}`);
      } else {
        seenCompanies.add(w.company.toLowerCase());
      }

      if (isNaN(w.weight) || w.weight < 0) {
        errors.push(`Invalid weight for ${w.company || `row ${index + 1}`}.`);
      } else {
        weightTotal += w.weight;
      }
    });

    if (weightTotal <= 0) {
      errors.push('The total weight must be greater than 0%.');
    }

    if (weightTotal > 100.5) {
      errors.push(`The total weight is too high (${weightTotal.toFixed(2)}%).`);
    }

    return errors;
  }

  isValid() {
    return this.getValidationErrors().length === 0;
  }
}