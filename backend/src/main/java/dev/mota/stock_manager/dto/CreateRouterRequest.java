package dev.mota.stock_manager.dto;

public record CreateRouterRequest(
        String assetNumber,
        String model,
        String serialNumber,
        String mac
) {
}
