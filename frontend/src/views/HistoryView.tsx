import { useMemo, useState } from "react"
import { usePagination } from "../Pagination"
import {
  type Movement,
  type Product,
  type Router,
  type Technician,
} from "../api"
import { Badge, ExportButtons, Metric, PageHeader } from "../components/ui"
import {
  filterHistory,
  itemKey,
  itemLabel,
  summarizeHistory,
  type HistoryFilters,
} from "../history"

export default function HistoryView({
  movements,
  technicians,
  products,
  routers,
}: {
  movements: Movement[]
  technicians: Technician[]
  products: Product[]
  routers: Router[]
}) {
  const [filters, setFilters] = useState<HistoryFilters>({
    technicianId: "",
    startDate: "",
    endDate: "",
    itemId: "",
    type: "WITHDRAWAL",
  })
  const update = (key: keyof HistoryFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }))
  const invalidRange = !!(
    filters.startDate &&
    filters.endDate &&
    filters.startDate > filters.endDate
  )
  const filtered = useMemo(
    () => filterHistory(movements, filters),
    [movements, filters],
  )
  const summary = useMemo(() => summarizeHistory(filtered), [filtered])
  const totals = summary.reduce(
    (sum, row) => ({
      withdrawals: sum.withdrawals + row.withdrawals,
      returns: sum.returns + row.returns,
      entries: sum.entries + row.entries,
    }),
    { withdrawals: 0, returns: 0, entries: 0 },
  )
  const technicianOptions = new Map(technicians.map((t) => [t.id, t.name]))
  const itemOptions = new Map<string, string>([
    ...products.map((p) => ["PRODUCT:" + p.id, p.name] as [string, string]),
  ])
  for (const movement of movements) {
    if (movement.technicianId)
      technicianOptions.set(movement.technicianId, movement.technicianName)
    for (const item of movement.items) {
      if (item.type === "PRODUCT")
        itemOptions.set(itemKey(item), itemLabel(item))
    }
  }
  const historyRows = filtered.map((m) => ({
    id: m.id,
    date: new Date(m.date).toLocaleDateString("pt-BR"),
    technician: m.technicianName,
    type: { WITHDRAWAL: "Saída", RETURN: "Devolução", ENTRY: "Entrada" }[
      m.type
    ],
    items: m.items.map((i) => ({
      name: itemLabel(i),
      quantity: i.quantity,
      category: i.type === "PRODUCT" ? "Material" : "Roteador",
    })),
    status: "Concluída",
  }))
  const summaryPage = usePagination(summary, JSON.stringify(filters))
  const historyPage = usePagination(historyRows, JSON.stringify(filters))
  return (
    <div className="page">
      <PageHeader
        eyebrow="Movimentações"
        title="Histórico"
        description="Filtre por técnico, período e item para conferir as quantidades movimentadas."
        action={
          <ExportButtons
            name="historico-filtrado"
            rows={filtered.flatMap((m) =>
              m.items.map((i) => ({
                Data: m.date.slice(0, 10).split("-").reverse().join("/"),
                Técnico: m.technicianName,
                Tipo: {
                  WITHDRAWAL: "Saída",
                  RETURN: "Devolução",
                  ENTRY: "Entrada",
                }[m.type],
                Categoria: i.type === "PRODUCT" ? "Material" : "Roteador",
                Item: itemLabel(i),
                Quantidade: i.quantity,
                Status: "Concluída",
              })),
            )}
          />
        }
      />
      <section
        className="card history-filters"
        aria-label="Filtros do histórico"
      >
        <label className="field">
          <span>Técnico</span>
          <select
            value={filters.technicianId}
            onChange={(e) => update("technicianId", e.target.value)}
          >
            <option value="">Todos os técnicos</option>
            {[...technicianOptions]
              .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
              .map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          <span>Data inicial</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Data final</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => update("endDate", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Material</span>
          <select
            value={filters.itemId}
            onChange={(e) => update("itemId", e.target.value)}
          >
            <option value="">Todos os itens</option>
            {[...itemOptions]
              .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
              .map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          <span>Tipo</span>
          <select
            value={filters.type}
            onChange={(e) => update("type", e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="WITHDRAWAL">Saída</option>
            <option value="RETURN">Devolução</option>
            <option value="ENTRY">Entrada</option>
          </select>
        </label>
        <button
          className="secondary-button"
          onClick={() =>
            setFilters({
              technicianId: "",
              startDate: "",
              endDate: "",
              itemId: "",
              type: "",
            })
          }
        >
          Limpar filtros
        </button>
        <p className="history-filter-note">
          O período inclui todo o dia inicial e final. Os resultados são
          atualizados ao alterar os filtros.
        </p>
      </section>
      <div className="active-filters" aria-label="Filtros ativos">
        <span>Filtros ativos:</span>
        {filters.technicianId && (
          <button onClick={() => update("technicianId", "")}>
            Técnico: {technicianOptions.get(filters.technicianId)} ×
          </button>
        )}
        {filters.startDate && (
          <button onClick={() => update("startDate", "")}>
            De: {filters.startDate.split("-").reverse().join("/")} ×
          </button>
        )}
        {filters.endDate && (
          <button onClick={() => update("endDate", "")}>
            Até: {filters.endDate.split("-").reverse().join("/")} ×
          </button>
        )}
        {filters.itemId && (
          <button onClick={() => update("itemId", "")}>
            Material: {itemOptions.get(filters.itemId)} ×
          </button>
        )}
        {filters.type ? (
          <button onClick={() => update("type", "")}>
            Tipo:{" "}
            {
              { WITHDRAWAL: "Saída", RETURN: "Devolução", ENTRY: "Entrada" }[
                filters.type
              ]
            }{" "}
            ×
          </button>
        ) : (
          <span>Todos os tipos</span>
        )}
        {!filters.itemId && (
          <span className="filter-note">Materiais e roteadores</span>
        )}
      </div>
      {invalidRange && (
        <div className="error-banner" role="alert">
          A data final deve ser igual ou posterior à data inicial.
        </div>
      )}
      <div className="metric-grid" aria-live="polite">
        <Metric
          icon="arrows"
          label="Unidades retiradas"
          value={String(totals.withdrawals)}
          detail="Saídas nos filtros selecionados"
        />
        <Metric
          icon="box"
          label="Unidades devolvidas"
          value={String(totals.returns)}
          detail="Devoluções nos filtros selecionados"
        />
        <Metric
          icon="chart"
          label="Retirado líquido"
          value={String(totals.withdrawals - totals.returns)}
          detail="Saídas menos devoluções filtradas"
        />
      </div>
      <section className="card table-card">
        <div className="table-toolbar">
          <div>
            <h2>Resumo por técnico e item</h2>
            <p>
              As quantidades consideram apenas os filtros selecionados. Para
              comparar saídas e devoluções, selecione Todos os tipos.
            </p>
          </div>
          <ExportButtons
            name="resumo-historico"
            label="Exportar resumo"
            rows={summary.map((r) => ({
              Técnico: r.technician,
              Item: r.item,
              Retiradas: r.withdrawals,
              Devoluções: r.returns,
              Entradas: r.entries,
              "Retirado líquido": r.net,
            }))}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Técnico</th>
                <th>Item</th>
                <th>Retiradas</th>
                <th>Devoluções</th>
                <th>Entradas</th>
                <th>Retirado líquido</th>
              </tr>
            </thead>
            <tbody>
              {summaryPage.rows.map((row) => (
                <tr key={row.key}>
                  <td className="table-name">{row.technician}</td>
                  <td>{row.item}</td>
                  <td>{row.withdrawals}</td>
                  <td>{row.returns}</td>
                  <td>{row.entries}</td>
                  <td>{row.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!summary.length && (
            <p className="history-empty" role="status">
              Nenhuma movimentação encontrada para os filtros selecionados.
            </p>
          )}
        </div>
        {summaryPage.control}
      </section>
      <section className="card table-card">
        <div className="table-toolbar">
          <div>
            <h2>Movimentações do resultado</h2>
            <p>Registros que compõem o resumo acima</p>
          </div>
          <Badge tone="neutral">{historyRows.length} registros</Badge>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Técnico</th>
                <th>Tipo</th>
                <th>Itens</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyPage.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td className="table-name">{row.technician}</td>
                  <td>
                    <Badge tone={row.type === "Saída" ? "field" : "success"}>
                      {row.type}
                    </Badge>
                  </td>
                  <td>
                    <ul className="history-items">
                      {row.items.map((item, index) => (
                        <li key={index}>
                          <span>
                            <strong>{item.name}</strong>
                            <small>{item.category}</small>
                          </span>
                          <span className="history-quantity">
                            {item.quantity} un.
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <Badge tone="success">{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {historyPage.control}
      </section>
    </div>
  )
}
