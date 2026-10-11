import Icon from "../components/Icon"
import { Badge, PageHeader } from "../components/ui"

export type TechnicianRow = {
  id: string
  name: string
  initials: string
  route: string
  status: string
}
export default function TechniciansView({
  technicians, reactivate,
  edit, remove, hasHistory, busy,
  create,
}: {
  edit: (id: string) => void
  remove: (id: string) => void
  hasHistory: (id: string) => boolean
  busy: boolean
  technicians: TechnicianRow[]
  reactivate: (id: string) => void
  create: () => void
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Equipe"
        title="Técnicos"
        description="Consulte os técnicos cadastrados e seus setores."
        action={
          <button className="primary-button" onClick={create}>
            <Icon name="plus" size={18} /> Novo técnico
          </button>
        }
      />
      <div className="people-grid">
        {technicians.map((person) => (
          <article className="card person-card" key={person.id}>
            <div className="person-top">
              <span className="avatar avatar-large">{person.initials}</span>
              <Badge tone={person.status === "Ativo" ? "success" : "neutral"}>
                {person.status}
              </Badge>
            </div>
            <h2>{person.name}</h2>
            <p>{person.route}</p>
            <div className="registration-actions">
              {person.status !== "Ativo" && <button className="secondary-button" disabled={busy} onClick={() => reactivate(person.id)}>Reativar</button>}
              <button className="secondary-button" disabled={busy || person.status !== "Ativo"} onClick={() => edit(person.id)}>Editar</button>
              <button className="secondary-button removal-button" disabled={busy || (person.status !== "Ativo" && hasHistory(person.id))} onClick={() => remove(person.id)}>
                {hasHistory(person.id) ? person.status === "Ativo" ? "Arquivar" : "Arquivado" : "Excluir"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
