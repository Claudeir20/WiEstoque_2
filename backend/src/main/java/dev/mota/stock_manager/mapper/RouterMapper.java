package dev.mota.stock_manager.mapper;

import dev.mota.stock_manager.dto.response.RouterResponse;
import dev.mota.stock_manager.entity.Router;
import org.springframework.stereotype.Component;

@Component
public class RouterMapper {

    public  RouterResponse toResponse(Router router) {
        return new RouterResponse(
                router.getId(),
                router.getAssetNumber(),
                router.getModel(),
                router.getSerialNumber(),
                router.getMac(),
                router.getStatus(),
                router.getCreatedAt()
        );
    }
}