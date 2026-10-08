package dev.mota.stock_manager.exception;

/** Recurso não existe. No @RestControllerAdvice vira 404. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
