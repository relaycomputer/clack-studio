package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"time"

	"clack-studio/pkg/emulator"
	"clack-studio/pkg/flasher"
	"clack-studio/pkg/queue"

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
	machine       *emulator.Machine
	queue         *queue.CompilerQueue
	lastHeartbeat int64
	hasConnected  bool
	mu            sync.Mutex
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
	host := flag.String("host", "127.0.0.1", "HTTP server host address (use 0.0.0.0 for LAN access)")
	port := flag.Int("port", 8080, "HTTP server port")
	loadPath := flag.String("load", "", "Optional path to daten[...] file to load at startup")
	autoOpen := flag.Bool("open", true, "Open default browser automatically on startup")
	autoExit := flag.Bool("auto-exit", true, "Automatically exit when all browser tabs are closed")
	queueWorkers := flag.Int("queue-workers", 2, "Number of concurrent compiler worker threads")
	queueBuffer := flag.Int("queue-buffer", 50, "Max buffer size for pending compilation requests")
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

	compilerQueue := queue.NewCompilerQueue(*queueWorkers, *queueBuffer, processJob)

	srv := &Server{
		machine:       m,
		queue:         compilerQueue,
		lastHeartbeat: time.Now().Unix(),
	}

	mux := http.NewServeMux()

	// System & Process Control Endpoints
	mux.HandleFunc("/api/info", srv.handleInfo)
	mux.HandleFunc("/api/keepalive", srv.handleKeepAlive)
	mux.HandleFunc("/api/leave", srv.handleLeave)
	mux.HandleFunc("/api/shutdown", srv.handleShutdown)
	mux.HandleFunc("/api/queue/stats", srv.handleQueueStats)

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

	url := fmt.Sprintf("http://%s:%d", *host, *port)
	if *host == "0.0.0.0" {
		url = fmt.Sprintf("http://localhost:%d", *port)
	}
	addr := fmt.Sprintf("%s:%d", *host, *port)
	fmt.Println("==================================================================")
	fmt.Printf("⚡ CLACK-STUDIO (v2.5.7): 16-Bit Relay Computer Simulator & Lab\n")
	fmt.Printf("⚡ Server running on: %s (Bind: %s)\n", url, addr)
	fmt.Printf("⚡ Compiler Queue: %d Workers (Max Buffer: %d)\n", *queueWorkers, *queueBuffer)
	if *autoExit {
		fmt.Printf("⚡ Auto-Exit: Aktiv (beendet Prozess automatisch bei Tab-Schließen)\n")
	}
	fmt.Println("==================================================================")

	if *autoExit {
		go func() {
			// Initial grace period of 25 seconds for the browser to open and load
			time.Sleep(25 * time.Second)
			ticker := time.NewTicker(2 * time.Second)
			defer ticker.Stop()
			for range ticker.C {
				srv.mu.Lock()
				connected := srv.hasConnected
				last := srv.lastHeartbeat
				srv.mu.Unlock()

				if connected {
					diff := time.Now().Unix() - last
					if diff >= 8 { // 8 seconds without heartbeat from browser tab
						fmt.Println("\n⚡ Kein aktiver Browser-Tab mehr verbunden (Timeout 8s). Clack-Studio beendet sich automatisch.")
						srv.queue.Close()
						os.Exit(0)
					}
				}
			}
		}()
	}

	if *autoOpen {
		go openBrowser(url)
	}

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// -------------------------------------------------------------
// Queue Job Processor
// -------------------------------------------------------------

type CompileJobPayload struct {
	Source string
	Format string
}

type CompileJobResult struct {
	Success     bool
	Error       string
	Code        string
	ArduinoCode string
	CarrayCode  string
	Listing     string
	UsedWords   int
	TotalWords  int
	DurationMs  float64
}

type AssembleJobPayload struct {
	Source string
}

type AssembleJobResult struct {
	Success     bool
	Error       string
	ArduinoCode string
	CarrayCode  string
	Memory      [codegen.MaxMemorySize]uint16
	Used        [codegen.MaxMemorySize]bool
	UsedWords   int
	TotalWords  int
	DurationMs  float64
}

type DecompileJobPayload struct {
	Source string
}

type DecompileJobResult struct {
	Success    bool
	Error      string
	BasicCode  string
	DurationMs float64
}

type DisasmJobPayload struct {
	Source string
}

type DisasmJobResult struct {
	Success    bool
	Error      string
	AsmCode    string
	DurationMs float64
}

func processJob(ctx context.Context, job *queue.Job) {
	start := time.Now()
	switch job.Type {
	case "compile":
		p := job.Payload.(CompileJobPayload)
		l := lexer.NewLexer(p.Source)
		tokens := l.Tokenize()
		parserObj := parser.NewParser(tokens)
		prog, err := parserObj.ParseProgram()
		if err != nil {
			job.Result = CompileJobResult{Success: false, Error: fmt.Sprintf("%v", err), DurationMs: float64(time.Since(start).Microseconds()) / 1000.0}
			return
		}
		cg := codegen.NewCodeGenerator()
		memory, comments, err := cg.Generate(prog)
		if err != nil {
			job.Result = CompileJobResult{Success: false, Error: fmt.Sprintf("Codegen-Fehler: %v", err), DurationMs: float64(time.Since(start).Microseconds()) / 1000.0}
			return
		}

		usedWords := 0
		for _, val := range memory {
			if val != 0 {
				usedWords++
			}
		}

		fmtReq := emitter.OutputFormat(p.Format)
		if fmtReq == "" {
			fmtReq = emitter.FormatArduino
		}

		code := emitter.Emit(memory, comments, fmtReq)
		listing := emitter.Emit(memory, comments, emitter.FormatListing)
		arduinoCode := emitter.Emit(memory, comments, emitter.FormatArduino)
		carrayCode := emitter.Emit(memory, comments, emitter.FormatCArray)

		job.Result = CompileJobResult{
			Success:     true,
			Code:        code,
			ArduinoCode: arduinoCode,
			CarrayCode:  carrayCode,
			Listing:     listing,
			UsedWords:   usedWords,
			TotalWords:  codegen.MaxMemorySize,
			DurationMs:  float64(time.Since(start).Microseconds()) / 1000.0,
		}

	case "assemble":
		p := job.Payload.(AssembleJobPayload)
		asm := assembler.NewAssembler()
		mem, used, err := asm.Assemble(p.Source)
		if err != nil {
			job.Result = AssembleJobResult{Success: false, Error: fmt.Sprintf("Assembler-Fehler: %v", err), DurationMs: float64(time.Since(start).Microseconds()) / 1000.0}
			return
		}
		usedWords := 0
		for _, u := range used {
			if u {
				usedWords++
			}
		}
		job.Result = AssembleJobResult{
			Success:     true,
			ArduinoCode: asm.FormatArduinoOutput(),
			CarrayCode:  asm.FormatCArrayOutput(),
			Memory:      mem,
			Used:        used,
			UsedWords:   usedWords,
			TotalWords:  codegen.MaxMemorySize,
			DurationMs:  float64(time.Since(start).Microseconds()) / 1000.0,
		}

	case "decompile":
		p := job.Payload.(DecompileJobPayload)
		decomp := decompiler.NewDecompiler()
		err := decomp.LoadSource(p.Source)
		if err != nil {
			asm := assembler.NewAssembler()
			mem, used, asmErr := asm.Assemble(p.Source)
			if asmErr != nil {
				job.Result = DecompileJobResult{Success: false, Error: fmt.Sprintf("Dekompilier-Fehler: %v", err), DurationMs: float64(time.Since(start).Microseconds()) / 1000.0}
				return
			}
			decomp.SetMemory(mem, used[:])
		}
		basicCode, err := decomp.Decompile()
		if err != nil {
			job.Result = DecompileJobResult{Success: false, Error: fmt.Sprintf("Dekompilier-Fehler: %v", err), DurationMs: float64(time.Since(start).Microseconds()) / 1000.0}
			return
		}
		job.Result = DecompileJobResult{
			Success:    true,
			BasicCode:  basicCode,
			DurationMs: float64(time.Since(start).Microseconds()) / 1000.0,
		}

	case "disasm":
		p := job.Payload.(DisasmJobPayload)
		decomp := decompiler.NewDecompiler()
		err := decomp.LoadSource(p.Source)
		if err != nil {
			job.Result = DisasmJobResult{Success: false, Error: fmt.Sprintf("Disassembler-Fehler: %v", err), DurationMs: float64(time.Since(start).Microseconds()) / 1000.0}
			return
		}
		asmCode, err := decomp.DisassembleToASM()
		if err != nil {
			job.Result = DisasmJobResult{Success: false, Error: fmt.Sprintf("Disassembler-Fehler: %v", err), DurationMs: float64(time.Since(start).Microseconds()) / 1000.0}
			return
		}
		job.Result = DisasmJobResult{
			Success:    true,
			AsmCode:    asmCode,
			DurationMs: float64(time.Since(start).Microseconds()) / 1000.0,
		}

	default:
		job.Err = fmt.Errorf("unknown job type: %s", job.Type)
	}
}

// -------------------------------------------------------------
// HTTP Handlers
// -------------------------------------------------------------

func (s *Server) handleQueueStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	stats := s.queue.GetStats()
	json.NewEncoder(w).Encode(stats)
}

func (s *Server) handleState(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	state := s.machine.GetState()
	mem := s.machine.GetMemoryDump()
	history := s.machine.GetHistory()

	resp := struct {
		State   emulator.CPUState        `json:"state"`
		Memory  [emulator.MemSize]uint16 `json:"memory"`
		History []emulator.TraceEntry    `json:"history"`
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

	r.Body = http.MaxBytesReader(w, r.Body, 4<<20) // 4 MiB limit
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

	r.Body = http.MaxBytesReader(w, r.Body, 4<<20) // 4 MiB limit
	var req struct {
		Source string `json:"source"`
		Format string `json:"format"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	job, err := s.queue.Submit(r.Context(), "compile", CompileJobPayload{
		Source: req.Source,
		Format: req.Format,
	}, 10*time.Second)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if errors.Is(err, queue.ErrQueueFull) {
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"error":   "Compiler-Warteschlange ist ausgelastet. Bitte versuche es in wenigen Augenblicken erneut.",
			})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	res := job.Result.(CompileJobResult)
	w.Header().Set("Content-Type", "application/json")
	queueWaitMs := float64(job.StartedAt.Sub(job.EnqueuedAt).Milliseconds())

	json.NewEncoder(w).Encode(map[string]any{
		"success":     res.Success,
		"error":       res.Error,
		"code":        res.Code,
		"arduinoCode": res.ArduinoCode,
		"carrayCode":  res.CarrayCode,
		"listing":     res.Listing,
		"usedWords":   res.UsedWords,
		"totalWords":  res.TotalWords,
		"durationMs":  res.DurationMs,
		"queueWaitMs": queueWaitMs,
	})
}

func (s *Server) handleCompileAndLoad(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 4<<20) // 4 MiB limit
	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	job, err := s.queue.Submit(r.Context(), "compile", CompileJobPayload{
		Source: req.Source,
		Format: string(emitter.FormatArduino),
	}, 10*time.Second)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if errors.Is(err, queue.ErrQueueFull) {
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"error":   "Compiler-Warteschlange ist ausgelastet. Bitte kurz warten.",
			})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	res := job.Result.(CompileJobResult)
	if !res.Success {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   res.Error,
		})
		return
	}

	count, loadErr := s.machine.LoadProgram(res.ArduinoCode)
	if loadErr != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   fmt.Sprintf("Load-Fehler: %v", loadErr),
		})
		return
	}

	queueWaitMs := float64(job.StartedAt.Sub(job.EnqueuedAt).Milliseconds())
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":     true,
		"count":       count,
		"arduinoCode": res.ArduinoCode,
		"carrayCode":  res.CarrayCode,
		"listing":     res.Listing,
		"usedWords":   res.UsedWords,
		"totalWords":  res.TotalWords,
		"durationMs":  res.DurationMs,
		"queueWaitMs": queueWaitMs,
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

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MiB limit
	var req struct {
		MaxSteps int `json:"maxSteps"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	const maxAllowedSteps = 1_000_000
	if req.MaxSteps <= 0 {
		req.MaxSteps = 50000
	} else if req.MaxSteps > maxAllowedSteps {
		req.MaxSteps = maxAllowedSteps
	}

	ctx := r.Context()
	steps := 0
	running := true
	for steps < req.MaxSteps && running {
		select {
		case <-ctx.Done():
			running = false
		default:
			running = s.machine.Step()
			steps++
		}
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

	r.Body = http.MaxBytesReader(w, r.Body, 4<<20) // 4 MiB limit
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

	r.Body = http.MaxBytesReader(w, r.Body, 4<<20) // 4 MiB limit
	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	job, err := s.queue.Submit(r.Context(), "assemble", AssembleJobPayload{
		Source: req.Source,
	}, 10*time.Second)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if errors.Is(err, queue.ErrQueueFull) {
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"error":   "Compiler-Warteschlange ist ausgelastet. Bitte kurz warten.",
			})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	res := job.Result.(AssembleJobResult)
	queueWaitMs := float64(job.StartedAt.Sub(job.EnqueuedAt).Milliseconds())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":     res.Success,
		"error":       res.Error,
		"arduinoCode": res.ArduinoCode,
		"carrayCode":  res.CarrayCode,
		"memory":      res.Memory,
		"used":        res.Used,
		"usedWords":   res.UsedWords,
		"totalWords":  res.TotalWords,
		"durationMs":  res.DurationMs,
		"queueWaitMs": queueWaitMs,
	})
}

func (s *Server) handleDisasm(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 4<<20) // 4 MiB limit
	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	job, err := s.queue.Submit(r.Context(), "disasm", DisasmJobPayload{
		Source: req.Source,
	}, 10*time.Second)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	res := job.Result.(DisasmJobResult)
	queueWaitMs := float64(job.StartedAt.Sub(job.EnqueuedAt).Milliseconds())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":     res.Success,
		"error":       res.Error,
		"asmCode":     res.AsmCode,
		"durationMs":  res.DurationMs,
		"queueWaitMs": queueWaitMs,
	})
}

func (s *Server) handleDecompile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 4<<20) // 4 MiB limit
	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	job, err := s.queue.Submit(r.Context(), "decompile", DecompileJobPayload{
		Source: req.Source,
	}, 10*time.Second)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	res := job.Result.(DecompileJobResult)
	queueWaitMs := float64(job.StartedAt.Sub(job.EnqueuedAt).Milliseconds())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":     res.Success,
		"error":       res.Error,
		"basicCode":   res.BasicCode,
		"durationMs":  res.DurationMs,
		"queueWaitMs": queueWaitMs,
	})
}

func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"standalone": true,
		"version":    "2.5.7",
		"os":         runtime.GOOS,
		"arch":       runtime.GOARCH,
		"pid":        os.Getpid(),
	})
}

func (s *Server) handleKeepAlive(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	s.lastHeartbeat = time.Now().Unix()
	s.hasConnected = true
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"ok": true,
	})
}

func (s *Server) handleLeave(w http.ResponseWriter, r *http.Request) {
	// A browser tab reported that it is unloading
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"ok": true,
	})
}

func (s *Server) handleShutdown(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Clack-Studio Server wird beendet...",
	})

	log.Println("🛑 Beenden angefordert durch Web-Frontend. Clack-Studio schließt...")
	go func() {
		time.Sleep(200 * time.Millisecond)
		s.queue.Close()
		os.Exit(0)
	}()
}
