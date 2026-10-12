-- PASSO 2 — LANÇAMENTO DAS 22 SAÍDAS COM A DATA ORIGINAL
-- Rode somente depois que o passo 1 mostrar tudo OK.
-- Se qualquer problema for encontrado, NADA é gravado e aparece uma mensagem de erro.
-- Se já tiver sido lançado antes, o script recusa e não duplica.
DO $$
DECLARE
    problemas text;
    grupo record;
    item record;
    novo_movimento uuid;
    sequencia int := 0;
BEGIN
    CREATE TEMP TABLE lancamento_local ON COMMIT DROP AS
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
        (18, DATE '2026-10-08', 'WESLEY',         'WESLLEY',        'CABO LC/UPC - LC/UPC AZUL', 'CORDAO AZUL',      NULL,    1),
        (19, DATE '2026-10-08', 'WESLEY',         'WESLLEY',        'CORDAO AMARELO',            NULL,               NULL,    1),
        (20, DATE '2026-10-08', 'PAULO VINICIUS', 'VINICIUS PAULO', 'CABO LC/UPC - LC/UPC AZUL', 'CORDAO AZUL',      NULL,    1),
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
    SELECT * FROM conferidos;

    SELECT string_agg('Linha ' || ordem || ' (' || to_char(dia, 'DD/MM') || ', ' || tecnico || ', '
                      || coalesce(material, 'roteador ' || patrimonio) || '): ' || situacao, E'\n' ORDER BY ordem)
      INTO problemas
      FROM lancamento_local
     WHERE situacao <> 'OK';

    IF problemas IS NOT NULL THEN
        RAISE EXCEPTION E'Nada foi gravado. Corrija antes de lançar:\n%', problemas;
    END IF;

    -- Uma movimentação por técnico e por dia, com todos os itens dele naquele dia
    FOR grupo IN
        SELECT dia, tecnico_id, min(ordem) AS primeira
          FROM lancamento_local
         GROUP BY dia, tecnico_id
         ORDER BY dia, min(ordem) DESC
    LOOP
        sequencia := sequencia + 1;
        novo_movimento := gen_random_uuid();

        INSERT INTO movements (id, technician_id, type, date, observation)
        VALUES (novo_movimento, grupo.tecnico_id, 'WITHDRAWAL',
                grupo.dia + TIME '12:00' + make_interval(mins => sequencia),
                'Lançamento retroativo do sistema local (08 a 10/10/2026)');

        FOR item IN
            SELECT * FROM lancamento_local
             WHERE dia = grupo.dia AND tecnico_id = grupo.tecnico_id
             ORDER BY ordem
        LOOP
            IF item.patrimonio IS NULL THEN
                UPDATE products
                   SET quantity = quantity - item.quantidade, version = version + 1
                 WHERE id = item.material_id;

                INSERT INTO movement_items (id, movement_id, type, product_id, router_id, quantity, client_code)
                VALUES (gen_random_uuid(), novo_movimento, 'PRODUCT', item.material_id, NULL, item.quantidade, NULL);
            ELSE
                UPDATE routers
                   SET status = 'OUT_OF_STOCK', version = version + 1
                 WHERE id = item.roteador_id AND status = 'IN_STOCK';

                INSERT INTO movement_items (id, movement_id, type, product_id, router_id, quantity, client_code)
                VALUES (gen_random_uuid(), novo_movimento, 'ROUTER', NULL, item.roteador_id, 1, NULL);
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Concluído: % movimentações criadas com % itens.',
        sequencia, (SELECT count(*) FROM lancamento_local);
END $$;
