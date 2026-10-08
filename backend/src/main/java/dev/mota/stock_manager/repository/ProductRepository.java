package dev.mota.stock_manager.repository;

import dev.mota.stock_manager.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;


@Repository
public interface ProductRepository
        extends JpaRepository<Product, UUID> {

    Optional<Product> findByName(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    boolean existsByName(String name);
}