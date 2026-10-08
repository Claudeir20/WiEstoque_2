package dev.mota.stock_manager.validation;

import dev.mota.stock_manager.entity.Router;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RouterIdentifiersTest {
    @Test
    void normalizesScannerInputsAndPreservesSerialSeparators() {
        assertEquals("SN-ZTE-001", RouterIdentifiers.normalizeSerial(" sn-zte-001\r\n"));
        for (String value : new String[]{"aabbccddee01", "aa:bb:cc:dd:ee:01", "aa-bb-cc-dd-ee-01", "aabb.ccdd.ee01", " aabbccddee01\r\n"}) {
            assertEquals("AA:BB:CC:DD:EE:01", RouterIdentifiers.normalizeMac(value));
        }
    }

    @Test
    void rejectsInvalidMacWithoutSilentlyDiscardingCharacters() {
        for (String value : new String[]{"", "aabbccddee0", "aabbccddee011", "D4D6B8N9S354A", "aabbccddee01!", "aa bb cc dd ee 01"}) {
            assertThrows(IllegalArgumentException.class, () -> RouterIdentifiers.normalizeMac(value));
        }
        assertThrows(IllegalArgumentException.class, () -> RouterIdentifiers.normalizeMac(null));
        assertThrows(IllegalArgumentException.class, () -> RouterIdentifiers.normalizeSerial(null));
        assertThrows(IllegalArgumentException.class, () -> RouterIdentifiers.normalizeSerial("   "));
    }

    @Test
    void directEntityCreationAlsoEnforcesFormatting() {
        Router router = Router.create("PAT-1", "ZTE", " sn-001 ", "aabbccddee01");
        assertEquals("SN-001", router.getSerialNumber());
        assertEquals("AA:BB:CC:DD:EE:01", router.getMac());
    }
}
