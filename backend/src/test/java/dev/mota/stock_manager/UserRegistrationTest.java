package dev.mota.stock_manager;

import dev.mota.stock_manager.controller.ApiExceptionHandler;
import dev.mota.stock_manager.controller.UserController;
import dev.mota.stock_manager.entity.User;
import dev.mota.stock_manager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:users;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.show-sql=false"
})
class UserRegistrationTest {
    @Autowired UserController controller;
    @Autowired ApiExceptionHandler handler;
    @Autowired UserRepository repository;
    @Autowired PasswordEncoder encoder;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        // Controller/validation/real persistence test; does not bypass security in the application.
        mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(handler).build();
        repository.deleteAll();
    }

    @Test
    void createsUserWithNormalizedEmailAndHashedPassword() throws Exception {
        var response = mvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"  José  \",\"email\":\"  JOSE@EXAMPLE.COM  \",\"password\":\" senha123 \"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.email").value("jose@example.com"))
            .andExpect(jsonPath("$.name").value("José"))
            .andExpect(jsonPath("$.password").doesNotExist()).andReturn();
        User user = repository.findAll().getFirst();
        assertNotEquals(" senha123 ", user.getPassword());
        assertTrue(encoder.matches(" senha123 ", user.getPassword()));
        assertFalse(encoder.matches("senha123", user.getPassword()));
    }

    @Test
    void duplicateEmailReturns409EvenWithDifferentCaseAndSpaces() throws Exception {
        String body = "{\"name\":\"Pessoa\",\"email\":\"user@example.com\",\"password\":\"senha123\"}";
        mvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated());
        mvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content(body.replace("user@example.com", " USER@EXAMPLE.COM ")))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("E-mail já cadastrado: user@example.com"));
        assertEquals(1, repository.count());
    }

    @Test
    void invalidInputReturns400WithoutSaving() throws Exception {
        for (String body : new String[]{
            "{\"name\":\"Pessoa\",\"email\":\"invalido\",\"password\":\"senha123\"}",
            "{\"name\":\"Pessoa\",\"password\":\"senha123\"}",
            "{\"name\":\"  \",\"email\":\"user@example.com\",\"password\":\"senha123\"}",
            "{\"name\":\"Pessoa\",\"email\":\"user@example.com\",\"password\":\"123\"}",
            "{\"name\":\"Pessoa\",\"email\":\"user@example.com\",\"password\":\"" + "á".repeat(40) + "\"}"
        }) {
            mvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        assertEquals(0, repository.count());
    }

    @Test
    void databaseEnforcesNamedEmailConstraint() {
        repository.saveAndFlush(User.create("Primeiro", "unique@example.com", encoder.encode("senha123")));
        var error = assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
            () -> repository.saveAndFlush(User.create("Segundo", "unique@example.com", encoder.encode("senha123"))));
        assertTrue(error.getMostSpecificCause().getMessage().toLowerCase(java.util.Locale.ROOT).contains("uk_users_email"));
    }
}