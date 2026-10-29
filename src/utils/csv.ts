export function escapeCsv(value: string | number | undefined) {
  if (value === undefined || value === null) return "";
  let stringValue = String(value);
  // Cegah CSV/formula injection: teks yang diawali = + - @ dibaca spreadsheet sebagai rumus
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
