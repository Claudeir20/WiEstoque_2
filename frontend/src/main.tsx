import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import Login from "./Login"
import { api, login, logout, ApiError } from "./api"
import "./index.css"

function AuthApp() {
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const expired = () => { setAuthenticated(false); setEmail("") }
    window.addEventListener("session-expired", expired)

    api<{ email: string }>("/auth/me")
        .then((session) => {
          if (active) { setEmail(session.email); setAuthenticated(true) }
        })
        .catch((e) => {
          if (active && !(e instanceof ApiError && e.status === 401)) {
            setError("Não foi possível conectar ao servidor.")
          }
        })
        .finally(() => {
          if (active) setLoading(false)
        })

    return () => {
      active = false
      window.removeEventListener("session-expired", expired)
    }
  }, [])

  if (loading) return <p>Verificando acesso…</p>

  if (error) {
    return (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
    )
  }

  if (!authenticated) {
    return (
        <Login
            onLogin={async ({ username, password }) => {
              await login(username, password)
              const session = await api<{ email: string }>("/auth/me")
              setEmail(session.email)
            }}
            onSuccess={() => setAuthenticated(true)}
        />
    )
  }

  return <App email={email} onLogout={logout} />
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AuthApp />
    </React.StrictMode>,
)