package dev.mota.stock_manager.controller;


import dev.mota.stock_manager.dto.CreateProductRequest;
import dev.mota.stock_manager.dto.response.ProductResponse;
import dev.mota.stock_manager.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;
import dev.mota.stock_manager.dto.UpdateProductRequest;
import dev.mota.stock_manager.dto.response.ProductAdjustmentResponse;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> create(@RequestBody  CreateProductRequest request) {
        ProductResponse response = productService.createProduct(request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> findAll(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return ResponseEntity.ok(productService.findAll(includeArchived));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Material excluído."));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<Map<String, String>> archive(@PathVariable UUID id) {
        productService.archive(id);
        return ResponseEntity.ok(Map.of("message", "Material arquivado. Histórico preservado."));
    }
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }
    @GetMapping("/{id}/adjustments")
    public List<ProductAdjustmentResponse> adjustments(@PathVariable UUID id) {
        return productService.adjustments(id);
    }
    @PostMapping("/{id}/reactivate")
    public Map<String, String> reactivate(@PathVariable UUID id) {
        productService.reactivate(id);
        return Map.of("message", "Cadastro reativado. Histórico preservado.");
    }
}
