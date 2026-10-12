# Desempenho e disponibilidade — diagnóstico e plano

Registro do diagnóstico feito em 12/10/2026, a partir de um travamento ao salvar uma movimentação depois de um período sem uso. Este documento descreve as causas encontradas e um roteiro para implementar as melhorias. **Nada aqui foi implementado ainda.**

## Ambiente

| Item | Situação |
| --- | --- |
| Aplicação | Render, plano gratuito (0,1 CPU, 512 MB), região Frankfurt |
| Banco | Neon (PostgreSQL), plano gratuito, região Frankfurt |
| Sessão de login | Em memória na instância (`JSESSIONID`), expira após 30 min sem uso |

## O que foi observado

1. Ao salvar uma saída, o botão ficou em "Salvando…" por mais de 3 minutos. Depois de atualizar a página, foi preciso fazer login de novo.
2. Na aba Rede do navegador, ao voltar ao site depois de um tempo parado:
   - o documento principal respondeu **503** com a página de espera do Render, que fica consultando o serviço até ele ligar;
   - depois de ligado, `GET /auth/me` respondeu **401** (sessão perdida).
3. Tempos medidos logo após o login, com o sistema recém-ligado e já "quente":

| Requisição | Recém-ligado | Quente |
| --- | --- | --- |
| `POST /auth/login` | 4,79 s | 1,26 s |
| `GET /routers` | 5,34 s | 939 ms |
| `GET /movements` | 4,84 s | 1,25 s |
| `GET /products` | 2,24 s | 847 ms |
| `GET /technicians` | 1,43 s | 739 ms |
| `GET /auth/csrf`, `GET /auth/me` | ~170–440 ms | ~170 ms |

## Causas

| Sintoma | Causa | Onde |
| --- | --- | --- |
| Espera de minutos e 503 | O plano gratuito do Render desliga a instância após ~15 min sem acesso; ligar o Spring Boot com 0,1 CPU leva minutos (cold start) | Plano do Render |
| "Salvando…" sem fim | O front-end não tem tempo limite nas requisições | `frontend/src/api.ts` |
| Logout após reinício (401) | A sessão fica na memória da instância e é perdida quando ela reinicia (aplicação *stateful*) | `SecurityConfig.java`, sessão padrão do Spring |
| Primeiras requisições de 4–5 s | JVM ainda não otimizada (JIT) e banco do Neon acordando | Cold start |
| Requisições "quentes" de 0,7–1,2 s | 0,1 CPU dividido entre as chamadas paralelas da tela inicial | Plano do Render |
| Piso de ~170 ms por requisição | Distância Brasil ↔ Frankfurt | Região (aceitável) |

Descartado: distância entre aplicação e banco (os dois estão em Frankfurt). Mudar ambos para os EUA economizaria ~50 ms por requisição e não compensa a migração do banco. O Render não tem região no Brasil.

## Roteiro de melhorias

Ordem sugerida. Cada item pode ser feito em uma branch e um pull request separados.

### 1. Tempo limite nas requisições (frontend)

**Objetivo:** nunca deixar um botão em "Salvando…" indefinidamente.

- Em `frontend/src/api.ts`, usar `AbortController` (ou `AbortSignal.timeout(ms)`) no `fetch` de `api()` e de `getCsrf()`. Sugestão: 30 s.
- Ao estourar o tempo, lançar `ApiError` com mensagem clara, por exemplo: *"O servidor demorou para responder. Confira no Histórico se a operação foi registrada antes de tentar de novo."*
- Teste: simular um servidor lento (DevTools → Rede → limitação, ou um endpoint de teste) e verificar que a mensagem aparece e o botão é liberado.

### 2. Aviso "Reconectando…" ao voltar à aba (frontend)

**Objetivo:** a espera acontece antes do clique, e o usuário entende o motivo.

- Ouvir `visibilitychange`; se a aba ficou oculta por mais de ~10 min, chamar `GET /auth/me` e mostrar um aviso discreto ("Reconectando ao servidor…") até a resposta chegar.
- Se a resposta for 401, seguir o fluxo atual de sessão expirada (`session-expired`).

### 3. Sessão no banco — aplicação *stateless* (backend)

**Objetivo:** reinícios da instância (repouso, deploy, falha) deixam de deslogar os usuários.

1. **Dependência:** adicionar o Spring Session JDBC no `backend/pom.xml`. No Spring Boot 4 a configuração automática do Spring Session fica em módulo próprio; confirmar o nome do artefato/starter na documentação da versão em uso (4.1.x).
2. **Migração Flyway** (`backend/src/main/resources/db/migration/V9__spring_session.sql`): criar as tabelas `SPRING_SESSION` e `SPRING_SESSION_ATTRIBUTES` e seus índices, copiando o script oficial para PostgreSQL do Spring Session (`schema-postgresql.sql`, dentro do jar `spring-session-jdbc`). Não editar migrações já aplicadas.
3. **Propriedades** (`application.properties` e `application-prod.properties`):
   ```properties
   spring.session.jdbc.initialize-schema=never
   ```
   `server.servlet.session.timeout=30m` continua valendo como prazo de inatividade.
4. **Logout** em `SecurityConfig.java`: o cookie passa a se chamar `SESSION`. Trocar `.deleteCookies("JSESSIONID")` por `.deleteCookies("SESSION")`.
5. **Pontos de atenção:**
   - Tudo que vai para a sessão precisa ser `Serializable`. Hoje o principal é o `User` do próprio Spring (via `UserDetailsServiceImpl`), que já é.
   - Cada requisição passa a ler a sessão no banco (alguns milissegundos a mais).
   - Na implantação, todos precisam fazer login uma vez (o nome do cookie muda).
6. **Como verificar:**
   - Local: fazer login, reiniciar o backend e atualizar a página — deve continuar logado.
   - No banco: `SELECT session_id, principal_name, to_timestamp(expiry_time/1000) FROM spring_session;` mostra a sessão ativa. Apagar a linha deve deslogar.
   - No Render: fazer login, usar *Manual Deploy → Restart* e atualizar — deve continuar logado.
   - Teste automatizado: login, nova requisição com o mesmo cookie após recriar o contexto, esperando 200 em `/auth/me`.

### 4. Proteção contra lançamento duplicado (backend + frontend)

**Objetivo:** tentar de novo depois de um erro de rede nunca registra a mesma movimentação duas vezes.

- O front gera um identificador único (`crypto.randomUUID()`) ao abrir o formulário e o envia em `POST /movements` (por exemplo, no cabeçalho `Idempotency-Key`).
- O backend grava a chave junto com a movimentação, com restrição `UNIQUE` (nova migração). Se a mesma chave chegar de novo, devolve a movimentação já criada em vez de criar outra.
- Teste: enviar o mesmo pedido duas vezes e verificar uma única movimentação e um único desconto no saldo.

### 5. Paginação no servidor (backend + frontend) — mais adiante

**Objetivo:** manter as telas rápidas conforme os dados crescem.

- `GET /movements` (`MovementService.findAll`, `MovementService.java:86`) devolve todas as movimentações desde o início. Passar a aceitar página, tamanho e filtros (técnico, tipo, período) e devolver apenas a página pedida.
- `GET /routers` (`RouterService.findAll`, `RouterService.java:55`) busca todos os roteadores e filtra os arquivados em memória. Fazer o filtro `active = true` na própria consulta do repositório.
- Ajustar as telas que hoje paginam no navegador para pedir as páginas ao servidor.

## Fora do código

| Opção | Custo | Efeito |
| --- | --- | --- |
| Render **Starter** (Settings → Instance Type) | US$ 7/mês | Instância não dorme; 0,5 CPU (5× mais que o gratuito). Manter o workspace no plano Hobby — o plano Pro (US$ 25/mês) é para equipes e não é necessário |
| Monitor externo (ex.: UptimeRobot acessando o site a cada 10 min) | Grátis | Na prática evita o repouso; depende de um serviço de terceiros |

Os itens 1 a 4 continuam úteis mesmo com o Starter, porque deploys e reinícios também derrubam a instância.

## Para estudar

- *Stateful* × *stateless*, *sticky sessions* e JWT (por que, aqui, sessão no banco é a opção mais simples e segura).
- Cold start e JIT da JVM; CDS/AppCDS e imagem nativa (GraalVM) para reduzir o tempo de inicialização.
- Escala vertical (máquina maior) × horizontal (mais instâncias) e por que a segunda exige aplicação *stateless*.
- Virtual threads (Java 21, `spring.threads.virtual.enabled=true`): aumentam a capacidade de atender muitas requisições que esperam I/O; não resolvem cold start nem perda de sessão.
