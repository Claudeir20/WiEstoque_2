package dev.mota.stock_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank(message = "Informe o nome.")
    @Size(max = 255, message = "O nome deve ter até 255 caracteres.") String name,
    @NotBlank(message = "Informe o e-mail para cadastro.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 254, message = "O e-mail deve ter até 254 caracteres.") String email,
    @NotBlank(message = "Crie uma senha para cadastro.")
    @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.") String password
) {
    public CreateUserRequest {
        name = name == null ? null : name.trim();
        email = email == null ? null : email.trim();
    }
}