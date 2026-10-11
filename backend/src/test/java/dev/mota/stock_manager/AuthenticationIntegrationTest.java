package dev.mota.stock_manager;

import dev.mota.stock_manager.entity.User;
import dev.mota.stock_manager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.net.*;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:authentication;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "INITIAL_ADMIN_EMAIL=bootstrap@example.com", "INITIAL_ADMIN_PASSWORD=bootstrap123",
    "spring.datasource.username=sa", "spring.datasource.password=", "spring.jpa.show-sql=false"
})
class AuthenticationIntegrationTest {
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;
    @Value("${local.server.port}") int port;
    HttpClient client;

    @BeforeEach
    void setup() {
        client = HttpClient.newBuilder().cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).build();
        users.deleteAll();
        users.saveAndFlush(User.create("Operador", "operator@example.com", encoder.encode(" senha123 ")));
        var admin = users.saveAndFlush(User.create("Administrador", "admin@example.com", encoder.encode("admin123")));
        jdbc.update("UPDATE users SET administrator = TRUE WHERE id = ?", admin.getId());
    }

    private HttpResponse<String> send(String path, String method, String body, String csrf, String contentType) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (csrf != null) builder.header("X-CSRF-TOKEN", csrf);
        if (contentType != null) builder.header("Content-Type", contentType);
        builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }
    private String csrf() throws Exception {
        var response = send("/auth/csrf", "GET", null, null, null);
        assertEquals(200, response.statusCode());
        return response.body().split("\"token\":\"")[1].split("\"")[0];
    }
    private int login(String email, String password, String token) throws Exception {
        return send("/auth/login", "POST", "email=" + URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8)
            + "&password=" + URLEncoder.encode(password, java.nio.charset.StandardCharsets.UTF_8), token,
            "application/x-www-form-urlencoded").statusCode();
    }

    @Test
    void servesFrontendWithoutOpeningProtectedApi() throws Exception {
        org.junit.jupiter.api.Assumptions.assumeTrue(getClass().getResource("/static/index.html") != null);
        var home = send("/", "GET", null, null, null);
        assertEquals(200, home.statusCode());
        assertTrue(home.body().contains("id=" + (char) 34 + "root" + (char) 34));
        var asset = java.util.regex.Pattern.compile("/assets/[^" + (char) 34 + " ]+\\.js").matcher(home.body());
        assertTrue(asset.find());
        assertEquals(200, send(asset.group(), "GET", null, null, null).statusCode());
        assertEquals(200, send("/wiestoque.svg", "GET", null, null, null).statusCode());
        assertEquals(401, send("/products", "GET", null, null, null).statusCode());
        assertEquals(401, send("/users", "POST", "{}", csrf(), "application/json").statusCode());
    }

    @Test
    void authenticatesDatabaseUserKeepsSessionAndInvalidatesOnLogout() throws Exception {
        assertEquals(401, send("/auth/me", "GET", null, null, null).statusCode());
        assertEquals(401, login("operator@example.com", " senha123 ", null));
        assertEquals(401, login("operator@example.com", "incorrect", csrf()));
        assertEquals(200, login(" OPERATOR@EXAMPLE.COM ", " senha123 ", csrf()));
        var me = send("/auth/me", "GET", null, null, null);
        assertEquals(200, me.statusCode());
        assertTrue(me.body().contains("\"email\":\"operator@example.com\""));
        assertEquals(200, send("/products", "GET", null, null, null).statusCode());
        assertEquals(403, send("/auth/logout", "POST", null, null, null).statusCode());
        assertEquals(204, send("/auth/logout", "POST", null, csrf(), null).statusCode());
        assertEquals(401, send("/auth/me", "GET", null, null, null).statusCode());
        assertEquals(401, send("/products", "GET", null, null, null).statusCode());
    }

    @Test
    void onlyAdministratorCanRegisterUsers() throws Exception {
        String body = "{\"name\":\"Novo\",\"email\":\"new@example.com\",\"password\":\"senha123\"}";
        assertEquals(200, login("operator@example.com", " senha123 ", csrf()));
        assertEquals(403, send("/users", "POST", body, csrf(), "application/json").statusCode());
        assertEquals(204, send("/auth/logout", "POST", null, csrf(), null).statusCode());
        assertEquals(200, login("admin@example.com", "admin123", csrf()));
        var response = send("/users", "POST", body, csrf(), "application/json");
        assertEquals(201, response.statusCode(), response.body());
        assertFalse(response.body().contains("password"));
        assertTrue(users.existsByEmail("new@example.com"));
    }
}