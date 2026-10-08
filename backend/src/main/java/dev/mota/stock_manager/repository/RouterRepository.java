package dev.mota.stock_manager.repository;

import dev.mota.stock_manager.entity.Router;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouterRepository
        extends JpaRepository<Router, UUID> {

    Optional<Router> findByAssetNumber(String assetNumber);

    Optional<Router> findBySerialNumber(String serialNumber);

    Optional<Router> findByMac(String mac);

    boolean existsByAssetNumber(String assetNumber);

    boolean existsBySerialNumber(String serialNumber);

    boolean existsByMac(String mac);
}