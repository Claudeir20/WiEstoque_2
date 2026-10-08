-- Técnicos
CREATE TABLE technicians (
                             id      UUID         PRIMARY KEY,
                             name    VARCHAR(255) NOT NULL,
                             sector  VARCHAR(255) NOT NULL,
                             active  BOOLEAN      NOT NULL,
                             CONSTRAINT uk_technicians_name UNIQUE (name)
);

-- Produtos controlados por quantidade
CREATE TABLE products (
                          id               UUID         PRIMARY KEY,
                          name             VARCHAR(255) NOT NULL,
                          quantity         INTEGER      NOT NULL,
                          minimum_quantity INTEGER      NOT NULL,
                          created_at       TIMESTAMP(6) NOT NULL,
                          active           BOOLEAN      NOT NULL,
                          CONSTRAINT uk_products_name UNIQUE (name),
                          CONSTRAINT ck_products_quantity CHECK (quantity >= 0),
                          CONSTRAINT ck_products_minimum_quantity CHECK (minimum_quantity >= 0)
);

-- Roteadores controlados individualmente (patrimônio, série e MAC)
CREATE TABLE routers (
                         id            UUID         PRIMARY KEY,
                         asset_number  VARCHAR(255) NOT NULL,
                         model         VARCHAR(255) NOT NULL,
                         serial_number VARCHAR(255) NOT NULL,
                         mac           VARCHAR(255) NOT NULL,
                         status        VARCHAR(50)  NOT NULL,
                         created_at    TIMESTAMP(6) NOT NULL,
                         CONSTRAINT uk_routers_asset_number  UNIQUE (asset_number),
                         CONSTRAINT uk_routers_serial_number UNIQUE (serial_number),
                         CONSTRAINT uk_routers_mac           UNIQUE (mac),
                         CONSTRAINT ck_routers_status CHECK (status IN ('IN_STOCK', 'OUT_OF_STOCK'))
);

CREATE INDEX idx_routers_status ON routers (status);

-- Movimentações (saída/devolução)
CREATE TABLE movements (
                           id            UUID         PRIMARY KEY,
                           technician_id UUID         NOT NULL,
                           type          VARCHAR(50)  NOT NULL,
                           date          TIMESTAMP(6) NOT NULL,
                           observation   VARCHAR(255),
                           CONSTRAINT fk_movements_technician
                               FOREIGN KEY (technician_id) REFERENCES technicians (id)
);

CREATE INDEX idx_movements_technician_id ON movements (technician_id);
CREATE INDEX idx_movements_date          ON movements (date);

-- Itens de cada movimentação (produto OU roteador)
CREATE TABLE movement_items (
                                id          UUID         PRIMARY KEY,
                                movement_id UUID         NOT NULL,
                                type        VARCHAR(50)  NOT NULL,
                                product_id  UUID,
                                router_id   UUID,
                                quantity    INTEGER      NOT NULL,
                                client_code VARCHAR(255),
                                CONSTRAINT fk_movement_items_movement
                                    FOREIGN KEY (movement_id) REFERENCES movements (id) ON DELETE CASCADE,
                                CONSTRAINT fk_movement_items_product
                                    FOREIGN KEY (product_id) REFERENCES products (id),
                                CONSTRAINT fk_movement_items_router
                                    FOREIGN KEY (router_id) REFERENCES routers (id),
                                CONSTRAINT ck_movement_items_quantity CHECK (quantity > 0),
                                CONSTRAINT ck_movement_items_type CHECK (type IN ('PRODUCT', 'ROUTER')),
    -- o item é de produto OU de roteador, nunca os dois nem nenhum
                                CONSTRAINT ck_movement_items_target CHECK (
                                    (type = 'PRODUCT' AND product_id IS NOT NULL AND router_id IS NULL)
                                        OR
                                    (type = 'ROUTER'  AND router_id  IS NOT NULL AND product_id IS NULL AND quantity = 1)
                                    )
);

CREATE INDEX idx_movement_items_movement_id ON movement_items (movement_id);
CREATE INDEX idx_movement_items_product_id  ON movement_items (product_id);
CREATE INDEX idx_movement_items_router_id   ON movement_items (router_id);