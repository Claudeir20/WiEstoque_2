package dev.mota.stock_manager.config;

import dev.mota.stock_manager.entity.User;
import dev.mota.stock_manager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Configuration
public class InitialAdminConfig {

    @Bean
    ApplicationRunner createInitialAdministrator(
            UserRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${INITIAL_ADMIN_EMAIL:}") String email,
            @Value("${INITIAL_ADMIN_PASSWORD:}") String password) {

        return args -> {
            if (repository.count() > 0) {
                return;
            }

            if (email.isBlank() || password.isBlank()) {
                throw new IllegalStateException(
                        "Configure INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD."
                );
            }

            if (password.length() < 8
                    || password.getBytes(StandardCharsets.UTF_8).length > 72) {
                throw new IllegalStateException(
                        "A senha inicial deve ter pelo menos 8 caracteres "
                                + "e no máximo 72 bytes."
                );
            }

            User administrator = User.createAdministrator(
                    "Administrador",
                    email.trim().toLowerCase(Locale.ROOT),
                    passwordEncoder.encode(password)
            );

            repository.saveAndFlush(administrator);
        };
    }
}