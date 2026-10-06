package emulator

import (
	"testing"
)

func TestEmulator_10BitAddressWrapAround(t *testing.T) {
	m := NewMachine()
	// Test STAM and LDAM with address > 1023 (e.g. 0x0401 should wrap to 0x0001)
	m.Memory[0] = OpLDA
	m.Memory[1] = 42
	m.Memory[2] = OpSTAM
	m.Memory[3] = 0x0401 // Should wrap to address 1
	m.Memory[4] = OpLDAM
	m.Memory[5] = 0x0801 // Should also read from address 1
	m.Memory[6] = OpNOP

	// Execute LDA #42
	if !m.Step() {
		t.Fatalf("Step 1 failed")
	}
	if m.State.Accu != 42 {
		t.Errorf("Expected Accu=42, got %d", m.State.Accu)
	}

	// Execute STAM [0x0401]
	if !m.Step() {
		t.Fatalf("Step 2 failed")
	}
	if m.Memory[1] != 42 {
		t.Errorf("Expected Memory[1]=42 after wrap-around, got %d", m.Memory[1])
	}

	// Execute LDAM [0x0801]
	m.State.Accu = 0
	if !m.Step() {
		t.Fatalf("Step 3 failed")
	}
	if m.State.Accu != 42 {
		t.Errorf("Expected Accu=42 after LDAM wrap-around, got %d", m.State.Accu)
	}
}

func TestEmulator_CarryOnShifts(t *testing.T) {
	m := NewMachine()
	// Test SHR with LSB=1
	m.Memory[0] = OpLDA
	m.Memory[1] = 0x0005 // binary ...0101
	m.Memory[2] = OpSHR
	m.Memory[3] = 0
	m.Memory[4] = OpSHL
	m.Memory[5] = 0

	m.Step() // LDA
	m.Step() // SHR
	if m.State.Accu != 2 {
		t.Errorf("Expected Accu=2 after SHR, got %d", m.State.Accu)
	}
	if m.State.Carry != 1 {
		t.Errorf("Expected Carry=1 after SHR of 5, got %d", m.State.Carry)
	}

	// Set MSB for SHL
	m.State.Accu = 0x8001
	m.Step() // SHL
	if m.State.Accu != 2 {
		t.Errorf("Expected Accu=2 after SHL, got %d", m.State.Accu)
	}
	if m.State.Carry != 1 {
		t.Errorf("Expected Carry=1 after SHL of 0x8001, got %d", m.State.Carry)
	}
}
