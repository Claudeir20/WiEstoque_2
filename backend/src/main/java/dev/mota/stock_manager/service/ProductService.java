package dev.mota.stock_manager.service;

import dev.mota.stock_manager.dto.CreateProductRequest;
import dev.mota.stock_manager.dto.UpdateProductRequest;
import dev.mota.stock_manager.dto.response.ProductAdjustmentResponse;
import dev.mota.stock_manager.dto.response.ProductResponse;
import dev.mota.stock_manager.entity.Product;
import dev.mota.stock_manager.exception.ConflictException;
import dev.mota.stock_manager.exception.ResourceNotFoundException;
import dev.mota.stock_manager.mapper.ProductMapper;
import dev.mota.stock_manager.repository.MovementItemRepository;
import dev.mota.stock_manager.repository.ProductAdjustmentRepository;
import dev.mota.stock_manager.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {
    private static final String NOT_FOUND = "Material não encontrado.";
    private final ProductRepository productRepository;
    private final ProductAdjustmentRepository adjustmentRepository;
    private final ProductMapper productMapper;
    private final MovementItemRepository movementItemRepository;

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        Product product = Product.create(request.name(), request.quantity(), request.minimumQuantity());
        assertNameAvailable(product.getName(), null);
        return productMapper.toResponse(productRepository.saveAndFlush(product));
    }

    public List<ProductResponse> findAll() {
        return findAll(false);
    }

    public List<ProductResponse> findAll(boolean includeArchived) {
        return productRepository.findAll(Sort.by("name")).stream()
            .filter(p -> includeArchived || p.isActive()).map(productMapper::toResponse).toList();
    }

    @Transactional
    public void delete(UUID id) {
        Product product = getProduct(id);
        product.ensureRemovable();
        if (movementItemRepository.existsByProductId(id) || adjustmentRepository.existsByProductId(id))
            throw new ConflictException("Este item possui movimentações. Use Arquivar para preservar o histórico.");
        productRepository.delete(product);
    }

    @Transactional
    public void archive(UUID id) {
        getProduct(id).archive();
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest request) {
        Product product = getProduct(id);

        if (!Objects.equals(request.version(), product.getVersion()))
            throw new ConflictException("Material alterado. Atualize os dados antes de editar.");

        String name = Product.normalizeName(request.name());
        int quantity;

        try { quantity = request.quantity().intValueExact(); }
        catch (ArithmeticException | NullPointerException ex) {
            throw new IllegalArgumentException("Informe uma quantidade inteira entre 0 e 2147483647.");
        }

        if (!name.equals(product.getName())) assertNameAvailable(name, id);
        product.edit(name, quantity, request.reason()).ifPresent(adjustmentRepository::save);
        // Atualiza @Version antes de montar a resposta; o cliente recebe a versão gravada.
        productRepository.flush();
        return productMapper.toResponse(product);
    }

    public List<ProductAdjustmentResponse> adjustments(UUID id) {
        getProduct(id);
        return adjustmentRepository.findByProductIdOrderByDateDesc(id).stream()
            .map(ProductAdjustmentResponse::from).toList();
    }

    private Product getProduct(UUID id) {
        return productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException(NOT_FOUND));
    }

    private void assertNameAvailable(String name, UUID excludeId) {
        boolean taken = excludeId == null ? productRepository.existsByNameIgnoreCase(name)
            : productRepository.existsByNameIgnoreCaseAndIdNot(name, excludeId);
        if (taken) throw new ConflictException("Já existe um material com esse nome.");
    }
    @Transactional
    public void reactivate(UUID id) { getProduct(id).reactivate(); }
}
