package dev.mota.stock_manager.entity;

import dev.mota.stock_manager.enums.MovementItemType;
import jakarta.persistence.*;
import lombok.Getter;

import java.util.UUID;

@Entity
@Getter
@Table(name = "movement_items")
public class MovementItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movement_id", nullable = false)
    private Movement movement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementItemType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "router_id")
    private Router router;

    @Column(nullable = false)
    private int quantity;

    private String clientCode;

    protected MovementItem() {}

    private MovementItem(
            Movement movement,
            Product product,
            Router router,
            MovementItemType type,
            int quantity,
            String clientCode
    ) {
        this.id = UUID.randomUUID();
        this.movement = movement;
        this.product = product;
        this.router = router;
        this.type = type;
        this.quantity = quantity;
        this.clientCode = clientCode;
    }

    static MovementItem forProduct(
            Movement movement,
            Product product,
            int quantity
    ) {
        return new MovementItem(
                movement,
                product,
                null,
                MovementItemType.PRODUCT,
                quantity,
                null
        );
    }

    static MovementItem forRouter(
            Movement movement,
            Router router,
            String clientCode
    ) {
        return new MovementItem(
                movement,
                null,
                router,
                MovementItemType.ROUTER,
                1,
                clientCode
        );
    }
}