package dev.mota.stock_manager.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record UpdateProductRequest(
    @NotBlank(message = "Informe o nome do material.")
    @Size(max = 255, message = "O nome deve ter até 255 caracteres.") String name,
    @NotNull(message = "Informe a quantidade.")
    @PositiveOrZero(message = "A quantidade não pode ser negativa.")
    @Digits(integer = 10, fraction = 0, message = "Informe uma quantidade inteira.")
    @DecimalMax(value = "2147483647", message = "A quantidade máxima é 2147483647.") BigDecimal quantity,
    @Size(max = 255, message = "O motivo deve ter até 255 caracteres.") String reason,
    @NotNull(message = "Atualize os dados para obter a versão do material.")
    @PositiveOrZero(message = "Versão inválida.") Long version
) {}
