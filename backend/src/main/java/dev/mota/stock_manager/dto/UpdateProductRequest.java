package dev.mota.stock_manager.dto;
public record UpdateProductRequest(String name, java.math.BigDecimal quantity, String reason, String expectedName, Integer expectedQuantity) {}
