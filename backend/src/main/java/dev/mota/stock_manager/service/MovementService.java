package dev.mota.stock_manager.service;

import dev.mota.stock_manager.dto.CreateMovementRequest;
import dev.mota.stock_manager.dto.MovementItemRequest;
import dev.mota.stock_manager.dto.response.MovementResponse;
import dev.mota.stock_manager.dto.response.RouterResponse;
import dev.mota.stock_manager.entity.*;
import dev.mota.stock_manager.enums.MovementType;
import dev.mota.stock_manager.mapper.MovementMapper;
import dev.mota.stock_manager.repository.MovementRepository;
import dev.mota.stock_manager.repository.ProductRepository;
import dev.mota.stock_manager.repository.RouterRepository;
import dev.mota.stock_manager.repository.TechnicianRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class MovementService {

    private final MovementRepository movementRepository;
    private final MovementMapper movementMapper;
    private final TechnicianRepository technicianRepository;
    private final ProductRepository productRepository;
    private final RouterRepository routerRepository;



    @Transactional
    public MovementResponse createMovement(CreateMovementRequest request){

        if (request.type() == null || request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Informe o tipo e ao menos um item.");
        }
        if (request.observation() != null && request.observation().length() > 255) {
            throw new IllegalArgumentException("A observação deve ter até 255 caracteres.");
        }
        Technician technician = null;
        if (request.technicianId() != null) {
            technician = technicianRepository.findById(request.technicianId())
                .orElseThrow(() -> new IllegalArgumentException("Técnico não encontrado."));

            if (!technician.isActive()) throw new IllegalArgumentException("Técnico inativo.");
        } else if (request.type() != MovementType.ENTRY) {
            throw new IllegalArgumentException("Selecione um técnico.");
        }

        Movement movement = Movement.create(
                request.technicianId(),
                request.type(),
                request.observation()
        );

        request.items().forEach(item -> addItem(movement, item));

        movementRepository.save(movement);

        return movementMapper.toResponse(movement, technician == null ? "Entrada de estoque" : technician.getName());

    }

    private void  addItem(Movement movement, MovementItemRequest item){
        if (item == null || item.type() == null) throw new IllegalArgumentException("Tipo de item obrigatório.");
        switch (item.type()){
            case PRODUCT -> {
                if (item.productId() == null || item.routerId() != null) throw new IllegalArgumentException("Material inválido.");
                Product product = productRepository.findById(item.productId())
                        .orElseThrow(() -> new IllegalArgumentException("Material não encontrado."));
                movement.addProduct(product, item.quantity());
            }
            case ROUTER -> {
                if (item.routerId() == null || item.productId() != null || item.quantity() != 1) throw new IllegalArgumentException("Roteadores devem ter quantidade 1.");
                Router router = routerRepository.findById(item.routerId())
                        .orElseThrow(() -> new IllegalArgumentException("Roteador não encontrado."));
                movement.addRouter(router, item.clientCode());
            }
        }
    }
    @Transactional(readOnly = true)
    public List<MovementResponse> findAll() {
        Map<UUID, String> names = technicianRepository.findAll().stream()
            .collect(Collectors.toMap(Technician::getId, Technician::getName));
        return movementRepository.findAll(Sort.by("date").descending()).stream()
            .map(m -> movementMapper.toResponse(m, m.getTechnicianId() == null ? "Entrada de estoque" : names.getOrDefault(m.getTechnicianId(), "Técnico"))).toList();
    }
}
