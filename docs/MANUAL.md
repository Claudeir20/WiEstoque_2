# Manual de uso

## Rotina do dia a dia

1. Cadastre os técnicos e seus setores.
2. Cadastre os materiais e os roteadores, conferindo o saldo inicial e os identificadores.
3. Para uma retirada, selecione **Saída**, escolha o técnico e adicione os itens.
4. Para itens devolvidos, use **Devolução** com o técnico responsável.
5. Para reposição de materiais, use **Entrada**. Para um roteador novo, use o cadastro de roteadores.
6. Confira o estoque e o histórico após a confirmação.
7. Se uma contagem física mostrar diferença de material, abra **Editar**, informe o saldo correto e explique o motivo.
8. Use os filtros e as exportações para consultar o consumo e as movimentações do período.

## Painel

Mostra os materiais abaixo ou no estoque mínimo, os roteadores disponíveis e as cinco movimentações mais recentes.

## Estoque de materiais

- Cadastro com nome, quantidade inicial e estoque mínimo. A quantidade inicial pode ser zero; o estoque mínimo deve ser maior que zero. Alguns materiais importados das planilhas têm mínimo zero, como estavam na origem.
- O material aparece como **Estoque baixo** quando a quantidade é menor ou igual ao mínimo.
- **Editar** permite corrigir o nome e a quantidade. Alterar a quantidade exige um motivo de até 255 caracteres e aceita inteiros de 0 a 2.147.483.647.
- O histórico de ajustes fica na própria janela **Editar**, com data, nome e saldo anteriores e novos, diferença e motivo.
- Exportação do estoque filtrado em Excel (.xlsx) ou CSV, com cabeçalhos em português.
- **Excluir** só é possível com saldo zero e sem movimentações ou ajustes. Com histórico, use **Arquivar**, que também exige saldo zero.
- Materiais arquivados aparecem na opção **Arquivados** e podem ser reativados, mantendo o mesmo cadastro e o histórico.

**Exemplo de ajuste:** o sistema mostra 60 unidades e a contagem física encontra 50. Informe 50 e o motivo. O saldo passa a ser 50 e o histórico registra a diferença de −10. O ajuste fica separado das compras, retiradas e devoluções e não entra nos totais dessas movimentações.

## Roteadores

- Cadastro individual por patrimônio, modelo, número de série e MAC. O roteador novo entra como disponível no estoque.
- A série é convertida para maiúsculas. Um MAC como `aabbccddeeff` é gravado como `AA:BB:CC:DD:EE:FF`; hífen e ponto também são aceitos como separadores, desde que haja 12 caracteres hexadecimais.
- Patrimônio, série e MAC não podem se repetir.
- No cadastro, o Enter avança entre os campos e, no último, leva ao botão de cadastrar. Assim, o fim da leitura não envia o formulário sozinho.
- Situação: **Estoque** ou **Fora de estoque**. Filtros por modelo e situação e busca por patrimônio, série, modelo ou MAC, inclusive sem separadores.
- Excluir ou arquivar só é possível com o roteador no estoque; com histórico, apenas arquivar.
- Roteador que volta do campo deve entrar por **Devolução**, não por um novo cadastro.

## Técnicos

- Cadastro com nome e setor; edição do nome e do setor de técnicos ativos.
- Corrigir o nome mantém o mesmo cadastro, e as movimentações passam a mostrar o nome corrigido.
- Técnico sem movimentações pode ser excluído. Com histórico, use **Arquivar**: ele fica inativo e deixa de aparecer nas novas movimentações.
- Técnicos inativos podem ser reativados.

## Movimentações

| Tipo | Efeito no estoque | Técnico |
| --- | --- | --- |
| Saída | Diminui o saldo do material ou coloca o roteador fora do estoque | Obrigatório |
| Devolução | Aumenta o saldo do material ou devolve o roteador ao estoque | Obrigatório |
| Entrada | Aumenta o saldo de materiais existentes | Não usa |

- Uma movimentação pode ter vários itens. Roteadores têm sempre quantidade 1; a quantidade de materiais pode ser digitada e, nas saídas, não passa do saldo disponível.
- A busca mostra nome, saldo e situação. Escolha com o clique ou com as setas e Enter. Correspondências exatas têm prioridade, inclusive MAC lido sem separadores, e itens indisponíveis ficam desabilitados.
- Com uma única correspondência, o Enter adiciona o item e mantém o foco para a próxima leitura; buscas ambíguas exigem escolher na lista.
- Na devolução, ao escolher o técnico, aparecem os roteadores cuja última saída foi com ele. Equipamentos sem saída identificada continuam disponíveis pela busca.
- Todos os itens são validados antes de gravar. Se algum falhar, nada é registrado.

## Histórico e relatórios

- Filtros por técnico, data inicial e final, material e tipo de movimentação. As datas incluem os dias completos.
- O filtro padrão é **Saída**. Para comparar retiradas e devoluções, escolha **Todos os tipos**. A opção **Todos os itens** inclui roteadores.
- Os filtros ativos aparecem na tela e podem ser removidos um a um; **Limpar filtros** volta a mostrar tudo.
- O resumo por técnico e item mostra retiradas, devoluções, entradas e retirado líquido.
- **Retirado líquido = saídas − devoluções dentro dos filtros.** Não é o saldo atual do estoque.
- Exportação da lista e do resumo em Excel ou CSV, com uma linha por item.
- As tabelas têm páginas de 20, 50 ou 100 registros; as exportações incluem todos os resultados filtrados.

## Usuários

O login usa e-mail e senha. Administradores cadastram novos usuários na tela **Usuários**. Veja [Login e permissões](LOGIN.md).
