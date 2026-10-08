package dev.mota.stock_manager.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Table(name = "products")
public class Product {

    @jakarta.persistence.Version
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
            throw new IllegalArgumentException("minimumQuantity is required");
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

    public void edit(String name, int quantity) {
        ensureActive();
        name = normalizeName(name);
        if (quantity < 0) throw new IllegalArgumentException("A quantidade não pode ser negativa.");
        this.name = name.strip(); this.quantity = quantity;
    }

    public void ensureRemovable() {
        if (!active) throw new IllegalArgumentException("Material já arquivado.");
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
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        this.quantity += quantity;
    }

    public void subtractQuantity(int quantity){
        ensureActive();
        if (quantity <= 0){
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        if (quantity > this.quantity){
            throw new IllegalArgumentException("Insufficient stock");
        }
        this.quantity -= quantity;
    }

}
