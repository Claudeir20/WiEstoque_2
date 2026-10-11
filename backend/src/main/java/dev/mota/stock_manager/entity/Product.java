package dev.mota.stock_manager.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Optional;
import dev.mota.stock_manager.exception.ConflictException;
import jakarta.persistence.Version;

@Entity
@Getter
@Table(name = "products")
public class Product {

    @Version
    private long version;

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private int minimumQuantity;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean active;

    protected Product() {}

    private Product( String name, int quantity, int minimumQuantity) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.quantity = quantity;
        this.minimumQuantity = minimumQuantity;
        this.createdAt = LocalDateTime.now();
        this.active = true;
    }

    public static Product create(String name, int quantity, int minimumQuantity) {

        name = normalizeName(name);
        if (quantity < 0){
            throw new IllegalArgumentException("A quantidade inicial não pode ser negativa.");
        }
        if (minimumQuantity <= 0){
            throw new IllegalArgumentException("Informe um estoque mínimo maior que zero.");
        }

        return new Product(
                name,
                quantity,
                minimumQuantity
        );
    }

    public static String normalizeName(String name) {
        if (name == null || name.isBlank() || name.strip().length() > 255)
            throw new IllegalArgumentException("Informe um nome com até 255 caracteres.");
        return name.strip();
    }

    public Optional<ProductAdjustment> edit(String name, int quantity, String reason) {
        if (!active) throw new ConflictException("Material arquivado não pode ser editado.");

        String newName = normalizeName(name);
        if (quantity < 0) throw new IllegalArgumentException("A quantidade não pode ser negativa.");
        String normalizedReason = reason == null ? "" : reason.strip();

        if (normalizedReason.length() > 255)
            throw new IllegalArgumentException("O motivo deve ter até 255 caracteres.");

        boolean nameChanged = !newName.equals(this.name);
        boolean quantityChanged = quantity != this.quantity;
        if (!nameChanged && !quantityChanged) return Optional.empty();
        if (quantityChanged && normalizedReason.isBlank())
            throw new IllegalArgumentException("Informe o motivo do ajuste de estoque.");

        ProductAdjustment adjustment = new ProductAdjustment(this, newName, quantity,
            normalizedReason.isBlank() ? "Correção do nome" : normalizedReason);
        this.name = newName;
        this.quantity = quantity;
        return Optional.of(adjustment);
    }

    public void ensureRemovable() {
        if (!active) throw new ConflictException("Material já arquivado.");
        if (quantity != 0) {
            throw new IllegalArgumentException("O saldo do material deve ser zero para excluir ou arquivar.");
        }
    }

    public void archive() {
        ensureRemovable();
        active = false;
    }

    private void ensureActive() {
        if (!active) throw new IllegalArgumentException("Material arquivado não pode ser movimentado.");
    }

    public void addQuantity(int quantity){
        ensureActive();
        if (quantity <= 0){
            throw new IllegalArgumentException("A quantidade deve ser maior que zero.");
        }
        this.quantity += quantity;
    }

    public void subtractQuantity(int quantity){
        ensureActive();
        if (quantity <= 0){
            throw new IllegalArgumentException("A quantidade deve ser maior que zero.");
        }

        if (quantity > this.quantity){
            throw new IllegalArgumentException("Saldo insuficiente de " + name + ". Disponível: " + this.quantity + ".");
        }
        this.quantity -= quantity;
    }

    public void reactivate() {
        if (active) throw new ConflictException("Material já está ativo.");
        active = true;
    }
}
