package dev.mota.stock_manager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import java.net.URI;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:integration;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.show-sql=false"
})
class ApiIntegrationTest {
    @Value("${local.server.port}") int port;
    private final HttpClient client = HttpClient.newHttpClient();
    private HttpResponse<String> request(String path, String body) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (body != null) builder.header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body));
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }
    private String id(HttpResponse<String> response) {
        assertEquals(201, response.statusCode(), response.body());
        return response.body().split("\"id\":\"")[1].split("\"")[0];
    }
    @Test
    void completeInventoryFlowAndRollback() throws Exception {
        String technician = id(request("/technicians", "{\"name\":\"Teste API\",\"sector\":\"Centro\"}"));
        String product = id(request("/products", "{\"name\":\"Cabo teste\",\"quantity\":10,\"minimumQuantity\":2}"));
        String router = id(request("/routers", "{\"assetNumber\":\"PAT-TEST\",\"model\":\"AX\",\"serialNumber\":\"SN-TEST\",\"mac\":\"AA:BB:CC:DD:EE:FF\"}"));
        for (String endpoint : new String[]{"/products", "/technicians", "/routers", "/movements"}) assertEquals(200, request(endpoint, null).statusCode());
        String productItem = "{\"type\":\"PRODUCT\",\"productId\":\"" + product + "\",\"quantity\":3}";
        String routerItem = "{\"type\":\"ROUTER\",\"routerId\":\"" + router + "\",\"quantity\":1}";
        String withdrawal = "{\"technicianId\":\"" + technician + "\",\"type\":\"WITHDRAWAL\",\"items\":[" + productItem + "," + routerItem + "]}";
        assertEquals(201, request("/movements", withdrawal).statusCode());
        assertTrue(request("/products", null).body().contains("\"quantity\":7"));
        assertTrue(request("/routers", null).body().contains("OUT_OF_STOCK"));
        // The first item reduces stock, then the unavailable router fails: all changes must roll back.
        assertEquals(400, request("/movements", withdrawal).statusCode());
        assertTrue(request("/products", null).body().contains("\"quantity\":7"));
        assertEquals(201, request("/movements", withdrawal.replace("WITHDRAWAL", "RETURN")).statusCode());
        assertTrue(request("/products", null).body().contains("\"quantity\":10"));
        assertTrue(request("/routers", null).body().contains("IN_STOCK"));
        assertEquals(201, request("/movements", "{\"type\":\"ENTRY\",\"items\":[" + productItem + "]}").statusCode());
        assertTrue(request("/products", null).body().contains("\"quantity\":13"));
        assertTrue(request("/movements", null).body().contains("Entrada de estoque"));
        assertEquals(400, request("/movements", "{\"type\":\"ENTRY\",\"items\":[]}").statusCode());
        assertEquals(400, request("/movements", "{\"type\":\"WITHDRAWAL\",\"items\":[" + productItem + "]}").statusCode());
    }
    @Test
    void normalizesRouterIdentifiersBeforeSavingAndCheckingDuplicates() throws Exception {
        String body = "{\"assetNumber\":\"PAT-FORMAT\",\"model\":\"ZTE\",\"serialNumber\":\" sn-format \",\"mac\":\"aabbccdd1234\"}";
        var response = request("/routers", body);
        assertEquals(201, response.statusCode(), response.body());
        assertTrue(response.body().contains("\"serialNumber\":\"SN-FORMAT\""));
        assertTrue(response.body().contains("\"mac\":\"AA:BB:CC:DD:12:34\""));
        assertEquals(400, request("/routers", body.replace("PAT-FORMAT", "PAT-DUP-SERIAL").replace("aabbccdd1234", "aabbccdd5678")).statusCode());
        assertEquals(400, request("/routers", body.replace("PAT-FORMAT", "PAT-DUP-MAC").replace("sn-format", "sn-another").replace("aabbccdd1234", "aa-bb-cc-dd-12-34")).statusCode());
        assertEquals(400, request("/routers", body.replace("PAT-FORMAT", "PAT-INVALID").replace("sn-format", "sn-invalid").replace("aabbccdd1234", "D4D6B8N9S354A")).statusCode());
    }
}

