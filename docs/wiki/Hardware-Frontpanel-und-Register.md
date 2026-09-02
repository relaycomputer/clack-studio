# 🎛️ Hardware-Frontpanel & Register

Das Frontpanel visualisiert den aktuellen Zustand aller internen Register und Busse des Relaisrechners in Echtzeit:

---

## 1. Register- & Busleisten

| Name | Breite | Bitmuster-Skala | Hex & Info-Badge |
| :--- | :---: | :--- | :--- |
| **ACCU** | 16 Bit | `[15..12] [11..8] [7..4] [3..0]` | Hex-Wert & vorzeichenbehafteter Dezimalwert |
| **IR** | 16 Bit | `[15..12] [11..8] [7..4] [3..0]` | Opcode & Mnemonic (z. B. `0x1800` $\rightarrow$ `LDAM`) |
| **DATENBUS** | 16 Bit | `[15..12] [11..8] [7..4] [3..0]` | Live-Datenverkehr & Lese-/Schreibwert |
| **ADRESSBUS** | 10 Bit | `[--.. 9..8] [7..4] [3..0]` | Angesteuerte Speicheradresse (`0`..`1023`) |
| **PC** | 10 Bit | `[--.. 9..8] [7..4] [3..0]` | Aktuelle Befehlsadresse des Programmzählers |
| **STACK (SR)**| 10 Bit | `[--.. 9..8] [7..4] [3..0]` | Rücksprungadresse für `CALL` / `RET` |

---

## 2. Statuslampen

* **`BUS`**:
  * **`READ`** *(Cyan)*: Leuchtet bei aktivem Lesezyklus.
  * **`WRITE`** *(Amber/Orange)*: Leuchtet bei aktivem Schreibzugriff.
* **`FLAGS`**:
  * **`C`** *(Carry)*: Übertrag der letzten arithmetischen Addition.
  * **`Z`** *(Zero)*: Gesetzt, wenn der Akkumulator gleich 0 ist.
  * **`N`** *(Negative)*: Gesetzt, wenn Bit 15 des Akkumulators 1 ist.
  * **`E`** *(Even)*: Gesetzt, wenn das niederwertigste Bit (Bit 0) 0 ist (gerade Zahl).
