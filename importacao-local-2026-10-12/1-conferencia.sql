-- PASSO 1 — CONFERÊNCIA (somente leitura, não altera nada)
-- Mostra as 22 saídas que faltam na nuvem e o que foi encontrado no banco.
-- Todas as linhas precisam aparecer com situacao = OK antes do passo 2.
WITH pendentes (ordem, dia, tecnico, tecnico_alt, material, material_alt, patrimonio, quantidade) AS (
    VALUES
    (1,  DATE '2026-10-10', 'GILBERTO',       NULL,             'CABO DROP',                 'Bobina Cabo Drop', NULL,    1),
    (2,  DATE '2026-10-10', 'GILBERTO',       NULL,             'CAIXA DE EMENDA',           NULL,               NULL,    2),
    (3,  DATE '2026-10-10', 'GILBERTO',       NULL,             'ESTOPAS',                   NULL,               NULL,    1),
    (4,  DATE '2026-10-10', 'WILSON',         NULL,             NULL,                        NULL,               '23252', 1),
    (5,  DATE '2026-10-10', 'WILSON',         NULL,             NULL,                        NULL,               '23256', 1),
    (6,  DATE '2026-10-10', 'MARCO',          NULL,             'CONECTOR',                  NULL,               NULL,    10),
    (7,  DATE '2026-10-10', 'ALEX',           NULL,             NULL,                        NULL,               '23147', 1),
    (8,  DATE '2026-10-10', 'ALEX',           NULL,             NULL,                        NULL,               '23300', 1),
    (9,  DATE '2026-10-10', 'ALEX',           NULL,             NULL,                        NULL,               '22417', 1),
    (10, DATE '2026-10-10', 'ALEX',           NULL,             'CONECTOR',                  NULL,               NULL,    10),
    (11, DATE '2026-10-10', 'ALEX',           NULL,             'Esticador',                 NULL,               NULL,    30),
    (12, DATE '2026-10-09', 'LUCAS',          NULL,             NULL,                        NULL,               '23226', 1),
    (13, DATE '2026-10-09', 'LUCAS',          NULL,             NULL,                        NULL,               '18028', 1),
    (14, DATE '2026-10-09', 'LUCAS',          NULL,             'FITA ISOLANTE',             NULL,               NULL,    1),
    (15, DATE '2026-10-09', 'JHONATAN',       NULL,             'FITA ISOLANTE',             NULL,               NULL,    1),
    (16, DATE '2026-10-09', 'JHONATAN',       NULL,             NULL,                        NULL,               '21574', 1),
    (17, DATE '2026-10-09', 'JHONATAN',       NULL,             NULL,                        NULL,               '21033', 1),
    (18, DATE '2026-10-08', 'WESLEY',         NULL,             'CABO LC/UPC - LC/UPC AZUL', NULL,               NULL,    1),
    (19, DATE '2026-10-08', 'WESLEY',         NULL,             'CORDAO AMARELO',            NULL,               NULL,    1),
    (20, DATE '2026-10-08', 'PAULO VINICIUS', 'VINICIUS PAULO', 'CABO LC/UPC - LC/UPC AZUL', NULL,               NULL,    1),
    (21, DATE '2026-10-08', 'JHONATAN',       NULL,             NULL,                        NULL,               '21599', 1),
    (22, DATE '2026-10-08', 'JHONATAN',       NULL,             NULL,                        NULL,               '21348', 1)
),
resolvidos AS (
    SELECT p.*,
           t.id AS tecnico_id, t.name AS tecnico_nuvem, t.active AS tecnico_ativo,
           pr.id AS material_id, pr.name AS material_nuvem, pr.quantity AS saldo, pr.active AS material_ativo,
           r.id AS roteador_id, r.model AS roteador_modelo, r.status AS roteador_status, r.active AS roteador_ativo
    FROM pendentes p
    LEFT JOIN LATERAL (
        SELECT * FROM technicians x
        WHERE upper(trim(x.name)) IN (upper(p.tecnico), upper(coalesce(p.tecnico_alt, p.tecnico)))
        ORDER BY upper(trim(x.name)) = upper(p.tecnico) DESC, x.active DESC
        LIMIT 1
    ) t ON true
    LEFT JOIN LATERAL (
        SELECT * FROM products x
        WHERE p.material IS NOT NULL
          AND upper(trim(x.name)) IN (upper(p.material), upper(coalesce(p.material_alt, p.material)))
        ORDER BY upper(trim(x.name)) = upper(p.material) DESC, x.active DESC
        LIMIT 1
    ) pr ON true
    LEFT JOIN routers r ON r.asset_number = p.patrimonio
),
avaliados AS (
    SELECT r.*,
           sum(r.quantidade) FILTER (WHERE r.material_id IS NOT NULL)
               OVER (PARTITION BY r.material_id) AS total_material,
           CASE
               WHEN EXISTS (SELECT 1 FROM movements m WHERE m.observation = 'Lançamento retroativo do sistema local (08 a 10/10/2026)')
                   THEN 'JÁ LANÇADO ANTES (não rode de novo)'
               WHEN r.tecnico_id IS NULL THEN 'Técnico não encontrado'
               WHEN NOT r.tecnico_ativo THEN 'Técnico arquivado'
               WHEN r.patrimonio IS NULL AND r.material_id IS NULL THEN 'Material não encontrado'
               WHEN r.patrimonio IS NULL AND NOT r.material_ativo THEN 'Material arquivado'
               WHEN r.patrimonio IS NOT NULL AND r.roteador_id IS NULL THEN 'Roteador não encontrado'
               WHEN r.patrimonio IS NOT NULL AND NOT r.roteador_ativo THEN 'Roteador arquivado'
               WHEN r.patrimonio IS NOT NULL AND r.roteador_status <> 'IN_STOCK' THEN 'Roteador já está fora do estoque'
           END AS erro_basico
    FROM resolvidos r
),
conferidos AS (
    SELECT a.*,
           coalesce(a.erro_basico,
               CASE WHEN a.material_id IS NOT NULL AND a.total_material > a.saldo
                    THEN 'Saldo insuficiente (tem ' || a.saldo || ', precisa ' || a.total_material || ')' END,
               'OK') AS situacao
    FROM avaliados a
)
SELECT ordem,
       to_char(dia, 'DD/MM/YYYY') AS data,
       tecnico_nuvem AS tecnico,
       coalesce(material_nuvem, roteador_modelo || ' · ' || patrimonio, coalesce(material, patrimonio)) AS item,
       quantidade,
       CASE WHEN patrimonio IS NULL THEN saldo::text ELSE roteador_status END AS saldo_ou_status_atual,
       situacao
FROM conferidos
ORDER BY ordem;
