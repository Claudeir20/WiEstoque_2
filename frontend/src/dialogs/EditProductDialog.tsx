import { useEffect, useRef, useState, type FormEvent } from "react"
import { api, type Product } from "../api"

export default function EditProductDialog({
  product,
  close,
  saved,
}: {
  product: Product
  close: () => void
  saved: () => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [name, setName] = useState(product.name)
  const [quantity, setQuantity] = useState(String(product.quantity))
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [auditError, setAuditError] = useState("")
  const [adjustments, setAdjustments] = useState<
    {
      id: string
      previousName: string
      newName: string
      previousQuantity: number
      newQuantity: number
      reason: string
      date: string
    }[]
  >([])
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    let cancelled = false
    api<typeof adjustments>(`/products/${product.id}/adjustments`)
      .then((data) => {
        if (!cancelled) setAdjustments(data)
      })
      .catch(() => {
        if (!cancelled)
          setAuditError("Não foi possível carregar o histórico de ajustes.")
      })
    return () => {
      cancelled = true
      element?.close()
    }
  }, [product.id])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending.current || done) return
    const value = Number(quantity)
    if (!name.trim() || name.trim().length > 255) {
      setError("Informe um nome com até 255 caracteres.")
      return
    }
    if (
      !/^\d+$/.test(quantity) ||
      !Number.isSafeInteger(value) ||
      value > 2147483647
    ) {
      setError("Informe uma quantidade inteira entre 0 e 2147483647.")
      return
    }
    if (value !== product.quantity && !reason.trim()) {
      setError("Informe o motivo do ajuste de estoque.")
      return
    }
    if (reason.trim().length > 255) {
      setError("O motivo deve ter até 255 caracteres.")
      return
    }
    pending.current = true
    setSaving(true)
    setError("")
    try {
      await api(
        `/products/${product.id}`,
        {
          name: name.trim(),
          quantity: value,
          reason: reason.trim(),
          version: product.version,
        },
        "PUT",
      )
      setDone(true)
      try {
        await saved()
        close()
      } catch {
        setError(
          "Alteração salva. Feche e use Atualizar dados para atualizar a tela.",
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.")
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  return (
    <dialog
      ref={dialog}
      className="card removal-dialog edit-product-dialog"
      aria-labelledby="edit-product-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!pending.current) close()
      }}
    >
      <h2 id="edit-product-title">Editar material</h2>
      <form onSubmit={(event) => void submit(event)}>
        <fieldset disabled={saving || done}>
          <label>
            Nome
            <input
              autoFocus
              value={name}
              maxLength={255}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Quantidade atual
            <input
              type="number"
              min="0"
              max="2147483647"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <p>
            Saldo anterior: {product.quantity}. Ajuste:{" "}
            {Number(quantity) - product.quantity > 0 ? "+" : ""}
            {Number(quantity) - product.quantity}.
          </p>
          <label>
            Motivo do ajuste
            <textarea
              maxLength={255}
              required={Number(quantity) !== product.quantity}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Obrigatório ao alterar a quantidade"
            />
          </label>
        </fieldset>
        {error && (
          <p className="removal-error" role="alert">
            {error}
          </p>
        )}
        <div className="registration-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={saving}
            onClick={close}
          >
            {done ? "Fechar" : "Cancelar"}
          </button>
          {!done && (
            <button className="primary-button" disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          )}
        </div>
      </form>
      <h3>Histórico de ajustes</h3>
      {auditError && <p role="alert">{auditError}</p>}
      {!auditError && !adjustments.length && <p>Nenhum ajuste registrado.</p>}
      {adjustments.map((a) => (
        <div className="product-adjustment" key={a.id}>
          <strong>{new Date(a.date).toLocaleDateString("pt-BR")}</strong>
          <p>
            {a.previousQuantity} → {a.newQuantity} (
            {a.newQuantity - a.previousQuantity > 0 ? "+" : ""}
            {a.newQuantity - a.previousQuantity}) — {a.reason}
          </p>
          {a.previousName !== a.newName && (
            <p>
              Nome: {a.previousName} → {a.newName}
            </p>
          )}
        </div>
      ))}
    </dialog>
  )
}
