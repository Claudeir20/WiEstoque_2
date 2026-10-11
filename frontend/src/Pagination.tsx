import { useEffect, useState } from "react"

export function usePagination<T>(rows: T[], resetKey: string) {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  useEffect(() => {
    setPage(1)
  }, [resetKey, size])
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(page, pages)
  return {
    rows: rows.slice((current - 1) * size, current * size),
    control: (
      <Pagination
        page={current}
        pages={pages}
        total={rows.length}
        size={size}
        setPage={setPage}
        setSize={setSize}
      />
    ),
  }
}

function Pagination({
  page,
  pages,
  total,
  size,
  setPage,
  setSize,
}: {
  page: number
  pages: number
  total: number
  size: number
  setPage: (n: number) => void
  setSize: (n: number) => void
}) {
  return (
    <nav className="pagination" aria-label="Paginação da tabela">
      <span>
        {total} resultados · Página {page} de {pages}
      </span>
      <label>
        Por página{" "}
        <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {[20, 50, 100].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <button
        className="secondary-button"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        Anterior
      </button>
      <button
        className="secondary-button"
        disabled={page >= pages}
        onClick={() => setPage(page + 1)}
      >
        Próxima
      </button>
    </nav>
  )
}
