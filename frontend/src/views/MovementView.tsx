import { useEffect, useRef, useState, type FormEvent } from "react"
import { type Technician } from "../api"
import Icon from "../components/Icon"
import { Badge, QuantityInput } from "../components/ui"
import { candidateUnavailable, type SearchCandidate } from "../movementSearch"
import { pendingReturns } from "../pendingReturns"
import { type MovementItem, type MovementType } from "../types"

export type MovementProps = {
  pending: ReturnType<typeof pendingReturns>
  setQuantity: (id: string, quantity: number) => void
  technicianData: Technician[]
  saving: boolean
  technician: string
  setTechnician: (value: string) => void
  entryOrigin: string
  setEntryOrigin: (value: string) => void
  movementType: MovementType
  setMovementType: (value: MovementType) => void
  note: string
  setNote: (value: string) => void
  query: string
  setQuery: (value: string) => void
  items: MovementItem[]
  candidates: SearchCandidate[]
  selectItem: (id: string) => void
  addItem: (event: FormEvent) => void
  changeQuantity: (id: string, delta: number) => void
  removeItem: (id: string) => void
  setClientCode: (id: string, value: string) => void
  totalUnits: number
  submitted: boolean
  registerMovement: () => void
  dismissSuccess: () => void
}

export default function MovementView(props: MovementProps) {
  const searchInput = useRef<HTMLInputElement>(null)
  const [highlighted, setHighlighted] = useState(-1)
  const [resultsOpen, setResultsOpen] = useState(true)
  const shownCandidates = props.candidates.slice(0, 20)
  const choose = (id: string) => {
    props.selectItem(id)
    setHighlighted(-1)
    searchInput.current?.focus()
  }
  useEffect(() => {
    setHighlighted(-1)
    setResultsOpen(true)
  }, [props.query, props.movementType])
  function searchKey(event: import("react").KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setResultsOpen(false)
      setHighlighted(-1)
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setResultsOpen(true)
      const direction = event.key === "ArrowDown" ? 1 : -1
      for (let step = 1; step <= shownCandidates.length; step++) {
        const base = highlighted === -1 && direction === -1 ? 0 : highlighted
        const index =
          (base + direction * step + shownCandidates.length) %
          shownCandidates.length
        if (
          !candidateUnavailable(
            shownCandidates[index],
            props.movementType,
            props.items,
          )
        ) {
          setHighlighted(index)
          break
        }
      }
    }
    if (
      event.key === "Enter" &&
      resultsOpen &&
      highlighted >= 0 &&
      shownCandidates[highlighted]
    ) {
      event.preventDefault()
      choose(shownCandidates[highlighted].id)
    }
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Movimentações</p>
          <h1>Nova movimentação</h1>
          <p className="page-description">
            Registre saídas, devoluções ou entradas de novos materiais no
            estoque.
          </p>
        </div>
        <Badge tone="neutral">{new Date().toLocaleDateString("pt-BR")}</Badge>
      </div>

      {props.submitted && (
        <div className="success-banner" role="status">
          <span className="success-icon">
            <Icon name="check" />
          </span>
          <div>
            <p className="font-semibold text-ink">
              {props.movementType} registrada com sucesso
            </p>
            <p className="text-sm text-muted">
              Movimentação salva no servidor.
            </p>
          </div>
          <button
            className="icon-button ml-auto"
            onClick={props.dismissSuccess}
            aria-label="Fechar aviso"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      <div className="movement-layout">
        <section className="card settings-card">
          <div className="card-header">
            <span className="step-number">1</span>
            <div>
              <h2>Dados da movimentação</h2>
              <p>
                {props.movementType === "Entrada"
                  ? "Informe a origem dos novos materiais."
                  : "Defina o responsável e o tipo."}
              </p>
            </div>
          </div>

          {props.movementType === "Entrada" ? (
            <label className="field">
              <span>Origem da entrada</span>
              <select
                disabled={props.saving}
                value={props.entryOrigin}
                onChange={(event) => props.setEntryOrigin(event.target.value)}
              >
                <option>Compra para reposição</option>
                <option>Compra de novo material</option>
                <option>Ajuste de inventário</option>
              </select>
            </label>
          ) : (
            <label className="field">
              <span>Técnico</span>
              <select
                disabled={props.saving}
                value={props.technician}
                onChange={(event) => props.setTechnician(event.target.value)}
              >
                <option value="">Selecione um técnico</option>
                {props.technicianData
                  .filter((t) => t.active)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <fieldset className="field">
            <legend>Tipo</legend>
            <div className="segmented">
              {(["Saída", "Devolução", "Entrada"] as MovementType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={props.saving}
                    className={
                      props.movementType === type ? "segment-active" : ""
                    }
                    onClick={() => props.setMovementType(type)}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <label className="field">
            <span>Observação</span>
            <textarea
              disabled={props.saving}
              maxLength={props.movementType === "Entrada" ? 200 : 255}
              rows={3}
              value={props.note}
              onChange={(event) => props.setNote(event.target.value)}
            />
          </label>
        </section>

        <section className="card items-card">
          <div className="card-header">
            <span className="step-number">2</span>
            <div>
              <h2>Itens da movimentação</h2>
              <p>
                {props.movementType === "Entrada"
                  ? "Busque um material já cadastrado. Cadastre novos materiais na tela de estoque."
                  : "Busque por patrimônio, série ou produto."}
              </p>
            </div>
          </div>

          {props.movementType === "Devolução" && (
            <section className="pending-returns">
              <h3>Roteadores por técnico</h3>
              <p>
                Lista baseada na última saída registrada. Selecione o técnico
                responsável para adicionar uma devolução.
              </p>
              {props.technician &&
                props.pending
                  .filter((p) => p.technicianId === props.technician)
                  .map(({ router }) => (
                    <button
                      key={router.id}
                      className="secondary-button"
                      disabled={
                        props.saving ||
                        props.items.some((i) => i.id === router.id)
                      }
                      onClick={() => choose(router.id)}
                    >
                      {router.model} · {router.assetNumber} — Adicionar
                    </button>
                  ))}
              {props.technician &&
                !props.pending.some(
                  (p) => p.technicianId === props.technician,
                ) && (
                  <p>
                    Nenhum roteador pendente identificado para este técnico.
                  </p>
                )}
              {props.pending.some((p) => !p.technicianId) && (
                <p>
                  {props.pending.filter((p) => !p.technicianId).length}{" "}
                  roteadores fora do estoque sem técnico identificado no
                  histórico. Use a busca para localizar o equipamento.
                </p>
              )}
            </section>
          )}
          <form
            className="search-form"
            onSubmit={(event) => {
              props.addItem(event)
              searchInput.current?.focus()
            }}
          >
            <label className="search-field">
              <span className="sr-only">
                {props.movementType === "Entrada"
                  ? "Nome do material"
                  : "Patrimônio, série ou produto"}
              </span>
              <Icon name="search" size={19} />
              <input
                ref={searchInput}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={
                  resultsOpen &&
                  !!props.query.trim() &&
                  shownCandidates.length > 0
                }
                aria-controls="movement-search-results"
                aria-activedescendant={
                  highlighted >= 0 && resultsOpen
                    ? "search-option-" + highlighted
                    : undefined
                }
                onKeyDown={searchKey}
                onFocus={() => setResultsOpen(true)}
                autoComplete="off"
                disabled={props.saving}
                value={props.query}
                onChange={(event) => props.setQuery(event.target.value)}
                placeholder={
                  props.movementType === "Entrada"
                    ? "Ex.: Cabo drop"
                    : "Ex.: PAT-001 ou Cabo UTP"
                }
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={props.saving}
            >
              <Icon name="plus" size={18} /> Adicionar
            </button>
          </form>

          <p className="search-help">
            Digite ou leia o código e pressione Enter. Use ↑ ↓ para escolher um
            resultado.
          </p>
          {resultsOpen && props.query.trim() && (
            <div
              className="search-results"
              id="movement-search-results"
              role="listbox"
              aria-label="Resultados da busca"
            >
              <p className="search-results-count" role="status">
                {props.candidates.length
                  ? `${props.candidates.length} resultado(s)`
                  : "Nenhum resultado. Confira o nome ou código."}
              </p>
              {shownCandidates.map((candidate, index) => {
                const blocked = candidateUnavailable(
                  candidate,
                  props.movementType,
                  props.items,
                )
                return (
                  <button
                    type="button"
                    role="option"
                    id={"search-option-" + index}
                    aria-selected={highlighted === index}
                    className={
                      "search-result " +
                      (highlighted === index ? "search-result-selected" : "")
                    }
                    key={candidate.id}
                    disabled={props.saving || !!blocked}
                    onClick={() => choose(candidate.id)}
                  >
                    <span>
                      <strong>{candidate.name}</strong>
                      <small>
                        {candidate.type === "PRODUCT"
                          ? "Material"
                          : "Roteador · " + candidate.detail}
                      </small>
                    </span>
                    <span className="search-result-balance">
                      {blocked ||
                        (candidate.type === "PRODUCT"
                          ? `${candidate.available} em estoque`
                          : candidate.available
                            ? "No estoque"
                            : "Fora do estoque")}
                    </span>
                  </button>
                )
              })}
              {props.candidates.length > 20 && (
                <p className="search-help">
                  Exibindo os primeiros 20. Digite mais para refinar a busca.
                </p>
              )}
            </div>
          )}
          <div className="item-list">
            {props.items.length === 0 ? (
              <div className="movement-empty">
                <Icon name="box" size={32} />
                <h3>Nenhum item adicionado</h3>
                <p>Busque um material ou roteador acima para começar.</p>
              </div>
            ) : (
              props.items.map((item) => (
                <div className="movement-item" key={item.id}>
                  <span
                    className={`item-icon ${
                      item.detail === "Produto" ||
                      item.detail === "Novo material"
                        ? ""
                        : "item-icon-router"
                    }`}
                  >
                    <Icon
                      name={
                        item.detail === "Produto" ||
                        item.detail === "Novo material"
                          ? "box"
                          : "router"
                      }
                      size={20}
                    />
                  </span>
                  <div className="item-copy">
                    <p>{item.name}</p>
                    <span>
                      {item.detail}
                      {item.available !== undefined
                        ? ` · ${item.available} disponíveis`
                        : ""}
                    </span>
                    {item.type === "ROUTER" &&
                      props.movementType === "Saída" && (
                        <label className="field">
                          <span>Código do cliente (opcional)</span>
                          <input
                            maxLength={255}
                            disabled={props.saving}
                            value={item.clientCode || ""}
                            onChange={(e) =>
                              props.setClientCode(item.id, e.target.value)
                            }
                          />
                        </label>
                      )}
                  </div>
                  <div
                    className="quantity-control"
                    aria-label={`Quantidade de ${item.name}`}
                  >
                    <button
                      disabled={props.saving}
                      onClick={() => props.changeQuantity(item.id, -1)}
                      aria-label="Diminuir quantidade"
                    >
                      <Icon name="minus" size={15} />
                    </button>
                    {item.type === "ROUTER" ? (
                      <span>1</span>
                    ) : (
                      <QuantityInput
                        value={item.quantity}
                        max={
                          props.movementType === "Saída"
                            ? (item.available ?? 0)
                            : 2147483647
                        }
                        disabled={props.saving}
                        change={(n) => props.setQuantity(item.id, n)}
                      />
                    )}
                    <button
                      disabled={
                        props.saving ||
                        item.type === "ROUTER" ||
                        (props.movementType === "Saída" &&
                          item.quantity >= (item.available || 0))
                      }
                      onClick={() => props.changeQuantity(item.id, 1)}
                      aria-label="Aumentar quantidade"
                    >
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                  <button
                    className="delete-button"
                    disabled={props.saving}
                    onClick={() => props.removeItem(item.id)}
                    aria-label={`Remover ${item.name}`}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="card-footer">
            <div>
              <p className="text-sm text-muted">Resumo</p>
              <p className="font-semibold text-ink">
                {props.items.length}{" "}
                {props.items.length === 1 ? "item" : "itens"} ·{" "}
                {props.totalUnits} unidades
              </p>
            </div>
            <button
              className="primary-button primary-large"
              disabled={
                !props.items.length ||
                props.saving ||
                (props.movementType !== "Entrada" && !props.technician)
              }
              onClick={props.registerMovement}
            >
              {props.saving
                ? "Salvando…"
                : "Registrar " + props.movementType.toLowerCase()}{" "}
              <Icon name="chevron" size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
