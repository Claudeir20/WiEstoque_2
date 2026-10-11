import { useState } from "react"
import { usePagination } from "../Pagination"
import Icon from "../components/Icon"
import { Badge, Metric, PageHeader } from "../components/ui"

export type RouterRow = {
  id: string
  model: string
  asset: string
  serial: string
  mac: string
  status: string
}
export default function RoutersView({
  routers,
  create,
  remove,
  hasHistory,
  busy,
}: {
  routers: RouterRow[]
  create: () => void
  remove: (row: RouterRow) => void
  hasHistory: (id: string) => boolean
  busy: boolean
}) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [model, setModel] = useState("")
  const fold = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  const rows = routers.filter(
    (r) =>
      (!status || r.status === status) &&
      (!model || r.model === model) &&
      (fold(`${r.model} ${r.asset} ${r.serial} ${r.mac}`).includes(
        fold(search.trim()),
      ) ||
        (!!search.trim() &&
          r.mac
            .replace(/[:.-]/g, "")
            .toLowerCase()
            .includes(search.replace(/[:.-]/g, "").trim().toLowerCase()))),
  )
  const pagination = usePagination(rows, search + status + model)
  const available = routers.filter(
    (router) => router.status === "Estoque",
  ).length
  const outOfStock = routers.filter(
    (router) => router.status === "Fora de estoque",
  ).length

  return (
    <div className="page">
      <PageHeader
        eyebrow="Estoque separado"
        title="Estoque de roteadores"
        description="Controle exclusivo de patrimônio, número de série e disponibilidade dos roteadores."
        action={
          <button className="primary-button" onClick={create}>
            <Icon name="plus" size={18} /> Cadastrar roteador
          </button>
        }
      />
      <div className="metric-grid">
        <Metric
          icon="router"
          label="No estoque"
          value={String(available)}
          detail="Roteadores disponíveis"
        />
        <Metric
          icon="users"
          label="Fora do estoque"
          value={String(outOfStock)}
          detail="Em uso ou atendimento"
        />
        <Metric
          icon="chart"
          label="Total cadastrado"
          value={String(routers.length)}
          detail="Patrimônios rastreados"
        />
      </div>
      <section className="card history-filters">
        <label className="field">
          <span>Buscar roteador</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Modelo, patrimônio, série ou MAC"
          />
        </label>
        <label className="field">
          <span>Situação</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            <option>Estoque</option>
            <option>Fora de estoque</option>
          </select>
        </label>
        <label className="field">
          <span>Modelo</span>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="">Todos os modelos</option>
            {[...new Set(routers.map((r) => r.model))].sort().map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <button
          className="secondary-button"
          onClick={() => {
            setSearch("")
            setStatus("")
            setModel("")
          }}
        >
          Limpar filtros
        </button>
      </section>
      <section className="card table-card">
        <div className="table-toolbar">
          <div>
            <h2>Roteadores cadastrados</h2>
            <p>Equipamentos deste estoque exclusivo</p>
          </div>
          <Badge tone="neutral">
            {rows.length} de {routers.length} roteadores
          </Badge>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Patrimônio</th>
                <th>Número de série</th>
                <th>MAC</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((router) => (
                <tr key={router.asset}>
                  <td className="table-name">{router.model}</td>
                  <td>{router.asset}</td>
                  <td>{router.serial}</td>
                  <td>{router.mac}</td>
                  <td>
                    <Badge
                      tone={router.status === "Estoque" ? "success" : "field"}
                    >
                      {router.status}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="secondary-button removal-button"
                      disabled={busy || router.status !== "Estoque"}
                      title={
                        router.status !== "Estoque"
                          ? "Registre a devolução antes de remover este roteador."
                          : undefined
                      }
                      onClick={() => remove(router)}
                    >
                      {hasHistory(router.id) ? "Arquivar" : "Excluir"}
                    </button>
                    {router.status !== "Estoque" && (
                      <small className="removal-hint">Requer devolução</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="history-empty">
              Nenhum roteador encontrado para os filtros.
            </p>
          )}
        </div>
        {pagination.control}
      </section>
    </div>
  )
}
