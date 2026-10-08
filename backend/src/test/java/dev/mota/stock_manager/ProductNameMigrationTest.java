package dev.mota.stock_manager;

import db.migration.V6__product_unique_name;
import java.sql.DriverManager;
import java.sql.SQLException;
import org.flywaydb.core.api.migration.Context;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProductNameMigrationTest {
    @Test
    void rejectsLegacyDuplicatesBeforeChangingSchemaOrData() throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:migration_duplicates;MODE=PostgreSQL", "sa", "")) {
            var context = mock(Context.class);
            when(context.getConnection()).thenReturn(connection);
            try (var statement = connection.createStatement()) {
                statement.execute("CREATE TABLE products (name VARCHAR(255) NOT NULL, version BIGINT NOT NULL)");
                statement.execute("INSERT INTO products VALUES ('Cabo', 7), ('cabo', 2)");
                var error = assertThrows(SQLException.class, () -> new V6__product_unique_name().migrate(context));
                assertTrue(error.getMessage().contains("duplicados"));
                try (var rows = statement.executeQuery("SELECT COUNT(*), SUM(version) FROM products")) {
                    assertTrue(rows.next()); assertEquals(2, rows.getInt(1)); assertEquals(9, rows.getInt(2));
                }
                assertThrows(SQLException.class, () -> statement.executeQuery("SELECT name_case_insensitive FROM products"));
            }
        }
    }

    @Test
    void databaseRejectsDuplicateEvenWhenServiceChecksAreBypassed() throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:migration_unique;MODE=PostgreSQL", "sa", "")) {
            var context = mock(Context.class);
            when(context.getConnection()).thenReturn(connection);
            try (var statement = connection.createStatement()) {
                statement.execute("CREATE TABLE products (name VARCHAR(255) NOT NULL, version BIGINT NOT NULL)");
                statement.execute("INSERT INTO products VALUES ('Cabo', 7)");
                new V6__product_unique_name().migrate(context);
                assertThrows(SQLException.class, () -> statement.execute("INSERT INTO products VALUES ('cabo', 0)"));
                try (var rows = statement.executeQuery("SELECT name, version FROM products")) {
                    assertTrue(rows.next()); assertEquals("Cabo", rows.getString(1)); assertEquals(7, rows.getInt(2));
                    assertFalse(rows.next());
                }
            }
        }
    }
}
