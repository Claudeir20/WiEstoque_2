import type { Movement } from "./api"

export type HistoryFilters = {
  technicianId: string
  startDate: string
  endDate: string
  itemId: string
  type: Movement["type"] | ""
}

export function itemKey(item: Movement["items"][number]): string {
  return item.type === "PRODUCT" ? "PRODUCT:" + item.productId : "ROUTER:" + item.routerId
}

export function itemLabel(item: Movement["items"][number]): string {
  return item.type === "PRODUCT" ? item.productName || "Material" : (item.model || "Roteador") + " · " + (item.assetNumber || "Sem patrimônio")
}

export function filterHistory(movements: Movement[], filters: HistoryFilters): Movement[] {
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) return []
  return movements.filter(m => {
    // The API returns LocalDateTime: compare calendar dates without UTC conversion.
    const day = m.date.slice(0, 10)
    return (!filters.technicianId || m.technicianId === filters.technicianId)
      && (!filters.startDate || day >= filters.startDate)
      && (!filters.endDate || day <= filters.endDate)
      && (!filters.type || m.type === filters.type)
  }).map(m => ({ ...m, items: m.items.filter(i => !filters.itemId || itemKey(i) === filters.itemId) }))
    .filter(m => m.items.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function summarizeHistory(movements: Movement[]) {
  const groups = new Map<string, { key: string; technician: string; item: string; withdrawals: number; returns: number; entries: number; net: number }>()
  for (const movement of movements) {
    for (const item of movement.items) {
      const key = JSON.stringify([movement.technicianId, itemKey(item)])
      const row = groups.get(key) || { key, technician: movement.technicianName, item: itemLabel(item), withdrawals: 0, returns: 0, entries: 0, net: 0 }
      if (movement.type === "WITHDRAWAL") row.withdrawals += item.quantity
      if (movement.type === "RETURN") row.returns += item.quantity
      if (movement.type === "ENTRY") row.entries += item.quantity
      row.net = row.withdrawals - row.returns
      groups.set(key, row)
    }
  }
  return [...groups.values()].sort((a, b) => a.technician.localeCompare(b.technician, "pt-BR") || a.item.localeCompare(b.item, "pt-BR"))
}
