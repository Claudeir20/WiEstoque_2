# WiEstoque

**Controle de estoque WiNET**

O WiEstoque controla os materiais e os roteadores do estoque da WiNET: cadastros, saldos, saídas, devoluções, entradas e consultas, em uma aplicação acessada pelo navegador.

Sistema em produção: https://wiestoque.duckdns.org (AWS)

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
| Testes | JUnit com H2 em memória e testes do frontend com Node.js, executados no GitHub Actions |
| Publicação | Docker na AWS (EC2), banco no RDS PostgreSQL, HTTPS com Caddy |

```text
├── backend/                          API Java: controllers, serviços, entidades e testes
│   └── src/main/resources/db/        Migrações do banco
├── frontend/                         Aplicação React
│   ├── src/views/                    Uma tela por arquivo
│   ├── src/dialogs/                  Janelas de cadastro, edição e remoção
│   ├── src/components/               Componentes visuais compartilhados
│   └── tests/                        Testes das regras do frontend
├── aws/                              Docker Compose, Caddy e script de preparação da EC2
├── docs/                             Manual, desenvolvimento, login, empacotamento e AWS
├── importacao-planilha-2026-10-07/   Relatório da importação inicial das planilhas
├── .github/workflows/ci.yml          Testes automáticos a cada pull request
└── Dockerfile                        Build da imagem usada na AWS (e no Render)
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

O sistema roda na AWS: uma EC2 com Docker executa a aplicação atrás do Caddy, que gera o certificado HTTPS, e os dados ficam em um PostgreSQL no RDS sem acesso público. O endereço `wiestoque.duckdns.org` aponta para o IP elástico da EC2. A configuração completa, passo a passo, está em [Publicação na AWS](docs/AWS.md).

**Testes automáticos:** cada pull request e cada push na `master` rodam os testes do backend no GitHub Actions ([ci.yml](.github/workflows/ci.yml)). Só faça o merge com o check verde.

**Para atualizar a versão no ar:** depois do merge na `master`, entre na EC2 pelo SSH e rode:

```bash
cd ~/WiEstoque_2 && git pull
cd aws && docker compose up -d --build
```

O build roda todos os testes; se algum falhar, o container atual continua no ar. Ainda não há deploy automático na AWS.

Variáveis do arquivo `aws/.env` na EC2 (nunca versione senhas; o modelo está em `aws/.env.exemplo`):

| Variável | Uso |
| --- | --- |
| `DOMINIO` | Endereço público do sistema; o Caddy gera o certificado para ele |
| `DATABASE_URL` | Endereço JDBC do RDS, com `sslmode=require` |
| `DATABASE_USER` / `DATABASE_PASSWORD` | Credenciais do banco |
| `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | Só para criar o primeiro administrador em banco vazio; remova depois do primeiro acesso |

`SPRING_PROFILES_ACTIVE=prod` e `TZ=America/Sao_Paulo` já são definidos no `aws/docker-compose.yml`. Sem o `TZ`, o servidor usaria UTC e lançamentos após as 21h ficariam com a data do dia seguinte.

### Publicação anterior no Render

Antes da AWS, o sistema rodava no Render (https://wiestoque-2.onrender.com), com os dados no Neon, publicado a cada merge na `master`. Os dados foram migrados do Neon para o RDS; o que for lançado no Render não aparece na AWS. No plano gratuito do Render, o serviço "dorme" após 15 minutos sem acesso.

## Backup

O RDS guarda backups automáticos por apenas 1 dia (limite do plano gratuito). Faça também backups manuais periódicos e guarde uma cópia fora da AWS. Na EC2, dentro de `~/WiEstoque_2/aws`:

```bash
read -rsp "Senha do RDS: " PGPASSWORD; echo; export PGPASSWORD
docker run --rm -e PGPASSWORD postgres:17 pg_dump -h ENDPOINT_DO_RDS -U wiestoque -d wiestoque -Fc > backup-$(date +%F).dump
unset PGPASSWORD
```

Depois, no PowerShell do seu computador, copie o arquivo para fora da AWS:

```powershell
scp -i .\wiestoque.pem ubuntu@IP_ELASTICO:~/WiEstoque_2/aws/backup-AAAA-MM-DD.dump .
```

As exportações em Excel ou CSV das telas não substituem um backup completo. Antes de migrações ou importações, faça um backup do banco de destino.

## Limitações atuais

- Movimentações e ajustes ainda não registram qual usuário fez a operação.
- Não há tela de edição de roteadores nem reativação de roteadores arquivados.
- Não há importação contínua de planilhas nem restauração de backup pela aplicação.
