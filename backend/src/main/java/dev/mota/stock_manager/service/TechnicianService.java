package dev.mota.stock_manager.service;

import dev.mota.stock_manager.dto.CreateTechnicianRequest;
import dev.mota.stock_manager.dto.response.TechnicianResponse;
import dev.mota.stock_manager.entity.Technician;
import dev.mota.stock_manager.mapper.TechnicianMapper;
import dev.mota.stock_manager.repository.TechnicianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TechnicianService {

    private final TechnicianRepository technicianRepository;
    private final dev.mota.stock_manager.repository.MovementRepository movementRepository;
    private final TechnicianMapper technicianMapper;

    public TechnicianResponse createTechnician(
            CreateTechnicianRequest request
    ) {

        if (technicianRepository.existsByNameIgnoreCase(request.name() == null ? "" : request.name().strip())) {
            throw new IllegalArgumentException("Já existe um técnico com esse nome.");
        }

        Technician technician = Technician.create(
                request.name(),
                request.sector()
        );

        Technician savedTechnician =
                technicianRepository.save(technician);

        return technicianMapper.toResponse(savedTechnician);
    }
    public java.util.List<TechnicianResponse> findAll() {
        return technicianRepository.findAll(org.springframework.data.domain.Sort.by("name")).stream().map(technicianMapper::toResponse).toList();
    }
    @jakarta.transaction.Transactional
    public TechnicianResponse update(java.util.UUID id, dev.mota.stock_manager.dto.UpdateTechnicianRequest request) {
        Technician technician = find(id);
        if (!java.util.Objects.equals(request.expectedName(), technician.getName())
            || !java.util.Objects.equals(request.expectedSector(), technician.getSector()))
            throw new org.springframework.dao.OptimisticLockingFailureException("Técnico alterado. Atualize os dados.");
        String name = request.name() == null ? "" : request.name().strip();
        if (technicianRepository.existsByNameIgnoreCaseAndIdNot(name, id))
            throw new IllegalArgumentException("Já existe um técnico com esse nome.");
        technician.edit(name, request.sector());
        return technicianMapper.toResponse(technician);
    }

    @jakarta.transaction.Transactional
    public void delete(java.util.UUID id) {
        Technician technician = find(id);
        if (movementRepository.existsByTechnicianId(id))
            throw new IllegalArgumentException("Este técnico possui movimentações. Use Arquivar para preservar o histórico.");
        technicianRepository.delete(technician);
    }

    @jakarta.transaction.Transactional
    public void archive(java.util.UUID id) {
        Technician technician = find(id);
        if (!technician.isActive()) throw new IllegalArgumentException("Técnico já arquivado.");
        technician.deactivate();
    }

    private Technician find(java.util.UUID id) {
        return technicianRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Técnico não encontrado."));
    }
}
