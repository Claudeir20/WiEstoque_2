package dev.mota.stock_manager.entity;

import dev.mota.stock_manager.enums.MovementType;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MovementTest {

    @Test
    void entryShouldIncreaseStockWithoutTechnician() {
        Product product = Product.create("Cabo", 10, 2);
        Movement movement = Movement.create(null, MovementType.ENTRY, "Compra");
        movement.addProduct(product, 5);
        assertEquals(15, product.getQuantity());
        assertNull(movement.getTechnicianId());
    }

    @Test
    void entryShouldRejectRouterAndLeaveStatusUnchanged() {
        Router router = Router.create("PAT-2", "AX", "SN-2", "AA:BB:CC:DD:EE:01");
        Movement movement = Movement.create(null, MovementType.ENTRY, null);
        assertThrows(IllegalArgumentException.class, () -> movement.addRouter(router, null));
        assertEquals(dev.mota.stock_manager.enums.Status.IN_STOCK, router.getStatus());
        assertTrue(movement.getItems().isEmpty());
    }

    @Test
    void withdrawalShouldSubtractProductStock() {
        Product product = Product.create("Cabo UTP", 10, 2);
        Movement movement = Movement.create(UUID.randomUUID(), MovementType.WITHDRAWAL, null);

        movement.addProduct(product, 3);

        assertEquals(7, product.getQuantity());
        assertEquals(1, movement.getItems().size());
    }

    @Test
    void returnShouldAddProductStock() {
        Product product = Product.create("Cabo UTP", 10, 2);
        Movement movement = Movement.create(UUID.randomUUID(), MovementType.RETURN, null);

        movement.addProduct(product, 3);

        assertEquals(13, product.getQuantity());
    }

    @Test
    void withdrawingRouterAlreadyOutShouldFail() {
        Router router = Router.create("PAT-1", "AX1800", "SN-1", "AA:BB:CC:DD:EE:FF");
        router.withdraw();
        Movement movement = Movement.create(UUID.randomUUID(), MovementType.WITHDRAWAL, null);

        assertThrows(IllegalArgumentException.class, () -> movement.addRouter(router, null));
    }
}
