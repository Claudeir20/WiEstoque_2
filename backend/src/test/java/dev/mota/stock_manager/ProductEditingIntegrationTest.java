package dev.mota.stock_manager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import java.net.URI;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:editing;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.show-sql=false"
})
class ProductEditingIntegrationTest {
    @Value("${local.server.port}") int port;
    private final HttpClient client = HttpClient.newHttpClient();

    private HttpResponse<String> request(String method, String path, String body) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
            .header("Content-Type", "application/json")
            .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String create(String path, String body) throws Exception {
        var response = request("POST", path, body);
        assertEquals(201, response.statusCode(), response.body());
        return response.body().split("\"id\":\"")[1].split("\"")[0];
    }

    private String product(String name, int quantity) throws Exception {
        return create("/products", "{\"name\":\"" + name + "\",\"quantity\":" + quantity + ",\"minimumQuantity\":1}");
    }

    private HttpResponse<String> edit(String id, String name, String quantity, String reason, String expectedName, int expectedQuantity) throws Exception {
        return request("PUT", "/products/" + id, "{\"name\":\""+name+"\",\"quantity\":"+quantity+",\"reason\":\""+reason+"\",\"expectedName\":\""+expectedName+"\",\"expectedQuantity\":"+expectedQuantity+"}");
    }
    @Test void editsAndAuditsWithoutChangingMovements() throws Exception {
        String id=product("Antes",60);
        assertEquals(200,edit(id,"Depois","50","Contagem física","Antes",60).statusCode());
        String history=request("GET","/products/"+id+"/adjustments",null).body();
        assertTrue(history.contains("\"previousQuantity\":60"),history);
        assertTrue(history.contains("\"newQuantity\":50"),history);
        assertTrue(history.contains("Contagem física"),history);
        assertEquals(409,edit(id,"Antes","60","Desatualizado","Antes",60).statusCode());
        assertEquals(200,edit(id," Depois ","50","","Depois",50).statusCode());
        assertEquals(history,request("GET","/products/"+id+"/adjustments",null).body());
        assertEquals(200,edit(id,"Depois","0","Correção","Depois",50).statusCode());
        assertEquals(400,request("DELETE","/products/"+id,null).statusCode());
        assertEquals(200,request("POST","/products/"+id+"/archive","{}").statusCode());
        assertEquals(400,edit(id,"Arquivado","0","","Depois",0).statusCode());
        assertTrue(request("GET","/products/"+id+"/adjustments",null).body().contains("Correção"));
    }
    @Test void validatesAndRollsBackInvalidEdits() throws Exception {
        String id=product("Validação",10);
        product("Duplicado",0);
        for (String quantity : new String[]{"-1","1.5","2147483648","null"})
            assertEquals(400,edit(id,"Validação",quantity,"Motivo","Validação",10).statusCode());
        assertEquals(400,edit(id,"Validação","9","   ","Validação",10).statusCode());
        assertEquals(400,edit(id,"   ","10","","Validação",10).statusCode());
        assertEquals(400,edit(id,"duplicado","10","","Validação",10).statusCode());
        assertEquals(400,edit(id,"Validação","9","a".repeat(256),"Validação",10).statusCode());
        assertEquals("[]",request("GET","/products/"+id+"/adjustments",null).body());
        assertEquals(200,edit(id,"Nome corrigido","10","","Validação",10).statusCode());
        assertTrue(request("GET","/products/"+id+"/adjustments",null).body().contains("Correção do nome"));
    }
    @Test void keepsExistingMovementLinkedAfterRenameAndAdjustment() throws Exception {
        String id=product("Material histórico",10);
        var entry=request("POST","/movements","{\"type\":\"ENTRY\",\"observation\":\"Compra original\",\"items\":[{\"type\":\"PRODUCT\",\"productId\":\""+id+"\",\"quantity\":2}]}");
        assertEquals(201,entry.statusCode(),entry.body());
        assertEquals(200,edit(id,"Material corrigido","8","Inventário","Material histórico",12).statusCode());
        String movements=request("GET","/movements",null).body();
        assertTrue(movements.contains(id),movements);
        assertTrue(movements.contains("Compra original"),movements);
        assertTrue(movements.contains("\"quantity\":2"),movements);
        assertTrue(movements.contains("Material corrigido"),movements);
        assertTrue(request("GET","/products",null).body().contains("\"hasAdjustments\":true"));
    }
}
