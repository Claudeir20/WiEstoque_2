package dev.mota.stock_manager.mapper;

import dev.mota.stock_manager.dto.response.ProductResponse;
import dev.mota.stock_manager.entity.Product;
import org.springframework.stereotype.Component;

@Component
@lombok.RequiredArgsConstructor
public class ProductMapper {
    private final dev.mota.stock_manager.repository.ProductAdjustmentRepository adjustments;

    public  ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getQuantity(),
                product.getMinimumQuantity(),
                product.isActive(),
                adjustments.existsByProductId(product.getId()),
                product.getCreatedAt()
        );
    }
}