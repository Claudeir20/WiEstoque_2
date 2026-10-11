import UserRegistration from "./UserRegistration"
import { usePagination } from "./Pagination"
import { pendingReturns } from "./pendingReturns"
import { searchMovementItems, candidateUnavailable, type SearchCandidate } from "./movementSearch"
import { makeCsv, makeExcel, downloadFile, type ExportRow } from "./exportData"
import { normalizeSerial, formatMac, normalizeMac } from "./routerIdentifiers"
import {
  api,
  type Product,
  type Router,
  type Technician,
  type Movement,
} from "./api"
import { filterHistory, summarizeHistory, itemKey, itemLabel, type HistoryFilters } from "./history"
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type View = "painel" | "movimentacao" | "estoque" | "historico" | "tecnicos" | "roteadores" | "usuarios"
type MovementType = "Saída" | "Devolução" | "Entrada"

type MovementItem = {
  id: string
  name: string
  detail: string
  quantity: number
  available?: number
  type: "PRODUCT" | "ROUTER"
  clientCode?: string
}

function Icon({ name, size = 20 }: {
  name: string
  size?: number
}) {
  const paths: Record<string, ReactNode> = {
    box: (
      <>
        <path d="m21 8-9 5-9-5" />
        <path d="m3 8 9-5 9 5v8l-9 5-9-5Z" />
        <path d="M12 13v8" />
      </>
    ),
    arrows: (
      <>
        <path d="m7 7-4 4 4 4" />
        <path d="M3 11h13a5 5 0 0 1 5 5v1" />
        <path d="m17 17 4-4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19H2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    router: (
      <>
        <rect x="3" y="10" width="18" height="9" rx="2" />
        <path d="M7 10V6m10 4V6M5 4l2 2 2-2m6 0 2 2 2-2M7 15h.01M11 15h.01" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7" />
        <path d="M10 11v5m4-5v5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

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

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "success" | "warning" | "field"
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function EmptyState({ query }: { query: string }) {
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
  const [movementType, setMovementType] = useState<MovementType>("Saída")
  const [technician, setTechnician] = useState("")
  const [entryOrigin, setEntryOrigin] = useState("Compra para reposição")
  const [note, setNote] = useState("Saída para instalação")
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<MovementItem[]>([])
  const [submitted, setSubmitted] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [routerData, setRouterData] = useState<Router[]>([])
  const [technicianData, setTechnicianData] = useState<Technician[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
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

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  function navigate(next: View) {
    if (savingRef.current) return
    setView(next)
    setMobileNavOpen(false)
  }

  const candidates = searchMovementItems(products, routerData, query, movementType)
  function addItem(event: FormEvent) {
    event.preventDefault()
    if (savingRef.current) return
    const exact = candidates.filter(item => item.exact)
    const matches = exact.length ? exact : candidates
    if (!query.trim()) return
    if (matches.length !== 1) {
      setError(matches.length ? "Escolha um dos resultados da busca para adicionar." : "Item não encontrado. Confira o nome ou código informado.")
      return
    }
    selectItem(matches[0].id)
  }
  
  function selectItem(id: string) {
    if (savingRef.current) return
    const candidate = candidates.find(item => item.id === id) ?? searchMovementItems(products, routerData, routerData.find(r => r.id === id)?.assetNumber ?? "", movementType).find(item => item.id === id)
    if (!candidate) return
    setError("")
    setSubmitted(false)
    if (candidate.type === "ROUTER") {
      if (
        (movementType === "Saída" && candidate.available !== 1) ||
        (movementType === "Devolução" && candidate.available !== 0)
      ) {
        setError("Roteador indisponível para esta movimentação.")
        return
      }
      if (items.some((i) => i.id === candidate.id)) {
        setError("Este roteador já está na lista.")
        return
      }
    }


    const existing = items.find((i) => i.id === candidate.id)
    if (
      movementType === "Saída" &&
      (existing?.quantity || 0) + 1 > (candidate.available || 0)
    ) {
      setError("Quantidade superior ao estoque disponível.")
      return
    }
    setItems((current) =>
      existing
        ? current.map((i) =>
            i.id === candidate.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...current, { ...candidate, detail: candidate.type === "PRODUCT" ? "Produto" : candidate.detail }],
    )
    setQuery("")
  }
  function changeQuantity(id: string, delta: number) {
    if (savingRef.current) return
    setSubmitted(false)
    setItems((current) =>
      current
        .map((i) => {
          if (i.id !== id) return i
          const next = Math.max(0, i.quantity + delta)
          if (i.type === "ROUTER" && next > 1) return i
          if (movementType === "Saída" && next > (i.available || 0)) return i
          return { ...i, quantity: next }
        })
        .filter((i) => i.quantity > 0),
    )
  }
  async function reactivate(kind: "products" | "technicians", id: string) {
    if (savingRef.current) return
    savingRef.current = true; setSaving(true); setError("")
    try { await api(`/${kind}/${id}/reactivate`, {}, "POST"); await refresh(); setRemovalMessage("Cadastro reativado. Histórico preservado.") }
    catch (e) { setError(e instanceof Error ? e.message : "Falha ao reativar.") }
    finally { savingRef.current = false; setSaving(false) }
  }
  function setQuantity(id: string, quantity: number) {
    if (savingRef.current) return
    setItems(current => current.map(i => i.id === id && Number.isInteger(quantity) && quantity > 0 && quantity <= 2147483647 && (i.type !== "ROUTER" || quantity === 1) && (movementType !== "Saída" || quantity <= (i.available ?? 0)) ? { ...i, quantity } : i))
    setSubmitted(false)
  }
  function removeItem(id: string) {
    if (!savingRef.current) {
      setItems((current) => current.filter((i) => i.id !== id))
      setSubmitted(false)
    }
  }
  async function registerMovement() {
    if (!items.length || savingRef.current) return
    if (movementType !== "Entrada" && !technician) {
      setError("Selecione um técnico.")
      return
    }
    savingRef.current = true
    setSaving(true)
    setError("")
    setSubmitted(false)
    try {
      await api("/movements", {
        technicianId: movementType === "Entrada" ? null : technician,
        type: { Saída: "WITHDRAWAL", Devolução: "RETURN", Entrada: "ENTRY" }[
          movementType
        ],
        observation:
          movementType === "Entrada" ? entryOrigin + ": " + note : note,
        items: items.map((i) => ({
          type: i.type,
          productId: i.type === "PRODUCT" ? i.id : null,
          routerId: i.type === "ROUTER" ? i.id : null,
          quantity: i.quantity,
          clientCode: i.clientCode || null,
        })),
      })
      setItems([])
      setSubmitted(true)
      try {
        await refresh()
      } catch {
        setError(
          "Movimentação salva. Não foi possível atualizar as listas; use Atualizar dados.",
        )
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha ao registrar movimentação.",
      )
    } finally {
      savingRef.current = false
      setSaving(false)
    }
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
            if (removal.kind === "technicians") { if (technician === removal.id) setTechnician("") }
            else setItems(current => current.filter(item => item.id !== removal.id))
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
            technician={technician}
            technicianData={technicianData}
            saving={saving}
            setTechnician={setTechnician}
            entryOrigin={entryOrigin}
            setEntryOrigin={setEntryOrigin}
            movementType={movementType}
            setMovementType={(type) => {
              if (savingRef.current) return
              setMovementType(type)
              setNote(
                type === "Saída"
                  ? "Saída para instalação"
                  : type === "Devolução"
                    ? "Devolução após atendimento"
                    : "Compra para reposição do estoque",
              )
              setItems([])
              setSubmitted(false)
            }}
            note={note}
            setNote={setNote}
            query={query}
            setQuery={setQuery}
            items={items}
            addItem={addItem}
            candidates={candidates}
            selectItem={selectItem}
            changeQuantity={changeQuantity}
            setQuantity={setQuantity}
            pending={pendingReturns(routerData, movements)}
            removeItem={removeItem}
            setClientCode={(id, value) => {
              if (!savingRef.current)
                setItems((current) =>
                  current.map((i) =>
                    i.id === id ? { ...i, clientCode: value } : i,
                  ),
                )
            }}
            totalUnits={totalUnits}
            submitted={submitted}
            registerMovement={registerMovement}
            dismissSuccess={() => setSubmitted(false)}
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

type MovementProps = {
  pending: ReturnType<typeof pendingReturns>
  setQuantity: (id: string, quantity: number) => void
  technicianData: Technician[]
  saving: boolean
  technician: string
  setTechnician: (value: string) => void
  entryOrigin: string
  setEntryOrigin: (value: string) => void
  movementType: MovementType
  setMovementType: (value: MovementType) => void
  note: string
  setNote: (value: string) => void
  query: string
  setQuery: (value: string) => void
  items: MovementItem[]
  candidates: SearchCandidate[]
  selectItem: (id: string) => void
  addItem: (event: FormEvent) => void
  changeQuantity: (id: string, delta: number) => void
  removeItem: (id: string) => void
  setClientCode: (id: string, value: string) => void
  totalUnits: number
  submitted: boolean
  registerMovement: () => void
  dismissSuccess: () => void
}

function MovementView(props: MovementProps) {
  const searchInput = useRef<HTMLInputElement>(null)
  const [highlighted, setHighlighted] = useState(-1)
  const [resultsOpen, setResultsOpen] = useState(true)
  const shownCandidates = props.candidates.slice(0, 20)
  const choose = (id: string) => { props.selectItem(id); setHighlighted(-1); searchInput.current?.focus() }
  useEffect(() => { setHighlighted(-1); setResultsOpen(true) }, [props.query, props.movementType])
  function searchKey(event: import("react").KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setResultsOpen(false); setHighlighted(-1); return }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); setResultsOpen(true)
      const direction = event.key === "ArrowDown" ? 1 : -1
      for (let step = 1; step <= shownCandidates.length; step++) {
        const base = highlighted === -1 && direction === -1 ? 0 : highlighted
        const index = (base + direction * step + shownCandidates.length) % shownCandidates.length
        if (!candidateUnavailable(shownCandidates[index], props.movementType, props.items)) { setHighlighted(index); break }
      }
    }
    if (event.key === "Enter" && resultsOpen && highlighted >= 0 && shownCandidates[highlighted]) {
      event.preventDefault(); choose(shownCandidates[highlighted].id)
    }
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Movimentações</p>
          <h1>Nova movimentação</h1>
          <p className="page-description">
            Registre saídas, devoluções ou entradas de novos materiais no
            estoque.
          </p>
        </div>
        <Badge tone="neutral">{new Date().toLocaleDateString("pt-BR")}</Badge>
      </div>

      {props.submitted && (
        <div className="success-banner" role="status">
          <span className="success-icon">
            <Icon name="check" />
          </span>
          <div>
            <p className="font-semibold text-ink">
              {props.movementType} registrada com sucesso
            </p>
            <p className="text-sm text-muted">
              Movimentação salva no servidor.
            </p>
          </div>
          <button
            className="icon-button ml-auto"
            onClick={props.dismissSuccess}
            aria-label="Fechar aviso"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      <div className="movement-layout">
        <section className="card settings-card">
          <div className="card-header">
            <span className="step-number">1</span>
            <div>
              <h2>Dados da movimentação</h2>
              <p>
                {props.movementType === "Entrada"
                  ? "Informe a origem dos novos materiais."
                  : "Defina o responsável e o tipo."}
              </p>
            </div>
          </div>

          {props.movementType === "Entrada" ? (
            <label className="field">
              <span>Origem da entrada</span>
              <select
                disabled={props.saving}
                value={props.entryOrigin}
                onChange={(event) => props.setEntryOrigin(event.target.value)}
              >
                <option>Compra para reposição</option>
                <option>Compra de novo material</option>
                <option>Ajuste de inventário</option>
              </select>
            </label>
          ) : (
            <label className="field">
              <span>Técnico</span>
              <select
                disabled={props.saving}
                value={props.technician}
                onChange={(event) => props.setTechnician(event.target.value)}
              >
                <option value="">Selecione um técnico</option>
                {props.technicianData
                  .filter((t) => t.active)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <fieldset className="field">
            <legend>Tipo</legend>
            <div className="segmented">
              {(["Saída", "Devolução", "Entrada"] as MovementType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={props.saving}
                    className={
                      props.movementType === type ? "segment-active" : ""
                    }
                    onClick={() => props.setMovementType(type)}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <label className="field">
            <span>Observação</span>
            <textarea
              disabled={props.saving}
              maxLength={props.movementType === "Entrada" ? 200 : 255}
              rows={3}
              value={props.note}
              onChange={(event) => props.setNote(event.target.value)}
            />
          </label>
        </section>

        <section className="card items-card">
          <div className="card-header">
            <span className="step-number">2</span>
            <div>
              <h2>Itens da movimentação</h2>
              <p>
                {props.movementType === "Entrada"
                  ? "Busque um material já cadastrado. Cadastre novos materiais na tela de estoque."
                  : "Busque por patrimônio, série ou produto."}
              </p>
            </div>
          </div>

          {props.movementType === "Devolução" && <section className="pending-returns"><h3>Roteadores por técnico</h3><p>Lista baseada na última saída registrada. Selecione o técnico responsável para adicionar uma devolução.</p>{props.technician && props.pending.filter(p => p.technicianId === props.technician).map(({router}) => <button key={router.id} className="secondary-button" disabled={props.saving || props.items.some(i => i.id === router.id)} onClick={() => choose(router.id)}>{router.model} · {router.assetNumber} — Adicionar</button>)}{props.technician && !props.pending.some(p => p.technicianId === props.technician) && <p>Nenhum roteador pendente identificado para este técnico.</p>}{props.pending.some(p => !p.technicianId) && <p>{props.pending.filter(p => !p.technicianId).length} roteadores fora do estoque sem técnico identificado no histórico. Use a busca para localizar o equipamento.</p>}</section>}
              <form className="search-form" onSubmit={event => { props.addItem(event); searchInput.current?.focus() }}>
            <label className="search-field">
              <span className="sr-only">
                {props.movementType === "Entrada"
                  ? "Nome do material"
                  : "Patrimônio, série ou produto"}
              </span>
              <Icon name="search" size={19} />
              <input
                ref={searchInput}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={resultsOpen && !!props.query.trim() && shownCandidates.length > 0}
                aria-controls="movement-search-results"
                aria-activedescendant={highlighted >= 0 && resultsOpen ? "search-option-" + highlighted : undefined}
                onKeyDown={searchKey}
                onFocus={() => setResultsOpen(true)}
                autoComplete="off"
                disabled={props.saving}
                value={props.query}
                onChange={(event) => props.setQuery(event.target.value)}
                placeholder={
                  props.movementType === "Entrada"
                    ? "Ex.: Cabo drop"
                    : "Ex.: PAT-001 ou Cabo UTP"
                }
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={props.saving}
            >
              <Icon name="plus" size={18} /> Adicionar
            </button>
          </form>

          <p className="search-help">Digite ou leia o código e pressione Enter. Use ↑ ↓ para escolher um resultado.</p>
          {resultsOpen && props.query.trim() && <div className="search-results" id="movement-search-results" role="listbox" aria-label="Resultados da busca">
            <p className="search-results-count" role="status">{props.candidates.length ? `${props.candidates.length} resultado(s)` : "Nenhum resultado. Confira o nome ou código."}</p>
            {shownCandidates.map((candidate, index) => {
              const blocked = candidateUnavailable(candidate, props.movementType, props.items)
              return <button type="button" role="option" id={"search-option-" + index} aria-selected={highlighted === index}
                className={"search-result " + (highlighted === index ? "search-result-selected" : "")}
                key={candidate.id} disabled={props.saving || !!blocked} onClick={() => choose(candidate.id)}>
                <span><strong>{candidate.name}</strong><small>{candidate.type === "PRODUCT" ? "Material" : "Roteador · " + candidate.detail}</small></span>
                <span className="search-result-balance">{blocked || (candidate.type === "PRODUCT" ? `${candidate.available} em estoque` : candidate.available ? "No estoque" : "Fora do estoque")}</span>
              </button>
            })}
            {props.candidates.length > 20 && <p className="search-help">Exibindo os primeiros 20. Digite mais para refinar a busca.</p>}
          </div>}
          <div className="item-list">
            {props.items.length === 0 ? (
              <div className="movement-empty"><Icon name="box" size={32} /><h3>Nenhum item adicionado</h3><p>Busque um material ou roteador acima para começar.</p></div>
            ) : (
              props.items.map((item) => (
                <div className="movement-item" key={item.id}>
                  <span
                    className={`item-icon ${
                      item.detail === "Produto" ||
                      item.detail === "Novo material"
                        ? ""
                        : "item-icon-router"
                    }`}
                  >
                    <Icon
                      name={
                        item.detail === "Produto" ||
                        item.detail === "Novo material"
                          ? "box"
                          : "router"
                      }
                      size={20}
                    />
                  </span>
                  <div className="item-copy">
                    <p>{item.name}</p>
                    <span>
                      {item.detail}
                      {item.available !== undefined
                        ? ` · ${item.available} disponíveis`
                        : ""}
                    </span>
                    {item.type === "ROUTER" &&
                      props.movementType === "Saída" && (
                        <label className="field">
                          <span>Código do cliente (opcional)</span>
                          <input
                            maxLength={255}
                            disabled={props.saving}
                            value={item.clientCode || ""}
                            onChange={(e) =>
                              props.setClientCode(item.id, e.target.value)
                            }
                          />
                        </label>
                      )}
                  </div>
                  <div
                    className="quantity-control"
                    aria-label={`Quantidade de ${item.name}`}
                  >
                    <button
                      disabled={props.saving}
                      onClick={() => props.changeQuantity(item.id, -1)}
                      aria-label="Diminuir quantidade"
                    >
                      <Icon name="minus" size={15} />
                    </button>
                    {item.type === "ROUTER" ? <span>1</span> : <QuantityInput value={item.quantity} max={props.movementType === "Saída" ? item.available ?? 0 : 2147483647} disabled={props.saving} change={n => props.setQuantity(item.id, n)} />}
                    <button
                      disabled={
                        props.saving ||
                        item.type === "ROUTER" ||
                        (props.movementType === "Saída" &&
                          item.quantity >= (item.available || 0))
                      }
                      onClick={() => props.changeQuantity(item.id, 1)}
                      aria-label="Aumentar quantidade"
                    >
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                  <button
                    className="delete-button"
                    disabled={props.saving}
                    onClick={() => props.removeItem(item.id)}
                    aria-label={`Remover ${item.name}`}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="card-footer">
            <div>
              <p className="text-sm text-muted">Resumo</p>
              <p className="font-semibold text-ink">
                {props.items.length}{" "}
                {props.items.length === 1 ? "item" : "itens"} ·{" "}
                {props.totalUnits} unidades
              </p>
            </div>
            <button
              className="primary-button primary-large"
              disabled={
                !props.items.length ||
                props.saving ||
                (props.movementType !== "Entrada" && !props.technician)
              }
              onClick={props.registerMovement}
            >
              {props.saving
                ? "Salvando…"
                : "Registrar " + props.movementType.toLowerCase()}{" "}
              <Icon name="chevron" size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function PageHeader({
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

type InventoryRow = {
  item: string
  category: string
  code: string
  stock: number
  status: string
}
function InventoryView({
  inventory, archived, reactivate,
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
          <ExportButtons name="estoque" rows={rows.map(row => ({ "Material": row.item, "Quantidade": row.stock, "Status": row.status }))} />
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
      <div className="row-actions"><button className="secondary-button" aria-pressed={!showArchived} onClick={() => setShowArchived(false)}>Ativos ({inventory.length})</button><button className="secondary-button" aria-pressed={showArchived} onClick={() => setShowArchived(true)}>Arquivados ({archived.length})</button></div>
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
                    {showArchived ? <button className="secondary-button" disabled={busy} onClick={() => reactivate(row.code)}>Reativar</button> : <div className="row-actions">
                    <button className="secondary-button" disabled={busy} onClick={() => edit(row)}>Editar</button>
                    <button className="secondary-button removal-button"
                      disabled={busy || row.stock !== 0}
                      title={row.stock !== 0 ? "O saldo deve ser zero para remover este material." : undefined}
                      onClick={() => remove(row)}>
                      {hasHistory(row.code) ? "Arquivar" : "Excluir"}
                    </button>
                    </div>}
                    {!showArchived && row.stock !== 0 && <small className="removal-hint">Requer saldo zero</small>}
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

function Metric({
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

function HistoryView({ movements, technicians, products, routers }: {
  movements: Movement[]
  technicians: Technician[]
  products: Product[]
  routers: Router[]
}) {
  const [filters, setFilters] = useState<HistoryFilters>({ technicianId: "", startDate: "", endDate: "", itemId: "", type: "WITHDRAWAL" })
  const update = (key: keyof HistoryFilters, value: string) => setFilters(current => ({ ...current, [key]: value }))
  const invalidRange = !!(filters.startDate && filters.endDate && filters.startDate > filters.endDate)
  const filtered = useMemo(() => filterHistory(movements, filters), [movements, filters])
  const summary = useMemo(() => summarizeHistory(filtered), [filtered])
  const totals = summary.reduce((sum, row) => ({ withdrawals: sum.withdrawals + row.withdrawals, returns: sum.returns + row.returns, entries: sum.entries + row.entries }), { withdrawals: 0, returns: 0, entries: 0 })
  const technicianOptions = new Map(technicians.map(t => [t.id, t.name]))
  const itemOptions = new Map<string, string>([
    ...products.map(p => ["PRODUCT:" + p.id, p.name] as [string, string]),
  ])
  for (const movement of movements) {
    if (movement.technicianId) technicianOptions.set(movement.technicianId, movement.technicianName)
    for (const item of movement.items) {
      if (item.type === "PRODUCT") itemOptions.set(itemKey(item), itemLabel(item))
    }
  }
  const historyRows = filtered.map(m => ({ id: m.id, date: new Date(m.date).toLocaleDateString("pt-BR"), technician: m.technicianName, type: { WITHDRAWAL: "Saída", RETURN: "Devolução", ENTRY: "Entrada" }[m.type], items: m.items.map(i => ({ name: itemLabel(i), quantity: i.quantity, category: i.type === "PRODUCT" ? "Material" : "Roteador" })), status: "Concluída" }))
  const summaryPage = usePagination(summary, JSON.stringify(filters))
  const historyPage = usePagination(historyRows, JSON.stringify(filters))
  return (
    <div className="page">
      <PageHeader
        eyebrow="Movimentações"
        title="Histórico"
        description="Filtre por técnico, período e item para conferir as quantidades movimentadas."
        action={
          <ExportButtons name="historico-filtrado" rows={filtered.flatMap(m => m.items.map(i => ({
            "Data": m.date.slice(0,10).split("-").reverse().join("/"), "Técnico": m.technicianName,
            "Tipo": { WITHDRAWAL: "Saída", RETURN: "Devolução", ENTRY: "Entrada" }[m.type],
            "Categoria": i.type === "PRODUCT" ? "Material" : "Roteador", "Item": itemLabel(i), "Quantidade": i.quantity, "Status": "Concluída",
          })))} />
        }
      />
      <section className="card history-filters" aria-label="Filtros do histórico">
        <label className="field"><span>Técnico</span><select value={filters.technicianId} onChange={e => update("technicianId", e.target.value)}><option value="">Todos os técnicos</option>{[...technicianOptions].sort((a,b) => a[1].localeCompare(b[1], "pt-BR")).map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="field"><span>Data inicial</span><input type="date" value={filters.startDate} onChange={e => update("startDate", e.target.value)} /></label>
        <label className="field"><span>Data final</span><input type="date" value={filters.endDate} onChange={e => update("endDate", e.target.value)} /></label>
        <label className="field"><span>Material</span><select value={filters.itemId} onChange={e => update("itemId", e.target.value)}><option value="">Todos os itens</option>{[...itemOptions].sort((a,b) => a[1].localeCompare(b[1], "pt-BR")).map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="field"><span>Tipo</span><select value={filters.type} onChange={e => update("type", e.target.value)}><option value="">Todos os tipos</option><option value="WITHDRAWAL">Saída</option><option value="RETURN">Devolução</option><option value="ENTRY">Entrada</option></select></label>
        <button className="secondary-button" onClick={() => setFilters({ technicianId: "", startDate: "", endDate: "", itemId: "", type: "" })}>Limpar filtros</button>
        <p className="history-filter-note">O período inclui todo o dia inicial e final. Os resultados são atualizados ao alterar os filtros.</p>
      </section>
      <div className="active-filters" aria-label="Filtros ativos">
        <span>Filtros ativos:</span>
        {filters.technicianId && <button onClick={() => update("technicianId", "")}>Técnico: {technicianOptions.get(filters.technicianId)} ×</button>}
        {filters.startDate && <button onClick={() => update("startDate", "")}>De: {filters.startDate.split("-").reverse().join("/")} ×</button>}
        {filters.endDate && <button onClick={() => update("endDate", "")}>Até: {filters.endDate.split("-").reverse().join("/")} ×</button>}
        {filters.itemId && <button onClick={() => update("itemId", "")}>Material: {itemOptions.get(filters.itemId)} ×</button>}
        {filters.type ? <button onClick={() => update("type", "")}>Tipo: {{WITHDRAWAL:"Saída", RETURN:"Devolução", ENTRY:"Entrada"}[filters.type]} ×</button> : <span>Todos os tipos</span>}
        {!filters.itemId && <span className="filter-note">Materiais e roteadores</span>}
      </div>
      {invalidRange && <div className="error-banner" role="alert">A data final deve ser igual ou posterior à data inicial.</div>}
      <div className="metric-grid" aria-live="polite">
        <Metric icon="arrows" label="Unidades retiradas" value={String(totals.withdrawals)} detail="Saídas nos filtros selecionados" />
        <Metric icon="box" label="Unidades devolvidas" value={String(totals.returns)} detail="Devoluções nos filtros selecionados" />
        <Metric icon="chart" label="Retirado líquido" value={String(totals.withdrawals - totals.returns)} detail="Saídas menos devoluções filtradas" />
      </div>
      <section className="card table-card">
        <div className="table-toolbar"><div><h2>Resumo por técnico e item</h2><p>As quantidades consideram apenas os filtros selecionados. Para comparar saídas e devoluções, selecione Todos os tipos.</p></div><ExportButtons name="resumo-historico" label="Exportar resumo" rows={summary.map(r => ({ "Técnico": r.technician, "Item": r.item, "Retiradas": r.withdrawals, "Devoluções": r.returns, "Entradas": r.entries, "Retirado líquido": r.net }))} /></div>
        <div className="table-wrap"><table><thead><tr><th>Técnico</th><th>Item</th><th>Retiradas</th><th>Devoluções</th><th>Entradas</th><th>Retirado líquido</th></tr></thead><tbody>{summaryPage.rows.map(row => <tr key={row.key}><td className="table-name">{row.technician}</td><td>{row.item}</td><td>{row.withdrawals}</td><td>{row.returns}</td><td>{row.entries}</td><td>{row.net}</td></tr>)}</tbody></table>{!summary.length && <p className="history-empty" role="status">Nenhuma movimentação encontrada para os filtros selecionados.</p>}</div>
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
                  <td><ul className="history-items">{row.items.map((item,index) => <li key={index}><span><strong>{item.name}</strong><small>{item.category}</small></span><span className="history-quantity">{item.quantity} un.</span></li>)}</ul></td>
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

type TechnicianRow = {
  id: string
  name: string
  initials: string
  route: string
  status: string
}
function TechniciansView({
  technicians, reactivate,
  edit, remove, hasHistory, busy,
  create,
}: {
  edit: (id: string) => void
  remove: (id: string) => void
  hasHistory: (id: string) => boolean
  busy: boolean
  technicians: TechnicianRow[]
  reactivate: (id: string) => void
  create: () => void
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Equipe"
        title="Técnicos"
        description="Consulte os técnicos cadastrados e seus setores."
        action={
          <button className="primary-button" onClick={create}>
            <Icon name="plus" size={18} /> Novo técnico
          </button>
        }
      />
      <div className="people-grid">
        {technicians.map((person) => (
          <article className="card person-card" key={person.id}>
            <div className="person-top">
              <span className="avatar avatar-large">{person.initials}</span>
              <Badge tone={person.status === "Ativo" ? "success" : "neutral"}>
                {person.status}
              </Badge>
            </div>
            <h2>{person.name}</h2>
            <p>{person.route}</p>
            <div className="registration-actions">
              {person.status !== "Ativo" && <button className="secondary-button" disabled={busy} onClick={() => reactivate(person.id)}>Reativar</button>}
              <button className="secondary-button" disabled={busy || person.status !== "Ativo"} onClick={() => edit(person.id)}>Editar</button>
              <button className="secondary-button removal-button" disabled={busy || (person.status !== "Ativo" && hasHistory(person.id))} onClick={() => remove(person.id)}>
                {hasHistory(person.id) ? person.status === "Ativo" ? "Arquivar" : "Arquivado" : "Excluir"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

type RouterRow = {
  id: string
  model: string
  asset: string
  serial: string
  mac: string
  status: string
}
function RoutersView({
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
  const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const rows = routers.filter(r => (!status || r.status === status) && (!model || r.model === model) && (fold(`${r.model} ${r.asset} ${r.serial} ${r.mac}`).includes(fold(search.trim())) || (!!search.trim() && r.mac.replace(/[:.-]/g, "").toLowerCase().includes(search.replace(/[:.-]/g, "").trim().toLowerCase()))))
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
      <section className="card history-filters"><label className="field"><span>Buscar roteador</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Modelo, patrimônio, série ou MAC" /></label><label className="field"><span>Situação</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todas</option><option>Estoque</option><option>Fora de estoque</option></select></label><label className="field"><span>Modelo</span><select value={model} onChange={e => setModel(e.target.value)}><option value="">Todos os modelos</option>{[...new Set(routers.map(r => r.model))].sort().map(m => <option key={m}>{m}</option>)}</select></label><button className="secondary-button" onClick={() => {setSearch("");setStatus("");setModel("")}}>Limpar filtros</button></section>
      <section className="card table-card">
        <div className="table-toolbar">
          <div>
            <h2>Roteadores cadastrados</h2>
            <p>Equipamentos deste estoque exclusivo</p>
          </div>
          <Badge tone="neutral">{rows.length} de {routers.length} roteadores</Badge>
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
                    <button className="secondary-button removal-button"
                      disabled={busy || router.status !== "Estoque"}
                      title={router.status !== "Estoque" ? "Registre a devolução antes de remover este roteador." : undefined}
                      onClick={() => remove(router)}>
                      {hasHistory(router.id) ? "Arquivar" : "Excluir"}
                    </button>
                    {router.status !== "Estoque" && <small className="removal-hint">Requer devolução</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="history-empty">Nenhum roteador encontrado para os filtros.</p>}
        </div>
        {pagination.control}
      </section>
    </div>
  )
}

function ExportButtons({ name, rows, label = "Exportar" }: { name: string; rows: ExportRow[]; label?: string }) {
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

function Registration({
  kind,
  close,
  saved,
}: {
  kind: "products" | "technicians" | "routers"
  close: () => void
  saved: () => Promise<void>
}) {
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const [persisted, setPersisted] = useState(false)
  const fields =
    kind === "products"
      ? [
          ["name", "Nome"],
          ["quantity", "Quantidade inicial"],
          ["minimumQuantity", "Estoque mínimo"],
        ]
      : kind === "technicians"
        ? [
            ["name", "Nome"],
            ["sector", "Setor"],
          ]
        : [
            ["assetNumber", "Patrimônio"],
            ["model", "Modelo"],
            ["serialNumber", "Número de série"],
            ["mac", "MAC"],
          ]
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending.current || persisted) return
    const data: Record<string, unknown> = Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    )
    if (kind === "products") {
      data.quantity = Number(data.quantity)
      data.minimumQuantity = Number(data.minimumQuantity)
    }
    if (kind === "routers") {
      try {
        data.serialNumber = normalizeSerial(String(data.serialNumber ?? ""))
        data.mac = normalizeMac(String(data.mac ?? ""))
      } catch (e) {
        setError(e instanceof Error ? e.message : "MAC inválido.")
        return
      }
    }
    pending.current = true
    setSaving(true)
    setError("")
    try {
      await api("/" + kind, data)
      setPersisted(true)
      try {
        await saved()
      } catch {
        setError(
          "Cadastro salvo, mas a atualização falhou. Feche e use Atualizar dados.",
        )
        return
      }
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao cadastrar.")
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  return (
    <div className="registration-overlay">
      <section
        className="card registration-card"
        role="dialog"
        aria-modal="true"
        aria-label="Novo cadastro"
      >
        <h2>
          {kind === "products"
            ? "Cadastrar material"
            : kind === "technicians"
              ? "Novo técnico"
              : "Cadastrar roteador"}
        </h2>
        <form onSubmit={submit}>
          {fields.map(([name, label]) => (
            <label className="field" key={name}>
              <span>{label}</span>
              <input
                name={name}
                autoFocus={fields[0][0] === name}
                autoComplete="off"
                onKeyDown={event => {
                  if (kind !== "routers" || event.key !== "Enter") return
                  event.preventDefault()
                  if (!event.currentTarget.reportValidity()) return
                  const inputs = Array.from(event.currentTarget.form?.querySelectorAll<HTMLInputElement>("input") || [])
                  const next = inputs[inputs.indexOf(event.currentTarget) + 1]
                  if (next) next.focus()
                  else event.currentTarget.form?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus()
                }}
                onChange={(event) => {
                  if (kind === "routers" && name === "serialNumber") {
                    event.currentTarget.value = event.currentTarget.value.toUpperCase()
                  }
                  if (kind === "routers" && name === "mac") {
                    event.currentTarget.value = formatMac(event.currentTarget.value)
                  }
                }}
                onBlur={(event) => {
                  if (kind === "routers" && name === "serialNumber" && event.currentTarget.value.trim()) {
                    event.currentTarget.value = normalizeSerial(event.currentTarget.value)
                  }
                }}
                required
                maxLength={255}
                type={
                  name.includes("Quantity") || name === "quantity"
                    ? "number"
                    : "text"
                }
                min={name === "quantity" ? 0 : 1}
                disabled={saving}
              />
            </label>
          ))}
          {error && <p role="alert">{error}</p>}
          <div className="registration-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={saving}
              onClick={close}
            >
              {persisted ? "Fechar" : "Cancelar"}
            </button>
            <button type="submit" className="primary-button" disabled={saving || persisted}>
              {saving ? "Salvando…" : "Cadastrar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}


type RemovalTarget = {
  kind: "products" | "routers" | "technicians"
  id: string
  name: string
  archive: boolean
}

function RemovalDialog({ target, close, saved }: {
  target: RemovalTarget
  close: () => void
  saved: () => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  async function confirm() {
    if (pending.current || done) return
    pending.current = true
    setSaving(true)
    setError("")
    try {
      await api("/" + target.kind + "/" + target.id + (target.archive ? "/archive" : ""),
        target.archive ? {} : undefined, target.archive ? "POST" : "DELETE")
      setDone(true)
      try {
        await saved()
      } catch {
        setError("Operação concluída, mas a atualização falhou. Feche e use Atualizar dados.")
        return
      }
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível remover o item.")
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialog} className="card removal-dialog" aria-labelledby="removal-title"
      onCancel={(event) => { event.preventDefault(); if (!pending.current) close() }}>
      <h2 id="removal-title">{target.kind === "technicians" ? target.archive ? "Arquivar técnico" : "Excluir técnico" : target.archive ? "Arquivar item" : "Excluir item"}</h2>
      <p className="removal-name">{target.name}</p>
      <p>{target.archive
        ? target.kind === "technicians" ? "O técnico ficará inativo e não poderá receber novas movimentações. O histórico será preservado." : "O item sairá do cadastro ativo e não poderá receber novas movimentações. O histórico será preservado."
        : "O cadastro será excluído permanentemente. Esta ação não pode ser desfeita."}</p>
      {error && <p className="removal-error" role="alert">{error}</p>}
      <div className="registration-actions">
        <button autoFocus className="secondary-button" disabled={saving} onClick={close}>
          {done ? "Fechar" : "Cancelar"}
        </button>
        {!done && <button className="primary-button" disabled={saving} onClick={() => void confirm()}>
          {saving ? "Aguarde…" : target.archive ? "Confirmar arquivamento" : "Confirmar exclusão"}
        </button>}
      </div>
    </dialog>
  )
}





function EditProductDialog({ product, close, saved }: { product: Product; close: () => void; saved: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [name, setName] = useState(product.name)
  const [quantity, setQuantity] = useState(String(product.quantity))
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [auditError, setAuditError] = useState("")
  const [adjustments, setAdjustments] = useState<{id: string; previousName: string; newName: string; previousQuantity: number; newQuantity: number; reason: string; date: string}[]>([])
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    let cancelled = false
    api<typeof adjustments>(`/products/${product.id}/adjustments`).then(data => { if (!cancelled) setAdjustments(data) }).catch(() => { if (!cancelled) setAuditError("Não foi possível carregar o histórico de ajustes.") })
    return () => { cancelled = true; element?.close() }
  }, [product.id])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending.current || done) return
    const value = Number(quantity)
    if (!name.trim() || name.trim().length > 255) { setError("Informe um nome com até 255 caracteres."); return }
    if (!/^\d+$/.test(quantity) || !Number.isSafeInteger(value) || value > 2147483647) { setError("Informe uma quantidade inteira entre 0 e 2147483647."); return }
    if (value !== product.quantity && !reason.trim()) { setError("Informe o motivo do ajuste de estoque."); return }
    if (reason.trim().length > 255) { setError("O motivo deve ter até 255 caracteres."); return }
    pending.current = true; setSaving(true); setError("")
    try {
      await api(`/products/${product.id}`, { name: name.trim(), quantity: value, reason: reason.trim(), version: product.version }, "PUT")
      setDone(true)
      try { await saved(); close() } catch { setError("Alteração salva. Feche e use Atualizar dados para atualizar a tela.") }
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar.") }
    finally { pending.current = false; setSaving(false) }
  }
  return <dialog ref={dialog} className="card removal-dialog edit-product-dialog" aria-labelledby="edit-product-title" onCancel={event => { event.preventDefault(); if (!pending.current) close() }}>
    <h2 id="edit-product-title">Editar material</h2>
    <form onSubmit={event => void submit(event)}>
      <fieldset disabled={saving || done}>
        <label>Nome<input autoFocus value={name} maxLength={255} required onChange={e => setName(e.target.value)} /></label>
        <label>Quantidade atual<input type="number" min="0" max="2147483647" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
        <p>Saldo anterior: {product.quantity}. Ajuste: {Number(quantity) - product.quantity > 0 ? "+" : ""}{Number(quantity) - product.quantity}.</p>
        <label>Motivo do ajuste<textarea maxLength={255} required={Number(quantity) !== product.quantity} value={reason} onChange={e => setReason(e.target.value)} placeholder="Obrigatório ao alterar a quantidade" /></label>
      </fieldset>
      {error && <p className="removal-error" role="alert">{error}</p>}
      <div className="registration-actions">
        <button type="button" className="secondary-button" disabled={saving} onClick={close}>{done ? "Fechar" : "Cancelar"}</button>
        {!done && <button className="primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>}
      </div>
    </form>
    <h3>Histórico de ajustes</h3>
    {auditError && <p role="alert">{auditError}</p>}
    {!auditError && !adjustments.length && <p>Nenhum ajuste registrado.</p>}
    {adjustments.map(a => <div className="product-adjustment" key={a.id}>
      <strong>{new Date(a.date).toLocaleDateString("pt-BR")}</strong>
      <p>{a.previousQuantity} → {a.newQuantity} ({a.newQuantity - a.previousQuantity > 0 ? "+" : ""}{a.newQuantity - a.previousQuantity}) — {a.reason}</p>
      {a.previousName !== a.newName && <p>Nome: {a.previousName} → {a.newName}</p>}
    </div>)}
  </dialog>
}

function EditTechnicianDialog({ technician, close, saved }: { technician: Technician; close: () => void; saved: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [name, setName] = useState(technician.name)
  const [sector, setSector] = useState(technician.sector)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending.current || done) return
    if (!name.trim() || name.trim().length > 255 || !sector.trim() || sector.trim().length > 255) { setError("Informe nome e setor com até 255 caracteres cada."); return }
    pending.current = true; setSaving(true); setError("")
    try {
      await api(`/technicians/${technician.id}`, { name: name.trim(), sector: sector.trim(), expectedName: technician.name, expectedSector: technician.sector }, "PUT")
      setDone(true)
      try { await saved(); close() } catch { setError("Alteração salva. Feche e use Atualizar dados para atualizar a tela.") }
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar.") }
    finally { pending.current = false; setSaving(false) }
  }
  return <dialog ref={dialog} className="card removal-dialog edit-product-dialog" aria-labelledby="edit-technician-title" onCancel={event => { event.preventDefault(); if (!pending.current) close() }}>
    <h2 id="edit-technician-title">Editar técnico</h2>
    <form onSubmit={event => void submit(event)}>
      <fieldset disabled={saving || done}>
        <label>Nome<input autoFocus value={name} maxLength={255} required onChange={e => setName(e.target.value)} /></label>
        <label>Setor<input value={sector} maxLength={255} required onChange={e => setSector(e.target.value)} /></label>
      </fieldset>
      {error && <p className="removal-error" role="alert">{error}</p>}
      <div className="registration-actions">
        <button type="button" className="secondary-button" disabled={saving} onClick={close}>{done ? "Fechar" : "Cancelar"}</button>
        {!done && <button className="primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>}
      </div>
    </form>
  </dialog>
}

function QuantityInput({ value, max, disabled, change }: { value: number; max: number; disabled: boolean; change: (n: number) => void }) {
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

function Dashboard({ products, routers, movements, navigate }: { products: Product[]; routers: Router[]; movements: Movement[]; navigate: (view: View) => void }) {
  const low = products.filter(p => p.quantity <= p.minimumQuantity)
  const recent = [...movements].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5)
  return <div className="page"><PageHeader eyebrow="WiNET" title="Visão geral do estoque" description="Confira o estoque e as últimas movimentações." action={<button className="primary-button" onClick={() => navigate("movimentacao")}>Nova movimentação</button>} /><div className="metric-grid"><Metric icon="box" label="Materiais em estoque" value={String(products.reduce((n,p) => n+p.quantity,0))} detail={`${products.length} tipos de material`} /><Metric icon="router" label="Roteadores disponíveis" value={String(routers.filter(r => r.status === "IN_STOCK").length)} detail={`${routers.length} roteadores cadastrados`} /><Metric icon="chart" label="Materiais com estoque baixo" value={String(low.length)} detail="Confira os itens para reposição" warning /></div><section className="card table-card"><div className="table-toolbar"><h2>Materiais para reposição</h2><button className="secondary-button" onClick={() => navigate("estoque")}>Ver materiais</button></div><div className="table-wrap"><table><thead><tr><th>Material</th><th>Saldo</th><th>Mínimo</th></tr></thead><tbody>{low.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.quantity}</td><td>{p.minimumQuantity}</td></tr>)}</tbody></table>{!low.length && <p className="history-empty">Nenhum material com estoque baixo.</p>}</div></section><section className="card table-card"><div className="table-toolbar"><h2>Últimas movimentações</h2><button className="secondary-button" onClick={() => navigate("historico")}>Ver histórico</button></div><div className="table-wrap"><table><thead><tr><th>Data</th><th>Técnico</th><th>Tipo</th><th>Itens</th></tr></thead><tbody>{recent.map(m => <tr key={m.id}><td>{new Date(m.date).toLocaleDateString("pt-BR")}</td><td>{m.technicianName}</td><td>{{WITHDRAWAL:"Saída",RETURN:"Devolução",ENTRY:"Entrada"}[m.type]}</td><td>{m.items.map(i => `${itemLabel(i)} (${i.quantity})`).join(", ")}</td></tr>)}</tbody></table>{!recent.length && <p className="history-empty">Nenhuma movimentação registrada.</p>}</div></section></div>
}
