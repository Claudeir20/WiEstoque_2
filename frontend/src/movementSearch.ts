import type { Product, Router } from "./api"

export type SearchCandidate = {
  id: string; name: string; detail: string; type: "PRODUCT" | "ROUTER";
  quantity: number; available: number; exact: boolean
}
const fold = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const compactMac = (value: string) => value.replace(/[:.\-]/g, "")
export function searchMovementItems(products: Product[], routers: Router[], query: string, type: string): SearchCandidate[] {
  const q = fold(query)
  if (!q) return []
  const result: SearchCandidate[] = products.filter(p => p.active && fold(p.name).includes(q)).map(p => ({
    id: p.id, name: p.name, detail: "Material", type: "PRODUCT", quantity: 1, available: p.quantity, exact: fold(p.name) === q,
  }))
  if (type !== "Entrada") for (const r of routers) {
    const values = [r.assetNumber, r.serialNumber, r.model, r.mac].map(fold)
    const macMatches = /^[a-f0-9]{12}$/.test(compactMac(q)) && compactMac(fold(r.mac)) === compactMac(q)
    if (!values.some(v => v.includes(q)) && !macMatches) continue
    result.push({ id: r.id, name: r.model + " · " + r.assetNumber, detail: r.serialNumber,
      type: "ROUTER", quantity: 1, available: r.status === "IN_STOCK" ? 1 : 0,
      exact: values.includes(q) || macMatches })
  }
  return result.sort((a,b) => Number(b.exact) - Number(a.exact) || a.name.localeCompare(b.name, "pt-BR"))
}
export function candidateUnavailable(candidate: SearchCandidate, type: string, added: {id: string; quantity: number}[]): string {
  const quantity = added.find(i => i.id === candidate.id)?.quantity || 0
  if (candidate.type === "ROUTER") {
    if (quantity) return "Já adicionado"
    if (type === "Saída" && candidate.available !== 1) return "Fora do estoque"
    if (type === "Devolução" && candidate.available !== 0) return "Já está no estoque"
  } else if (type === "Saída" && quantity >= candidate.available) return candidate.available === 0 ? "Sem saldo" : "Saldo já adicionado"
  return ""
}
