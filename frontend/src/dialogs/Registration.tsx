import { useRef, useState, type FormEvent } from "react"
import { api } from "../api"
import { formatMac, normalizeMac, normalizeSerial } from "../routerIdentifiers"

export default function Registration({
  kind,
  close,
  saved,
}: {
  kind: "products" | "technicians" | "routers"
  close: () => void
  saved: () => Promise<void>
}) {
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const [persisted, setPersisted] = useState(false)
  const fields =
    kind === "products"
      ? [
          ["name", "Nome"],
          ["quantity", "Quantidade inicial"],
          ["minimumQuantity", "Estoque mínimo"],
        ]
      : kind === "technicians"
        ? [
            ["name", "Nome"],
            ["sector", "Setor"],
          ]
        : [
            ["assetNumber", "Patrimônio"],
            ["model", "Modelo"],
            ["serialNumber", "Número de série"],
            ["mac", "MAC"],
          ]
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending.current || persisted) return
    const data: Record<string, unknown> = Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    )
    if (kind === "products") {
      data.quantity = Number(data.quantity)
      data.minimumQuantity = Number(data.minimumQuantity)
    }
    if (kind === "routers") {
      try {
        data.serialNumber = normalizeSerial(String(data.serialNumber ?? ""))
        data.mac = normalizeMac(String(data.mac ?? ""))
      } catch (e) {
        setError(e instanceof Error ? e.message : "MAC inválido.")
        return
      }
    }
    pending.current = true
    setSaving(true)
    setError("")
    try {
      await api("/" + kind, data)
      setPersisted(true)
      try {
        await saved()
      } catch {
        setError(
          "Cadastro salvo, mas a atualização falhou. Feche e use Atualizar dados.",
        )
        return
      }
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao cadastrar.")
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  return (
    <div className="registration-overlay">
      <section
        className="card registration-card"
        role="dialog"
        aria-modal="true"
        aria-label="Novo cadastro"
      >
        <h2>
          {kind === "products"
            ? "Cadastrar material"
            : kind === "technicians"
              ? "Novo técnico"
              : "Cadastrar roteador"}
        </h2>
        <form onSubmit={submit}>
          {fields.map(([name, label]) => (
            <label className="field" key={name}>
              <span>{label}</span>
              <input
                name={name}
                autoFocus={fields[0][0] === name}
                autoComplete="off"
                onKeyDown={(event) => {
                  if (kind !== "routers" || event.key !== "Enter") return
                  event.preventDefault()
                  if (!event.currentTarget.reportValidity()) return
                  const inputs = Array.from(
                    event.currentTarget.form?.querySelectorAll<HTMLInputElement>(
                      "input",
                    ) || [],
                  )
                  const next = inputs[inputs.indexOf(event.currentTarget) + 1]
                  if (next) next.focus()
                  else
                    event.currentTarget.form
                      ?.querySelector<HTMLButtonElement>(
                        'button[type="submit"]',
                      )
                      ?.focus()
                }}
                onChange={(event) => {
                  if (kind === "routers" && name === "serialNumber") {
                    event.currentTarget.value =
                      event.currentTarget.value.toUpperCase()
                  }
                  if (kind === "routers" && name === "mac") {
                    event.currentTarget.value = formatMac(
                      event.currentTarget.value,
                    )
                  }
                }}
                onBlur={(event) => {
                  if (
                    kind === "routers" &&
                    name === "serialNumber" &&
                    event.currentTarget.value.trim()
                  ) {
                    event.currentTarget.value = normalizeSerial(
                      event.currentTarget.value,
                    )
                  }
                }}
                required
                maxLength={255}
                type={
                  name.includes("Quantity") || name === "quantity"
                    ? "number"
                    : "text"
                }
                min={name === "quantity" ? 0 : 1}
                disabled={saving}
              />
            </label>
          ))}
          {error && <p role="alert">{error}</p>}
          <div className="registration-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={saving}
              onClick={close}
            >
              {persisted ? "Fechar" : "Cancelar"}
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || persisted}
            >
              {saving ? "Salvando…" : "Cadastrar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
