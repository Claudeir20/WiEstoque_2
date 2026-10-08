package dev.mota.stock_manager.controller;



import dev.mota.stock_manager.dto.CreateTechnicianRequest;
import dev.mota.stock_manager.dto.response.TechnicianResponse;
import dev.mota.stock_manager.service.TechnicianService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/technicians")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianService technicianService;

    @PostMapping
    public ResponseEntity<TechnicianResponse> create(@RequestBody CreateTechnicianRequest request) {
        TechnicianResponse response = technicianService.createTechnician(request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public ResponseEntity<java.util.List<TechnicianResponse>> findAll() {
        return ResponseEntity.ok(technicianService.findAll());
    }
    @PutMapping("/{id}")
    public ResponseEntity<TechnicianResponse> update(@PathVariable UUID id, @RequestBody dev.mota.stock_manager.dto.UpdateTechnicianRequest request) {
        return ResponseEntity.ok(technicianService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public java.util.Map<String, String> delete(@PathVariable UUID id) {
        technicianService.delete(id);
        return java.util.Map.of("message", "Técnico excluído.");
    }
    @PostMapping("/{id}/archive")
    public java.util.Map<String, String> archive(@PathVariable UUID id) {
        technicianService.archive(id);
        return java.util.Map.of("message", "Técnico arquivado. Histórico preservado.");
    }
}
