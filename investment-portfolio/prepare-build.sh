#!/bin/bash

# Prepare desktop app build - ensures all directories and dependencies are in place

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Desktop App - Build Preparation${NC}"
echo -e "${BLUE}========================================${NC}"

# Create resources directory structure
echo -e "\n${YELLOW}Creating Tauri resources directory...${NC}"
mkdir -p "$PROJECT_ROOT/src-tauri/resources/server"
mkdir -p "$PROJECT_ROOT/src-tauri/resources/node_modules"
echo -e "${GREEN}✓ Directories created${NC}"

# Check if .env exists in server
if [ ! -f "$PROJECT_ROOT/server/.env" ]; then
    echo -e "\n${YELLOW}Creating .env for server...${NC}"
    cat > "$PROJECT_ROOT/server/.env" << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=file:./investment_portfolio.db
CORS_ORIGIN=http://localhost:1420
JWT_SECRET=dev-secret-key-change-in-production
EOF
    echo -e "${GREEN}✓ .env created${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

# Check Prisma schema
if [ ! -f "$PROJECT_ROOT/server/prisma/schema.prisma" ]; then
    echo -e "${RED}✗ Prisma schema not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma schema OK${NC}"

# Set up Node.js runtime
echo -e "\n${YELLOW}Setting up Node.js runtime...${NC}"
if [ -f "$PROJECT_ROOT/src-tauri/setup-node-runtime.sh" ]; then
    chmod +x "$PROJECT_ROOT/src-tauri/setup-node-runtime.sh"
    # Try to run it (may download Node.js)
    "$PROJECT_ROOT/src-tauri/setup-node-runtime.sh" || echo -e "${YELLOW}⚠ Node.js setup incomplete (will be done during build)${NC}"
else
    echo -e "${YELLOW}⚠ setup-node-runtime.sh not found${NC}"
fi

# Make build scripts executable
echo -e "\n${YELLOW}Making build scripts executable...${NC}"
chmod +x "$PROJECT_ROOT/build-production.sh" 2>/dev/null || true
echo -e "${GREEN}✓ Build scripts ready${NC}"

# Check Rust setup
echo -e "\n${YELLOW}Checking Rust/Cargo setup...${NC}"
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}✗ Cargo not found. Please install Rust:${NC}"
    echo -e "  ${YELLOW}https://rustup.rs/${NC}"
    exit 1
fi
RUST_VERSION=$(rustc --version)
echo -e "${GREEN}✓ $RUST_VERSION${NC}"

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Preparation Complete${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Review the build script: ${GREEN}./build-production.sh${NC}"
echo -e "  2. Build the application: ${GREEN}chmod +x build-production.sh && ./build-production.sh${NC}"
echo -e ""
echo -e "${YELLOW}System info:${NC}"
echo -e "  OS: $(uname -s)"
echo -e "  Architecture: $(uname -m)"
echo -e "  Node.js: $(node --version 2>/dev/null || echo 'Not found')"
echo -e "  npm: $(npm --version 2>/dev/null || echo 'Not found')"
echo -e "  Cargo: $RUST_VERSION"

exit 0
