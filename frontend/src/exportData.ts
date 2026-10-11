export type ExportRow = Record<string, string | number | boolean | null>

export function makeCsv(rows: ExportRow[]): string {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const cell = (value: unknown) => {
    let text = String(value ?? "")
    // Texto vindo de cadastros não deve virar fórmula ao abrir no Excel.
    if (typeof value === "string" && /^[\s]*[=+@-]/.test(text)) text = "'" + text
    return '"' + text.replace(/"/g, '""') + '"'
  }
  return "\uFEFF" + [headers.map(cell).join(";"), ...rows.map(row => headers.map(key => cell(row[key])).join(";"))].join("\r\n")
}
export async function makeExcel(rows: ExportRow[]): Promise<Uint8Array> {
  if (!rows.length) throw new Error("Não há dados para exportar.")
  const { default: ExcelJS } = await import("exceljs")
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "WiEstoque"
  const sheet = workbook.addWorksheet("Relatório", { views: [{state: "frozen", ySplit: 1}] })
  const headers = Object.keys(rows[0])
  sheet.columns = headers.map(header => ({ header, key: header,
    width: Math.min(60, rows.reduce((width, row) => Math.max(width, Math.min(60, String(row[header] ?? "").length + 2)), Math.max(16, header.length + 3))) }))
  for (const row of rows) sheet.addRow(headers.map(key => row[key] ?? ""))
  sheet.getRow(1).font = { bold: true, color: {argb: "FFFFFFFF"} }
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: {argb: "FF005E57"} }
  sheet.getRow(1).height = 26
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: {row: rows.length + 1, column: headers.length} }
  sheet.eachRow((row, index) => {
    row.alignment = { vertical: "middle", wrapText: true }
    if (index > 1 && index % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: {argb: "FFF0F8F7"} }
  })
  return new Uint8Array(await workbook.xlsx.writeBuffer())
}
export function downloadFile(filename: string, data: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const link = document.createElement("a")
  link.href = url; link.download = filename
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
