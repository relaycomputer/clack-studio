#!/usr/bin/env bash
set -Eeuo pipefail

PROJECTS="$HOME/Projects"
BASIC="$PROJECTS/clack-basic"
STUDIO="$PROJECTS/clack-studio"

step() { printf '\n==> %s\n' "$*"; }

for dir in "$BASIC" "$STUDIO"; do
  if [[ ! -d "$dir/.git" ]]; then
    printf 'Fehler: Kein Git-Repository: %s\n' "$dir" >&2
    exit 1
  fi
done

step 'clack-basic aktualisieren'
git -C "$BASIC" pull --ff-only

step 'clack-basic bauen'
cd "$BASIC"
make clean
make

step 'clack-studio aktualisieren'
git -C "$STUDIO" pull --ff-only

step 'Node.js 22 aktivieren'
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # nvm ist eine Shell-Funktion und muss im Skript geladen werden.
  . "$NVM_DIR/nvm.sh"
else
  echo 'Fehler: nvm wurde nicht gefunden.' >&2
  exit 1
fi
nvm use 22

step 'Frontend-Abhaengigkeiten installieren und Frontend bauen'
cd "$STUDIO/frontend"
npm ci
npm run build

step 'Go-Abhaengigkeiten laden und Clack Studio bauen'
cd "$STUDIO"
go mod download
# Erst temporär bauen, damit die vorhandene Binary bei einem Build-Fehler erhalten bleibt.
output="$(mktemp "$STUDIO/.clack-studio-build.XXXXXXXX")"
trap 'rm -f "$output"' EXIT
go build -o "$output" .
chmod +x "$output"
mv -f "$output" "$STUDIO/clack-studio"
trap - EXIT

step 'Fertig!'
printf 'Starten mit: %s/clack-studio\n' "$STUDIO"
