package dev.mota.stock_manager.entity;

import dev.mota.stock_manager.exception.ConflictException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ProductTest {
    @Test
    void createsAdjustmentWithOriginalValuesBeforeUpdating() {
        Product product = Product.create("Antes", 60, 1);
        ProductAdjustment adjustment = product.edit(" Depois ", 50, " Contagem física ").orElseThrow();
        assertEquals(product.getId(), adjustment.getProductId());
        assertEquals("Antes", adjustment.getPreviousName());
        assertEquals("Depois", adjustment.getNewName());
        assertEquals(60, adjustment.getPreviousQuantity());
        assertEquals(50, adjustment.getNewQuantity());
        assertEquals("Contagem física", adjustment.getReason());
        assertNotNull(adjustment.getDate());
        assertEquals("Depois", product.getName());
        assertEquals(50, product.getQuantity());
    }

    @Test
    void rejectsInvalidEditsWithoutChangingState() {
        Product product = Product.create("Material", 10, 1);
        assertThrows(IllegalArgumentException.class, () -> product.edit("Outro", 9, null));
        assertThrows(IllegalArgumentException.class, () -> product.edit("Outro", 9, "   "));
        assertThrows(IllegalArgumentException.class, () -> product.edit("Outro", -1, "Motivo"));
        assertThrows(IllegalArgumentException.class, () -> product.edit("   ", 10, null));
        assertThrows(IllegalArgumentException.class, () -> product.edit("Outro", 10, "a".repeat(256)));
        assertEquals("Material", product.getName());
        assertEquals(10, product.getQuantity());
    }

    @Test
    void skipsUnchangedValuesAndUsesDefaultReasonForRename() {
        Product product = Product.create("Material", 10, 1);
        assertTrue(product.edit(" Material ", 10, null).isEmpty());
        ProductAdjustment adjustment = product.edit("Corrigido", 10, null).orElseThrow();
        assertEquals("Correção do nome", adjustment.getReason());
        assertEquals(10, adjustment.getPreviousQuantity());
        assertEquals(10, adjustment.getNewQuantity());
    }

    @Test
    void refusesArchivedMaterialEvenWithoutChanges() {
        Product product = Product.create("Arquivado", 0, 1);
        product.archive();
        assertThrows(ConflictException.class, () -> product.edit("Arquivado", 0, null));
        assertThrows(ConflictException.class, () -> product.edit("Outro", 1, "Motivo"));
        assertEquals("Arquivado", product.getName());
        assertEquals(0, product.getQuantity());
    }
}
