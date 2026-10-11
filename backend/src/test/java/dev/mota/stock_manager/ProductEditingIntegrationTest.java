package dev.mota.stock_manager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:editing;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.show-sql=false", TestSession.ADMIN_EMAIL, TestSession.ADMIN_PASSWORD
})
class ProductEditingIntegrationTest {
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

    private HttpResponse<String> edit(String id, String name, String quantity, String reason, String expectedName, int expectedQuantity) throws Exception {
        String all = request("GET", "/products", null).body();
        var objects = java.util.regex.Pattern.compile("\\{[^{}]*\\}").matcher(all);
        long version = 0;
        while (objects.find()) {
            String object = objects.group();
            if (!object.contains(id)) continue;
            var field = java.util.regex.Pattern.compile("\"version\":(\\d+)").matcher(object);
            if (field.find()) version = Long.parseLong(field.group(1));
            if (!object.contains("\"name\":\"" + expectedName + "\"") || !object.contains("\"quantity\":" + expectedQuantity + ","))
                version = Math.max(0, version - 1);
            break;
        }
        return update(id, name, quantity, reason, version);
    }

    private HttpResponse<String> update(String id, String name, String quantity, String reason, long version) throws Exception {
        return request("PUT", "/products/" + id, "{\"name\":\""+name+"\",\"quantity\":"+quantity+",\"reason\":\""+reason+"\",\"version\":"+version+"}");
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
        assertEquals(409,request("DELETE","/products/"+id,null).statusCode());
        assertEquals(200,request("POST","/products/"+id+"/archive","{}").statusCode());
        assertEquals(409,edit(id,"Arquivado","0","","Depois",0).statusCode());
        assertTrue(request("GET","/products/"+id+"/adjustments",null).body().contains("Correção"));
    }
    @Test void validatesAndRollsBackInvalidEdits() throws Exception {
        String id=product("Validação",10);
        product("Duplicado",0);
        for (String quantity : new String[]{"-1","1.5","2147483648","null"})
            assertEquals(400,edit(id,"Validação",quantity,"Motivo","Validação",10).statusCode());
        assertEquals(400,edit(id,"Validação","9","   ","Validação",10).statusCode());
        assertEquals(400,edit(id,"   ","10","","Validação",10).statusCode());
        assertEquals(409,edit(id,"duplicado","10","","Validação",10).statusCode());
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
    @Test void rejectsMissingVersionAndDetectsChangesEvenIfBalanceReturnsToOriginal() throws Exception {
        String id=product("Versão",10);
        assertEquals(400,request("PUT","/products/"+id,"{\"name\":\"Versão\",\"quantity\":10}").statusCode());
        var first=update(id,"Versão","9","Ajuste",0);
        assertEquals(200,first.statusCode(),first.body());
        assertTrue(first.body().contains("\"version\":1"),first.body());
        var second=update(id,"Versão","10","Recontagem",1);
        assertEquals(200,second.statusCode(),second.body());
        assertTrue(second.body().contains("\"version\":2"),second.body());
        assertEquals(409,update(id,"Versão","8","Formulário antigo",0).statusCode());
        assertEquals(200,update(id,"Versão","10","",2).statusCode());
        assertEquals(404,update(java.util.UUID.randomUUID().toString(),"Ausente","0","",0).statusCode());
        assertEquals(404,request("GET","/products/"+java.util.UUID.randomUUID()+"/adjustments",null).statusCode());
        assertFalse(request("GET","/products/"+id+"/adjustments",null).body().contains("productId"));
        var duplicate=request("POST","/products","{\"name\":\" versão \",\"quantity\":0,\"minimumQuantity\":1}");
        assertEquals(409,duplicate.statusCode());
    }

    @Test void reactivationRestoresTheSameMaterialAndDefaultListStaysActiveOnly() throws Exception {
        String id = product("Reativação", 0);
        assertEquals(200, request("POST", "/products/"+id+"/archive", "{}").statusCode());
        assertFalse(request("GET", "/products", null).body().contains(id));
        assertTrue(request("GET", "/products?includeArchived=true", null).body().contains(id));
        assertEquals(200, request("POST", "/products/"+id+"/reactivate", "{}").statusCode());
        assertTrue(request("GET", "/products", null).body().contains(id));
        assertEquals(409, request("POST", "/products/"+id+"/reactivate", "{}").statusCode());
    }
}
