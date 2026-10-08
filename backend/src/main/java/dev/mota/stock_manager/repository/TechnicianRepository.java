package dev.mota.stock_manager.repository;

import dev.mota.stock_manager.entity.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TechnicianRepository
        extends JpaRepository<Technician, UUID> {

    Optional<Technician> findByName(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
    boolean existsByNameIgnoreCase(String name);

    boolean existsByName(String name);
}