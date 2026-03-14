import ExcelJS from 'exceljs';

export class ExcelParser {
  static async parse(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error('No worksheet found');

    const weights = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const companyCell = row.getCell(1).value;
      const weightCell = row.getCell(2).value;

      if (!companyCell || typeof companyCell !== 'string') return;
      const company = companyCell.trim();
      if (!company || /total|sum/i.test(company)) return;

      const weight = parseFloat(weightCell);
      if (isNaN(weight) || weight < 0) return;

      const normalizedWeight = weight > 0 && weight < 1
        ? +(weight * 100).toFixed(4)
        : +weight.toFixed(4);

      weights.push({ company, weight: normalizedWeight });
    });

    if (weights.length === 0) {
      throw new Error('No valid company/weight data found.');
    }

    return weights.sort((a, b) => b.weight - a.weight);
  }
}