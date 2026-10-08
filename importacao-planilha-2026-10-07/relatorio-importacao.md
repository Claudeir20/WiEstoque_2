# Importação da planilha de estoque

Importação realizada no banco local do sistema em 07/10/2026. A planilha original foi preservada.

- Materiais: 32 cadastros e 1588 unidades.
- Roteadores: 986 cadastros; 969 disponíveis e 17 fora do estoque.
- Técnicos: 17 cadastros.
- Histórico: 52 movimentações (37 saídas, 14 entradas e 1 devolução).

## Critérios usados

- Saldos atuais da aba ESTOQUE importados diretamente. O histórico não alterou os saldos novamente.
- MANTA 65/19-150: saldo de 40 unidades confirmado pelo usuário.
- Status dos roteadores da aba ROTEADORES preservados. Equipamentos da aba PRONTOS SISTEMA incorporados como disponíveis.
- As 955 linhas de PRONTOS SISTEMA representam 938 identidades. Uma também existe em ROTEADORES; foi cadastrada uma única vez.
- As 19 saídas de materiais presentes também em MOVIMENTACOES TECNICOS foram unificadas; os horários dessa aba foram preservados.
- A devolução de 1 CAIXA DE EMENDA de 05/10/2026 foi identificada em MOVIMENTACOES TECNICOS, linha 13, técnico EDUARDO; ENTRADAS, linha 14, foi vinculada ao mesmo evento.
- EDY aparece duas vezes em TECNICOS; foi cadastrado uma única vez.
- Setores não constam na planilha: armazenados como Não informado. Mínimos ausentes: 0 (sem limite definido).
- Seriais em maiúsculas e MACs formatados; sem inventar caracteres ausentes.
- Datas de cadastro indicam a importação. As datas reais das movimentações foram preservadas.
- Entradas históricas de roteadores foram preservadas como ENTRY na importação; o fluxo atual de novos roteadores continua pelo cadastro.
- Informações de origem, fornecedor, custos e demais campos sem correspondente no sistema estão preservados nos dados de origem deste relatório; alguns fornecedores aparecem nas observações do histórico.

## Pendências não importadas

| Aba | Linha | Motivo |
| --- | --- | --- |
| ROTEADORES | 41 | MAC inválido: 35522133 |
| ROTEADORES | 44 | Patrimônio não informado |
| ENTRADAS | 12 | MAC inválido no roteador; cadastro pendente |
| ENTRADAS | 16 | Data não informada |

A entrada pendente na linha 12 refere-se ao roteador da linha 41. A linha 16 é uma entrada de 2 PILHAS AA sem data. O saldo atual de PILHAS AA (80) foi mantido conforme ESTOQUE.

## Divergências preservadas para revisão

- Patrimônio 23253: ROTEADORES indica ESTOQUE, mas há saída para THALYTA em 02/10/2026 sem devolução no histórico. O estado atual da aba ROTEADORES foi mantido.
- ASKEY RTF7000, serial ASKY000809D3: patrimônio D em ROTEADORES e 1 em ENTRADAS. Foi vinculada a mesma identidade por serial/MAC, mantendo D como cadastro atual.
- CAIXA DE EMENDA: há duas entradas de 52 em 01/10/2026, com fornecedores diferentes. As duas linhas foram preservadas como eventos da fonte; o saldo atual permaneceu 47.
- As identidades abaixo têm descrições de modelo diferentes. Em PRONTOS SISTEMA, ambas as descrições aparecem no cadastro, separadas por /. Na interseção com ROTEADORES, foi mantida a descrição atual desta aba.

- PRONTOS SISTEMA, linha 246: Mesma identidade, descrição de modelo divergente: 14989; modelos: ZTE ONU ZXHN F601 + MULTILASER ZXHN H199A / ONU ZTE ZXHN F601 + MULTILASER ZTE ZXHN G199A; ONU ZTE ZXHN F601 + MULTILASER ZTE ZXHN G199A.
- PRONTOS SISTEMA, linha 309: Mesma identidade, descrição de modelo divergente: 16345; modelos: HUAWEI EG8145V7 / HUAWEI HG8145V5 BRANCA; HUAWEI HG8145V5 BRANCA.
- PRONTOS SISTEMA, linha 337: Mesma identidade, descrição de modelo divergente: 17396; modelos: EG8145V5 / HUAWEI EG8145V5; HUAWEI EG8145V5.
- PRONTOS SISTEMA, linha 369: Mesma identidade, descrição de modelo divergente: 17890; modelos: ZTE ZXHN F670L / ZTE ZXHN F660; ZTE ZXHN F660.
- PRONTOS SISTEMA, linha 378: Mesma identidade, descrição de modelo divergente: 17952; modelos: ZTE PADRAO ZXHN F670L / ZTE ZXHN F670L; ZTE ZXHN F670L.
- PRONTOS SISTEMA, linha 383: Mesma identidade, descrição de modelo divergente: 17977; modelos: ZTE ZXHN F670L / ZTE PADRAO ZXHN F670L; ZTE PADRAO ZXHN F670L.
- PRONTOS SISTEMA, linha 385: Mesma identidade, descrição de modelo divergente: 17984; modelos: ZTE QUADRADA ZXHN F670L / ZTE PADRAO ZXHN F670L; ZTE PADRAO ZXHN F670L.
- PRONTOS SISTEMA, linha 455: Mesma identidade, descrição de modelo divergente: 18485; modelos: ZTE PADRAO ZXHN F670L / ZTE ZXHN F670L; ZTE ZXHN F670L.
- PRONTOS SISTEMA, linha 527: Mesma identidade, descrição de modelo divergente: 19140; modelos: ZTE PADRAO ZXHN F670L / ZTE QUADRADA ZXHN F670L; ZTE QUADRADA ZXHN F670L.
- PRONTOS SISTEMA, linha 566: Mesma identidade, descrição de modelo divergente: 19455; modelos: ZTE PADRAO ZXHN F670L / ZTE ZXHN F670L; ZTE ZXHN F670L.
- PRONTOS SISTEMA, linha 628: Mesma identidade, descrição de modelo divergente: 19881; modelos: ZTE ZXHN F662 / ZTE PADRAO ZXHN F670L; ZTE PADRAO ZXHN F670L.
- PRONTOS SISTEMA, linha 652: Mesma identidade, descrição de modelo divergente: 20007; modelos: ZTE PADRAO ZXHN F670L / ZTE ZXHN F670L; ZTE ZXHN F670L.
- PRONTOS SISTEMA, linha 718: Mesma identidade, descrição de modelo divergente: 20364; modelos: ZTE PADRAO ZXHN F670L / ZTE ZXHN F670L; ZTE ZXHN F670L.
- PRONTOS SISTEMA, linha 753: Mesma identidade, descrição de modelo divergente: 20603; modelos: ZTE PADRAO ZXHN F670L / ZTE ZXHN F670L; ZTE ZXHN F670L.
- PRONTOS SISTEMA, linha 786: Mesma identidade, descrição de modelo divergente: 20999; modelos: ZTE PADRAO ZXHN F670L / ZTE ZXHN F670L; ZTE ZXHN F670L.
- PRONTOS SISTEMA, linha 800: Mesma identidade, descrição de modelo divergente: 21120; modelos: HUAWEI V2 BRANCA / HUAWEI V2; HUAWEI V2.
- PRONTOS SISTEMA, linha 924: Mesma identidade, descrição de modelo divergente: 22417; modelos: ZTE ZXHN F6201B; ZTE MULTI ZXHN F6201B.
- PRONTOS SISTEMA, linha 939: Mesma identidade, descrição de modelo divergente: 22668; modelos: TPLINKXC220-G3V PRETO / TPLINKXC220-G3V; TPLINKXC220-G3V.

Detalhes completos, identificadores no banco, linhas de origem e decisões estão em dados-importados-e-pendencias.json. As linhas originais das abas solicitadas estão em dados-originais-das-abas.json.

SHA-256 da planilha: 3ed469668e3bb8b43d744f61affc783adc025421860c029a3f0033c4c76c2b9c
