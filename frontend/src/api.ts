export type Product = {
  id: string
  version: number
  name: string
  quantity: number
  hasAdjustments?: boolean
  minimumQuantity: number
  active: boolean
}
export type Router = {
  id: string
  model: string
  assetNumber: string
  serialNumber: string
  mac: string
  status: "IN_STOCK" | "OUT_OF_STOCK"
}
export type Technician = {
  id: string
  name: string
  sector: string
  active: boolean
}
export type Movement = {
  id: string
  technicianId: string | null
  technicianName: string
  type: "WITHDRAWAL" | "RETURN" | "ENTRY"
  date: string
  observation: string | null
  items: {
    type: "PRODUCT" | "ROUTER"
    productId: string | null
    routerId: string | null
    productName: string | null
    model: string | null
    assetNumber: string | null
    quantity: number
  }[]
}
const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "")
export async function api<T>(endpoint: string, body?: unknown, method?: "GET" | "POST" | "DELETE" | "PUT"): Promise<T> {
  let response: Response
  try {
    response = await fetch(base + endpoint, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique se o backend está em execução.",
    )
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "Não foi possível concluir a operação.")
  }
  return response.json()
}
