package dev.mota.stock_manager.repository;
import dev.mota.stock_manager.entity.ProductAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.*;
public interface ProductAdjustmentRepository extends JpaRepository<ProductAdjustment, UUID> {



 List<ProductAdjustment> findByProductIdOrderByDateDesc(UUID productId);

 @Query("select distinct a.productId from ProductAdjustment a")
 Set<UUID> findProductIdsWithAdjustments();

 boolean existsByProductId(UUID productId);
}
