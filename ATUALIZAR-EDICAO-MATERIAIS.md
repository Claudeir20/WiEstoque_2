# Atualização: materiais e técnicos (sem Docker)

Esta atualização corresponde ao projeto Sistema de estoque e ao pacote estoque-sem-docker apresentado na conversa.

## Painel, filtros e reativação
- Novo painel inicial com estoque baixo, roteadores disponíveis e últimas movimentações.
- Quantidade digitável, com validação de inteiro positivo e limite de saldo para saída.
- Devoluções por técnico baseadas na última saída do roteador; histórico insuficiente ou conflitante é indicado.
- Busca de roteadores por modelo, patrimônio, série e MAC; filtros de situação e modelo.
- Paginação das tabelas (20, 50 ou 100), mantendo a exportação de todos os resultados filtrados.
- Materiais arquivados e técnicos inativos podem ser reativados, preservando seus identificadores e histórico.
- Atualize frontend e backend juntos e reinicie os dois. Nenhuma nova migração é necessária para estas seis melhorias.

## Melhorias do frontend
- Busca com seleção de materiais e roteadores, saldo, situação e navegação por setas/Enter.
- Leitura de MAC sem separadores e foco mantido para adicionar o próximo item.
- Enter no cadastro de roteador avança para o próximo campo, sem salvar automaticamente ao terminar a leitura.
- Botões com espaçamento padronizado; filtros ativos removíveis e itens separados no histórico.
- Exportação em Excel (.xlsx), além de CSV, com cabeçalhos em português, sem IDs e uma linha por item no histórico.
- Atualize frontend/package.json e pnpm-lock.yaml e instale as dependências antes de iniciar. No pacote sem Docker que usa npm, execute npm install na pasta frontend após copiar os arquivos, pois node_modules pode já existir e o script antigo não reinstala dependências automaticamente.
- A biblioteca ExcelJS é carregada apenas quando uma exportação Excel é solicitada.

## Regras de edição na entidade
- Product.edit valida estado ativo, nome, quantidade e motivo, identifica mudanças e cria o registro de ajuste antes de alterar os valores.
- O service mantém consultas, conferência de versão, duplicidade e persistência.
- Esta mudança não exige uma nova migração ou mudança no frontend.

## Refatoração dos materiais
- A edição envia a versão do cadastro e recebe a versão gravada após salvar.
- Validação de formulário ativada no backend; quantidades fracionadas continuam sendo rejeitadas.
- Cadastros inexistentes retornam 404; duplicidades, edições desatualizadas e exclusões com histórico retornam 409.
- O histórico de ajustes é devolvido por um DTO de resposta.
- A migração V6 adiciona unicidade no banco sem diferenciar maiúsculas/minúsculas. Ela verifica duplicações e interrompe a atualização se encontrar alguma, sem apagar ou mesclar materiais. As migrações V1–V5 e a coluna version não são substituídas.
- O frontend e o backend devem ser atualizados juntos, pois o formulário agora usa version.

## Técnicos
- Editar nome e setor, com campos obrigatórios de até 255 caracteres e bloqueio de nomes duplicados.
- Excluir técnicos sem movimentações; arquivar os técnicos com histórico, preservando seus vínculos.
- Técnicos arquivados ficam inativos e não podem ser editados ou usados em novas movimentações.
- Migração V5 adiciona o controle de versão aos técnicos, preservando os dados existentes.

## O que muda
- Botão Editar na tabela de estoque de materiais.
- Correção do nome, mantendo o identificador e os vínculos com as movimentações.
- Ajuste do saldo com motivo obrigatório quando a quantidade muda.
- Histórico de ajustes dentro da janela Editar: data, nome anterior/novo, saldo anterior/novo, diferença e motivo.
- Validações de nome obrigatório (até 255 caracteres), nome duplicado sem distinguir maiúsculas/minúsculas, saldo inteiro não negativo, motivo até 255 caracteres, cadastro arquivado e dados desatualizados.
- Materiais com ajustes registrados são arquivados, em vez de excluídos, quando o saldo é zero.
- Os ajustes não contam como compras, retiradas ou devoluções nos resumos de movimentações.

## Como atualizar no PC da empresa
1. Faça o backup completo do banco de dados usando o procedimento que já funciona na empresa. O backup deve incluir todas as tabelas, inclusive product_adjustments depois desta atualização.
2. Pare o backend e o frontend (Ctrl+C nas duas janelas).
3. Extraia este ZIP em uma pasta temporária. Copie o conteúdo das pastas backend e frontend, incluindo backend/pom.xml (nova dependência de validação), para as mesmas pastas da instalação existente, substituindo os arquivos correspondentes. Não apague as pastas existentes: copie por cima.
4. Preserve configuracao-local.ps1, os scripts de início, application.properties, os arquivos de configuração e o banco já utilizado pela empresa. Este ZIP não contém esses arquivos nem dados iniciais.
5. Antes de iniciar, abra um terminal na pasta frontend da instalação e execute npm install, mesmo que node_modules já exista. Depois inicie novamente o backend e o frontend pelos atalhos existentes. O backend compila as alterações e o Flyway cria apenas a tabela de ajustes (migração V4) e o controle de versão dos técnicos (V5) e a unicidade dos nomes dos materiais (V6); os cadastros e movimentações existentes permanecem.
6. Atualize a página do navegador e confira o botão Editar no estoque de materiais.

Não use o antigo pacote de instalação Docker para aplicar esta atualização à instalação sem Docker.

## Validação realizada
Testes de integração em banco H2 temporário: edição, auditoria, validações, dados desatualizados, arquivamento e vínculo com movimentações anteriores. Testes existentes do backend e frontend passaram. Frontend compilado para produção e tipos do código src verificados.
A verificação de tipos que inclui vite.config.ts encontrou problemas preexistentes nos tipos dos plugins desse arquivo; o build do Vite passou. A atualização não foi executada no computador da empresa nem aplicada ao banco da empresa nesta sessão.

Se a V6 avisar sobre nomes duplicados, não remova ou renumere migrações. Corrija os nomes de forma deliberada no banco, mantendo os identificadores e o histórico, e tente iniciar novamente. Nenhuma correção automática dessas duplicidades é incluída.
