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
- Exportação do estoque filtrado em Excel (.xlsx) ou CSV, com cabeçalhos em português e sem IDs internos.
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

Uma movimentação pode conter vários itens. A busca apresenta uma lista com nome, saldo e situação dos materiais e roteadores. É possível escolher pelo clique ou pelas setas e Enter. Correspondências exatas têm prioridade, incluindo MAC lido sem separadores. Resultados indisponíveis ficam desabilitados. O Enter adiciona uma correspondência única e mantém o foco para a próxima leitura; buscas ambíguas exigem seleção.

No cadastro de roteadores, o Enter avança entre os campos e, ao chegar ao último, direciona o foco ao botão de cadastro. Assim, o final da leitura não envia o formulário automaticamente.

O backend valida todos os itens antes de concluir a operação. Se uma regra falhar, a transação é revertida e a movimentação não fica parcialmente registrada.

### Histórico e relatórios

- Filtros por técnico, data inicial, data final, material e tipo de movimentação.
- O seletor de material apresenta somente materiais.
- A opção **Todos os itens** pode incluir roteadores nos resultados e no resumo.
- Lista de movimentações com data sem horário, itens separados e quantidades destacadas.
- Filtros ativos visíveis, com remoção individual; Limpar filtros restaura todos os resultados.
- Resumo por técnico e item, com retiradas, devoluções, entradas e retirado líquido.
- Exportação da lista filtrada e do resumo em Excel (.xlsx) ou CSV. A exportação detalhada apresenta uma linha por item, separando categoria, nome e quantidade.

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
| Publicação | Docker no Render, com PostgreSQL no Neon. |

```text
Sistema de estoque/
├── backend/                         API Java, regras, entidades e testes
│   ├── src/main/java/               Controllers, serviços, DTOs e repositórios
│   └── src/main/resources/db/       Migrações do banco
├── frontend/                        Aplicação React
│   ├── src/                         Telas, integração com a API e estilos
│   ├── public/                      Logo do WiEstoque
│   └── tests/                       Testes do frontend
├── importacao-planilha-2026-10-07/   Relatório e registros da importação inicial
├── Dockerfile                       Build integrado utilizado pelo Render
├── EMPACOTAR.md                     Como gerar e testar o JAR integrado
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


No fluxo de desenvolvimento sem Docker, mantenha as janelas dos dois serviços abertas. Para parar, use `Ctrl+C` em cada uma. Os registros permanecem no PostgreSQL.

## Publicação na nuvem

O sistema da empresa está em https://wiestoque-2.onrender.com, com os dados no PostgreSQL do Neon. Os computadores precisam de navegador e internet; o computador do desenvolvedor pode permanecer desligado.

O Render utiliza o Dockerfile da raiz para compilar frontend e backend em uma aplicação integrada. Mantenha a Root Directory vazia e o Dockerfile Path como ./Dockerfile. Configure SPRING_PROFILES_ACTIVE=prod, PORT, DATABASE_URL (JDBC com SSL), DATABASE_USER e DATABASE_PASSWORD no serviço, sem versionar senhas.

Em banco sem usuários, configure também INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD para criar o primeiro administrador. Consulte LOGIN.md para o fluxo de autenticação.

Para atualizar, teste a alteração, faça commit e push para a branch configurada no serviço (atualmente feature/login). Com Auto-Deploy habilitado, o Render inicia o deploy após o push; caso contrário, use Manual Deploy. O commit local sozinho não publica uma atualização. Mudanças de tabelas devem usar novas migrations do Flyway, preservando as já aplicadas.

Para gerar e testar o JAR no computador, consulte EMPACOTAR.md.

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

Faça backups periódicos do banco Neon e mantenha uma cópia em local separado. Exportações de CSV/Excel das telas não substituem um backup completo do banco. Os dados locais e os dados do Neon são bancos separados, sem sincronização automática.

Antes de migrations ou importações, faça um backup do banco de destino. Para atualizar o código, utilize o fluxo de publicação na nuvem acima. Uma restauração deve ser planejada para o banco correto; não restaure um backup completo sobre o banco em uso sem conferir os dados e o histórico do Flyway.

As cópias de dados da implantação local anterior em implantacao/dados-iniciais.sql e implantacao/dados-iniciais-manifesto.json foram preservadas como histórico. Não são backups atuais do Neon e não devem ser importadas novamente no sistema publicado.

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

Os testes do frontend verificam o histórico e a normalização dos identificadores. O Dockerfile executa a checagem TypeScript, os testes do frontend e a suíte completa do backend antes de gerar a aplicação integrada; se algum teste falhar, o deploy é interrompido.

## Escopo atual

- O sistema possui login por sessão e cadastro de usuários restrito a administradores. Os ajustes ainda não identificam o usuário responsável.
- Não existe sincronização automática entre computadores.
- A instalação sem Docker descrita utiliza o servidor de desenvolvimento do Vite e a execução do backend pelo Maven ou IntelliJ.
- Não há tela de edição de roteadores, reativação de roteadores arquivados, restauração de backup ou importação contínua de planilhas.
- O sistema publicado utiliza HTTPS, autenticação por sessão e proteção CSRF.

O WiEstoque foi pensado inicialmente para a operação local do estoque da WiNET. Sua proposta é manter o saldo consultável, os equipamentos identificados e as movimentações rastreáveis, com correções registradas e preservação do histórico.


## Painel, consulta e reativação

O painel inicial apresenta materiais abaixo ou no estoque mínimo, roteadores disponíveis e as cinco movimentações mais recentes. Em nova movimentação, a quantidade dos materiais pode ser digitada diretamente; são aceitos apenas inteiros positivos e, nas saídas, o saldo disponível é o limite. Roteadores continuam com quantidade fixa de uma unidade.

Na devolução, ao selecionar o técnico, aparecem os roteadores fora do estoque cuja última movimentação é uma saída vinculada a ele. Essa consulta depende do histórico: equipamentos sem saída identificada ou com registros conflitantes são informados como sem técnico identificado e continuam acessíveis pela busca.

Roteadores têm filtros de modelo e situação e busca por patrimônio, série, modelo ou MAC, inclusive sem separadores. As tabelas de materiais, roteadores e as duas tabelas do histórico têm páginas de 20, 50 ou 100 registros. A paginação ocorre no frontend; as exportações incluem todos os resultados filtrados.

Materiais arquivados aparecem na opção Arquivados do estoque e podem ser reativados. Técnicos inativos também têm botão Reativar. O mesmo identificador e o histórico são preservados, sem recriar cadastros ou ajustar saldos. GET /products mantém a lista de ativos por padrão; includeArchived=true inclui arquivados. POST /products/{id}/reactivate e POST /technicians/{id}/reactivate reativam o cadastro e rejeitam um cadastro já ativo. Estas melhorias não exigem uma nova migração.
