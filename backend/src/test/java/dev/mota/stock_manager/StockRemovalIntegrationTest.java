package dev.mota.stock_manager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:removal;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.show-sql=false", TestSession.ADMIN_EMAIL, TestSession.ADMIN_PASSWORD
})
class StockRemovalIntegrationTest {
    @Value("${local.server.port}") int port;
    private TestSession session;

    @BeforeEach
    void login() throws Exception {
        session = new TestSession(port);
    }

    private HttpResponse<String> request(String method, String path, String body) throws Exception {
        return session.request(method, path, body);
    }

    private String create(String path, String body) throws Exception {
        var response = request("POST", path, body);
        assertEquals(201, response.statusCode(), response.body());
        return response.body().split("\"id\":\"")[1].split("\"")[0];
    }

    private String product(String name, int quantity) throws Exception {
        return create("/products", "{\"name\":\"" + name + "\",\"quantity\":" + quantity + ",\"minimumQuantity\":1}");
    }

    private String router(String suffix, String mac) throws Exception {
        return create("/routers", "{\"assetNumber\":\"PAT-" + suffix + "\",\"model\":\"ZTE\",\"serialNumber\":\"SN-" + suffix + "\",\"mac\":\"" + mac + "\"}");
    }

    private HttpResponse<String> move(String type, String technician, String items) throws Exception {
        return request("POST", "/movements", "{\"type\":\"" + type + "\",\"technicianId\":\"" + technician + "\",\"items\":[" + items + "]}");
    }

    @Test
    void deletesUnusedItemsAndBlocksMaterialsWithBalance() throws Exception {
        String empty = product("Material sem movimento", 0);
        assertEquals(200, request("DELETE", "/products/" + empty, null).statusCode());
        assertFalse(request("GET", "/products", null).body().contains(empty));
        String stocked = product("Material com saldo", 5);
        assertEquals(400, request("DELETE", "/products/" + stocked, null).statusCode());
        assertEquals(400, request("POST", "/products/" + stocked + "/archive", "{}").statusCode());
        assertTrue(request("GET", "/products", null).body().contains(stocked));
        String unused = router("UNUSED", "001122334455");
        assertEquals(200, request("DELETE", "/routers/" + unused, null).statusCode());
        assertFalse(request("GET", "/routers", null).body().contains(unused));
        assertEquals(400, request("DELETE", "/routers/" + unused, null).statusCode());
    }

    @Test
    void preservesHistoryAndPreventsArchivedItemsFromMoving() throws Exception {
        String tech = create("/technicians", "{\"name\":\"Equipe arquivamento\",\"sector\":\"Centro\"}");
        String product = product("Material histórico", 2);
        String router = router("HISTORY", "001122334466");
        String productItem = "{\"type\":\"PRODUCT\",\"productId\":\"" + product + "\",\"quantity\":2}";
        String routerItem = "{\"type\":\"ROUTER\",\"routerId\":\"" + router + "\",\"quantity\":1}";
        assertEquals(201, move("WITHDRAWAL", tech, productItem + "," + routerItem).statusCode());
        assertEquals(400, request("DELETE", "/routers/" + router, null).statusCode());
        assertEquals(400, request("POST", "/routers/" + router + "/archive", "{}").statusCode());
        assertEquals(409, request("DELETE", "/products/" + product, null).statusCode());
        assertEquals(200, request("POST", "/products/" + product + "/archive", "{}").statusCode());
        assertEquals(400, move("RETURN", tech, productItem).statusCode());
        assertEquals(400, request("POST", "/movements", "{\"type\":\"ENTRY\",\"items\":[" + productItem + "]}").statusCode());
        assertEquals(201, move("RETURN", tech, routerItem).statusCode());
        assertEquals(400, request("DELETE", "/routers/" + router, null).statusCode());
        assertEquals(200, request("POST", "/routers/" + router + "/archive", "{}").statusCode());
        assertEquals(400, move("WITHDRAWAL", tech, routerItem).statusCode());
        assertEquals(400, request("POST", "/routers/" + router + "/archive", "{}").statusCode());
        assertFalse(request("GET", "/products", null).body().contains(product));
        assertFalse(request("GET", "/routers", null).body().contains(router));
        var history = request("GET", "/movements", null);
        assertEquals(200, history.statusCode());
        assertTrue(history.body().contains(product));
        assertTrue(history.body().contains(router));
        assertTrue(history.body().contains("Material histórico"));
        assertTrue(history.body().contains("PAT-HISTORY"));
    }
}
