package dev.mota.stock_manager.dto.response;



import java.util.UUID;

public record TechnicianResponse(
        UUID id,
        String name,
        String sector,
        boolean active
) {
}