import { useRef, useState, type FormEvent } from "react"
import { api, ApiError } from "../api"

type UserResponse = { id: string; name: string; email: string }

export default function UserRegistration({
  onBusy,
}: {
  onBusy: (busy: boolean) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    setError("")
    setSuccess("")
    if (!name.trim() || !email.trim()) {
      setError("Informe o nome e o e-mail.")
      return
    }
    if (
      password.trim().length === 0 ||
      password.length < 8 ||
      new TextEncoder().encode(password).length > 72
    ) {
      setError(
        "A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes. Letras acentuadas podem ocupar mais de um byte.",
      )
      return
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.")
      return
    }
    pending.current = true
    setSaving(true)
    onBusy(true)
    try {
      const user = await api<UserResponse>(
        "/users",
        { name: name.trim(), email: email.trim(), password },
        "POST",
      )
      setSuccess(`Usuário ${user.name} (${user.email}) cadastrado com sucesso.`)
      setName("")
      setEmail("")
      setPassword("")
      setConfirmation("")
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 403
          ? "Somente administradores podem cadastrar usuários."
          : e instanceof ApiError && e.status === 409
            ? "Este e-mail já está cadastrado."
            : e instanceof Error
              ? e.message
              : "Não foi possível cadastrar o usuário.",
      )
    } finally {
      pending.current = false
      setSaving(false)
      onBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Cadastros</p>
          <h1>Cadastrar usuário</h1>
          <p className="page-description">
            Crie uma conta para acessar o WiEstoque. Cadastro disponível para
            administradores.
          </p>
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="success-banner" role="status">
          {success}
        </div>
      )}
      <form
        className="card settings-card"
        style={{ maxWidth: 640 }}
        onSubmit={submit}
      >
        <h2>Dados do usuário</h2>
        <fieldset
          disabled={saving}
          style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 20 }}
        >
          <label className="field">
            <span>Nome</span>
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="off"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small>Mínimo de 8 caracteres.</small>
          </label>
          <label className="field">
            <span>Confirmar senha</span>
            <input
              name="confirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <p className="text-sm text-muted">
            A nova conta terá acesso ao estoque. Ela não terá permissão para
            cadastrar outros usuários.
          </p>
          <button className="primary-button" type="submit">
            {saving ? "Cadastrando…" : "Cadastrar usuário"}
          </button>
        </fieldset>
      </form>
    </div>
  )
}
