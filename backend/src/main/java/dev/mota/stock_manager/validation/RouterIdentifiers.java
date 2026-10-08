package dev.mota.stock_manager.validation;

import java.util.Locale;

public final class RouterIdentifiers {
    private RouterIdentifiers() {}

    public static String normalizeSerial(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Número de série é obrigatório.");
        }
        return value.strip().toUpperCase(Locale.ROOT);
    }

    public static String normalizeMac(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("MAC é obrigatório.");
        }
        String raw = value.strip().replace(":", "").replace("-", "").replace(".", "");
        if (!raw.matches("[0-9a-fA-F]{12}")) {
            throw new IllegalArgumentException("MAC inválido: informe 12 caracteres, usando números e letras de A a F.");
        }
        return String.join(":", raw.toUpperCase(Locale.ROOT).split("(?<=\\G.{2})"));
    }
}
