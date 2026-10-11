import { useEffect, useRef, useState } from "react"
import UserRegistration from "./views/UserRegistration"
import { api, type Movement, type Product, type Router, type Technician } from "./api"
import Icon from "./components/Icon"
import EditProductDialog from "./dialogs/EditProductDialog"
import EditTechnicianDialog from "./dialogs/EditTechnicianDialog"
import Registration from "./dialogs/Registration"
import RemovalDialog, { type RemovalTarget } from "./dialogs/RemovalDialog"
import { pendingReturns } from "./pendingReturns"
import type { View } from "./types"
import { useMovementForm } from "./useMovementForm"
import Dashboard from "./views/Dashboard"
import HistoryView from "./views/HistoryView"
import InventoryView from "./views/InventoryView"
import MovementView from "./views/MovementView"
import RoutersView from "./views/RoutersView"
import TechniciansView from "./views/TechniciansView"

const navItems: {
  id: View
  label: string
  icon: string
}[] = [
  { id: "painel", label: "Painel", icon: "chart" },
  { id: "movimentacao", label: "Nova movimentação", icon: "arrows" },
  { id: "estoque", label: "Estoque de materiais", icon: "box" },
  { id: "historico", label: "Histórico", icon: "clock" },
  { id: "tecnicos", label: "Técnicos", icon: "users" },
  { id: "roteadores", label: "Roteadores", icon: "router" },
  { id: "usuarios", label: "Usuários", icon: "users" },
]


export default function App({ email, onLogout }: { email: string; onLogout: () => Promise<void> }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const logoutPending = useRef(false)
  const [logoutError, setLogoutError] = useState("")
  async function handleLogout() {
    if (logoutPending.current || savingRef.current) return
    logoutPending.current = true; setLoggingOut(true); setLogoutError("")
    try { await onLogout() }
    catch (e) { setLogoutError(e instanceof Error ? e.message : "Não foi possível sair. Tente novamente.") }
    finally { logoutPending.current = false; setLoggingOut(false) }
  }
  const [view, setView] = useState<View>("painel")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [routerData, setRouterData] = useState<Router[]>([])
  const [technicianData, setTechnicianData] = useState<Technician[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const movement = useMovementForm({ products, routerData, savingRef, setSaving, setError, refresh })
  const [registration, setRegistration] =
    useState<"products" | "technicians" | "routers" | null>(null)
  async function refresh() {
    const [p, r, t, m] = await Promise.all([
      api<Product[]>("/products?includeArchived=true"),
      api<Router[]>("/routers"),
      api<Technician[]>("/technicians"),
      api<Movement[]>("/movements"),
    ])
    setProducts(p)
    setRouterData(r)
    setTechnicianData(t)
    setMovements(m)
  }
  async function load() {
    setLoading(true)
    setError("")
    try {
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [removal, setRemoval] = useState<RemovalTarget | null>(null)
  const [removalMessage, setRemovalMessage] = useState("")
  function hasHistory(kind: "products" | "routers", id: string) {
    return (kind === "products" && !!products.find(p => p.id === id)?.hasAdjustments) || movements.some(m => m.items.some(i =>
      kind === "products" ? i.productId === id : i.routerId === id,
    ))
  }
  const inventory = products.filter(p => p.active).map((p) => ({
    item: p.name,
    category: "Produto",
    code: p.id,
    stock: p.quantity,
    status: p.quantity <= p.minimumQuantity ? "Estoque baixo" : "Disponível",
  }))
  const routers = routerData.map((r) => ({
    id: r.id,
    model: r.model,
    asset: r.assetNumber,
    serial: r.serialNumber,
    mac: r.mac,
    status: r.status === "IN_STOCK" ? "Estoque" : "Fora de estoque",
  }))
  const technicians = technicianData.map((t) => ({
    id: t.id,
    name: t.name,
    initials: t.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join(""),
    route: t.sector,
    status: t.active ? "Ativo" : "Inativo",
  }))
  const monthWithdrawals = movements
    .filter(
      (m) =>
        m.type === "WITHDRAWAL" &&
        new Date(m.date).getMonth() === new Date().getMonth() &&
        new Date(m.date).getFullYear() === new Date().getFullYear(),
    )
    .reduce(
      (sum, m) =>
        sum +
        m.items
          .filter((i) => i.type === "PRODUCT")
          .reduce((n, i) => n + i.quantity, 0),
      0,
    )

  function navigate(next: View) {
    if (savingRef.current) return
    setView(next)
    setMobileNavOpen(false)
  }

  async function reactivate(kind: "products" | "technicians", id: string) {
    if (savingRef.current) return
    savingRef.current = true; setSaving(true); setError("")
    try { await api(`/${kind}/${id}/reactivate`, {}, "POST"); await refresh(); setRemovalMessage("Cadastro reativado. Histórico preservado.") }
    catch (e) { setError(e instanceof Error ? e.message : "Falha ao reativar.") }
    finally { savingRef.current = false; setSaving(false) }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <img src="/wiestoque.svg" width={40} height={40} alt="" aria-hidden="true" />
          </span>
          <div>
            <span className="brand-name">WiEstoque</span>
            <span className="brand-subtitle">Controle de estoque WiNET</span>
          </div>
          <button
            className="icon-button close-nav"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Fechar menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          <p className="nav-eyebrow">Operação</p>
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                view === item.id ? "nav-item-active" : ""
              }`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          <p className="nav-eyebrow nav-section">Cadastros</p>
          {navItems.slice(4).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                view === item.id ? "nav-item-active" : ""
              }`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-profile">
          <span className="avatar">AR</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {email}
            </p>
            <p className="truncate text-xs text-muted">Gestão de estoque</p>
          </div>
        </div>
        <button className="secondary-button" disabled={loggingOut || saving} onClick={() => void handleLogout()}>{loggingOut ? "Saindo…" : "Sair"}</button>
        {logoutError && <p role="alert">{logoutError}</p>}
      </aside>

      {mobileNavOpen && (
        <button
          className="nav-overlay"
          aria-label="Fechar menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menu"
          >
            <Icon name="menu" />
          </button>
          <span className="mobile-brand">
            <img src="/wiestoque.svg" width={26} height={26} alt="" aria-hidden="true" /> WiEstoque
          </span>
          <span className="avatar avatar-small">AR</span>
        </header>

        <div className="connection-bar">
          <span>{loading ? "Carregando dados…" : "Dados do servidor"}</span>
          <button
            className="secondary-button"
            disabled={loading || saving}
            onClick={() => void load()}
          >
            Atualizar dados
          </button>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        {removalMessage && <div className="success-banner" role="status">{removalMessage}</div>}
        {editingTechnician && <EditTechnicianDialog technician={editingTechnician} close={() => setEditingTechnician(null)} saved={async () => {
          setRemovalMessage("Técnico atualizado.")
          await refresh()
        }} />}
        {editingProduct && <EditProductDialog product={editingProduct} close={() => setEditingProduct(null)} saved={async () => {
          setRemovalMessage("Material atualizado.")
          await refresh()
        }} />}
        {removal && (
          <RemovalDialog target={removal} close={() => setRemoval(null)} saved={async () => {
            if (removal.kind === "technicians") { if (movement.technician === removal.id) movement.setTechnician("") }
            else movement.setItems(current => current.filter(item => item.id !== removal.id))
            setRemovalMessage(removal.archive ? "Item arquivado. O histórico foi preservado." : "Item excluído.")
            await refresh()
          }} />
        )}
        {registration && (
          <Registration
            kind={registration}
            close={() => setRegistration(null)}
            saved={refresh}
          />
        )}
        {view === "usuarios" && <UserRegistration onBusy={busy => { savingRef.current = busy; setSaving(busy) }} />}
        {!loading && view === "painel" && <Dashboard products={products.filter(p => p.active)} routers={routerData} movements={movements} navigate={navigate} />}
        {!loading && view === "movimentacao" && (
          <MovementView
            technician={movement.technician}
            technicianData={technicianData}
            saving={saving}
            setTechnician={movement.setTechnician}
            entryOrigin={movement.entryOrigin}
            setEntryOrigin={movement.setEntryOrigin}
            movementType={movement.movementType}
            setMovementType={movement.changeMovementType}
            note={movement.note}
            setNote={movement.setNote}
            query={movement.query}
            setQuery={movement.setQuery}
            items={movement.items}
            addItem={movement.addItem}
            candidates={movement.candidates}
            selectItem={movement.selectItem}
            changeQuantity={movement.changeQuantity}
            setQuantity={movement.setQuantity}
            pending={pendingReturns(routerData, movements)}
            removeItem={movement.removeItem}
            setClientCode={movement.setClientCode}
            totalUnits={movement.totalUnits}
            submitted={movement.submitted}
            registerMovement={movement.registerMovement}
            dismissSuccess={() => movement.setSubmitted(false)}
          />
        )}
        {view === "estoque" && (
          <InventoryView
            inventory={inventory}
            archived={products.filter(p => !p.active).map(p => ({ item: p.name, category: "Produto", code: p.id, stock: p.quantity, status: "Arquivado" }))}
            reactivate={id => reactivate("products", id)}
            edit={(row) => { const product = products.find(p => p.id === row.code); if (product) setEditingProduct(product) }}
            remove={(row) => {
              setRemovalMessage("")
              setRemoval({ kind: "products", id: row.code, name: row.item, archive: hasHistory("products", row.code) })
            }}
            hasHistory={(id) => hasHistory("products", id)}
            busy={loading || saving}
            monthWithdrawals={monthWithdrawals}
            create={() => setRegistration("products")}
          />
        )}
        {view === "historico" && <HistoryView movements={movements} technicians={technicianData} products={products} routers={routerData} />}
        {view === "tecnicos" && (
          <TechniciansView
            technicians={technicians}
            reactivate={id => reactivate("technicians", id)}
            edit={(id) => { const person = technicianData.find(t => t.id === id); if (person) setEditingTechnician(person) }}
            remove={(id) => {
              const person = technicianData.find(t => t.id === id)
              if (person) { setRemovalMessage(""); setRemoval({ kind: "technicians", id, name: person.name, archive: movements.some(m => m.technicianId === id) }) }
            }}
            hasHistory={(id) => movements.some(m => m.technicianId === id)}
            busy={loading || saving}
            create={() => setRegistration("technicians")}
          />
        )}
        {view === "roteadores" && (
          <RoutersView
            routers={routers}
            remove={(row) => {
              setRemovalMessage("")
              setRemoval({ kind: "routers", id: row.id, name: row.model + " · " + row.asset, archive: hasHistory("routers", row.id) })
            }}
            hasHistory={(id) => hasHistory("routers", id)}
            busy={loading || saving}
            create={() => setRegistration("routers")}
          />
        )}
      </main>
    </div>
  )
}

