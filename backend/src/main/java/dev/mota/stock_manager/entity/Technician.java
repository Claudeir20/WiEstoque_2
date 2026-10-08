package dev.mota.stock_manager.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Table(name = "technicians")
public class Technician {

    @Version
    private long version;

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String sector;

    @Column(nullable = false)
    private boolean active;

    protected Technician() {}

    private Technician(String name, String sector) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.sector = sector;
        this.active = true;
    }

    public static Technician create(
            String name,
            String sector) {

        if (name == null || name.isBlank() || name.strip().length() > 255) {
            throw new IllegalArgumentException(
                    "Name is required"
            );
        }

        if (sector == null || sector.isBlank() || sector.strip().length() > 255) {
            throw new IllegalArgumentException(
                    "Sector is required"
            );
        }

        return new Technician(
                name.trim(),
                sector.trim()
        );
    }

    public void edit(String name, String sector) {
        if (!active) throw new IllegalArgumentException("Técnico arquivado não pode ser editado.");
        if (name == null || name.isBlank() || name.strip().length() > 255)
            throw new IllegalArgumentException("Informe um nome com até 255 caracteres.");
        if (sector == null || sector.isBlank() || sector.strip().length() > 255)
            throw new IllegalArgumentException("Informe um setor com até 255 caracteres.");
        this.name = name.strip(); this.sector = sector.strip();
    }

    public void deactivate() {
        this.active = false;
    }
}