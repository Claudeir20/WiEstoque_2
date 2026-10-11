

export type View = "painel" | "movimentacao" | "estoque" | "historico" | "tecnicos" | "roteadores" | "usuarios"
export type MovementType = "Saída" | "Devolução" | "Entrada"

export type MovementItem = {
  id: string
  name: string
  detail: string
  quantity: number
  available?: number
  type: "PRODUCT" | "ROUTER"
  clientCode?: string
}
