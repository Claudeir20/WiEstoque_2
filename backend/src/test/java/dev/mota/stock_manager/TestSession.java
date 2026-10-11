package dev.mota.stock_manager;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Cliente HTTP dos testes de integração: entra com o administrador inicial
 * e envia o token CSRF nas operações que alteram dados, como o frontend.
 */
final class TestSession {
    // Usados nas propriedades dos testes para criar o administrador inicial.
    static final String ADMIN_EMAIL = "INITIAL_ADMIN_EMAIL=admin@test.local";
    static final String ADMIN_PASSWORD = "INITIAL_ADMIN_PASSWORD=admin-test-123";

    private final HttpClient client = HttpClient.newBuilder()
        .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).build();
    private final String baseUrl;
    private final String csrf;

    TestSession(int port) throws Exception {
        baseUrl = "http://localhost:" + port;
        String form = "email=" + encode(value(ADMIN_EMAIL)) + "&password=" + encode(value(ADMIN_PASSWORD));
        var login = client.send(HttpRequest.newBuilder(URI.create(baseUrl + "/auth/login"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("X-CSRF-TOKEN", csrfToken())
                .POST(HttpRequest.BodyPublishers.ofString(form)).build(),
            HttpResponse.BodyHandlers.ofString());
        assertEquals(200, login.statusCode(), "Falha no login dos testes");
        // O login renova a sessão; o token precisa ser obtido novamente.
        csrf = csrfToken();
    }

    HttpResponse<String> request(String method, String path, String body) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create(baseUrl + path))
            .header("Content-Type", "application/json")
            .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        if (!method.equals("GET")) builder.header("X-CSRF-TOKEN", csrf);
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String csrfToken() throws Exception {
        var response = client.send(HttpRequest.newBuilder(URI.create(baseUrl + "/auth/csrf")).GET().build(),
            HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        return response.body().split("\"token\":\"")[1].split("\"")[0];
    }

    private static String value(String property) {
        return property.substring(property.indexOf('=') + 1);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
