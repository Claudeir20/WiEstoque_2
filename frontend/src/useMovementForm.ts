import { useMemo, useState, type FormEvent, type MutableRefObject } from "react"
import { api, type Product, type Router } from "./api"
import { searchMovementItems } from "./movementSearch"
import type { MovementItem, MovementType } from "./types"

type Options = {
  products: Product[]
  routerData: Router[]
  savingRef: MutableRefObject<boolean>
  setSaving: (saving: boolean) => void
  setError: (message: string) => void
  refresh: () => Promise<void>
}

// Estado e regras do formulário de nova movimentação. Fica no App para o
// formulário não ser perdido ao navegar entre as telas.
export function useMovementForm({
  products,
  routerData,
  savingRef,
  setSaving,
  setError,
  refresh,
}: Options) {
  const [movementType, setMovementType] = useState<MovementType>("Saída")
  const [technician, setTechnician] = useState("")
  const [entryOrigin, setEntryOrigin] = useState("Compra para reposição")
  const [note, setNote] = useState("Saída para instalação")
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<MovementItem[]>([])
  const [submitted, setSubmitted] = useState(false)

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const candidates = searchMovementItems(
    products,
    routerData,
    query,
    movementType,
  )
  function addItem(event: FormEvent) {
    event.preventDefault()
    if (savingRef.current) return
    const exact = candidates.filter((item) => item.exact)
    const matches = exact.length ? exact : candidates
    if (!query.trim()) return
    if (matches.length !== 1) {
      setError(
        matches.length
          ? "Escolha um dos resultados da busca para adicionar."
          : "Item não encontrado. Confira o nome ou código informado.",
      )
      return
    }
    selectItem(matches[0].id)
  }

  function selectItem(id: string) {
    if (savingRef.current) return
    const candidate =
      candidates.find((item) => item.id === id) ??
      searchMovementItems(
        products,
        routerData,
        routerData.find((r) => r.id === id)?.assetNumber ?? "",
        movementType,
      ).find((item) => item.id === id)
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
        : [
            ...current,
            {
              ...candidate,
              detail:
                candidate.type === "PRODUCT" ? "Produto" : candidate.detail,
            },
          ],
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
  function setQuantity(id: string, quantity: number) {
    if (savingRef.current) return
    setItems((current) =>
      current.map((i) =>
        i.id === id &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 2147483647 &&
        (i.type !== "ROUTER" || quantity === 1) &&
        (movementType !== "Saída" || quantity <= (i.available ?? 0))
          ? { ...i, quantity }
          : i,
      ),
    )
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

  function changeMovementType(type: MovementType) {
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
  }

  function setClientCode(id: string, value: string) {
    if (!savingRef.current)
      setItems((current) =>
        current.map((i) => (i.id === id ? { ...i, clientCode: value } : i)),
      )
  }

  return {
    movementType,
    changeMovementType,
    technician,
    setTechnician,
    entryOrigin,
    setEntryOrigin,
    note,
    setNote,
    query,
    setQuery,
    items,
    setItems,
    submitted,
    setSubmitted,
    totalUnits,
    candidates,
    addItem,
    selectItem,
    changeQuantity,
    setQuantity,
    removeItem,
    setClientCode,
    registerMovement,
  }
}
