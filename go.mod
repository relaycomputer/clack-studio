module clack-studio

go 1.25.0

replace clack-basic => ../clack-basic

require (
	clack-basic v0.0.0-00010101000000-000000000000
	go.bug.st/serial v1.8.0
)

require golang.org/x/sys v0.43.0 // indirect
