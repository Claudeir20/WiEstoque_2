package dev.mota.stock_manager.repository;

import dev.mota.stock_manager.entity.MovementItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface MovementItemRepository extends JpaRepository<MovementItem, UUID> {
    boolean existsByProductId(UUID id);
    boolean existsByRouterId(UUID id);
}
