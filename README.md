# WiEstoque

**Controle de estoque WiNET**

O WiEstoque é um sistema de controle de materiais e roteadores desenvolvido para apoiar a rotina do estoque da WiNET. Ele reúne cadastros, saldos, saídas, devoluções, entradas e consultas em uma aplicação acessada pelo navegador, com os dados armazenados em PostgreSQL.

## Por que o sistema foi criado

O projeto surgiu da necessidade de organizar informações que eram controladas em planilhas, distribuídas entre abas de estoque, roteadores, entradas, saídas, movimentações e técnicos.

Na rotina de uma empresa de telecomunicações, controlar apenas uma quantidade não é suficiente. Materiais, como fitas e conectores, são acompanhados por saldo. Roteadores precisam ser identificados individualmente por patrimônio, número de série e MAC. Também é necessário saber quais itens saíram com cada técnico e quais voltaram ao estoque.

O WiEstoque transforma essa rotina em um fluxo de cadastro e movimentação, aplicando regras antes de alterar o banco. O objetivo é facilitar a consulta e reduzir erros de preenchimento, lançamentos inconsistentes e perda de rastreabilidade.

## Qual problema ele resolve

| Situação da rotina | Como o WiEstoque ajuda |
| --- | --- |
| Informações espalhadas em diferentes abas | Centraliza cadastros, estoque e movimentações. |
| Dificuldade para conferir o saldo de um material | Exibe a quantidade atual e destaca o estoque baixo. |
| Necessidade de identificar cada roteador | Mantém patrimônio, modelo, série, MAC e situação de cada equipamento. |
| Dificuldade para consultar o que um técnico retirou | Permite filtrar o histórico e consultar totais por técnico e item. |
| Série e MAC lidos sem formatação pelo leitor | Padroniza a série em maiúsculas e o MAC em pares separados por dois-pontos. |
| Erro no nome ou na quantidade de um material | Permite corrigir o cadastro e registrar o ajuste de saldo com motivo. |
| Cadastro que deixou de ser utilizado | Permite excluir quando não há histórico ou arquivar para preservar os vínculos existentes. |

O saldo depende dos registros feitos pelos usuários. O sistema auxilia o controle, mas a conferência física continua sendo necessária para identificar diferenças e registrar os ajustes.

## Funcionalidades

### Estoque de materiais

- Cadastro com nome, quantidade inicial e estoque mínimo.
- Consulta e busca de materiais.
- Exibição do saldo e indicação de estoque baixo quando a quantidade é menor ou igual ao mínimo.
- Edição do nome e da quantidade atual.
- Motivo obrigatório quando a quantidade é alterada.
- Histórico dos ajustes dentro da janela **Editar**, com data, nome anterior e novo, saldo anterior e novo, diferença e motivo.
- Exportação do estoque em CSV.
- Exclusão de materiais sem movimentações ou ajustes, desde que o saldo seja zero.
- Arquivamento de materiais com histórico, também exigindo saldo zero.

**Exemplo de ajuste:** se o sistema mostra 60 unidades e a contagem física encontra 50, o usuário informa 50 e o motivo. O saldo passa a ser 50 e o histórico registra a diferença de −10. Esse ajuste fica separado das compras, retiradas e devoluções e não entra nos totais dessas movimentações.

O cadastro aceita quantidade inicial zero. O estoque mínimo informado no novo cadastro deve ser maior que zero. Alguns dados legados importados possuem mínimo zero, preservando o valor usado na importação.

### Roteadores

- Cadastro individual por patrimônio, modelo, número de série e MAC.
- Novo equipamento cadastrado como disponível no estoque.
- Consulta dos equipamentos e sua situação: **Estoque** ou **Fora de estoque**.
- Saída e devolução vinculadas às movimentações.
- Quantidade fixa de uma unidade por equipamento.
- Exclusão de roteadores sem histórico, quando estão no estoque.
- Arquivamento de roteadores com histórico, quando estão no estoque.

A série é convertida para maiúsculas. Um MAC como `aabbccddeeff` é armazenado como `AA:BB:CC:DD:EE:FF`. Também são aceitos separadores usuais, como hífen e ponto, desde que o conteúdo corresponda a 12 caracteres hexadecimais válidos. A validação acontece no frontend e no backend.

A entrada de um roteador novo acontece pelo cadastro de roteadores. Quando um equipamento retorna do campo, deve ser utilizada a movimentação **Devolução**.

### Técnicos

- Cadastro com nome e setor.
- Edição do nome e do setor de técnicos ativos.
- Exclusão de técnicos sem movimentações.
- Arquivamento de técnicos com histórico, mantendo os vínculos das movimentações.
- Técnicos arquivados ficam inativos e deixam de aparecer na seleção para novas movimentações.

Corrigir o nome mantém o mesmo identificador do técnico. As consultas das movimentações passam a exibir o nome corrigido. O sistema não mantém um histórico separado das alterações do cadastro do técnico.

### Movimentações

| Tipo | Efeito no estoque | Responsável |
| --- | --- | --- |
| Saída | Diminui o saldo do material ou coloca o roteador fora do estoque. | Técnico obrigatório. |
| Devolução | Aumenta o saldo do material ou devolve o roteador ao estoque. | Técnico obrigatório. |
| Entrada | Aumenta o saldo de materiais existentes. | Dispensa técnico. |

Uma movimentação pode conter vários itens. A busca aceita o nome do material e os identificadores do roteador. Correspondências exatas têm prioridade; quando há mais de um resultado possível, o sistema pede um termo mais específico para evitar escolher o cadastro errado.

O backend valida todos os itens antes de concluir a operação. Se uma regra falhar, a transação é revertida e a movimentação não fica parcialmente registrada.

### Histórico e relatórios

- Filtros por técnico, data inicial, data final, material e tipo de movimentação.
- O seletor de material apresenta somente materiais.
- A opção **Todos os itens** pode incluir roteadores nos resultados e no resumo.
- Lista de movimentações com a data exibida sem horário.
- Resumo por técnico e item, com retiradas, devoluções, entradas e retirado líquido.
- Exportação da lista filtrada e do resumo em CSV.

O filtro padrão é **Saída**. Para comparar retiradas e devoluções, selecione **Todos os tipos**. As datas inicial e final incluem os dias completos.

**Retirado líquido = saídas − devoluções dentro dos filtros selecionados.** Esse valor não representa o saldo atual do estoque nem o saldo anterior ao período.

## Regras e validações

- Quantidades de movimentação devem ser positivas e saídas de materiais respeitam o saldo disponível.
- Ajustes de material aceitam apenas quantidades inteiras entre 0 e 2.147.483.647.
- O motivo do ajuste de quantidade é obrigatório e deve ter até 255 caracteres.
- Na edição de materiais e técnicos, nomes e campos obrigatórios são validados; nomes duplicados são rejeitados sem distinguir maiúsculas e minúsculas.
- Nome do material, nome do técnico e setor têm limite de 255 caracteres nas edições.
- Patrimônio, série e MAC de roteadores são verificados contra duplicação.
- Cadastros arquivados não recebem novas movimentações. Materiais e técnicos arquivados não podem ser editados pelas funcionalidades atuais.
- O controle de versão dos materiais, roteadores e técnicos ajuda a detectar alterações concorrentes.
- As edições de materiais e técnicos também conferem os valores recebidos na abertura do formulário para rejeitar dados desatualizados.
- Exclusão e arquivamento exigem confirmação na interface.
- Os identificadores internos continuam no banco e nas integrações, embora o UUID do material não seja exibido na tabela de estoque.

## Tecnologias e organização

| Camada | Tecnologias |
| --- | --- |
| Interface | React 19, TypeScript, Vite 8 e Tailwind CSS 4. |
| API | Java 21, Spring Boot, Spring Web MVC e Spring Data JPA. |
| Persistência | PostgreSQL, Hibernate e migrações Flyway. |
| Testes | JUnit, testes HTTP de integração, H2 temporário e testes do frontend com Node.js. |
| Instalação opcional | Docker Compose, Nginx e containers para frontend, backend e banco. |

```text
Sistema de estoque/
├── backend/                         API Java, regras, entidades e testes
│   ├── src/main/java/               Controllers, serviços, DTOs e repositórios
│   └── src/main/resources/db/       Migrações do banco
├── frontend/                        Aplicação React
│   ├── src/                         Telas, integração com a API e estilos
│   ├── public/                      Logo do WiEstoque
│   └── tests/                       Testes do frontend
├── implantacao/                     Documentação e scripts para Docker
├── importacao-planilha-2026-10-07/   Relatório e registros da importação inicial
├── compose.yaml                     Configuração dos serviços Docker
├── ATUALIZAR-EDICAO-MATERIAIS.md     Orientação de atualização sem Docker
└── README.md                        Documentação geral do projeto
```

As regras de edição de materiais ficam em `Product.edit(name, quantity, reason)`: a entidade recusa cadastros arquivados, valida nome, saldo e motivo, identifica mudanças e cria o ajuste com os valores anteriores antes de alterar o estado. Quando nada muda, retorna `Optional.empty()`. O `ProductService` consulta o cadastro, confere a versão e a disponibilidade do nome, converte a quantidade recebida, salva o ajuste retornado e executa o flush. A entidade não utiliza repositories.

A comunicação segue o fluxo: **navegador → frontend → API → PostgreSQL**. O banco armazena os cadastros, as movimentações e os ajustes. O frontend apresenta os dados e envia as operações; o backend aplica as regras e grava as alterações.

## Executar localmente sem Docker

### Requisitos

- Java JDK 21.
- PostgreSQL instalado e iniciado.
- Node.js compatível com a versão do Vite usada no projeto.
- pnpm para o frontend deste repositório.
- Maven ou Maven Wrapper; o backend deste repositório inclui `mvnw.cmd`.
- Internet no primeiro uso para baixar as dependências.

### Configurar o banco

Confira a conexão em `backend/src/main/resources/application.properties`. Para usar outro banco sem modificar esse arquivo, configure as variáveis do Spring no terminal ou na configuração de execução do IntelliJ:

```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/wiestoque'
$env:SPRING_DATASOURCE_USERNAME = 'SEU_USUARIO'
$env:SPRING_DATASOURCE_PASSWORD = 'SUA_SENHA'
```

O banco e o usuário precisam existir e ter as permissões necessárias. O Flyway cria e evolui as tabelas ao iniciar o backend. Usar um banco novo não importa automaticamente os dados das planilhas.

As credenciais e configurações locais da empresa devem ser mantidas fora de arquivos publicados.

### Iniciar o backend

Na pasta raiz do projeto:

```powershell
cd .ackend
.\mvnw.cmd spring-boot:run
```

Também é possível abrir o backend no IntelliJ e executar `StockManagerApplication` com Java 21 e a conexão configurada.

A API fica, por padrão, em `http://localhost:8080`.

### Iniciar o frontend

Em outro terminal, partindo da pasta raiz:

```powershell
cd .rontend
pnpm install --frozen-lockfile
pnpm dev
```

Abra **http://localhost:8443**. A porta 8443 usada nesse fluxo é HTTP, conforme o endereço acima.

O Vite encaminha `/api/*` ao backend e remove o prefixo `/api`. Se o backend estiver em outra porta, configure o destino antes de iniciar o frontend:

```powershell
$env:API_TARGET = 'http://localhost:8081'
pnpm dev
```

Na instalação sem Docker utilizada na empresa, os scripts **Iniciar-backend.cmd** e **Iniciar-frontend.cmd** pertencem ao pacote separado `estoque-sem-docker`. Ele utiliza Maven e npm disponíveis no computador e pode usar um arquivo `configuracao-local.ps1`. Preserve a configuração que já funciona nessa instalação. Esses scripts não são os mesmos `Iniciar.cmd` do pacote Docker.

No fluxo de desenvolvimento sem Docker, mantenha as janelas dos dois serviços abertas. Para parar, use `Ctrl+C` em cada uma. Os registros permanecem no PostgreSQL.

## Instalar com Docker

O Docker é uma alternativa de instalação. Ele reúne frontend, backend e PostgreSQL e dispensa instalar Java, Node.js e PostgreSQL separadamente no Windows.

1. Confira a compatibilidade e instale o Docker Desktop com containers Linux.
2. Extraia o pacote de instalação em uma pasta permanente do computador.
3. Abra o Docker Desktop e aguarde a inicialização.
4. Execute **Instalar.cmd** e aguarde a conclusão.
5. Abra o atalho **Sistema de Estoque** criado na Área de Trabalho ou **http://localhost:8085**.

A primeira instalação precisa de internet. Para iniciar os serviços posteriormente, use **Iniciar.cmd**.

Consulte o [guia de implantação](implantacao/LEIA-ME.md), os [requisitos oficiais do Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) e as [condições de licença](https://docs.docker.com/subscription-billing/desktop-license/).

O pacote Docker utiliza um volume persistente para o banco e publica a interface somente no próprio computador. Quando presente, o SQL inicial é carregado apenas na criação de um volume novo. Sua data e suas contagens ficam no manifesto de dados iniciais. O pacote é uma cópia de um momento específico e não sincroniza bancos de computadores diferentes.

**Pacotes ZIP já gerados não recebem alterações do código automaticamente.** O antigo `pacote-empresa.zip` pode representar uma versão anterior. Para a instalação sem Docker da empresa, utilize o pacote de atualização correspondente e suas instruções.

## Como usar no dia a dia

1. Cadastre os técnicos e seus setores.
2. Cadastre os materiais e os roteadores, conferindo o saldo inicial e os identificadores.
3. Para uma retirada, selecione **Saída**, escolha o técnico e adicione os itens.
4. Para itens devolvidos, utilize **Devolução** com o técnico responsável.
5. Para reposição de materiais, utilize **Entrada**. Para um roteador novo, use o cadastro de roteadores.
6. Confira o estoque e o histórico após a confirmação.
7. Se uma contagem física mostrar diferença de material, abra **Editar**, informe o saldo correto e explique o motivo.
8. Use os filtros e as exportações para consultar o consumo e as movimentações do período.

## Backup e atualização

### Instalação sem Docker

Use o procedimento de backup do PostgreSQL configurado na empresa. O backup completo precisa incluir todas as tabelas, inclusive `product_adjustments` e o histórico de migrações do Flyway.

Para atualizar:

1. Faça um backup completo e guarde uma cópia fora do computador.
2. Pare o backend e o frontend.
3. Aplique os arquivos da atualização sobre a instalação existente, seguindo o guia do pacote.
4. Preserve as configurações locais, credenciais e o banco utilizado pela empresa.
5. Inicie novamente os serviços. O backend aplica as migrações pendentes.
6. Atualize o navegador e confira as funcionalidades.

O [guia de atualização de materiais e técnicos](ATUALIZAR-EDICAO-MATERIAIS.md) descreve o procedimento para o pacote sem Docker usado na empresa.

### Instalação Docker

- **Backup.cmd** gera um backup do banco.
- **Ativar backup diario.cmd** configura a execução diária às 17h.
- O agendamento depende do usuário conectado, do computador ligado e do Docker funcionando.
- Preserve `.env`, backups e o volume do banco durante as atualizações.
- Não remova o volume do banco nem execute `docker compose down -v` para atualizar.

Detalhes de inicialização, atualização e recuperação estão no [guia de implantação](implantacao/LEIA-ME.md). A restauração é feita pelo PostgreSQL e deve ser planejada para o banco correto; não existe uma tela de restauração no sistema.

## Importação inicial das planilhas

A carga inicial foi preparada a partir das abas de estoque, roteadores, entradas, saídas, equipamentos prontos, movimentações de técnicos e técnicos da planilha utilizada na operação.

O processo considerou os saldos atuais separadamente do histórico, para não descontar novamente movimentações já refletidas na planilha. Foram tratadas duplicações e identificadores; registros incompletos ou inconsistentes ficaram documentados como pendências.

O [relatório da importação](importacao-planilha-2026-10-07/relatorio-importacao.md) registra as decisões e as pendências dessa carga. Esses arquivos descrevem a importação inicial, não os saldos atuais após novas operações. A aplicação não possui uma tela de importação contínua de Excel.

## API principal

As rotas abaixo são do backend. No frontend, o proxy acrescenta o prefixo `/api`.

| Método | Rota | Operação |
| --- | --- | --- |
| GET / POST | `/products` | Listar materiais ativos / cadastrar material. |
| PUT | `/products/{id}` | Editar material e registrar ajuste quando houver mudança. |
| GET | `/products/{id}/adjustments` | Consultar o histórico de ajustes do material. |
| DELETE | `/products/{id}` | Excluir material sem histórico e com saldo zero. |
| POST | `/products/{id}/archive` | Arquivar material com saldo zero. |
| GET / POST | `/routers` | Listar roteadores ativos / cadastrar roteador. |
| DELETE | `/routers/{id}` | Excluir roteador sem histórico e no estoque. |
| POST | `/routers/{id}/archive` | Arquivar roteador no estoque. |
| GET / POST | `/technicians` | Listar técnicos, incluindo inativos / cadastrar técnico. |
| PUT | `/technicians/{id}` | Editar nome e setor do técnico ativo. |
| DELETE | `/technicians/{id}` | Excluir técnico sem movimentações. |
| POST | `/technicians/{id}/archive` | Tornar o técnico inativo preservando o histórico. |
| GET / POST | `/movements` | Consultar / registrar movimentações. |

As edições enviam os valores anteriores para detectar formulários desatualizados: `expectedName` e `expectedQuantity` para materiais; `expectedName` e `expectedSector` para técnicos. Conflitos são retornados com HTTP 409. Dados inválidos retornam HTTP 400.

## Migrações e testes

O Flyway mantém a evolução do banco:

| Migração | Alteração |
| --- | --- |
| V1 | Criação das tabelas e restrições iniciais. |
| V2 | Entrada sem técnico e controle de versão de materiais e roteadores. |
| V3 | Estado ativo dos roteadores para arquivamento. |
| V4 | Histórico de ajustes de materiais. |
| V5 | Controle de versão dos técnicos. |

Para executar os testes do backend:

```powershell
cd .ackend
.\mvnw.cmd test
```

Para testar e compilar o frontend:

```powershell
cd .rontend
pnpm test
pnpm build
```

Os testes do backend usam H2 temporário em modo PostgreSQL e não alteram o banco operacional. Cobrem cadastro, movimentação, reversão de transações, normalização de identificadores, edição, validações, exclusão e arquivamento.

Os testes do frontend cobrem filtros e resumos do histórico e a formatação dos identificadores. O build verifica a geração dos arquivos de distribuição. Na verificação realizada, os tipos do código `src` passaram; a checagem completa `pnpm exec tsc --noEmit` encontrou erros preexistentes nos tipos dos plugins de `vite.config.ts`, embora o build tenha concluído.

## Escopo atual

- O sistema não possui login, perfis de acesso ou identificação do usuário que fez um ajuste.
- Não existe sincronização automática entre computadores.
- A instalação sem Docker descrita utiliza o servidor de desenvolvimento do Vite e a execução do backend pelo Maven ou IntelliJ.
- Não há tela de edição de roteadores, reativação de cadastros arquivados, restauração de backup ou importação contínua de planilhas.
- Publicar o sistema na internet exige preparar autenticação, controle de acesso, HTTPS e a configuração do encaminhamento da API.

O WiEstoque foi pensado inicialmente para a operação local do estoque da WiNET. Sua proposta é manter o saldo consultável, os equipamentos identificados e as movimentações rastreáveis, com correções registradas e preservação do histórico.
