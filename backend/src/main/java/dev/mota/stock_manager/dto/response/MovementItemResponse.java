package dev.mota.stock_manager.dto.response;
import dev.mota.stock_manager.enums.MovementItemType;

import java.util.UUID;

public record MovementItemResponse(
        UUID id,
        MovementItemType type,

        UUID productId,
        String productName,

        UUID routerId,
        String assetNumber,
        String model,
        String serialNumber,
        String mac,

        int quantity,
        String clientCode
) {
}