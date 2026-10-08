package db.migration;

import java.sql.SQLException;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** Preserva as migrações existentes e adiciona unicidade sem distinguir maiúsculas. */
public class V6__product_unique_name extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        var connection = context.getConnection();
        try (var statement = connection.createStatement()) {
            try (var duplicates = statement.executeQuery(
                "SELECT LOWER(name) FROM products GROUP BY LOWER(name) HAVING COUNT(*) > 1")) {
                if (duplicates.next()) {
                    throw new SQLException("Existem nomes de materiais duplicados sem distinguir maiúsculas e minúsculas. "
                        + "Corrija os cadastros antes de aplicar a V6; nenhum cadastro será mesclado ou excluído automaticamente.");
                }
            }
            if ("H2".equals(connection.getMetaData().getDatabaseProductName())) {
                // H2 não suporta o índice de expressão do PostgreSQL. Coluna calculada equivalente nos testes.
                statement.execute("ALTER TABLE products ADD COLUMN name_case_insensitive VARCHAR(255) GENERATED ALWAYS AS (LOWER(name))");
                statement.execute("CREATE UNIQUE INDEX uk_products_name_lower ON products(name_case_insensitive)");
            } else {
                statement.execute("CREATE UNIQUE INDEX uk_products_name_lower ON products(LOWER(name))");
            }
        }
    }
}
