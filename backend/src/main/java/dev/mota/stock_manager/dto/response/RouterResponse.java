package dev.mota.stock_manager.dto.response;

import dev.mota.stock_manager.enums.Status;

import java.time.LocalDateTime;
import java.util.UUID;

public record RouterResponse(
        UUID id,
        String assetNumber,
        String model,
        String serialNumber,
        String mac,
        Status status,
        LocalDateTime createdAt
) {
}