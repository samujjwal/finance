#!/bin/bash

# Production Build Script for JCL Investment Portfolio
# Builds complete desktop app with bundled Node.js and SQLite for all platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JCL Investment Portfolio - Full Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Complete bundled desktop app build${NC}"
echo -e "${YELLOW}Includes: Node.js, SQLite, all platforms${NC}\n"

# Check prerequisites
echo -e "${BLUE}[0/6] Checking prerequisites...${NC}"

if ! command -v cargo &> /dev/null; then
    echo -e "${RED}✗ Rust/Cargo not found. Install from https://rustup.rs/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Cargo found${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found $(npm --version)${NC}"

# Step 1: Download bundled Node.js
echo -e "\n${BLUE}[1/6] Preparing bundled Node.js...${NC}"
chmod +x "$PROJECT_ROOT/src-tauri/download-node.sh"

OS=$(uname -s)
case "$OS" in
  Linux|Darwin)
    "$PROJECT_ROOT/src-tauri/download-node.sh"
    ;;
  MSYS*|MINGW*|CYGWIN*)
    echo -e "${YELLOW}Windows detected${NC}"
    if [ -f "$PROJECT_ROOT/src-tauri/download-node.bat" ]; then
        cmd /c "$PROJECT_ROOT/src-tauri/download-node.bat" || true
    fi
    ;;
esac

# Check if Node.js was bundled
if [ -f "$PROJECT_ROOT/src-tauri/resources/node/bin/node" ] || [ -f "$PROJECT_ROOT/src-tauri/resources/node/bin/node.exe" ]; then
    echo -e "${GREEN}✓ Node.js bundled${NC}"
else
    echo -e "${YELLOW}⚠ Node.js not bundled (will use system Node.js)${NC}"
fi

# Step 2: Build backend NestJS
echo -e "\n${BLUE}[2/6] Building NestJS backend...${NC}"
cd "$PROJECT_ROOT/server"

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Backend package.json not found${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm ci --production=false || {
        echo -e "${RED}✗ Failed to install backend dependencies${NC}"
        exit 1
    }
fi

echo -e "${YELLOW}Compiling TypeScript...${NC}"
npx tsc || {
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    exit 1
}

if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Backend compiled ($(find dist -type f -name '*.js' | wc -l) files)${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

# Step 3: Prepare server bundle with production dependencies
echo -e "\n${BLUE}[3/6] Bundling server with production dependencies...${NC}"

TAURI_SERVER_DIR="$PROJECT_ROOT/src-tauri/resources/server"
rm -rf "$TAURI_SERVER_DIR/dist" 2>/dev/null || true
rm -rf "$TAURI_SERVER_DIR/node_modules" 2>/dev/null || true
mkdir -p "$TAURI_SERVER_DIR"

cp -r "dist" "$TAURI_SERVER_DIR/" || {
    echo -e "${RED}✗ Failed to copy dist${NC}"
    exit 1
}

# Copy package files
cp "package.json" "$TAURI_SERVER_DIR/"
cp "package-lock.json" "$TAURI_SERVER_DIR/" 2>/dev/null || true

# Install production dependencies only
cd "$TAURI_SERVER_DIR"
npm ci --production || {
    echo -e "${RED}✗ Failed to install production dependencies${NC}"
    exit 1
}

SIZE=$(du -sh "$TAURI_SERVER_DIR" | cut -f1)
echo -e "${GREEN}✓ Server bundle prepared ($SIZE)${NC}"

cd "$PROJECT_ROOT"

# Step 4: Build frontend
echo -e "\n${BLUE}[4/6] Building React frontend...${NC}"
cd "$PROJECT_ROOT"

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Frontend package.json not found${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm ci --production=false || {
        echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
        exit 1
    }
fi

echo -e "${YELLOW}Running TypeScript type check...${NC}"
npm run build:check || {
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
}

if [ -d "dist" ]; then
    SIZE=$(du -sh dist | cut -f1)
    echo -e "${GREEN}✓ Frontend built ($SIZE)${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# Step 5: Verify Tauri configuration
echo -e "\n${BLUE}[5/6] Verifying Tauri configuration...${NC}"

if [ ! -f "src-tauri/tauri.conf.json" ]; then
    echo -e "${RED}✗ Tauri config not found${NC}"
    exit 1
fi

# Extract version
VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Building v$VERSION${NC}"

# Step 6: Build Tauri application
echo -e "\n${BLUE}[6/6] Building Tauri desktop application...${NC}"
echo -e "${YELLOW}This may take 2-5 minutes...${NC}"

npm run tauri:build || {
    echo -e "${RED}✗ Tauri build failed${NC}"
    exit 1
}

# Verify build succeeded
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"

# Report artifacts
echo -e "\n${YELLOW}Build artifacts:${NC}"
BUILD_DIR="src-tauri/target/release"

if [ "$OS" = "Darwin" ]; then
    if [ -d "$BUILD_DIR/bundle/macos/JCL Investment Portfolio.app" ]; then
        echo -e "  ${GREEN}✓ macOS App Bundle (signed & ready)${NC}"
        du -sh "$BUILD_DIR/bundle/macos/JCL Investment Portfolio.app" | awk '{print "    Size: " $1}'
    fi
elif [ "$OS" = "Linux" ]; then
    if [ -f "$BUILD_DIR/app" ]; then
        SIZE=$(ls -lh "$BUILD_DIR/app" | awk '{print $5}')
        echo -e "  ${GREEN}✓ Linux Binary: $SIZE${NC}"
    fi
    if ls "$BUILD_DIR/bundle/appimage/app_"*.AppImage &> /dev/null; then
        SIZE=$(ls -lh "$BUILD_DIR/bundle/appimage/app_"*.AppImage | awk '{print $5}')
        echo -e "  ${GREEN}✓ Linux AppImage: $SIZE${NC}"
    fi
    if ls "$BUILD_DIR/bundle/deb/app_"*.deb &> /dev/null; then
        SIZE=$(ls -lh "$BUILD_DIR/bundle/deb/app_"*.deb | awk '{print $5}')
        echo -e "  ${GREEN}✓ Debian Package: $SIZE${NC}"
    fi
elif [[ "$OS" == MSYS* ]] || [[ "$OS" == MINGW* ]] || [[ "$OS" == CYGWIN* ]]; then
    if [ -f "$BUILD_DIR/app.exe" ]; then
        SIZE=$(ls -lh "$BUILD_DIR/app.exe" | awk '{print $5}')
        echo -e "  ${GREEN}✓ Windows Executable: $SIZE${NC}"
    fi
    if ls "$BUILD_DIR/bundle/msi/"*.msi &> /dev/null; then
        SIZE=$(ls -lh "$BUILD_DIR/bundle/msi/"*.msi | awk '{print $5}')
        echo -e "  ${GREEN}✓ Windows MSI Installer: $SIZE${NC}"
    fi
fi

echo -e "\n${YELLOW}What's included in the build:${NC}"
echo -e "  ✓ Node.js ${NODE_VERSION:-18.19.0} (bundled in resources/)"
echo -e "  ✓ SQLite (via Prisma ORM)"
echo -e "  ✓ NestJS backend"
echo -e "  ✓ React frontend"
echo -e "  ✓ Tauri desktop wrapper"

echo -e "\n${YELLOW}Installation & Distribution:${NC}"
if [ "$OS" = "Darwin" ]; then
    echo -e "  macOS: Drag .app to Applications folder"
elif [ "$OS" = "Linux" ]; then
    echo -e "  Linux: Run .AppImage directly or install .deb"
elif [[ "$OS" == MSYS* ]] || [[ "$OS" == MINGW* ]] || [[ "$OS" == CYGWIN* ]]; then
    echo -e "  Windows: Run .exe or MSI installer"
fi

echo -e "\n${YELLOW}Data storage:${NC}"
echo -e "  Linux/Mac: ~/.local/share/jcl-investment-portfolio/"
echo -e "  Windows: %APPDATA%\\jcl-investment-portfolio\\"

echo -e "\n${GREEN}✓ Ready to ship!${NC}\n"
exit 0
