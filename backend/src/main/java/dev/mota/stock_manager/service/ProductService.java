package dev.mota.stock_manager.service;


import dev.mota.stock_manager.dto.CreateProductRequest;
import dev.mota.stock_manager.dto.response.ProductResponse;
import dev.mota.stock_manager.entity.Product;
import dev.mota.stock_manager.mapper.ProductMapper;
import dev.mota.stock_manager.repository.ProductRepository;
import dev.mota.stock_manager.repository.MovementItemRepository;
import jakarta.transaction.Transactional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final dev.mota.stock_manager.repository.ProductAdjustmentRepository adjustmentRepository;
    private final ProductMapper productMapper;
    private final MovementItemRepository movementItemRepository;

    public ProductResponse createProduct(CreateProductRequest request) {

       if (productRepository.existsByName(request.name())){
           throw new IllegalArgumentException("Product already exists");
       }

       Product product = Product.create(
               request.name(),
               request.quantity(),
               request.minimumQuantity()
       );

       Product savedProduct= productRepository.save(product);

       return productMapper.toResponse(savedProduct);
    }

    public java.util.List<ProductResponse> findAll() {
        return productRepository.findAll(org.springframework.data.domain.Sort.by("name")).stream().filter(Product::isActive).map(productMapper::toResponse).toList();
    }

    @Transactional
    public void delete(UUID id) {
        Product item = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Material não encontrado."));
        item.ensureRemovable();
        if (movementItemRepository.existsByProductId(id) || adjustmentRepository.existsByProductId(id)) {
            throw new IllegalArgumentException("Este item possui movimentações. Use Arquivar para preservar o histórico.");
        }
        productRepository.delete(item);
    }

    @Transactional
    public void archive(UUID id) {
        Product item = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Material não encontrado."));
        item.archive();
    }
    @Transactional
    public ProductResponse update(UUID id, dev.mota.stock_manager.dto.UpdateProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Material não encontrado."));
        if (!product.isActive()) throw new IllegalArgumentException("Material arquivado não pode ser editado.");
        if (request.expectedQuantity() == null || request.expectedQuantity() != product.getQuantity()
            || !java.util.Objects.equals(request.expectedName(), product.getName()))
            throw new org.springframework.dao.OptimisticLockingFailureException("Material alterado. Atualize os dados antes de editar.");
        String name = request.name() == null ? "" : request.name().strip();
        if (name.isBlank() || name.length() > 255) throw new IllegalArgumentException("Informe um nome com até 255 caracteres.");
        int quantity;
        try { quantity = request.quantity().intValueExact(); }
        catch (ArithmeticException | NullPointerException ex) { throw new IllegalArgumentException("Informe uma quantidade inteira entre 0 e 2147483647."); }
        if (quantity < 0) throw new IllegalArgumentException("Informe uma quantidade inteira maior ou igual a zero.");
        if (productRepository.existsByNameIgnoreCaseAndIdNot(name, id)) throw new IllegalArgumentException("Já existe um material com esse nome.");
        String reason = request.reason() == null ? "" : request.reason().strip();
        if (reason.length() > 255) throw new IllegalArgumentException("O motivo deve ter até 255 caracteres.");
        if (quantity != product.getQuantity() && reason.isBlank()) throw new IllegalArgumentException("Informe o motivo do ajuste de estoque.");
        if (!name.equals(product.getName()) || quantity != product.getQuantity()) {
            adjustmentRepository.save(new dev.mota.stock_manager.entity.ProductAdjustment(product, name, quantity, reason.isBlank() ? "Correção do nome" : reason));
            product.edit(name, quantity);
        }
        return productMapper.toResponse(product);
    }

    public java.util.List<dev.mota.stock_manager.entity.ProductAdjustment> adjustments(UUID id) {
        if (!productRepository.existsById(id)) throw new IllegalArgumentException("Material não encontrado.");
        return adjustmentRepository.findByProductIdOrderByDateDesc(id);
    }
}
