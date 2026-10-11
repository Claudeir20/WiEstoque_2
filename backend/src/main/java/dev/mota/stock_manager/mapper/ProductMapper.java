package dev.mota.stock_manager.mapper;

import dev.mota.stock_manager.dto.response.ProductResponse;
import dev.mota.stock_manager.entity.Product;
import org.springframework.stereotype.Component;
import dev.mota.stock_manager.repository.ProductAdjustmentRepository;

@Component
@lombok.RequiredArgsConstructor
public class ProductMapper {
    private final ProductAdjustmentRepository adjustments;

    public ProductResponse toResponse(Product product) {
        return toResponse(product, adjustments.existsByProductId(product.getId()));
    }

    public ProductResponse toResponse(Product product, boolean hasAdjustments) {
        return new ProductResponse(
                product.getId(),
                product.getVersion(),
                product.getName(),
                product.getQuantity(),
                product.getMinimumQuantity(),
                product.isActive(),
                hasAdjustments,
                product.getCreatedAt()
        );
    }
}