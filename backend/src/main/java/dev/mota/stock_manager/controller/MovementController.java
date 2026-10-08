package dev.mota.stock_manager.controller;


import dev.mota.stock_manager.dto.CreateMovementRequest;

import dev.mota.stock_manager.dto.response.MovementResponse;
import dev.mota.stock_manager.service.MovementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/movements")
@RequiredArgsConstructor
public class MovementController {

    private final MovementService movementService;

    @PostMapping
    public ResponseEntity<MovementResponse> create(@RequestBody  CreateMovementRequest request) {
        MovementResponse response = movementService.createMovement(request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public ResponseEntity<java.util.List<MovementResponse>> findAll() {
        return ResponseEntity.ok(movementService.findAll());
    }
}
