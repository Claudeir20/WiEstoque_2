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
import dev.mota.stock_manager.dto.UpdateTechnicianRequest;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<List<TechnicianResponse>> findAll() {
        return ResponseEntity.ok(technicianService.findAll());
    }
    @PutMapping("/{id}")
    public ResponseEntity<TechnicianResponse> update(@PathVariable UUID id, @RequestBody UpdateTechnicianRequest request) {
        return ResponseEntity.ok(technicianService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable UUID id) {
        technicianService.delete(id);
        return Map.of("message", "Técnico excluído.");
    }
    @PostMapping("/{id}/archive")
    public Map<String, String> archive(@PathVariable UUID id) {
        technicianService.archive(id);
        return Map.of("message", "Técnico arquivado. Histórico preservado.");
    }
    @PostMapping("/{id}/reactivate")
    public Map<String, String> reactivate(@PathVariable UUID id) {
        technicianService.reactivate(id);
        return Map.of("message", "Cadastro reativado. Histórico preservado.");
    }
}
