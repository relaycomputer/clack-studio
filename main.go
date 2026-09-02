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

	"clack-studio/pkg/emulator"
)

//go:embed web/*
var webFS embed.FS

type Server struct {
	machine *emulator.Machine
}

func main() {
	port := flag.Int("port", 8080, "HTTP server port")
	loadPath := flag.String("load", "", "Optional path to daten[...] file to load at startup")
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
	mux.HandleFunc("/api/step", srv.handleStep)
	mux.HandleFunc("/api/run", srv.handleRun)
	mux.HandleFunc("/api/reset", srv.handleReset)

	// Static Web Frontend
	subFS, err := fs.Sub(webFS, "web")
	if err != nil {
		log.Fatalf("Failed to initialize web filesystem: %v", err)
	}
	mux.Handle("/", http.FileServer(http.FS(subFS)))

	addr := fmt.Sprintf("0.0.0.0:%d", *port)
	fmt.Println("==================================================================")
	fmt.Printf("⚡ CLACK-STUDIO: 16-Bit Relay Computer Simulator & Lab\n")
	fmt.Printf("⚡ Server running on: http://localhost:%d\n", *port)
	fmt.Println("==================================================================")

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
