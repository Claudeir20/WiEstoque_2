package dev.mota.stock_manager;

import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Garante que as listas da tela inicial não fazem uma consulta por registro (N+1).
 * Com o banco na nuvem, cada consulta extra soma o tempo de ida e volta ao Neon.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:query_count;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.show-sql=false", "spring.jpa.properties.hibernate.generate_statistics=true",
    TestSession.ADMIN_EMAIL, TestSession.ADMIN_PASSWORD
})
class QueryCountIntegrationTest {
    private static final int MOVEMENTS = 30;

    @Value("${local.server.port}") int port;
    @Autowired EntityManagerFactory entityManagerFactory;

    @Test
    void listsLoadWithAFixedNumberOfQueries() throws Exception {
        var session = new TestSession(port);
        String technician = id(session.request("POST", "/technicians", "{\"name\":\"Consultas\",\"sector\":\"Centro\"}").body());
        for (int i = 0; i < MOVEMENTS; i++) {
            String product = id(session.request("POST", "/products", "{\"name\":\"Material " + i + "\",\"quantity\":10,\"minimumQuantity\":1}").body());
            String router = id(session.request("POST", "/routers", "{\"assetNumber\":\"PAT-Q" + i + "\",\"model\":\"ZTE\",\"serialNumber\":\"SN-Q" + i
                + "\",\"mac\":\"" + String.format("AABBCCDD%04X", i) + "\"}").body());
            String items = "{\"type\":\"PRODUCT\",\"productId\":\"" + product + "\",\"quantity\":1},{\"type\":\"ROUTER\",\"routerId\":\"" + router + "\",\"quantity\":1}";
            var movement = session.request("POST", "/movements", "{\"type\":\"WITHDRAWAL\",\"technicianId\":\"" + technician + "\",\"items\":[" + items + "]}");
            assertEquals(201, movement.statusCode(), movement.body());
        }
        // Um ajuste garante que a lista de materiais também consulta o histórico de ajustes.
        String adjusted = id(session.request("POST", "/products", "{\"name\":\"Ajustado\",\"quantity\":5,\"minimumQuantity\":1}").body());
        assertEquals(200, session.request("PUT", "/products/" + adjusted, "{\"name\":\"Ajustado\",\"quantity\":4,\"reason\":\"Contagem\",\"version\":0}").statusCode());

        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();

        statistics.clear();
        var products = session.request("GET", "/products?includeArchived=true", null);
        assertEquals(200, products.statusCode());
        assertTrue(products.body().contains("\"hasAdjustments\":true"));
        assertTrue(statistics.getPrepareStatementCount() <= 3, "GET /products: " + statistics.getPrepareStatementCount() + " consultas");

        statistics.clear();
        var movements = session.request("GET", "/movements", null);
        assertEquals(200, movements.statusCode());
        assertEquals(MOVEMENTS, movements.body().split("\"technicianName\"", -1).length - 1, "movimentações duplicadas ou ausentes");
        assertTrue(statistics.getPrepareStatementCount() <= 3, "GET /movements: " + statistics.getPrepareStatementCount() + " consultas");
    }

    private static String id(String body) {
        return body.split("\"id\":\"")[1].split("\"")[0];
    }
}
