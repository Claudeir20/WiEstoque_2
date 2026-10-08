package dev.mota.stock_manager.controller;


import dev.mota.stock_manager.dto.CreateRouterRequest;

import dev.mota.stock_manager.dto.response.RouterResponse;
import dev.mota.stock_manager.enums.Status;
import dev.mota.stock_manager.service.RouterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/routers")
@RequiredArgsConstructor
public class RouterController {

    private final RouterService routerService;

    @PostMapping
    public ResponseEntity<RouterResponse> create(@RequestBody CreateRouterRequest request) {
        RouterResponse response = routerService.create(request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public ResponseEntity<java.util.List<RouterResponse>> findAll() {
        return ResponseEntity.ok(routerService.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, String>> delete(@PathVariable UUID id) {
        routerService.delete(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Roteador excluído."));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<java.util.Map<String, String>> archive(@PathVariable UUID id) {
        routerService.archive(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Roteador arquivado. Histórico preservado."));
    }
}
