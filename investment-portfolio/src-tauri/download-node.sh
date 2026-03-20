#!/bin/bash

# Download and setup Node.js runtime for bundling into desktop app
# Supports: linux-x64, darwin-x64, darwin-arm64

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="$PROJECT_ROOT/src-tauri/setup-helpers"
RESOURCES_DIR="$PROJECT_ROOT/src-tauri/resources"

mkdir -p "$SCRIPT_DIR"
mkdir -p "$RESOURCES_DIR/node"

NODE_VERSION="18.19.0"
BASE_URL="https://nodejs.org/dist/v${NODE_VERSION}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Node.js Bundle Setup${NC}"
echo -e "${BLUE}========================================${NC}"

# Detect system
OS=$(uname -s)
ARCH=$(uname -m)

case "$OS" in
  Linux)
    case "$ARCH" in
      x86_64) NODE_ARCH="x64"; NODE_FILE="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" ;;
      aarch64) NODE_ARCH="arm64"; NODE_FILE="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" ;;
      *) echo -e "${RED}✗ Unsupported Linux architecture: $ARCH${NC}"; exit 1 ;;
    esac
    ;;
  Darwin)
    case "$ARCH" in
      x86_64) NODE_ARCH="x64"; NODE_FILE="node-v${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz" ;;
      arm64) NODE_ARCH="arm64"; NODE_FILE="node-v${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz" ;;
      *) echo -e "${RED}✗ Unsupported macOS architecture: $ARCH${NC}"; exit 1 ;;
    esac
    ;;
  MSYS*|MINGW*|CYGWIN*)
    echo -e "${YELLOW}Windows detected - Node.exe must be downloaded separately${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}✗ Unsupported OS: $OS${NC}"
    exit 1
    ;;
esac

echo -e "\n${YELLOW}Detected: $OS $ARCH${NC}"
echo -e "${YELLOW}Archive: $NODE_FILE${NC}"

# Check if already downloaded
NODE_ARCHIVE="$RESOURCES_DIR/node/$NODE_FILE"
if [ -f "$NODE_ARCHIVE" ]; then
    echo -e "${GREEN}✓ Archive already exists${NC}"
else
    echo -e "\n${YELLOW}Downloading Node.js v${NODE_VERSION}...${NC}"
    mkdir -p "$RESOURCES_DIR/node"
    
    if ! curl -L "$BASE_URL/$NODE_FILE" -o "$NODE_ARCHIVE" --progress-bar; then
        echo -e "${RED}✗ Failed to download Node.js${NC}"
        rm -f "$NODE_ARCHIVE"
        exit 1
    fi
    echo -e "${GREEN}✓ Downloaded${NC}"
fi

# Extract
echo -e "\n${YELLOW}Extracting Node.js...${NC}"
cd "$RESOURCES_DIR/node"

if [[ $NODE_FILE == *.tar.xz ]]; then
    tar xf "$NODE_FILE"
elif [[ $NODE_FILE == *.tar.gz ]]; then
    tar xzf "$NODE_FILE"
fi

# Move binaries to a consistent location
NODE_DIR="node-v${NODE_VERSION}-${OS,,}-${NODE_ARCH}"
if [ -d "$NODE_DIR" ]; then
    # Copy node binary to consistent location
    mkdir -p "bin"
    if [ "$OS" = "Darwin" ]; then
        cp "$NODE_DIR/bin/node" "bin/node"
        cp "$NODE_DIR/bin/npm" "bin/npm" 2>/dev/null || true
    else
        cp "$NODE_DIR/bin/node" "bin/node"
        cp "$NODE_DIR/bin/npm" "bin/npm" 2>/dev/null || true
    fi
    chmod +x "bin/node"
    chmod +x "bin/npm" 2>/dev/null || true
    echo -e "${GREEN}✓ Extracted to bin/${NC}"
    
    # Clean up extracted dir to save space
    rm -rf "$NODE_DIR"
else
    echo -e "${RED}✗ Extraction failed${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"
echo -e "\n${GREEN}✓ Node.js v${NODE_VERSION} ready for bundling${NC}"
echo -e "${YELLOW}Location: $RESOURCES_DIR/node/bin/node${NC}"
