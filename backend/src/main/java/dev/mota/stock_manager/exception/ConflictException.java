package dev.mota.stock_manager.exception;

/** Conflito com o estado atual (duplicado, desatualizado, tem histórico). No @RestControllerAdvice vira 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
