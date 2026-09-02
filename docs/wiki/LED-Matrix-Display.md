# 💡 LED-Matrix Display & Framebuffer-Architektur

Clack-Studio simuliert die 4-Display LED-Hardwarematrix des 16-Bit Relaisrechners mit flüssigen 60 FPS über ein HTML5 Canvas.

---

## 🗺️ Speicherabbild & Adressierung

| Matrix-Modus | Speicherbereich | Worte | Bits pro Zeile | Auflösung |
| :--- | :--- | :--- | :--- | :--- |
| **32 × 32 Standard** | `960` .. `1023` (`0x03C0` .. `0x03FF`) | 64 Worte | 32 Bits (2 Worte) | 4x 8x32 bzw. 16x16 Matrix |
| **64 × 64 Vollbild** | `768` .. `1023` (`0x0300` .. `0x03FF`) | 256 Worte | 64 Bits (4 Worte) | Voller Display-Speicher |

---

## 🎨 Single-Pixel Bitmasking
Jedes Wort im Framebuffer steuert **16 horizontale LEDs**:
* **Wort 0 (Linke Hälfte):** $X = 0$ (Bit 15, `0x8000`) bis $X = 15$ (Bit 0, `0x0001`).
* **Wort 1 (Rechte Hälfte):** $X = 16$ (Bit 15, `0x8000`) bis $X = 31$ (Bit 0, `0x0001`).

### Live-Status & Diagnose
* **`⚡ X LEDs aktiv`**: Zeigt live die exakte Anzahl leuchtender LEDs im RAM an.
* **`Schachbrett`**: Schreibt mit 1 Klick ein Testmuster direkt in den Framebuffer zur Funktionsprüfung.
* **`Leeren`**: Setzt den Framebuffer auf Nullen zurück.
