import { useRef, useState, type FormEvent } from "react"

export type LoginCredentials = { username: string; password: string }
export type LoginProps = {
  onLogin?: (credentials: LoginCredentials) => Promise<void>
  onSuccess?: () => void
}

export default function Login({ onLogin, onSuccess }: LoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submitting = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    if (!username.trim() || !password) {
      setError("Informe seu E-mail e sua senha.")
      return
    }
    if (!onLogin) {
      setError("O acesso estará disponível após a integração com o servidor.")
      return
    }
    submitting.current = true
    setBusy(true)
    setError("")
    try {
      await onLogin({ username: username.trim(), password })
      setPassword("")
      onSuccess?.()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível entrar. Tente novamente.",
      )
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-label="WiEstoque">
        <div className="login-brand">
          <img src="/wiestoque.svg" alt="" />
          <strong>WiEstoque</strong>
        </div>
        <div>
          <span className="login-eyebrow">CONTROLE DE ESTOQUE · WiNET</span>
          <h1>
            Seu estoque.
            <br />
            Tudo no lugar.
          </h1>
          <p>
            Organize materiais, acompanhe roteadores e mantenha cada
            movimentação registrada.
          </p>
          <div className="login-feature">
            <span aria-hidden="true">✓</span> Materiais e equipamentos
            organizados
          </div>
          <div className="login-feature">
            <span aria-hidden="true">✓</span> Histórico de retiradas e
            devoluções
          </div>
        </div>
        <small>WiEstoque · Gestão de estoque WiNET</small>
      </section>
      <section className="login-form-side">
        <div className="login-panel">
          <img
            className="login-mobile-logo"
            src="/wiestoque.svg"
            alt="WiEstoque"
          />
          <span className="login-eyebrow">BEM-VINDO AO WIESTOQUE</span>
          <h2>Acesse sua conta</h2>
          <p>Informe seus dados para entrar no sistema.</p>
          <form onSubmit={submit} aria-label="Acessar o WiEstoque">
            <label htmlFor="login-username">E-mail</label>
            <input
              id="login-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              autoFocus
              disabled={busy}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError("")
              }}
              placeholder="Digite seu E-mail"
            />
            <label htmlFor="login-password">Senha</label>
            <div className="login-password">
              <input
                id="login-password"
                name="password"
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                required
                disabled={busy}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                disabled={busy}
                aria-controls="login-password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="primary-button login-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? "Entrando…" : "Entrar"}
            </button>
          </form>
          <p className="login-help">
            Precisa de acesso? Fale com o responsável pelo sistema.
          </p>
        </div>
        <small className="login-footer">WiNET · Controle de estoque</small>
      </section>
    </main>
  )
}
