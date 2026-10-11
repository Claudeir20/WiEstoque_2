package dev.mota.stock_manager.entity;
import org.junit.jupiter.api.Test;
import dev.mota.stock_manager.exception.ConflictException;
import static org.junit.jupiter.api.Assertions.*;
class ReactivationTest {
 @Test void restoresMaterialIdentityAndAllowsEditing() {
  Product p=Product.create("Material",0,1); var id=p.getId(); p.archive(); p.reactivate();
  assertTrue(p.isActive()); assertEquals(id,p.getId()); assertEquals(0,p.getQuantity());
  assertTrue(p.edit("Corrigido",1,"Reposição").isPresent());
  assertThrows(ConflictException.class,p::reactivate);
 }
 @Test void restoresTechnicianWithoutChangingIdentityOrSector() {
  Technician t=Technician.create("Técnico","Estoque"); var id=t.getId(); t.deactivate(); t.reactivate();
  assertTrue(t.isActive()); assertEquals(id,t.getId()); assertEquals("Estoque",t.getSector());
  assertThrows(ConflictException.class,t::reactivate);
 }
}
