import { useEffect, useRef, useState, type FormEvent } from "react"
import { api, type Technician } from "../api"

export default function EditTechnicianDialog({ technician, close, saved }: { technician: Technician; close: () => void; saved: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [name, setName] = useState(technician.name)
  const [sector, setSector] = useState(technician.sector)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending.current || done) return
    if (!name.trim() || name.trim().length > 255 || !sector.trim() || sector.trim().length > 255) { setError("Informe nome e setor com até 255 caracteres cada."); return }
    pending.current = true; setSaving(true); setError("")
    try {
      await api(`/technicians/${technician.id}`, { name: name.trim(), sector: sector.trim(), expectedName: technician.name, expectedSector: technician.sector }, "PUT")
      setDone(true)
      try { await saved(); close() } catch { setError("Alteração salva. Feche e use Atualizar dados para atualizar a tela.") }
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar.") }
    finally { pending.current = false; setSaving(false) }
  }
  return <dialog ref={dialog} className="card removal-dialog edit-product-dialog" aria-labelledby="edit-technician-title" onCancel={event => { event.preventDefault(); if (!pending.current) close() }}>
    <h2 id="edit-technician-title">Editar técnico</h2>
    <form onSubmit={event => void submit(event)}>
      <fieldset disabled={saving || done}>
        <label>Nome<input autoFocus value={name} maxLength={255} required onChange={e => setName(e.target.value)} /></label>
        <label>Setor<input value={sector} maxLength={255} required onChange={e => setSector(e.target.value)} /></label>
      </fieldset>
      {error && <p className="removal-error" role="alert">{error}</p>}
      <div className="registration-actions">
        <button type="button" className="secondary-button" disabled={saving} onClick={close}>{done ? "Fechar" : "Cancelar"}</button>
        {!done && <button className="primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>}
      </div>
    </form>
  </dialog>
}
