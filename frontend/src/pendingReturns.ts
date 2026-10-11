import type { Movement, Router } from "./api"

export function pendingReturns(routers: Router[], movements: Movement[]) {
  return routers.filter(r => r.status === "OUT_OF_STOCK").map(router => {
    const history = movements.filter(m => m.items.some(i => i.routerId === router.id)).sort((a,b) => b.date.localeCompare(a.date))
    const latest = history[0]
    const tied = latest && history.filter(m => m.date === latest.date)
    const technicianId = latest?.type === "WITHDRAWAL" && tied?.every(m => m.type === latest.type && m.technicianId === latest.technicianId) ? latest.technicianId : null
    return { router, technicianId }
  })
}
