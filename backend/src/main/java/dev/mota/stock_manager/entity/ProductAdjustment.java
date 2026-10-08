package dev.mota.stock_manager.entity;
import jakarta.persistence.*;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity @Getter @Table(name="product_adjustments")
public class ProductAdjustment {
 @Id private UUID id;
 @Column(nullable=false) private UUID productId;
 @Column(nullable=false) private String previousName;
 @Column(nullable=false) private String newName;
 @Column(nullable=false) private int previousQuantity;
 @Column(nullable=false) private int newQuantity;
 @Column(nullable=false) private String reason;
 @Column(nullable=false) private LocalDateTime date;
 protected ProductAdjustment() {}
 public ProductAdjustment(Product product, String name, int quantity, String reason) {
  id=UUID.randomUUID(); productId=product.getId(); previousName=product.getName(); newName=name;
  previousQuantity=product.getQuantity(); newQuantity=quantity; this.reason=reason; date=LocalDateTime.now();
 }
}
