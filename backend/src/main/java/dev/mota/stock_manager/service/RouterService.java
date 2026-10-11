package dev.mota.stock_manager.service;

import dev.mota.stock_manager.exception.ResourceNotFoundException;
import dev.mota.stock_manager.exception.ConflictException;
import dev.mota.stock_manager.validation.RouterIdentifiers;
import dev.mota.stock_manager.dto.CreateRouterRequest;
import dev.mota.stock_manager.dto.response.RouterResponse;
import dev.mota.stock_manager.entity.Router;
import dev.mota.stock_manager.mapper.RouterMapper;
import dev.mota.stock_manager.repository.RouterRepository;
import dev.mota.stock_manager.repository.MovementItemRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class RouterService {

    private final RouterRepository routerRepository;
    private final RouterMapper routerMapper;
    private final MovementItemRepository movementItemRepository;

    @Transactional
    public RouterResponse create(CreateRouterRequest request){
        String serial = RouterIdentifiers.normalizeSerial(request.serialNumber());
        String mac = RouterIdentifiers.normalizeMac(request.mac());

        if (routerRepository.existsByAssetNumber(request.assetNumber())){
            throw new ConflictException("Já existe um roteador com esse patrimônio.");
        }
        if (routerRepository.existsBySerialNumber(serial)){
            throw new ConflictException("Já existe um roteador com esse número de série.");
        }
        if (routerRepository.existsByMac(mac)){
            throw new ConflictException("Já existe um roteador com esse MAC.");
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

    public List<RouterResponse> findAll() {
        return routerRepository.findAll(Sort.by("assetNumber")).stream().filter(Router::isActive).map(routerMapper::toResponse).toList();
    }

    @Transactional
    public void delete(UUID id) {
        Router item = routerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Roteador não encontrado."));
        item.ensureRemovable();
        if (movementItemRepository.existsByRouterId(id)) {
            throw new ConflictException("Este item possui movimentações. Use Arquivar para preservar o histórico.");
        }
        routerRepository.delete(item);
    }

    @Transactional
    public void archive(UUID id) {
        Router item = routerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Roteador não encontrado."));
        item.archive();
    }
}
