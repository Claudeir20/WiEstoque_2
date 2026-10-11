package dev.mota.stock_manager.entity;


import dev.mota.stock_manager.enums.MovementType;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Table(name = "movements")
public class Movement {

    @Id
    private UUID id;

    @Column
    private UUID technicianId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType type;

    @Column(nullable = false)
    private LocalDateTime date;

    private String observation;

    @OneToMany(
            mappedBy = "movement",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<MovementItem> items = new ArrayList<>();

    protected Movement() {}

    private Movement(
            UUID technicianId,
            MovementType type,
            String observation
    ) {
        this.id = UUID.randomUUID();
        this.technicianId = technicianId;
        this.type = type;
        this.observation = observation;
        this.date = LocalDateTime.now();
    }

    public static Movement create(
            UUID technicianId,
            MovementType type,
            String observation
    ) {
        if (technicianId == null && type != MovementType.ENTRY) {
            throw new IllegalArgumentException(
                    "Selecione um técnico."
            );
        }

        if (type == null) {
            throw new IllegalArgumentException(
                    "Informe o tipo da movimentação."
            );
        }

        return new Movement(
                technicianId,
                type,
                observation
        );
    }

    public void addProduct(
            Product product,
            int quantity
    ) {
        if (product == null) {
            throw new IllegalArgumentException(
                    "Informe o material."
            );
        }

        if (quantity <= 0) {
            throw new IllegalArgumentException(
                    "A quantidade deve ser maior que zero."
            );
        }

        switch (type){
            case WITHDRAWAL -> product.subtractQuantity(quantity);
            case RETURN, ENTRY -> product.addQuantity(quantity);
        }

        items.add(MovementItem.forProduct(this, product, quantity));
    }

    public void addRouter(Router router, String clientCode) {

        if (router == null) {
            throw new IllegalArgumentException(
                    "Informe o roteador."
            );
        }


        switch (type){
            case WITHDRAWAL -> router.withdraw();
            case RETURN -> router.returnStock();
            case ENTRY -> throw new IllegalArgumentException("Cadastre novos roteadores na tela de roteadores; para retornos, use devolução.");
            }


        items.add(MovementItem.forRouter(this, router, clientCode));
    }

    public List<MovementItem> getItems() {
        return Collections.unmodifiableList(items);
    }
}
