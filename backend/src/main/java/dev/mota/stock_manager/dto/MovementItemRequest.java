package dev.mota.stock_manager.dto;

import dev.mota.stock_manager.enums.MovementItemType;

import java.util.UUID;

public record MovementItemRequest(
        MovementItemType type,
        UUID productId,
        UUID routerId,
        int quantity,
        String clientCode
) {}