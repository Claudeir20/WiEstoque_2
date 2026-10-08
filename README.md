# Sistema de estoque

## Instalar no PC da empresa com Docker

O pacote de instalação está em `pacote-empresa.zip`. Extraia-o no computador do estoque e siga `implantacao/LEIA-ME.md`. Execute `Instalar.cmd` depois de instalar e abrir o Docker Desktop. O acesso desta instalação é `http://localhost:8085`.

O arquivo `implantacao/dados-iniciais-manifesto.json` registra a data e as contagens da cópia do banco incluída no pacote. Alterações posteriores neste banco não são sincronizadas automaticamente com o pacote.

O frontend em `frontend` usa a API Java em `backend`. As telas carregam os dados do banco e permitem cadastrar materiais, técnicos e roteadores e registrar movimentações.

## Iniciar no Windows

Requisitos: Java 21, Node.js e pnpm, PostgreSQL ativo. Confira o endereço e as credenciais do banco em `backend/src/main/resources/application.properties` antes de iniciar. Por padrão, o banco é `postgres` em `localhost:5432`.

Abra um terminal na pasta do projeto e inicie o backend:

```powershell
cd .\backend
.\mvnw.cmd spring-boot:run
```

Se outro Java for o padrão do computador, configure `JAVA_HOME` para sua instalação do Java 21 antes de executar. O backend fica em `http://localhost:8080`. O Flyway aplica as migrações automaticamente, incluindo a V2 que permite entradas sem técnico e adiciona controle de concorrência no estoque.

Abra outro terminal na pasta do projeto e inicie o frontend:

```powershell
cd '.\frontend'
pnpm install
pnpm dev
```

Abra `http://localhost:8443`. O frontend envia `/api/*` ao backend; o proxy do Vite remove o prefixo `/api`. Não é necessário configurar CORS para esse fluxo.

Se o backend usar outra porta, defina `API_TARGET` antes de iniciar o frontend:

```powershell
$env:API_TARGET='http://localhost:8081'
pnpm dev
```

## Primeiro uso

1. Em Técnicos, cadastre um técnico e seu setor.
2. Em Estoque de materiais, cadastre um material com quantidade inicial e estoque mínimo maiores que zero.
3. Em Roteadores, cadastre patrimônio, modelo, série e MAC. O novo roteador já começa disponível.
4. Em Nova movimentação, selecione saída ou devolução e um técnico; busque um material pelo nome ou um roteador por patrimônio, série, modelo ou MAC. Uma busca ambígua pede um termo mais específico.
5. Para entrada de materiais existentes, selecione Entrada e informe a origem. Essa operação dispensa técnico. Novos roteadores são incluídos pelo cadastro; equipamentos que voltam do campo usam Devolução.
6. Registre a movimentação. O estoque e o histórico são recarregados depois da confirmação do servidor.

Os roteadores têm quantidade fixa de uma unidade. Saídas de produtos respeitam o estoque disponível. A API valida novamente as regras, desfaz a movimentação inteira em caso de falha e detecta alterações concorrentes nos produtos e roteadores.

## Verificação

No Histórico, combine técnico, data inicial, data final, material ou roteador e tipo. O padrão é Saída; selecione Todos os tipos para comparar retiradas e devoluções. O resumo agrupa as quantidades por técnico e item, e a lista mostra as movimentações que compõem esse resultado. As duas datas incluem o dia inteiro. Exportar baixa os registros filtrados; Exportar resumo baixa os totais por técnico e item. O retirado líquido é saídas menos devoluções dentro dos filtros selecionados, não um saldo acumulado anterior ao período.

No frontend:

```powershell
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

No backend:

```powershell
.\mvnw.cmd test
```

Os testes usam H2 temporário em modo PostgreSQL, sem alterar o banco de trabalho. Há testes HTTP de cadastro, listagem, saída, devolução, entrada e rollback. A execução das migrações no PostgreSQL real ainda deve ser verificada ao iniciar o backend.

## Publicação

O proxy de desenvolvimento não é incluído no frontend compilado. Na hospedagem, configure o servidor web para encaminhar `/api/*` ao backend removendo `/api`, ou defina `VITE_API_URL` durante o build e configure CORS no backend para a origem publicada. O projeto ainda não implementa login ou controle de acesso.

