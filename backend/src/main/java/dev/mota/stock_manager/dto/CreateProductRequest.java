package dev.mota.stock_manager.dto;

public record CreateProductRequest(
        String name,
        int quantity,
        int minimumQuantity
) {
}
