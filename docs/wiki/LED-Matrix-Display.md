# 🟢 64x64 & 32x32 LED Matrix Display

Das LED-Matrix-Display ist als **Memory-Mapped Framebuffer** im RAM des Relaisrechners angebunden.

---

## 1. Speicherzuordnung (64x64 Modus)

* **Startadresse:** `0x0300` (Dezimal `768`)
* **Endadresse:** `0x03FF` (Dezimal `1023`)
* **Gesamtgröße:** 256 Worte $\times$ 16 Bit = **4096 Pixel** (64 Zeilen $\times$ 64 Spalten)
* **Pixel pro Wort:** 16 Pixel (Bit 15 = links, Bit 0 = rechts)
* **Worte pro Zeile:** 4 Worte (z. B. Zeile 0 = Worte `768..771`)

---

## 2. Farbmodi & Phosphor-Glow

Über das Dropdown-Menü in der Kopfzeile können verschiedene klassische Bildschirmfarben gewählt werden:
* **Amber (Bernstein):** Klassischer 80er-Jahre Gasplasma-/Terminal-Look.
* **Phosphor Grün:** Nostalgischer P31-Oszilloskop-Grün-Phosphor.
* **Cyber Cyan:** Moderner Neon-Blau-Look.
* **Rubin Rot:** LED-Matrix in Rot.
