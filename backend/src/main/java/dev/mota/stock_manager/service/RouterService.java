package dev.mota.stock_manager.service;

import dev.mota.stock_manager.validation.RouterIdentifiers;
import dev.mota.stock_manager.dto.CreateRouterRequest;
import dev.mota.stock_manager.dto.response.RouterResponse;
import dev.mota.stock_manager.entity.Router;
import dev.mota.stock_manager.mapper.RouterMapper;
import dev.mota.stock_manager.repository.RouterRepository;
import dev.mota.stock_manager.repository.MovementItemRepository;
import jakarta.transaction.Transactional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RouterService {

    private final RouterRepository routerRepository;
    private final RouterMapper routerMapper;
    private final MovementItemRepository movementItemRepository;

    public RouterResponse create(CreateRouterRequest request){
        String serial = RouterIdentifiers.normalizeSerial(request.serialNumber());
        String mac = RouterIdentifiers.normalizeMac(request.mac());

        if (routerRepository.existsByAssetNumber(request.assetNumber())){
            throw new IllegalArgumentException("Router with this asset number already exists");
        }
        if (routerRepository.existsBySerialNumber(serial)){
            throw new IllegalArgumentException("Router with this serial number already exists");
        }
        if (routerRepository.existsByMac(mac)){
            throw new IllegalArgumentException("Router with this mac already exists");
        }

        Router router = Router.create(
                request.assetNumber(),
                request.model(),
                serial,
                mac
        );

        Router savedRouter = routerRepository.save(router);

        return routerMapper.toResponse(savedRouter);

    }

    public java.util.List<RouterResponse> findAll() {
        return routerRepository.findAll(org.springframework.data.domain.Sort.by("assetNumber")).stream().filter(Router::isActive).map(routerMapper::toResponse).toList();
    }

    @Transactional
    public void delete(UUID id) {
        Router item = routerRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Roteador não encontrado."));
        item.ensureRemovable();
        if (movementItemRepository.existsByRouterId(id)) {
            throw new IllegalArgumentException("Este item possui movimentações. Use Arquivar para preservar o histórico.");
        }
        routerRepository.delete(item);
    }

    @Transactional
    public void archive(UUID id) {
        Router item = routerRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Roteador não encontrado."));
        item.archive();
    }
}
