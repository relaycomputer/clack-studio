package main

import (
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"

	"clack-studio/pkg/emulator"
	"clack-studio/pkg/flasher"

	"clack-basic/pkg/assembler"
	"clack-basic/pkg/codegen"
	"clack-basic/pkg/decompiler"
	"clack-basic/pkg/emitter"
	"clack-basic/pkg/lexer"
	"clack-basic/pkg/parser"
)

//go:embed frontend/dist/*
var webFS embed.FS

type Server struct {
	machine *emulator.Machine
}

func openBrowser(url string) {
	time.Sleep(300 * time.Millisecond) // Give server a moment to bind
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

func main() {
	port := flag.Int("port", 8080, "HTTP server port")
	loadPath := flag.String("load", "", "Optional path to daten[...] file to load at startup")
	autoOpen := flag.Bool("open", true, "Open default browser automatically on startup")
	flag.Parse()

	m := emulator.NewMachine()
	if *loadPath != "" {
		content, err := os.ReadFile(*loadPath)
		if err != nil {
			log.Printf("Warning: Failed to load startup file %s: %v", *loadPath, err)
		} else {
			count, _ := m.LoadProgram(string(content))
			log.Printf("Loaded %d memory entries from %s", count, *loadPath)
		}
	}

	srv := &Server{machine: m}

	mux := http.NewServeMux()

	// API Endpoints
	mux.HandleFunc("/api/state", srv.handleState)
	mux.HandleFunc("/api/load", srv.handleLoad)
	mux.HandleFunc("/api/compile", srv.handleCompile)
	mux.HandleFunc("/api/compile-and-load", srv.handleCompileAndLoad)
	mux.HandleFunc("/api/assemble", srv.handleAssemble)
	mux.HandleFunc("/api/disasm", srv.handleDisasm)
	mux.HandleFunc("/api/decompile", srv.handleDecompile)
	mux.HandleFunc("/api/ports", srv.handlePorts)
	mux.HandleFunc("/api/flash", srv.handleFlash)
	mux.HandleFunc("/api/step", srv.handleStep)
	mux.HandleFunc("/api/run", srv.handleRun)
	mux.HandleFunc("/api/reset", srv.handleReset)

	// Static Web Frontend (Svelte 5 + Vite Build)
	subFS, err := fs.Sub(webFS, "frontend/dist")
	if err != nil {
		log.Fatalf("Failed to initialize web filesystem: %v", err)
	}
	mux.Handle("/", http.FileServer(http.FS(subFS)))

	url := fmt.Sprintf("http://localhost:%d", *port)
	addr := fmt.Sprintf("0.0.0.0:%d", *port)
	fmt.Println("==================================================================")
	fmt.Printf("⚡ CLACK-STUDIO: 16-Bit Relay Computer Simulator & Lab\n")
	fmt.Printf("⚡ Server running on: %s\n", url)
	fmt.Println("==================================================================")

	if *autoOpen {
		go openBrowser(url)
	}

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func (s *Server) handleState(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	state := s.machine.GetState()
	mem := s.machine.GetMemoryDump()
	history := s.machine.GetHistory()

	resp := struct {
		State   emulator.CPUState     `json:"state"`
		Memory  [emulator.MemSize]uint16 `json:"memory"`
		History []emulator.TraceEntry `json:"history"`
	}{
		State:   state,
		Memory:  mem,
		History: history,
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleLoad(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	count, err := s.machine.LoadProgram(req.Source)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"count":   count,
		"state":   s.machine.GetState(),
	})
}

func (s *Server) handleCompile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Source string `json:"source"`
		Format string `json:"format"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	startTime := time.Now()
	l := lexer.NewLexer(req.Source)
	tokens := l.Tokenize()

	p := parser.NewParser(tokens)
	prog, err := p.ParseProgram()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("%v", err),
		})
		return
	}

	cg := codegen.NewCodeGenerator()
	memory, comments, err := cg.Generate(prog)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("Codegen-Fehler: %v", err),
		})
		return
	}

	duration := time.Since(startTime)

	usedWords := 0
	for _, val := range memory {
		if val != 0 {
			usedWords++
		}
	}

	fmtReq := emitter.OutputFormat(req.Format)
	if fmtReq == "" {
		fmtReq = emitter.FormatArduino
	}

	code := emitter.Emit(memory, comments, fmtReq)
	listing := emitter.Emit(memory, comments, emitter.FormatListing)
	arduinoCode := emitter.Emit(memory, comments, emitter.FormatArduino)
	carrayCode := emitter.Emit(memory, comments, emitter.FormatCArray)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":     true,
		"code":        code,
		"arduinoCode": arduinoCode,
		"carrayCode":  carrayCode,
		"listing":     listing,
		"usedWords":   usedWords,
		"totalWords":  codegen.MaxMemorySize,
		"durationMs":  float64(duration.Microseconds()) / 1000.0,
	})
}

func (s *Server) handleCompileAndLoad(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	startTime := time.Now()
	l := lexer.NewLexer(req.Source)
	tokens := l.Tokenize()

	p := parser.NewParser(tokens)
	prog, err := p.ParseProgram()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("%v", err),
		})
		return
	}

	cg := codegen.NewCodeGenerator()
	memory, comments, err := cg.Generate(prog)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("Codegen-Fehler: %v", err),
		})
		return
	}

	duration := time.Since(startTime)

	arduinoCode := emitter.Emit(memory, comments, emitter.FormatArduino)
	carrayCode := emitter.Emit(memory, comments, emitter.FormatCArray)
	listing := emitter.Emit(memory, comments, emitter.FormatListing)

	count, loadErr := s.machine.LoadProgram(arduinoCode)
	if loadErr != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("Load-Fehler: %v", loadErr),
		})
		return
	}

	usedWords := 0
	for _, val := range memory {
		if val != 0 {
			usedWords++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":     true,
		"count":       count,
		"arduinoCode": arduinoCode,
		"carrayCode":  carrayCode,
		"listing":     listing,
		"usedWords":   usedWords,
		"totalWords":  codegen.MaxMemorySize,
		"durationMs":  float64(duration.Microseconds()) / 1000.0,
		"state":       s.machine.GetState(),
		"memory":      s.machine.GetMemoryDump(),
	})
}

func (s *Server) handleStep(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	running := s.machine.Step()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"running": running,
		"state":   s.machine.GetState(),
	})
}

func (s *Server) handleRun(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		MaxSteps int `json:"maxSteps"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	if req.MaxSteps <= 0 {
		req.MaxSteps = 50000
	}

	steps := 0
	running := true
	for steps < req.MaxSteps && running {
		running = s.machine.Step()
		steps++
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"steps":   steps,
		"running": running,
		"state":   s.machine.GetState(),
	})
}

func (s *Server) handleReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.machine.Reset()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"state":   s.machine.GetState(),
	})
}

func (s *Server) handlePorts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ports, err := flasher.ListPorts()
	if err != nil {
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
			"ports":   []flasher.PortInfo{},
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"ports":   ports,
	})
}

func (s *Server) handleFlash(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Port   string `json:"port"`
		Baud   int    `json:"baud"`
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if req.Port == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"message": "Kein serieller Port angegeben.",
		})
		return
	}

	res := flasher.FlashProgram(req.Port, req.Baud, req.Source)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (s *Server) handleAssemble(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	startTime := time.Now()
	asm := assembler.NewAssembler()
	mem, used, err := asm.Assemble(req.Source)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("Assembler-Fehler: %v", err),
		})
		return
	}

	usedWords := 0
	for _, u := range used {
		if u {
			usedWords++
		}
	}

	arduinoCode := asm.FormatArduinoOutput()
	carrayCode := asm.FormatCArrayOutput()
	duration := time.Since(startTime)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":     true,
		"arduinoCode": arduinoCode,
		"carrayCode":  carrayCode,
		"memory":      mem,
		"used":        used,
		"usedWords":   usedWords,
		"totalWords":  codegen.MaxMemorySize,
		"durationMs":  float64(duration.Microseconds()) / 1000.0,
	})
}

func (s *Server) handleDisasm(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	startTime := time.Now()
	decomp := decompiler.NewDecompiler()

	err := decomp.LoadSource(req.Source)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("Disassembler-Fehler: %v", err),
		})
		return
	}

	asmCode, err := decomp.DisassembleToASM()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("Disassembler-Fehler: %v", err),
		})
		return
	}

	duration := time.Since(startTime)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":    true,
		"asmCode":    asmCode,
		"durationMs": float64(duration.Microseconds()) / 1000.0,
	})
}

func (s *Server) handleDecompile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	startTime := time.Now()
	decomp := decompiler.NewDecompiler()

	err := decomp.LoadSource(req.Source)
	if err != nil {
		// Try assembling as ASM first
		asm := assembler.NewAssembler()
		mem, used, asmErr := asm.Assemble(req.Source)
		if asmErr != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"error":   fmt.Sprintf("Dekompilier-Fehler: %v", err),
			})
			return
		}
		decomp.SetMemory(mem, used[:])
	}

	basicCode, err := decomp.Decompile()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("Dekompilier-Fehler: %v", err),
		})
		return
	}

	duration := time.Since(startTime)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":    true,
		"basicCode":  basicCode,
		"durationMs": float64(duration.Microseconds()) / 1000.0,
	})
}

