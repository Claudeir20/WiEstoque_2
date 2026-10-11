import { useEffect, useRef, useState } from "react"
import { api } from "../api"

export type RemovalTarget = {
  kind: "products" | "routers" | "technicians"
  id: string
  name: string
  archive: boolean
}

export default function RemovalDialog({
  target,
  close,
  saved,
}: {
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
      await api(
        "/" +
          target.kind +
          "/" +
          target.id +
          (target.archive ? "/archive" : ""),
        target.archive ? {} : undefined,
        target.archive ? "POST" : "DELETE",
      )
      setDone(true)
      try {
        await saved()
      } catch {
        setError(
          "Operação concluída, mas a atualização falhou. Feche e use Atualizar dados.",
        )
        return
      }
      close()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível remover o item.",
      )
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="card removal-dialog"
      aria-labelledby="removal-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!pending.current) close()
      }}
    >
      <h2 id="removal-title">
        {target.kind === "technicians"
          ? target.archive
            ? "Arquivar técnico"
            : "Excluir técnico"
          : target.archive
            ? "Arquivar item"
            : "Excluir item"}
      </h2>
      <p className="removal-name">{target.name}</p>
      <p>
        {target.archive
          ? target.kind === "technicians"
            ? "O técnico ficará inativo e não poderá receber novas movimentações. O histórico será preservado."
            : "O item sairá do cadastro ativo e não poderá receber novas movimentações. O histórico será preservado."
          : "O cadastro será excluído permanentemente. Esta ação não pode ser desfeita."}
      </p>
      {error && (
        <p className="removal-error" role="alert">
          {error}
        </p>
      )}
      <div className="registration-actions">
        <button
          autoFocus
          className="secondary-button"
          disabled={saving}
          onClick={close}
        >
          {done ? "Fechar" : "Cancelar"}
        </button>
        {!done && (
          <button
            className="primary-button"
            disabled={saving}
            onClick={() => void confirm()}
          >
            {saving
              ? "Aguarde…"
              : target.archive
                ? "Confirmar arquivamento"
                : "Confirmar exclusão"}
          </button>
        )}
      </div>
    </dialog>
  )
}
