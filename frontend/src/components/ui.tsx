import { useEffect, useRef, useState, type ReactNode } from "react"
import Icon from "./Icon"
import { downloadFile, makeCsv, makeExcel, type ExportRow } from "../exportData"

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "success" | "warning" | "field"
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="search" size={24} />
      </span>
      <p className="font-semibold text-ink">Nenhum item encontrado</p>
      <p className="mt-1 text-sm text-muted">
        Revise o código “{query}” ou tente buscar pelo nome.
      </p>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function Metric({
  icon,
  label,
  value,
  detail,
  warning = false,
}: {
  icon: string
  label: string
  value: string
  detail: string
  warning?: boolean
}) {
  return (
    <div className="metric-card">
      <span className={`metric-icon ${warning ? "metric-warning" : ""}`}>
        <Icon name={icon} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span className={warning ? "warning-text" : ""}>{detail}</span>
      </div>
    </div>
  )
}

export function ExportButtons({ name, rows, label = "Exportar" }: { name: string; rows: ExportRow[]; label?: string }) {
  const [format, setFormat] = useState("xlsx")
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [error, setError] = useState("")
  async function download() {
    if (pending.current || !rows.length) return
    pending.current = true; setBusy(true); setError("")
    try {
      if (format === "xlsx") {
        const data = await makeExcel(rows)
        downloadFile(name + ".xlsx", data as BlobPart, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      } else downloadFile(name + ".csv", makeCsv(rows), "text/csv;charset=utf-8")
    } catch { setError("Não foi possível exportar. Tente novamente.") }
    finally { pending.current = false; setBusy(false) }
  }
  return <div className="export-control">
    <div><select aria-label={"Formato de " + label.toLowerCase()} value={format} disabled={busy} onChange={e => setFormat(e.target.value)}><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV</option></select>
    <button className="secondary-button" disabled={busy || !rows.length} onClick={() => void download()}><Icon name="download" size={18} />{busy ? "Gerando…" : label}</button></div>
    {error && <small role="alert" className="removal-error">{error}</small>}
  </div>
}

export function QuantityInput({ value, max, disabled, change }: { value: number; max: number; disabled: boolean; change: (n: number) => void }) {
  const [text, setText] = useState(String(value))
  const [error, setError] = useState("")
  useEffect(() => { setText(String(value)); setError("") }, [value])
  function commit() {
    const n = Number(text)
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(n) || n < 1 || n > max) { setText(String(value)); setError(`Informe uma quantidade inteira entre 1 e ${max}.`); return }
    setError(""); change(n)
  }
  return <label className="quantity-input"><input aria-label="Quantidade do material" type="number" min={1} max={max} step={1} disabled={disabled} value={text} onChange={e => {setText(e.target.value);setError("")}} onBlur={commit} onKeyDown={e => { if(e.key === "Enter") {e.preventDefault(); e.currentTarget.blur()} }} />{error && <small role="alert">{error}</small>}</label>
}
