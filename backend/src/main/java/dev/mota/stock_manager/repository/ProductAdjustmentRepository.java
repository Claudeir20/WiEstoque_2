package dev.mota.stock_manager.repository;
import dev.mota.stock_manager.entity.ProductAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ProductAdjustmentRepository extends JpaRepository<ProductAdjustment, UUID> {
 List<ProductAdjustment> findByProductIdOrderByDateDesc(UUID productId);
 boolean existsByProductId(UUID productId);
}
