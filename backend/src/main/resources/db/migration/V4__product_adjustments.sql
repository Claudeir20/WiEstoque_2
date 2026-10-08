CREATE TABLE product_adjustments (
 id UUID PRIMARY KEY, product_id UUID NOT NULL REFERENCES products(id),
 previous_name VARCHAR(255) NOT NULL, new_name VARCHAR(255) NOT NULL,
 previous_quantity INTEGER NOT NULL CHECK(previous_quantity >= 0),
 new_quantity INTEGER NOT NULL CHECK(new_quantity >= 0),
 reason VARCHAR(255) NOT NULL, date TIMESTAMP(6) NOT NULL
);
CREATE INDEX idx_product_adjustments_product ON product_adjustments(product_id, date);
