package dev.mota.stock_manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/csrf").permitAll()

                        // Ele exige que o usuário tenha a autoridade ROLE_ADMIN para acessar essas rotas.
                        .requestMatchers("/users", "/users/**").hasRole("ADMIN")

                        .anyRequest().hasRole("USER")
                )



                .formLogin(form -> form
                        .loginProcessingUrl("/auth/login")
                        .usernameParameter("email")
                        .passwordParameter("password")
                        .successHandler((request, response, authentication) ->

                                response.setStatus(200)

                        )
                        .failureHandler((request, response, exception) ->

                                response.setStatus(401)

                        )
                        .permitAll()

                )

                /*
                Permite criar uma sessão quando necessário.
                Após o login, o navegador usa um cookie de sessão para identificar o usuário nas próximas requisições.
                */
                .sessionManagement( session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )


                /*
                Retorna 401 quando alguém tenta acessar um recurso protegido sem estar autenticado.
                O frontend poderá usar essa resposta para mostrar a tela de login.
                */
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                response.setStatus(401)
                        )
                )


                /*
                Configura POST /auth/logout para encerrar a sessão. Retorna 204, indicando sucesso sem conteúdo na resposta.
                 */
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((request, response, authentication) ->
                                response.setStatus(204)
                        )
                        .permitAll()
                );

        http.requestCache(cache -> cache.disable());
        return http.build();




    }

}
