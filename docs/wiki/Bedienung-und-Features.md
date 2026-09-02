# 🎛️ Bedienung, Relais-Schaltzeiten & Takt-Steuerung

Clack-Studio bietet volle Kontrolle über den virtuellen 16-Bit Relaisrechner:

---

## ⏱️ Physikalische Relais-Zeiten & Taktstufen

Auf echter Relais-Hardware dauert ein einzelner Befehl $\approx \mathbf{50\text{ ms}}$ (10 ms Anzug, 5 ms Prellen, 15 ms ALU, 20 ms Latch). Das entspricht einer physikalischen Taktgrenze von **20 Hz**.

| Takt-Stufe | Frequenz | Zyklusdauer | Zeitfaktor | Typischer Einsatzzweck |
| :--- | :--- | :--- | :--- | :--- |
| **1 Hz** | 1.0 Hz | 1000 ms | 0.05× Zeitlupe | Visuelle Fehlersuche, Beobachten der Datenbusse |
| **5 Hz** | 5.0 Hz | 200 ms | 0.25× Zeitlupe | Schrittweise Programmausführung |
| **20 Hz** | 20.0 Hz | 50 ms | **1.0× Original-Hardware** | Echte mechanische Relais-Geschwindigkeit |
| **100 Hz** | 100.0 Hz | 10 ms | 5.0× Turbo | Schnelle Rechenaufgaben |
| **MAX** | ~500+ Hz | < 2 ms | Echtzeit-Simulation | Flüssige Grafik & Spiele (Ping-Pong) |

---

## 📊 Live-Anzeigen & Metriken

* **PC:** Aktueller Befehlszeiger (`0x0000`).
* **ACCU:** Akkumulator (Hexadezimal und vorzeichenbehaftet in Klammern).
* **STACK:** Unterprogramm-Rücksprungadresse.
* **CYCLES:** Anzahl ausgeführter Takte.
* **RELAIS-ZEIT:** Berechnete reale Dauer auf echter 20 Hz Relais-Hardware (`14.2s`, `2m 15s`, etc.).
