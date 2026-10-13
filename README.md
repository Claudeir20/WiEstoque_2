# WiEstoque

**Controle de estoque WiNET**

O WiEstoque controla os materiais e os roteadores do estoque da WiNET: cadastros, saldos, saídas, devoluções, entradas e consultas, em uma aplicação acessada pelo navegador.

Sistema em produção: https://wiestoque-2.onrender.com

## Por que o sistema foi criado

O controle era feito em planilhas, com abas separadas para estoque, roteadores, entradas, saídas, movimentações e técnicos. Numa empresa de telecomunicações, controlar só a quantidade não basta: materiais como fitas e conectores são acompanhados por saldo, roteadores precisam ser identificados um a um (patrimônio, série e MAC) e é preciso saber o que saiu com cada técnico e o que voltou.

O WiEstoque transforma essa rotina em cadastros e movimentações, validando as regras antes de gravar. O objetivo é facilitar a consulta e reduzir erros de preenchimento, lançamentos inconsistentes e perda de rastreabilidade.

O saldo depende dos registros feitos no sistema. A conferência física continua necessária para encontrar diferenças e registrar os ajustes.

## Funcionalidades

- **Painel:** materiais no estoque mínimo, roteadores disponíveis e últimas movimentações.
- **Materiais:** cadastro com saldo e estoque mínimo, edição com motivo obrigatório para ajuste de saldo, histórico de ajustes, arquivamento e reativação.
- **Roteadores:** cadastro por patrimônio, modelo, série e MAC, com padronização automática da série e do MAC lidos pelo leitor.
- **Técnicos:** cadastro por nome e setor, edição, arquivamento e reativação.
- **Movimentações:** saída, devolução e entrada com vários itens; busca por nome, patrimônio, série ou MAC; a movimentação é gravada inteira ou não é gravada.
- **Histórico e relatórios:** filtros por técnico, período, material e tipo, resumo por técnico e item e exportação em Excel ou CSV.
- **Acesso:** login por e-mail e senha; o cadastro de usuários é restrito a administradores.

O funcionamento detalhado de cada tela está no [manual de uso](docs/MANUAL.md).

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | React 19, TypeScript, Vite 8 e Tailwind CSS 4 |
| API | Java 21, Spring Boot 4, Spring Security e Spring Data JPA |
| Banco | PostgreSQL, com migrações Flyway |
| Testes | JUnit com H2 em memória e testes do frontend com Node.js |
| Publicação | Docker no Render, banco no Neon |

```text
├── backend/                          API Java: controllers, serviços, entidades e testes
│   └── src/main/resources/db/        Migrações do banco
├── frontend/                         Aplicação React
│   ├── src/views/                    Uma tela por arquivo
│   ├── src/dialogs/                  Janelas de cadastro, edição e remoção
│   ├── src/components/               Componentes visuais compartilhados
│   └── tests/                        Testes das regras do frontend
├── docs/                             Manual, desenvolvimento, login e empacotamento
├── importacao-planilha-2026-10-07/   Relatório da importação inicial das planilhas
└── Dockerfile                        Build usado pelo Render
```

## Executar localmente

Requisitos: Java 21, Node.js com pnpm e um PostgreSQL local.

1. Configure a conexão com o banco local (o Flyway cria as tabelas ao iniciar):
   ```powershell
   $env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/wiestoque'
   $env:SPRING_DATASOURCE_USERNAME = 'SEU_USUARIO'
   $env:SPRING_DATASOURCE_PASSWORD = 'SUA_SENHA'
   ```
   Em banco sem usuários, configure também `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` (veja [Login e permissões](docs/LOGIN.md)).
2. Inicie o backend, que fica em http://localhost:8080:
   ```powershell
   cd .\backend
   .\mvnw.cmd spring-boot:run
   ```
   Também é possível executar `StockManagerApplication` pelo IntelliJ.
3. Em outro terminal, inicie o frontend e abra http://localhost:8443:
   ```powershell
   cd .\frontend
   pnpm install --frozen-lockfile
   pnpm dev
   ```
   O Vite encaminha `/api/*` para o backend. Se ele estiver em outra porta, defina `$env:API_TARGET = 'http://localhost:8081'` antes do `pnpm dev`.

Testes, API, migrações e outros detalhes técnicos estão em [desenvolvimento](docs/DESENVOLVIMENTO.md).

## Publicação

O Render compila frontend e backend pelo `Dockerfile` da raiz e publica a branch `master`, com os dados no PostgreSQL do Neon.

Para atualizar: crie uma branch, abra um pull request para a `master` e faça o merge. O deploy começa sozinho. O build roda todos os testes; se algum falhar, o deploy é interrompido e a versão anterior continua no ar.

Variáveis de ambiente do serviço no Render (nunca versione senhas):

| Variável | Uso |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` | Porta do serviço |
| `DATABASE_URL` | Endereço JDBC do Neon, com SSL |
| `DATABASE_USER` / `DATABASE_PASSWORD` | Credenciais do banco |
| `TZ` | `America/Sao_Paulo`; sem ela, o servidor usa UTC e lançamentos após as 21h ficam com a data do dia seguinte |
| `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | Só para criar o primeiro administrador em banco vazio; podem ser removidas depois |

No plano gratuito, o serviço "dorme" após 15 minutos sem acesso, e o primeiro acesso seguinte leva cerca de 2 minutos.

Para publicar em uma conta AWS (EC2 com Docker e banco no RDS), siga o guia [Publicação na AWS](docs/AWS.md).

## Backup

Faça backups periódicos do banco Neon e guarde uma cópia em outro local. As exportações em Excel ou CSV das telas não substituem um backup completo. Antes de migrações ou importações, faça um backup do banco de destino.

## Limitações atuais

- Movimentações e ajustes ainda não registram qual usuário fez a operação.
- Não há tela de edição de roteadores nem reativação de roteadores arquivados.
- Não há importação contínua de planilhas nem restauração de backup pela aplicação.
