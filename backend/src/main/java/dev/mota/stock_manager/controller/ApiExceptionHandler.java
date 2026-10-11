package dev.mota.stock_manager.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import java.util.Map;
import dev.mota.stock_manager.exception.ConflictException;
import dev.mota.stock_manager.exception.EmailAlreadyExistsException;
import dev.mota.stock_manager.exception.ResourceNotFoundException;
import java.util.Objects;
import org.springframework.web.bind.MethodArgumentNotValidException;
/**
 * Converte as exceções em respostas com {"message": "..."} em português.
 * <ul>
 *   <li>400 – IllegalArgumentException: dados inválidos ou regra de estoque violada
 *       (saldo insuficiente, roteador indisponível, item arquivado na movimentação).</li>
 *   <li>404 – ResourceNotFoundException: o registro indicado na URL não existe.</li>
 *   <li>409 – ConflictException: conflito com o estado atual (duplicado, formulário
 *       desatualizado, possui histórico, já arquivado ou já ativo).</li>
 * </ul>
 */
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> emailConflict(EmailAlreadyExistsException ex) {
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
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of("message", ex.getMessage()));
    }
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, String>> stateConflict(ConflictException ex) {
        return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getDefaultMessage()).filter(Objects::nonNull)
            .sorted().findFirst().orElse("Dados inválidos. Confira os campos enviados.");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
