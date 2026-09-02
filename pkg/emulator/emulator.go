package emulator

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

const (
	MemSize       = 1024
	HistoryBuffer = 10000

	// Opcodes
	OpNOP   = 0xF000
	OpLDA   = 0x1400
	OpLDAM  = 0x1800
	OpLDAMM = 0x1C00
	OpSTAM  = 0x2800
	OpSTAMM = 0x2C00
	OpADD   = 0x3440
	OpAND   = 0x3480
	OpOR    = 0x34C0
	OpNOT   = 0x3540
	OpSHR   = 0x3580
	OpSHL   = 0x35C0
	OpBA    = 0x4000
	OpBC    = 0x4008
	OpBN    = 0x4010
	OpBE    = 0x4020
	OpBZ    = 0x4018
	OpCALL  = 0x5000
	OpRET   = 0x6000
)

type CPUState struct {
	PC         uint16 `json:"pc"`
	Accu       uint16 `json:"accu"`
	Stack      uint16 `json:"stack"`
	Carry      uint16 `json:"carry"`
	Zero       bool   `json:"zero"`
	Negative   bool   `json:"negative"`
	Even       bool   `json:"even"`
	IR         uint16 `json:"ir"`
	AddressBus uint16 `json:"addressBus"`
	DataBus    uint16 `json:"dataBus"`
	Read       uint16 `json:"read"`
	Write      uint16 `json:"write"`
	Cycles     uint32 `json:"cycles"`
	Halted     bool   `json:"halted"`
	HaltReason string `json:"haltReason"`
}

type TraceEntry struct {
	Index      int    `json:"idx"`
	Cmd        uint16 `json:"cmd"`
	Mnemonic   string `json:"mnemonic"`
	PC         uint16 `json:"pc"`
	Accu       uint16 `json:"accu"`
	AddressBus uint16 `json:"addr"`
	DataBus    uint16 `json:"data"`
	Read       uint16 `json:"read"`
	Write      uint16 `json:"write"`
	Carry      uint16 `json:"carry"`
	Stack      uint16 `json:"stack"`
	Cycles     uint32 `json:"cycles"`
}

type Machine struct {
	mu           sync.RWMutex
	Memory       [MemSize]uint16
	State        CPUState
	History      []TraceEntry
	LastModified map[uint16]bool
}

func NewMachine() *Machine {
	m := &Machine{
		LastModified: make(map[uint16]bool),
		History:      make([]TraceEntry, 0, HistoryBuffer),
	}
	m.Reset()
	return m
}

func (m *Machine) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.State = CPUState{
		PC:         0,
		Accu:       0,
		Stack:      0,
		Carry:      0,
		Zero:       true,
		Negative:   false,
		Even:       true,
		IR:         0,
		AddressBus: 0,
		DataBus:    0,
		Read:       0,
		Write:      0,
		Cycles:     0,
		Halted:     false,
		HaltReason: "",
	}
	m.History = m.History[:0]
	m.LastModified = make(map[uint16]bool)
}

func (m *Machine) LoadProgram(source string) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Clear memory
	for i := range m.Memory {
		m.Memory[i] = 0
	}

	// Strip block comments /* ... */
	reBlockComment := regexp.MustCompile(`(?s)/\*.*?\*/`)
	cleanSource := reBlockComment.ReplaceAllString(source, "")

	// Pattern for daten[123] = 0x1400; or daten[123] = 118;
	linePattern := regexp.MustCompile(`(?i)daten\[\s*(\d+)\s*\]\s*=\s*(0x[0-9A-Fa-f]+|\d+)\s*;`)

	count := 0
	lines := strings.Split(cleanSource, "\n")
	for _, rawLine := range lines {
		// Strip line comments
		line := rawLine
		if idx := strings.Index(line, "//"); idx >= 0 {
			line = line[:idx]
		}
		if idx := strings.Index(line, ";"); idx >= 0 && !strings.Contains(line, "daten[") {
			line = line[:idx]
		}
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		matches := linePattern.FindStringSubmatch(line)
		if len(matches) == 3 {
			idx64, err := strconv.ParseUint(matches[1], 10, 16)
			if err != nil || idx64 >= MemSize {
				continue
			}

			valStr := matches[2]
			var val64 uint64
			if strings.HasPrefix(strings.ToLower(valStr), "0x") {
				val64, err = strconv.ParseUint(valStr[2:], 16, 16)
			} else {
				val64, err = strconv.ParseUint(valStr, 10, 16)
			}
			if err == nil {
				m.Memory[idx64] = uint16(val64)
				count++
			}
		}
	}

	m.State = CPUState{
		PC:     0,
		Cycles: 0,
		Even:   true,
		Zero:   true,
	}
	m.History = m.History[:0]
	return count, nil
}

func Disassemble(cmd uint16, operand uint16) (string, int) {
	switch cmd {
	case OpNOP:
		return "NOP", 1
	case OpLDA:
		return fmt.Sprintf("LDA #0x%04X (%d)", operand, operand), 2
	case OpLDAM:
		return fmt.Sprintf("LDAM [0x%03X]", operand), 2
	case OpLDAMM:
		return fmt.Sprintf("LDAMM [[0x%03X]]", operand), 2
	case OpSTAM:
		return fmt.Sprintf("STAM [0x%03X]", operand), 2
	case OpSTAMM:
		return fmt.Sprintf("STAMM [[0x%03X]]", operand), 2
	case OpADD:
		return fmt.Sprintf("ADD #0x%04X (%d)", operand, int16(operand)), 2
	case OpAND:
		return fmt.Sprintf("AND #0x%04X", operand), 2
	case OpOR:
		return fmt.Sprintf("OR #0x%04X", operand), 2
	case OpNOT:
		return "NOT A", 2
	case OpSHR:
		return "SHR A", 2
	case OpSHL:
		return "SHL A", 2
	case OpBA:
		return fmt.Sprintf("BA 0x%03X", operand), 2
	case OpBC:
		return fmt.Sprintf("BC 0x%03X", operand), 2
	case OpBN:
		return fmt.Sprintf("BN 0x%03X", operand), 2
	case OpBE:
		return fmt.Sprintf("BE 0x%03X", operand), 2
	case OpBZ:
		return fmt.Sprintf("BZ 0x%03X", operand), 2
	case OpCALL:
		return fmt.Sprintf("CALL 0x%03X", operand), 2
	case OpRET:
		return "RET", 1
	default:
		return fmt.Sprintf("DATA 0x%04X", cmd), 1
	}
}

func (m *Machine) Step() bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.State.Halted || m.State.PC >= MemSize {
		m.State.Halted = true
		if m.State.HaltReason == "" {
			m.State.HaltReason = "PC reached end of memory"
		}
		return false
	}

	pc := m.State.PC
	cmd := m.Memory[pc]
	m.State.IR = cmd

	// Fetch operand if in bounds
	var opVal uint16
	if pc+1 < MemSize {
		opVal = m.Memory[pc+1]
	}

	mnemonic, _ := Disassemble(cmd, opVal)
	entry := TraceEntry{
		Index:      len(m.History) + 1,
		Cmd:        cmd,
		Mnemonic:   mnemonic,
		PC:         pc,
		Accu:       m.State.Accu,
		AddressBus: 0,
		DataBus:    0,
		Read:       0,
		Write:      0,
		Carry:      m.State.Carry,
		Stack:      m.State.Stack,
		Cycles:     m.State.Cycles,
	}

	switch cmd {
	case OpNOP:
		m.State.PC++
		m.State.Cycles += 2

	case OpLDA:
		if pc+1 >= MemSize {
			m.halt("LDA operand out of bounds")
			return false
		}
		m.State.Accu = opVal
		m.State.AddressBus = pc + 1
		m.State.DataBus = opVal
		m.State.Read = opVal
		m.State.PC += 2
		m.State.Cycles += 4

	case OpLDAM:
		if pc+1 >= MemSize || opVal >= MemSize {
			m.halt("LDAM address out of bounds")
			return false
		}
		m.State.Accu = m.Memory[opVal]
		m.State.AddressBus = opVal
		m.State.DataBus = m.State.Accu
		m.State.Read = m.State.Accu
		m.State.PC += 2
		m.State.Cycles += 6

	case OpLDAMM:
		if pc+1 >= MemSize || opVal >= MemSize {
			m.halt("LDAMM 1st address out of bounds")
			return false
		}
		ptr := m.Memory[opVal]
		if ptr >= MemSize {
			m.halt("LDAMM 2nd address out of bounds")
			return false
		}
		m.State.Accu = m.Memory[ptr]
		m.State.AddressBus = ptr
		m.State.DataBus = m.State.Accu
		m.State.Read = m.State.Accu
		m.State.PC += 2
		m.State.Cycles += 8

	case OpSTAM:
		if pc+1 >= MemSize || opVal >= MemSize {
			m.halt("STAM address out of bounds")
			return false
		}
		m.Memory[opVal] = m.State.Accu
		m.LastModified[opVal] = true
		m.State.AddressBus = opVal
		m.State.DataBus = m.State.Accu
		m.State.Write = m.State.Accu
		m.State.PC += 2
		m.State.Cycles += 6

	case OpSTAMM:
		if pc+1 >= MemSize || opVal >= MemSize {
			m.halt("STAMM 1st address out of bounds")
			return false
		}
		ptr := m.Memory[opVal]
		if ptr >= MemSize {
			m.halt("STAMM 2nd address out of bounds")
			return false
		}
		m.Memory[ptr] = m.State.Accu
		m.LastModified[ptr] = true
		m.State.AddressBus = ptr
		m.State.DataBus = m.State.Accu
		m.State.Write = m.State.Accu
		m.State.PC += 2
		m.State.Cycles += 8

	case OpADD:
		if pc+1 >= MemSize {
			m.halt("ADD operand out of bounds")
			return false
		}
		res := uint32(m.State.Accu) + uint32(opVal)
		if res > 0xFFFF {
			m.State.Carry = 1
		} else {
			m.State.Carry = 0
		}
		m.State.Accu = uint16(res & 0xFFFF)
		m.State.AddressBus = pc + 1
		m.State.DataBus = opVal
		m.State.Read = opVal
		m.State.PC += 2
		m.State.Cycles += 4

	case OpAND:
		if pc+1 >= MemSize {
			m.halt("AND operand out of bounds")
			return false
		}
		m.State.Carry = 0
		m.State.Accu = m.State.Accu & opVal
		m.State.AddressBus = pc + 1
		m.State.DataBus = opVal
		m.State.Read = opVal
		m.State.PC += 2
		m.State.Cycles += 4

	case OpOR:
		if pc+1 >= MemSize {
			m.halt("OR operand out of bounds")
			return false
		}
		m.State.Carry = 0
		m.State.Accu = m.State.Accu | opVal
		m.State.AddressBus = pc + 1
		m.State.DataBus = opVal
		m.State.Read = opVal
		m.State.PC += 2
		m.State.Cycles += 4

	case OpNOT:
		m.State.Carry = 0
		m.State.Accu = ^m.State.Accu
		m.State.PC += 2
		m.State.Cycles += 4

	case OpSHR:
		m.State.Carry = 0
		m.State.Accu = m.State.Accu >> 1
		m.State.PC += 2
		m.State.Cycles += 4

	case OpSHL:
		m.State.Carry = 0
		m.State.Accu = (m.State.Accu << 1) & 0xFFFF
		m.State.PC += 2
		m.State.Cycles += 4

	case OpBA:
		m.State.PC = opVal
		m.State.Cycles += 4

	case OpBC:
		if m.State.Carry == 1 {
			m.State.PC = opVal
		} else {
			m.State.PC += 2
		}
		m.State.Cycles += 4

	case OpBN:
		if (m.State.Accu & 0x8000) != 0 {
			m.State.PC = opVal
		} else {
			m.State.PC += 2
		}
		m.State.Cycles += 4

	case OpBE:
		if (m.State.Accu & 0x0001) == 0 {
			m.State.PC = opVal
		} else {
			m.State.PC += 2
		}
		m.State.Cycles += 4

	case OpBZ:
		if m.State.Accu == 0 {
			m.State.PC = opVal
		} else {
			m.State.PC += 2
		}
		m.State.Cycles += 4

	case OpCALL:
		m.State.Stack = pc + 2
		m.State.PC = opVal
		m.State.Cycles += 4

	case OpRET:
		m.State.PC = m.State.Stack
		m.State.Cycles += 5

	default:
		m.halt(fmt.Sprintf("Halt / Unknown Opcode 0x%04X at PC:0x%03X", cmd, pc))
		return false
	}

	// Update flags derived continuously from Accu
	m.State.Zero = (m.State.Accu == 0)
	m.State.Negative = ((m.State.Accu & 0x8000) != 0)
	m.State.Even = ((m.State.Accu & 0x0001) == 0)

	// Record trace
	entry.AddressBus = m.State.AddressBus
	entry.DataBus = m.State.DataBus
	entry.Read = m.State.Read
	entry.Write = m.State.Write
	entry.Accu = m.State.Accu
	entry.Carry = m.State.Carry

	if len(m.History) < HistoryBuffer {
		m.History = append(m.History, entry)
	}

	return true
}

func (m *Machine) halt(reason string) {
	m.State.Halted = true
	m.State.HaltReason = reason
}

func (m *Machine) GetMemoryDump() [MemSize]uint16 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.Memory
}

func (m *Machine) GetState() CPUState {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.State
}

func (m *Machine) GetHistory() []TraceEntry {
	m.mu.RLock()
	defer m.mu.RUnlock()
	copied := make([]TraceEntry, len(m.History))
	copy(copied, m.History)
	return copied
}
