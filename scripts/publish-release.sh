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

# Copy to local bin/ permanently as well
mkdir -p bin
cp /tmp/clack-build/clack-studio bin/
cp /tmp/clack-build/clack-studio.exe bin/
cp /tmp/clack-build/clack-studio-darwin-arm64 bin/

echo "==> 3. Creating/Fetching Release $TAG on Forgejo..."
RESP=$(curl -4 -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tag_name\": \"$TAG\", \"name\": \"$TITLE\", \"body\": \"Automated release build for $TAG with Linux, Windows x64 and macOS ARM64 (Apple Silicon) binaries.\", \"draft\": false}" \
  "$API_URL/releases")

REL_ID=$(echo "$RESP" | jq -r .id 2>/dev/null || echo "null")
if [ "$REL_ID" = "null" ] || [ -z "$REL_ID" ]; then
  echo "Release might already exist, fetching existing ID for tag $TAG..."
  REL_ID=$(curl -4 -s -H "Authorization: token $TOKEN" "$API_URL/releases/tags/$TAG" | jq -r .id)
fi

echo "==> Release ID: $REL_ID"

echo "==> 4. Uploading Assets..."
curl -4 -s -X POST -H "Authorization: token $TOKEN" \
  -F "attachment=@/tmp/clack-build/clack-studio.exe;filename=clack-studio.exe" \
  "$API_URL/releases/$REL_ID/assets?name=clack-studio.exe" >/dev/null

curl -4 -s -X POST -H "Authorization: token $TOKEN" \
  -F "attachment=@/tmp/clack-build/clack-studio;filename=clack-studio" \
  "$API_URL/releases/$REL_ID/assets?name=clack-studio" >/dev/null

curl -4 -s -X POST -H "Authorization: token $TOKEN" \
  -F "attachment=@/tmp/clack-build/clack-studio-darwin-arm64;filename=clack-studio-darwin-arm64" \
  "$API_URL/releases/$REL_ID/assets?name=clack-studio-darwin-arm64" >/dev/null

rm -rf /tmp/clack-build
echo "==> ✅ SUCCESS! Release $TAG is live on Forgejo with Linux, Windows and macOS ARM64 binaries attached."
