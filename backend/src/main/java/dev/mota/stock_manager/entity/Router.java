package dev.mota.stock_manager.entity;

import dev.mota.stock_manager.exception.ConflictException;
import dev.mota.stock_manager.validation.RouterIdentifiers;
import dev.mota.stock_manager.enums.Status;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.persistence.Version;

@Entity
@Getter
@Table(name = "routers")
public class Router {

    @Version
    private long version;

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String assetNumber;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false, unique = true)
    private String serialNumber;

    @Column(nullable = false, unique = true)
    private String mac;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(nullable = false)
    private LocalDateTime createdAt;


    @Column(nullable = false)
    private boolean active = true;

    protected Router() {}

    public void ensureRemovable() {
        if (!active) throw new ConflictException("Roteador já arquivado.");
        if (status != Status.IN_STOCK) {
            throw new IllegalArgumentException("Registre a devolução do roteador antes de excluir ou arquivar.");
        }
    }

    public void archive() {
        ensureRemovable();
        active = false;
    }

    private void ensureActive() {
        if (!active) throw new IllegalArgumentException("Roteador arquivado não pode ser movimentado.");
    }

    private Router( String assetNumber, String model, String serialNumber, String mac) {
        this.id = UUID.randomUUID();
        this.assetNumber = assetNumber;
        this.model = model;
        this.serialNumber = serialNumber;
        this.mac = mac;
        this.status = Status.IN_STOCK;
        this.createdAt = LocalDateTime.now();
    }

    public static Router create(
            String assetNumber,
            String model,
            String serialNumber,
            String mac) {

        if (assetNumber == null ||  assetNumber.isBlank()){
            throw new IllegalArgumentException("Informe o patrimônio.");
        }
        if (model == null || model.isBlank()){
            throw new IllegalArgumentException("Informe o modelo.");
        }
        if (serialNumber == null || serialNumber.isBlank()){
            throw new IllegalArgumentException("Informe o número de série.");
        }
        if (mac == null || mac.isBlank()){
            throw new IllegalArgumentException("Informe o MAC.");
        }

        return new Router(assetNumber, model,
                RouterIdentifiers.normalizeSerial(serialNumber), RouterIdentifiers.normalizeMac(mac));

    }

    public void withdraw() {
        ensureActive();
        if (status != Status.IN_STOCK){
            throw new IllegalArgumentException("Roteador " + assetNumber + " já está fora do estoque.");
        }
        this.status = Status.OUT_OF_STOCK;
    }

    public void returnStock() {
        ensureActive();
        if (status != Status.OUT_OF_STOCK){
            throw new IllegalArgumentException("Roteador " + assetNumber + " já está no estoque.");
        }

        this.status = Status.IN_STOCK;
    }

}

