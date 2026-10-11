package dev.mota.stock_manager.repository;


import dev.mota.stock_manager.entity.Movement;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MovementRepository
        extends JpaRepository<Movement, UUID> {

    boolean existsByTechnicianId(UUID technicianId);

    List<Movement> findByTechnicianId(UUID technicianId);

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "items.router"})
    List<Movement> findAll(Sort sort);
}
