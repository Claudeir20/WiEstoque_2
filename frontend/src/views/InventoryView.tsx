import { useState } from "react"
import { usePagination } from "../Pagination"
import Icon from "../components/Icon"
import {
  Badge,
  EmptyState,
  ExportButtons,
  Metric,
  PageHeader,
} from "../components/ui"

export type InventoryRow = {
  item: string
  category: string
  code: string
  stock: number
  status: string
}
export default function InventoryView({
  inventory,
  archived,
  reactivate,
  edit,
  monthWithdrawals,
  create,
  remove,
  hasHistory,
  busy,
}: {
  edit: (row: InventoryRow) => void
  inventory: InventoryRow[]
  archived: InventoryRow[]
  reactivate: (id: string) => void
  monthWithdrawals: number
  create: () => void
  remove: (row: InventoryRow) => void
  hasHistory: (id: string) => boolean
  busy: boolean
}) {
  const [filter, setFilter] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const rows = (showArchived ? archived : inventory).filter((row) =>
    `${row.item} ${row.code}`.toLowerCase().includes(filter.toLowerCase()),
  )
  const pagination = usePagination(rows, filter + showArchived)
  return (
    <div className="page">
      <PageHeader
        eyebrow="Materiais"
        title="Estoque de materiais"
        description="Acompanhe consumíveis e materiais de instalação. Roteadores são controlados em um estoque separado."
        action={
          <ExportButtons
            name="estoque"
            rows={rows.map((row) => ({
              Material: row.item,
              Quantidade: row.stock,
              Status: row.status,
            }))}
          />
        }
      />
      <button className="primary-button" onClick={create}>
        Cadastrar material
      </button>
      <div className="metric-grid">
        <Metric
          icon="box"
          label="Unidades em estoque"
          value={String(inventory.reduce((n, i) => n + i.stock, 0))}
          detail={inventory.length + " tipos de material"}
        />
        <Metric
          icon="arrows"
          label="Saídas neste mês"
          value={String(monthWithdrawals)}
          detail="Materiais utilizados"
        />
        <Metric
          icon="chart"
          label="Estoque baixo"
          value={String(
            inventory.filter((i) => i.status === "Estoque baixo").length,
          )}
          detail="Requer atenção"
          warning
        />
      </div>
      <div className="row-actions">
        <button
          className="secondary-button"
          aria-pressed={!showArchived}
          onClick={() => setShowArchived(false)}
        >
          Ativos ({inventory.length})
        </button>
        <button
          className="secondary-button"
          aria-pressed={showArchived}
          onClick={() => setShowArchived(true)}
        >
          Arquivados ({archived.length})
        </button>
      </div>
      <section className="card table-card">
        <div className="table-toolbar">
          <div>
            <h2>Materiais cadastrados</h2>
            <p>Consumíveis disponíveis no estoque geral</p>
          </div>
          <label className="search-field compact">
            <Icon name="search" size={18} />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Buscar material"
            />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoria</th>

                <th>Quantidade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((row) => (
                <tr key={row.code}>
                  <td className="table-name">{row.item}</td>
                  <td>{row.category}</td>

                  <td>{row.stock}</td>
                  <td>
                    <Badge
                      tone={
                        row.status === "Estoque baixo"
                          ? "warning"
                          : row.status === "Em campo"
                            ? "field"
                            : "success"
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td>
                    {showArchived ? (
                      <button
                        className="secondary-button"
                        disabled={busy}
                        onClick={() => reactivate(row.code)}
                      >
                        Reativar
                      </button>
                    ) : (
                      <div className="row-actions">
                        <button
                          className="secondary-button"
                          disabled={busy}
                          onClick={() => edit(row)}
                        >
                          Editar
                        </button>
                        <button
                          className="secondary-button removal-button"
                          disabled={busy || row.stock !== 0}
                          title={
                            row.stock !== 0
                              ? "O saldo deve ser zero para remover este material."
                              : undefined
                          }
                          onClick={() => remove(row)}
                        >
                          {hasHistory(row.code) ? "Arquivar" : "Excluir"}
                        </button>
                      </div>
                    )}
                    {!showArchived && row.stock !== 0 && (
                      <small className="removal-hint">Requer saldo zero</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyState query={filter} />}
        </div>
        {pagination.control}
      </section>
    </div>
  )
}
