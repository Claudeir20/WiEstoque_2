package dev.mota.stock_manager.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import java.util.Map;
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(dev.mota.stock_manager.exception.EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> emailConflict(dev.mota.stock_manager.exception.EmailAlreadyExistsException ex) {
        return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> invalid(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable() {
        return ResponseEntity.badRequest().body(Map.of("message", "Dados inválidos. Confira os campos enviados."));
    }
    @ExceptionHandler({DataIntegrityViolationException.class, OptimisticLockingFailureException.class})
    public ResponseEntity<Map<String, String>> conflict() {
        return ResponseEntity.status(409).body(Map.of("message", "Registro duplicado ou estoque alterado por outra operação. Atualize os dados e tente novamente."));
    }
    @ExceptionHandler(dev.mota.stock_manager.exception.ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(dev.mota.stock_manager.exception.ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of("message", ex.getMessage()));
    }
    @ExceptionHandler(dev.mota.stock_manager.exception.ConflictException.class)
    public ResponseEntity<Map<String, String>> stateConflict(dev.mota.stock_manager.exception.ConflictException ex) {
        return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
    }
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validation(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getDefaultMessage()).filter(java.util.Objects::nonNull)
            .sorted().findFirst().orElse("Dados inválidos. Confira os campos enviados.");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
