package dev.mota.stock_manager.dto.response;
import dev.mota.stock_manager.enums.MovementType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MovementResponse(
        UUID id,
        UUID technicianId,
        String technicianName,
        MovementType type,
        LocalDateTime date,
        String observation,
        List<MovementItemResponse> items
) {
}