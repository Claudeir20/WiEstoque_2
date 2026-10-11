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


type CsrfResponse= {
  headerName: string
  token: string
}

export class ApiError extends Error {
  constructor(message: string, public  status: number) {
    super(message);
  }
}

async function getCsrf(): Promise<CsrfResponse> {
  const response = await fetch(`${base}/auth/csrf`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new ApiError("Não foi possível obter o token.", response.status)
  }

  return response.json()
}



export async function api<T>(
    endpoint: string,
    body?: unknown,
    method?: "GET" | "POST" | "PUT" | "DELETE",
): Promise<T> {
  const verb = method ?? (body === undefined ? "GET" : "POST")
  const headers: Record<string, string> = {}

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  if (verb !== "GET") {
    const csrf = await getCsrf()
    headers[csrf.headerName] = csrf.token
  }

  const response = await fetch(base + endpoint, {
    method: verb,
    credentials: "include",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("session-expired"))
    }

    const error = await response.json().catch(() => ({}))

    throw new ApiError(
        error.message || "Não foi possível concluir a operação.",
        response.status,
    )
  }

  if (response.status === 204) return undefined as T

  return response.json()
}

export async function login(email: string, password: string) {
  const csrf = await getCsrf()

  const response = await fetch(`${base}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      [csrf.headerName]: csrf.token,
    },
    body: new URLSearchParams({
      email: email.trim(),
      password,
    }),
  })

  if (!response.ok) {
    throw new ApiError(
        response.status === 401
            ? "E-mail ou senha incorretos."
            : "Não foi possível entrar.",
        response.status,
    )
  }

  await getCsrf()
}
export async function logout(): Promise<void> {
  try {
    await api<void>("/auth/logout", undefined, "POST")
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error
  }
  window.dispatchEvent(new Event("session-expired"))
}