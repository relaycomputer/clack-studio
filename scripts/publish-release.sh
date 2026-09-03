#!/bin/bash
set -e

TAG="$1"
if [ -z "$TAG" ]; then
  echo "Usage: ./scripts/publish-release.sh <vX.Y.Z> [Release Title]"
  exit 1
fi
TITLE="${2:-Release $TAG}"
TOKEN="${FORGEJO_TOKEN:-41a3c242c766575b10db98047bf3acd9106958b9}"
API_URL="https://forge.scrapheap.eu/api/v1/repos/relay-computing/clack-studio"

echo "==> 1. Building Frontend..."
cd frontend && npm run build && cd ..

echo "==> 2. Compiling Linux, Windows & macOS ARM64 Binaries..."
mkdir -p /tmp/clack-build
go build -o /tmp/clack-build/clack-studio .
GOOS=windows GOARCH=amd64 go build -o /tmp/clack-build/clack-studio.exe .
GOOS=darwin GOARCH=arm64 go build -o /tmp/clack-build/clack-studio-darwin-arm64 .

echo "==> 3. Creating Release $TAG on Forgejo..."
RESP=$(curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tag_name\": \"$TAG\", \"name\": \"$TITLE\", \"body\": \"Automated release build for $TAG with Linux, Windows x64 and macOS ARM64 (Apple Silicon) binaries.\", \"draft\": false}" \
  "$API_URL/releases")

REL_ID=$(echo "$RESP" | jq -r .id)
echo "==> Release created with ID: $REL_ID"

echo "==> 4. Uploading Assets..."
curl -s -X POST -H "Authorization: token $TOKEN" \
  -F "attachment=@/tmp/clack-build/clack-studio.exe;filename=clack-studio.exe" \
  "$API_URL/releases/$REL_ID/assets?name=clack-studio.exe" >/dev/null

curl -s -X POST -H "Authorization: token $TOKEN" \
  -F "attachment=@/tmp/clack-build/clack-studio;filename=clack-studio" \
  "$API_URL/releases/$REL_ID/assets?name=clack-studio" >/dev/null

curl -s -X POST -H "Authorization: token $TOKEN" \
  -F "attachment=@/tmp/clack-build/clack-studio-darwin-arm64;filename=clack-studio-darwin-arm64" \
  "$API_URL/releases/$REL_ID/assets?name=clack-studio-darwin-arm64" >/dev/null

rm -rf /tmp/clack-build
echo "==> ✅ SUCCESS! Release $TAG is live on Forgejo with Linux, Windows and macOS ARM64 binaries attached."
