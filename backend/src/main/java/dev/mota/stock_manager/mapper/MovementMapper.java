package dev.mota.stock_manager.mapper;

import dev.mota.stock_manager.dto.response.MovementItemResponse;
import dev.mota.stock_manager.dto.response.MovementResponse;
import dev.mota.stock_manager.entity.Movement;
import dev.mota.stock_manager.entity.MovementItem;
import dev.mota.stock_manager.entity.Product;
import dev.mota.stock_manager.entity.Router;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MovementMapper {

    public MovementResponse toResponse(
            Movement movement,
            String technicianName
    ) {

        List<MovementItemResponse> items =
                movement.getItems()
                        .stream()
                        .map(MovementMapper::toItemResponse)
                        .toList();

        return new MovementResponse(
                movement.getId(),
                movement.getTechnicianId(),
                technicianName,
                movement.getType(),
                movement.getDate(),
                movement.getObservation(),
                items
        );
    }

    private static MovementItemResponse toItemResponse(
            MovementItem item
    ) {

        Product product = item.getProduct();
        Router router = item.getRouter();

        return new MovementItemResponse(
                item.getId(),
                item.getType(),

                product != null ? product.getId() : null,
                product != null ? product.getName() : null,

                router != null ? router.getId() : null,
                router != null ? router.getAssetNumber() : null,
                router != null ? router.getModel() : null,
                router != null ? router.getSerialNumber() : null,
                router != null ? router.getMac() : null,

                item.getQuantity(),
                item.getClientCode()
        );
    }
}