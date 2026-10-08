package dev.mota.stock_manager.dto.response;


import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        int quantity,
        int minimumQuantity,
        boolean active,
        boolean hasAdjustments,
        LocalDateTime createdAt
) {
}