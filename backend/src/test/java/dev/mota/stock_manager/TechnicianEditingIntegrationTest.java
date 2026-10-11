package dev.mota.stock_manager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:technician_editing;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.show-sql=false", TestSession.ADMIN_EMAIL, TestSession.ADMIN_PASSWORD
})
class TechnicianEditingIntegrationTest {
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

    private String technician(String name) throws Exception {
        return create("/technicians", "{\"name\":\""+name+"\",\"sector\":\"Estoque\"}");
    }
    private HttpResponse<String> edit(String id, String name, String sector, String expected) throws Exception {
        return request("PUT","/technicians/"+id,"{\"name\":\""+name+"\",\"sector\":\""+sector+"\",\"expectedName\":\""+expected+"\",\"expectedSector\":\"Estoque\"}");
    }
    @Test void editsValidatesAndDeletesUnusedTechnician() throws Exception {
        String id=technician("Original"); technician("Duplicado");
        assertEquals(400,edit(id,"   ","Estoque","Original").statusCode());
        assertEquals(400,edit(id,"Original","   ","Original").statusCode());
        assertEquals(400,edit(id,"duplicado","Estoque","Original").statusCode());
        assertEquals(400,edit(id,"a".repeat(256),"Estoque","Original").statusCode());
        assertEquals(200,edit(id," Corrigido "," Campo ","Original").statusCode());
        assertEquals(409,edit(id,"Desatualizado","Estoque","Original").statusCode());
        assertTrue(request("GET","/technicians",null).body().contains("Corrigido"));
        assertEquals(200,request("DELETE","/technicians/"+id,null).statusCode());
        assertFalse(request("GET","/technicians",null).body().contains(id));
        assertEquals(400,request("DELETE","/technicians/"+id,null).statusCode());
    }
    @Test void preservesHistoryWhenArchivingAndBlocksNewMovements() throws Exception {
        String id=technician("Histórico");
        String product=create("/products","{\"name\":\"Material técnico\",\"quantity\":10,\"minimumQuantity\":1}");
        String movement="{\"type\":\"WITHDRAWAL\",\"technicianId\":\""+id+"\",\"items\":[{\"type\":\"PRODUCT\",\"productId\":\""+product+"\",\"quantity\":1}]}";
        assertEquals(201,request("POST","/movements",movement).statusCode());
        assertEquals(400,request("DELETE","/technicians/"+id,null).statusCode());
        assertEquals(200,edit(id,"Histórico corrigido","Estoque","Histórico").statusCode());
        assertTrue(request("GET","/movements",null).body().contains("Histórico corrigido"));
        assertEquals(200,request("POST","/technicians/"+id+"/archive","{}").statusCode());
        assertEquals(400,edit(id,"Outro","Estoque","Histórico corrigido").statusCode());
        assertEquals(400,request("POST","/movements",movement).statusCode());
        assertTrue(request("GET","/movements",null).body().contains(id));
        assertEquals(400,request("POST","/technicians/"+id+"/archive","{}").statusCode());
        assertEquals(200,request("POST","/technicians/"+id+"/reactivate","{}").statusCode());
        assertEquals(201,request("POST","/movements",movement).statusCode());
        assertTrue(request("GET","/movements",null).body().contains(id));
        assertEquals(409,request("POST","/technicians/"+id+"/reactivate","{}").statusCode());

    }
}
