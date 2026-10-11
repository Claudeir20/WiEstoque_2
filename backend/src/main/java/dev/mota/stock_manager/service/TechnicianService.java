package dev.mota.stock_manager.service;

import dev.mota.stock_manager.exception.ResourceNotFoundException;
import dev.mota.stock_manager.exception.ConflictException;
import dev.mota.stock_manager.dto.CreateTechnicianRequest;
import dev.mota.stock_manager.dto.response.TechnicianResponse;
import dev.mota.stock_manager.entity.Technician;
import dev.mota.stock_manager.mapper.TechnicianMapper;
import dev.mota.stock_manager.repository.TechnicianRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import dev.mota.stock_manager.dto.UpdateTechnicianRequest;
import dev.mota.stock_manager.repository.MovementRepository;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class TechnicianService {

    private final TechnicianRepository technicianRepository;
    private final MovementRepository movementRepository;
    private final TechnicianMapper technicianMapper;

    @Transactional
    public TechnicianResponse createTechnician(
            CreateTechnicianRequest request
    ) {

        if (technicianRepository.existsByNameIgnoreCase(request.name() == null ? "" : request.name().strip())) {
            throw new ConflictException("Já existe um técnico com esse nome.");
        }

        Technician technician = Technician.create(
                request.name(),
                request.sector()
        );

        Technician savedTechnician =
                technicianRepository.save(technician);

        return technicianMapper.toResponse(savedTechnician);
    }

    public List<TechnicianResponse> findAll() {
        return technicianRepository.findAll(Sort.by("name")).stream().map(technicianMapper::toResponse).toList();
    }
    @Transactional
    public TechnicianResponse update(UUID id, UpdateTechnicianRequest request) {
        Technician technician = find(id);
        if (!Objects.equals(request.expectedName(), technician.getName())
            || !Objects.equals(request.expectedSector(), technician.getSector()))
            throw new ConflictException("Técnico alterado. Atualize os dados antes de editar.");
        String name = request.name() == null ? "" : request.name().strip();
        if (technicianRepository.existsByNameIgnoreCaseAndIdNot(name, id))
            throw new ConflictException("Já existe um técnico com esse nome.");
        technician.edit(name, request.sector());
        return technicianMapper.toResponse(technician);
    }

    @Transactional
    public void delete(UUID id) {
        Technician technician = find(id);
        if (movementRepository.existsByTechnicianId(id))
            throw new ConflictException("Este técnico possui movimentações. Use Arquivar para preservar o histórico.");
        technicianRepository.delete(technician);
    }

    @Transactional
    public void archive(UUID id) {
        Technician technician = find(id);
        if (!technician.isActive()) throw new ConflictException("Técnico já arquivado.");
        technician.deactivate();
    }

    private Technician find(UUID id) {
        return technicianRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Técnico não encontrado."));
    }
    @Transactional
    public void reactivate(UUID id) { find(id).reactivate(); }
}
