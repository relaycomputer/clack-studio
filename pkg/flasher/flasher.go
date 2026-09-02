package flasher

import (
	"bufio"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"go.bug.st/serial"
	"go.bug.st/serial/enumerator"
)

// PortInfo describes a detected serial communication port
type PortInfo struct {
	Name        string `json:"name"`
	IsUSB       bool   `json:"isUSB"`
	Description string `json:"description"`
	IsArduino   bool   `json:"isArduino"`
}

// FlashResult contains the summary of a flash operation
type FlashResult struct {
	Success   bool     `json:"success"`
	Message   string   `json:"message"`
	LinesSent int      `json:"linesSent"`
	Duration  float64  `json:"durationMs"`
	Logs      []string `json:"logs"`
}

// ListPorts discovers all available serial ports on the host
func ListPorts() ([]PortInfo, error) {
	ports, err := enumerator.GetDetailedPortsList()
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Abfragen der seriellen Ports: %w", err)
	}

	var result []PortInfo
	for _, p := range ports {
		isArduino := false
		desc := "Serieller Port"
		if p.IsUSB {
			desc = fmt.Sprintf("USB VID:%s PID:%s", p.VID, p.PID)
			// Common Arduino VID/PID patterns
			if strings.EqualFold(p.VID, "2341") || strings.EqualFold(p.VID, "1A86") || strings.EqualFold(p.VID, "0403") || strings.Contains(strings.ToLower(p.Product), "arduino") {
				isArduino = true
				desc = "Arduino Mega / USB-Serial (" + p.Product + ")"
			}
		}

		result = append(result, PortInfo{
			Name:        p.Name,
			IsUSB:       p.IsUSB,
			Description: desc,
			IsArduino:   isArduino,
		})
	}
	return result, nil
}

// ParseLines parses both Arduino loader (addr val) and C-Array (daten[n]=...) formats
func ParseLines(source string) ([]string, error) {
	lines := strings.Split(source, "\n")
	var clean []string

	regexArray := regexp.MustCompile(`(?i)daten\[\s*(\d+)\s*\]\s*=\s*(0x[0-9a-fA-F]+|\d+)\s*;`)
	regexSimple := regexp.MustCompile(`^\s*(\d+)\s+(0x[0-9a-fA-F]+|\d+)`)

	hasClear := false

	for _, raw := range lines {
		trimmed := strings.TrimSpace(raw)
		if idx := strings.Index(trimmed, "//"); idx != -1 {
			trimmed = strings.TrimSpace(trimmed[:idx])
		}
		if trimmed == "" {
			continue
		}

		upper := strings.ToUpper(trimmed)
		if upper == "CLR" {
			clean = append(clean, "CLR")
			hasClear = true
			continue
		}
		if upper == "RUN" {
			clean = append(clean, "RUN")
			continue
		}

		if match := regexArray.FindStringSubmatch(trimmed); len(match) == 3 {
			addr, _ := strconv.Atoi(match[1])
			valStr := match[2]
			var val int64
			if strings.HasPrefix(strings.ToLower(valStr), "0x") {
				val, _ = strconv.ParseInt(valStr[2:], 16, 64)
			} else {
				val, _ = strconv.ParseInt(valStr, 10, 64)
			}
			clean = append(clean, fmt.Sprintf("%d 0x%04X", addr, val&0xFFFF))
			continue
		}

		if match := regexSimple.FindStringSubmatch(trimmed); len(match) == 3 {
			addr, _ := strconv.Atoi(match[1])
			valStr := match[2]
			var val int64
			if strings.HasPrefix(strings.ToLower(valStr), "0x") {
				val, _ = strconv.ParseInt(valStr[2:], 16, 64)
			} else {
				val, _ = strconv.ParseInt(valStr, 10, 64)
			}
			clean = append(clean, fmt.Sprintf("%d 0x%04X", addr, val&0xFFFF))
			continue
		}
	}

	if len(clean) == 0 {
		return nil, fmt.Errorf("keine gültigen Maschinencode-Zeilen gefunden")
	}

	// Prepend CLR if not explicitly present
	if !hasClear && clean[0] != "CLR" {
		clean = append([]string{"CLR"}, clean...)
	}

	return clean, nil
}

// FlashProgram opens the serial port, resets Arduino via DTR, and writes line by line
func FlashProgram(portName string, baudRate int, source string) FlashResult {
	startTime := time.Now()
	var logs []string
	log := func(msg string) {
		logs = append(logs, msg)
	}

	if baudRate <= 0 {
		baudRate = 115200
	}

	cleanLines, err := ParseLines(source)
	if err != nil {
		return FlashResult{
			Success:  false,
			Message:  err.Error(),
			Duration: 0,
			Logs:     []string{fmt.Sprintf("Fehler: %v", err)},
		}
	}

	log(fmt.Sprintf("Öffne seriellen Port %s mit %d Baud...", portName, baudRate))

	mode := &serial.Mode{
		BaudRate: baudRate,
		DataBits: 8,
		Parity:   serial.NoParity,
		StopBits: serial.OneStopBit,
	}

	port, err := serial.Open(portName, mode)
	if err != nil {
		return FlashResult{
			Success:  false,
			Message:  fmt.Sprintf("Konnte Port %s nicht öffnen: %v", portName, err),
			Duration: 0,
			Logs:     logs,
		}
	}
	defer port.Close()

	// Hardware Reset via DTR toggle
	log("Führe Arduino Hardware-Reset via DTR aus...")
	_ = port.SetDTR(false)
	time.Sleep(100 * time.Millisecond)
	_ = port.SetDTR(true)

	log("Warte 1.5s auf Initialisierung des Arduino Speichersubsystems...")
	time.Sleep(1500 * time.Millisecond)

	// Flush any initial bootloader banner
	buf := make([]byte, 1024)
	_ = port.SetReadTimeout(100 * time.Millisecond)
	_, _ = port.Read(buf)

	// Send lines
	log(fmt.Sprintf("Sende %d Maschinencode-Zeilen an den Arduino...", len(cleanLines)))
	sent := 0

	for i, line := range cleanLines {
		data := []byte(line + "\n")
		_, writeErr := port.Write(data)
		if writeErr != nil {
			return FlashResult{
				Success:   false,
				Message:   fmt.Sprintf("Schreibfehler bei Zeile %d ('%s'): %v", i+1, line, writeErr),
				LinesSent: sent,
				Duration:  float64(time.Since(startTime).Milliseconds()),
				Logs:      logs,
			}
		}
		sent++
		time.Sleep(4 * time.Millisecond) // Pacing delay
	}

	// Read responses
	reader := bufio.NewReader(port)
	for {
		port.SetReadTimeout(200 * time.Millisecond)
		respLine, readErr := reader.ReadString('\n')
		if readErr != nil {
			break
		}
		respLine = strings.TrimSpace(respLine)
		if respLine != "" {
			log(fmt.Sprintf("Arduino: %s", respLine))
		}
	}

	duration := float64(time.Since(startTime).Milliseconds())
	log(fmt.Sprintf("✅ Upload erfolgreich abgeschlossen in %.1f ms! (%d Zeilen)", duration, sent))

	return FlashResult{
		Success:   true,
		Message:   fmt.Sprintf("Erfolgreich %d Zeilen in %.1f ms geflasht.", sent, duration),
		LinesSent: sent,
		Duration:  duration,
		Logs:      logs,
	}
}
