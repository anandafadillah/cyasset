import ExcelJS from "exceljs";

export async function renderLaporanExcel(
  judulSheet: string,
  kolom: string[],
  baris: (string | number)[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(judulSheet.slice(0, 31));

  sheet.addRow(kolom);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = kolom.map(() => ({ width: 24 }));

  for (const row of baris) {
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
