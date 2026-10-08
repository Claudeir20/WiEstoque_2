package dev.mota.stock_manager.mapper;


import dev.mota.stock_manager.dto.response.TechnicianResponse;
import dev.mota.stock_manager.entity.Technician;
import org.springframework.stereotype.Component;

@Component
public class TechnicianMapper {

    public  TechnicianResponse toResponse(Technician technician) {
        return new TechnicianResponse(
                technician.getId(),
                technician.getName(),
                technician.getSector(),
                technician.isActive()
        );
    }
}