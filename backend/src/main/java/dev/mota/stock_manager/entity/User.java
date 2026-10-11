package dev.mota.stock_manager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.util.UUID;
import jakarta.persistence.UniqueConstraint;

@Entity
@Getter
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"))
public class User {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private boolean administrator;

    protected User() {}
    private User(String name, String email, String password) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public static User create(String name, String email, String password) {

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Informe o nome.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Informe o e-mail.");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Informe a senha.");
        }

        return new User(name, email, password);
    }


    public static User createAdministrator(
            String name, String email, String passwordHash
    ){
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Informe o nome.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Informe o e-mail.");
        }
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("Informe a senha.");
        }

        User user = create(name, email, passwordHash);
        user.administrator = true;
        return user;
    }


}



