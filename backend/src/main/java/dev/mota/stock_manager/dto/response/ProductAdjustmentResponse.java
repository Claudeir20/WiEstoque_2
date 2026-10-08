package dev.mota.stock_manager.dto.response;

import dev.mota.stock_manager.entity.ProductAdjustment;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProductAdjustmentResponse(
        UUID id,
        LocalDateTime date,
        String previousName,
        String newName,
        int previousQuantity,
        int newQuantity,
        String reason
) {
    public static ProductAdjustmentResponse from(ProductAdjustment a) {
        return new ProductAdjustmentResponse(
                a.getId(), a.getDate(),
                a.getPreviousName(), a.getNewName(),
                a.getPreviousQuantity(), a.getNewQuantity(),
                a.getReason());
    }
}
