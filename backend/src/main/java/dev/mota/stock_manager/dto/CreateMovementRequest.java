package dev.mota.stock_manager.dto;

import dev.mota.stock_manager.enums.MovementType;

import java.util.List;
import java.util.UUID;

public record CreateMovementRequest(
        UUID technicianId,
        MovementType type,
        String observation,
        List<MovementItemRequest> items
) {}