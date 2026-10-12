# Saídas do sistema local que faltam na nuvem

Comparação feita em 12/10/2026 entre o histórico do sistema local (semana de 05 a 10/10/2026) e o histórico da nuvem.
Faltam 22 saídas na nuvem: as de 08/10 (5), 09/10 (6) e 10/10 (11).

Os scripts lançam essas saídas no banco do Neon com a data original. Eles também baixam o saldo dos materiais e passam os roteadores para fora do estoque, como o sistema faz em uma saída comum.

| Arquivo | O que faz |
| --- | --- |
| `1-conferencia.sql` | Só consulta. Mostra cada saída, o que foi encontrado no banco e se está OK. |
| `2-lancamento.sql` | Grava tudo de uma vez. Se houver qualquer problema, não grava nada. Se já tiver sido lançado, recusa e não duplica. |

## Como foram feitos os lançamentos

- Cada técnico ganha uma movimentação por dia, com todos os itens dele naquele dia, no horário de 12h.
- Os roteadores são localizados pelo patrimônio.
- Os materiais e os técnicos são localizados pelo nome, sem diferenciar maiúsculas de minúsculas.
- Equivalências usadas: CABO DROP também é procurado como "Bobina Cabo Drop", PAULO VINICIUS também como "VINICIUS PAULO", WESLEY também como "WESLLEY" e CABO LC/UPC - LC/UPC AZUL também como "CORDAO AZUL".
- Todas as movimentações recebem a observação "Lançamento retroativo do sistema local (08 a 10/10/2026)".

## Passo a passo

1. **Faça um backup no Neon.** No console do Neon (console.neon.tech), abra o projeto e vá em **Branches**. Clique em **New Branch** e crie uma branch com o nome `antes-lancamento-local`, com Parent branch `production` e a opção **Branch data and schema**. Em Auto-delete, escolha um prazo de pelo menos 7 dias. Se algo der errado, essa branch tem o banco exatamente como estava.
2. **Abra o SQL Editor.** No menu do projeto, entre em **SQL Editor** e confira se o banco e a branch selecionados no topo são os de produção (a `production`).
3. **Rode a conferência.** Abra `1-conferencia.sql`, copie todo o conteúdo, cole no editor e clique em **Run**. Aparecem 22 linhas. Confira a coluna `situacao`:
   - Se todas estiverem `OK`, siga para o passo 4.
   - Se alguma não estiver `OK`, não rode o passo 4. A mensagem diz o que falta, por exemplo técnico ou material com outro nome, roteador já fora do estoque ou saldo insuficiente.
4. **Rode o lançamento.** Limpe o editor e cole todo o conteúdo de `2-lancamento.sql`. Clique em **Run**. A mensagem esperada é `Concluído: 9 movimentações criadas com 22 itens.`
5. **Confira no sistema.** Abra https://wiestoque-2.onrender.com e veja o histórico de 08, 09 e 10/10. Confira também o saldo dos materiais e o status dos roteadores.
6. **Apague a branch de backup** depois de alguns dias, quando tiver certeza de que está tudo certo.

Se o passo 4 mostrar a mensagem "Nada foi gravado", nenhum dado foi alterado. Resolva o que ela indicar e rode de novo.
