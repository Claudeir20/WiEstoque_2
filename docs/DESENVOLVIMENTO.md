# Desenvolvimento

Como executar o projeto localmente está no [README](../README.md#executar-localmente). Este documento reúne os detalhes técnicos.

## Arquitetura

**navegador → frontend React → API Spring Boot → PostgreSQL**

O backend segue camadas: controllers recebem as requisições, services orquestram e as entidades guardam as regras de negócio (por exemplo, `Product.edit`, `Product.subtractQuantity` e `Router.withdraw`). Os repositories ficam fora das entidades.

Em produção, o frontend compilado é servido pelo próprio backend, no mesmo domínio. No desenvolvimento, o Vite encaminha `/api/*` para o backend, removendo o prefixo `/api`.

## API

| Método | Rota | Operação |
| --- | --- | --- |
| GET | `/auth/csrf` | Token CSRF (público) |
| POST | `/auth/login` | Login com `email` e `password` (formulário) |
| POST | `/auth/logout` | Encerra a sessão |
| GET | `/auth/me` | Usuário da sessão |
| POST | `/users` | Cadastrar usuário (somente administrador) |
| GET / POST | `/products` | Listar materiais ativos (`?includeArchived=true` inclui arquivados) / cadastrar |
| PUT | `/products/{id}` | Editar material e registrar ajuste quando houver mudança |
| GET | `/products/{id}/adjustments` | Histórico de ajustes do material |
| DELETE | `/products/{id}` | Excluir material sem histórico e com saldo zero |
| POST | `/products/{id}/archive` | Arquivar material com saldo zero |
| POST | `/products/{id}/reactivate` | Reativar material arquivado |
| GET / POST | `/routers` | Listar roteadores ativos / cadastrar |
| DELETE | `/routers/{id}` | Excluir roteador sem histórico e no estoque |
| POST | `/routers/{id}/archive` | Arquivar roteador no estoque |
| GET / POST | `/technicians` | Listar técnicos, incluindo inativos / cadastrar |
| PUT | `/technicians/{id}` | Editar nome e setor do técnico ativo |
| DELETE | `/technicians/{id}` | Excluir técnico sem movimentações |
| POST | `/technicians/{id}/archive` | Tornar o técnico inativo, preservando o histórico |
| POST | `/technicians/{id}/reactivate` | Reativar técnico inativo |
| GET / POST | `/movements` | Consultar / registrar movimentações |

Todas as rotas, exceto as públicas de `/auth`, exigem login. Operações que alteram dados exigem o token CSRF no cabeçalho.

As edições detectam formulários desatualizados: materiais enviam a `version` recebida na listagem; técnicos enviam `expectedName` e `expectedSector`.

### Erros

Os erros retornam `{"message": "..."}` em português:

| Código | Quando |
| --- | --- |
| 400 | Dados inválidos ou regra de estoque (saldo insuficiente, roteador indisponível, item arquivado na movimentação) |
| 404 | O registro indicado na URL não existe |
| 409 | Conflito com o estado atual: duplicado, formulário desatualizado, possui histórico, já arquivado ou já ativo |

## Migrações

O Flyway cria e evolui o banco ao iniciar o backend. Nunca altere uma migração já aplicada; mudanças de tabela vão em uma nova versão.

| Migração | Alteração |
| --- | --- |
| V1 | Criação das tabelas e restrições iniciais |
| V2 | Entrada sem técnico e controle de versão de materiais e roteadores |
| V3 | Estado ativo dos roteadores, para arquivamento |
| V4 | Histórico de ajustes de materiais |
| V5 | Controle de versão dos técnicos |
| V6 | Nome de material único sem distinguir maiúsculas e minúsculas |
| V7 | Tabela de usuários |
| V8 | Permissão de administrador |

## Testes

Backend:
```powershell
cd .\backend
.\mvnw.cmd test
```

Frontend:
```powershell
cd .\frontend
pnpm test
pnpm build
```

- Os testes do backend usam H2 em memória, no modo PostgreSQL, e não tocam no banco real. Cobrem cadastros, movimentações, reversão de transações, normalização de identificadores, edição, validações, exclusão, arquivamento, login e permissões. O `QueryCountIntegrationTest` garante que as listas da tela inicial não façam uma consulta por registro.
- Os testes do frontend cobrem os filtros do histórico, a busca da movimentação, as devoluções pendentes, as exportações e a normalização de série e MAC.
- O `Dockerfile` roda a checagem do TypeScript e todos os testes antes de gerar a imagem; se algum falhar, o deploy é interrompido.
- Formatação do frontend: `pnpm format` (Prettier).

## Importação inicial das planilhas

A carga inicial veio das abas de estoque, roteadores, entradas, saídas, equipamentos prontos, movimentações de técnicos e técnicos. Os saldos atuais foram importados separadamente do histórico, para não descontar de novo movimentações já refletidas na planilha. Duplicações e identificadores foram tratados, e registros incompletos ficaram documentados como pendências.

O [relatório da importação](../importacao-planilha-2026-10-07/relatorio-importacao.md) registra as decisões e as pendências. Ele descreve a carga inicial, não os saldos atuais. A aplicação não tem importação contínua de planilhas.

## Outros documentos

- [Login e permissões](LOGIN.md)
- [Empacotar o JAR localmente](EMPACOTAR.md)
