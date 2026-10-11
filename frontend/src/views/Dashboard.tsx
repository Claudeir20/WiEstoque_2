import { type Movement, type Product, type Router } from "../api"
import { Metric, PageHeader } from "../components/ui"
import { itemLabel } from "../history"
import { type View } from "../types"

export default function Dashboard({
  products,
  routers,
  movements,
  navigate,
}: {
  products: Product[]
  routers: Router[]
  movements: Movement[]
  navigate: (view: View) => void
}) {
  const low = products.filter((p) => p.quantity <= p.minimumQuantity)
  const recent = [...movements]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
  return (
    <div className="page">
      <PageHeader
        eyebrow="WiNET"
        title="Visão geral do estoque"
        description="Confira o estoque e as últimas movimentações."
        action={
          <button
            className="primary-button"
            onClick={() => navigate("movimentacao")}
          >
            Nova movimentação
          </button>
        }
      />
      <div className="metric-grid">
        <Metric
          icon="box"
          label="Materiais em estoque"
          value={String(products.reduce((n, p) => n + p.quantity, 0))}
          detail={`${products.length} tipos de material`}
        />
        <Metric
          icon="router"
          label="Roteadores disponíveis"
          value={String(routers.filter((r) => r.status === "IN_STOCK").length)}
          detail={`${routers.length} roteadores cadastrados`}
        />
        <Metric
          icon="chart"
          label="Materiais com estoque baixo"
          value={String(low.length)}
          detail="Confira os itens para reposição"
          warning
        />
      </div>
      <section className="card table-card">
        <div className="table-toolbar">
          <h2>Materiais para reposição</h2>
          <button
            className="secondary-button"
            onClick={() => navigate("estoque")}
          >
            Ver materiais
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Saldo</th>
                <th>Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {low.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.quantity}</td>
                  <td>{p.minimumQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!low.length && (
            <p className="history-empty">Nenhum material com estoque baixo.</p>
          )}
        </div>
      </section>
      <section className="card table-card">
        <div className="table-toolbar">
          <h2>Últimas movimentações</h2>
          <button
            className="secondary-button"
            onClick={() => navigate("historico")}
          >
            Ver histórico
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Técnico</th>
                <th>Tipo</th>
                <th>Itens</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.date).toLocaleDateString("pt-BR")}</td>
                  <td>{m.technicianName}</td>
                  <td>
                    {
                      {
                        WITHDRAWAL: "Saída",
                        RETURN: "Devolução",
                        ENTRY: "Entrada",
                      }[m.type]
                    }
                  </td>
                  <td>
                    {m.items
                      .map((i) => `${itemLabel(i)} (${i.quantity})`)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recent.length && (
            <p className="history-empty">Nenhuma movimentação registrada.</p>
          )}
        </div>
      </section>
    </div>
  )
}
