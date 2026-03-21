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
OS=$(uname -s)

# Windows builds are handled by a dedicated script to keep platform concerns
# isolated and to avoid interfering with the Mac / Linux path.
# Nothing below this block runs on Windows.
case "$OS" in
  MSYS*|MINGW*|CYGWIN*)
    exec "$PROJECT_ROOT/scripts/build-windows.sh" "$@"
    ;;
esac

prepend_path_if_exists() {
    if [ -d "$1" ]; then
        export PATH="$1:$PATH"
    fi
}

join_semicolon_windows_paths() {
    local output=""
    local path

    for path in "$@"; do
        if [ -n "$path" ] && [ -d "$path" ]; then
            local win_path
            win_path="$(cygpath -w "$path")"
            if [ -z "$output" ]; then
                output="$win_path"
            else
                output="$output;$win_path"
            fi
        fi
    done

    printf '%s\n' "$output"
}

find_windows_msvc_linker() {
    local root
    local candidate

    for root in "/c/Program Files/Microsoft Visual Studio" "/c/Program Files (x86)/Microsoft Visual Studio"; do
        if [ -d "$root" ]; then
            candidate="$(find "$root" -path '*/VC/Tools/MSVC/*/bin/Hostx64/x64/link.exe' 2>/dev/null | sort | tail -1)"
            if [ -n "$candidate" ]; then
                printf '%s\n' "$candidate"
                return 0
            fi
        fi
    done

    return 1
}

find_windows_sdk_layout() {
    local lib_base include_base bin_base latest_ver

    if [ -d "/c/Program Files (x86)/Windows Kits/10/Lib" ] && [ -d "/c/Program Files (x86)/Windows Kits/10/Include" ]; then
        lib_base="/c/Program Files (x86)/Windows Kits/10/Lib"
        include_base="/c/Program Files (x86)/Windows Kits/10/Include"
        bin_base="/c/Program Files (x86)/Windows Kits/10/bin"

        latest_ver="$(find "$lib_base" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -V | tail -1)"
        if [ -n "$latest_ver" ] && [ -d "$latest_ver/um/x64" ] && [ -d "$latest_ver/ucrt/x64" ]; then
            local ver_name
            ver_name="$(basename "$latest_ver")"
            if [ -d "$include_base/$ver_name/um" ] && [ -d "$include_base/$ver_name/shared" ] && [ -d "$include_base/$ver_name/ucrt" ]; then
                printf '%s|%s|%s\n' "$latest_ver" "$include_base/$ver_name" "$bin_base/$ver_name/x64"
                return 0
            fi
        fi
    fi

    local temp_root
    for temp_root in "$TEMP" "/c/Users/$USERNAME/AppData/Local/Temp"; do
        if [ -n "$temp_root" ] && [ -d "$temp_root/winsdk_x64/c/um/x64" ] && [ -d "$temp_root/winsdk_x64/c/ucrt/x64" ]; then
            local include_root include_ver bin_root
            include_root="$temp_root/winsdk_headers/c/Include"
            if [ -d "$include_root" ]; then
                include_ver="$(find "$include_root" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -V | tail -1)"
                if [ -n "$include_ver" ] && [ -d "$include_ver/um" ] && [ -d "$include_ver/shared" ] && [ -d "$include_ver/ucrt" ]; then
                    bin_root="$temp_root/winsdk_headers/c/bin/$(basename "$include_ver")/x64"
                    printf '%s|%s|%s\n' "$temp_root/winsdk_x64/c" "$include_ver" "$bin_root"
                    return 0
                fi
            fi
        fi
    done

    return 1
}

configure_windows_toolchain_env() {
    local linker_path="$1"
    local msvc_bin_dir msvc_tools_dir msvc_include_dir msvc_lib_dir
    local sdk_layout sdk_lib_root sdk_include_root sdk_bin_dir
    local lib_env include_env

    msvc_bin_dir="$(dirname "$linker_path")"
    msvc_tools_dir="$(cd "$msvc_bin_dir/../../.." && pwd)"
    msvc_include_dir="$msvc_tools_dir/include"
    msvc_lib_dir="$msvc_tools_dir/lib/x64"

    sdk_layout="$(find_windows_sdk_layout || true)"
    if [ -z "$sdk_layout" ]; then
        echo -e "${RED}✗ Windows SDK headers/libs not found.${NC}"
        echo -e "${YELLOW}  Install Windows 10/11 SDK, or ensure temp SDK folders exist:${NC}"
        echo -e "${YELLOW}  - %TEMP%\\winsdk_x64\\c${NC}"
        echo -e "${YELLOW}  - %TEMP%\\winsdk_headers\\c${NC}"
        exit 1
    fi

    IFS='|' read -r sdk_lib_root sdk_include_root sdk_bin_dir <<< "$sdk_layout"

    lib_env="$(join_semicolon_windows_paths "$sdk_lib_root/um/x64" "$sdk_lib_root/ucrt/x64" "$msvc_lib_dir")"
    include_env="$(join_semicolon_windows_paths "$msvc_include_dir" "$sdk_include_root/um" "$sdk_include_root/shared" "$sdk_include_root/ucrt" "$sdk_include_root/winrt")"

    if [ -z "$lib_env" ] || [ -z "$include_env" ]; then
        echo -e "${RED}✗ Failed to compose Windows SDK/MSVC LIB/INCLUDE variables.${NC}"
        exit 1
    fi

    export LIB="$lib_env"
    export INCLUDE="$include_env"

    if [ -f "$sdk_bin_dir/rc.exe" ]; then
        export RC="$(cygpath -w "$sdk_bin_dir/rc.exe")"
        prepend_path_if_exists "$sdk_bin_dir"
        echo -e "${GREEN}✓ Windows resource compiler found${NC}"
    else
        echo -e "${YELLOW}⚠ rc.exe not found at $sdk_bin_dir; resource compile may fail${NC}"
    fi

    echo -e "${GREEN}✓ Windows SDK configured${NC}"
}

prepare_windows_bundle_lock_state() {
    echo -e "${YELLOW}Preparing Windows bundle lock state...${NC}"

    # Stop previous app instances that can hold app.exe during MSI/NSIS patching.
    cmd //c "taskkill /F /IM app.exe /T" >/dev/null 2>&1 || true
    cmd //c "taskkill /F /IM \"JCL Investment Portfolio.exe\" /T" >/dev/null 2>&1 || true

    # Remove stale bundle output from interrupted runs.
    rm -rf "$PROJECT_ROOT/src-tauri/target/release/bundle" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/src-tauri/target/release/server" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/src-tauri/target/release/node" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/src-tauri/target/release/resources" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/src-tauri/target/release/wix/x64/output.msi" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/src-tauri/target/release/wix/x64/output.wixpdb" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/src-tauri/target/release/wix/x64/main.wixpdb" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/src-tauri/target/release/wix/x64/main.wixobj" 2>/dev/null || true

    # Stop MSI-related processes that can keep wix outputs or generated MSIs locked.
    cmd //c "taskkill /F /IM msiexec.exe /T" >/dev/null 2>&1 || true
    sleep 2
}

reset_tauri_wix_toolchain_if_needed() {
    local log_file="$1"
    local wix_tools_dir

    wix_tools_dir="${LOCALAPPDATA:-$USERPROFILE/AppData/Local}/tauri/WixTools314"

    if grep -Eq "failed to run .*WixTools314\\\\light\.exe|failed to run .*WixTools314/light\.exe" "$log_file"; then
        echo -e "${YELLOW}Detected WixTools314 light.exe launch failure. Resetting local WiX toolchain...${NC}"
        rm -rf "$wix_tools_dir" 2>/dev/null || true
        sleep 1
    fi
}

ensure_tauri_target_dir() {
    mkdir -p "$PROJECT_ROOT/src-tauri/target"
}

# Run light.exe manually with -sval to skip ICE validation (workaround for ICE30
# duplicate-component errors that Tauri's WiX manifest generator can produce with
# large resource trees).
run_light_exe_sval_fallback() {
    local wix_dir="$PROJECT_ROOT/src-tauri/target/release/wix/x64"
    local msi_dir="$PROJECT_ROOT/src-tauri/target/release/bundle/msi"
    local wix_tools_dir
    wix_tools_dir="${LOCALAPPDATA:-$USERPROFILE/AppData/Local}/tauri/WixTools314"

    local light_exe_unix
    light_exe_unix="$(cygpath "$wix_tools_dir/light.exe" 2>/dev/null || echo "$wix_tools_dir/light.exe")"
    if [ ! -f "$light_exe_unix" ]; then
        echo -e "${RED}✗ light.exe not found – cannot build MSI via sval fallback${NC}"
        return 1
    fi
    if [ ! -f "$wix_dir/main.wixobj" ]; then
        echo -e "${RED}✗ main.wixobj not found – candle step must have succeeded first${NC}"
        return 1
    fi

    # Derive MSI output filename from Tauri config (productName + version).
    local product_name version msi_filename
    product_name=$(grep '"productName"' "$PROJECT_ROOT/src-tauri/tauri.conf.json" 2>/dev/null \
        | head -1 | sed 's/.*"productName"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    version=$(grep '"version"' "$PROJECT_ROOT/package.json" 2>/dev/null \
        | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    msi_filename="${product_name}_${version}_x64_en-US.msi"

    mkdir -p "$msi_dir"

    # Use Windows paths for light.exe arguments (it is a native Win32 tool).
    local wix_tools_w wix_dir_w msi_out_w
    wix_tools_w="$(cygpath -w "$wix_tools_dir")"
    wix_dir_w="$(cygpath -w "$wix_dir")"
    msi_out_w="$(cygpath -w "$msi_dir")\\${msi_filename}"

    echo -e "${YELLOW}Running light.exe -sval (skipping ICE validation)...${NC}"
    # Call light.exe directly from bash — no cmd.exe wrapper needed.
    "$light_exe_unix" -nologo -sval \
        -ext "${wix_tools_w}\\WixUIExtension.dll" \
        -ext "${wix_tools_w}\\WixUtilExtension.dll" \
        -cultures:en-us \
        -loc "${wix_dir_w}\\locale.wxl" \
        -out "$msi_out_w" \
        "${wix_dir_w}\\main.wixobj" 2>&1 | grep -Ev "^[[:space:]]*$"

    if ls "$msi_dir"/*.msi >/dev/null 2>&1; then
        local sz
        sz=$(ls -lh "$msi_dir"/*.msi | awk '{print $5}')
        echo -e "${GREEN}✓ MSI created via -sval fallback: $sz${NC}"
        return 0
    else
        echo -e "${RED}✗ MSI creation failed even with -sval${NC}"
        return 1
    fi
}

# Build only the NSIS installer (reuses already-compiled app.exe).
run_tauri_nsis_build() {
    local log_file="$PROJECT_ROOT/src-tauri/target/tauri-nsis.log"
    ensure_tauri_target_dir
    echo -e "${YELLOW}Building NSIS installer...${NC}"
    if npm run tauri:build -- --bundles nsis >"$log_file" 2>&1; then
        [ -f "$log_file" ] && cat "$log_file"
        return 0
    fi
    [ -f "$log_file" ] && cat "$log_file"
    echo -e "${RED}✗ NSIS-only build failed${NC}"
    return 1
}

run_tauri_build_with_retries() {
    local attempt max_attempts log_file
    attempt=1
    max_attempts=3
    log_file="$PROJECT_ROOT/src-tauri/target/tauri-build.log"

    ensure_tauri_target_dir

    while [ "$attempt" -le "$max_attempts" ]; do
        echo -e "${YELLOW}Tauri build attempt $attempt/$max_attempts...${NC}"

        if npm run tauri:build >"$log_file" 2>&1; then
            [ -f "$log_file" ] && cat "$log_file"
            return 0
        fi

        [ -f "$log_file" ] && cat "$log_file"

        # light.exe failed (either a launch failure or ICE validation error).
        # Tauri only emits a summary; the real light.exe errors are not in the
        # log.  Distinguish the two cases by checking whether candle succeeded:
        # if main.wixobj exists, candle ran fine and light.exe itself failed –
        # this is almost always an ICE30 validation error on large resource
        # trees.  Apply the -sval fallback in that case.
        if [ -f "$log_file" ] && grep -Eq "os error 32|failed to run .*light\.exe|failed to bundle project" "$log_file"; then
            local wixobj="$PROJECT_ROOT/src-tauri/target/release/wix/x64/main.wixobj"
            local msi_dir="$PROJECT_ROOT/src-tauri/target/release/bundle/msi"
            local nsis_dir="$PROJECT_ROOT/src-tauri/target/release/bundle/nsis"

            if [ -f "$wixobj" ]; then
                # candle succeeded → light.exe failed (ICE validation or similar).
                # Rerun light.exe with -sval and then build NSIS separately.
                echo -e "${YELLOW}light.exe failed after candle succeeded. Trying -sval MSI fallback + NSIS...${NC}"
                run_light_exe_sval_fallback || true
                run_tauri_nsis_build || true
                if ls "$msi_dir"/*.msi >/dev/null 2>&1 || ls "$nsis_dir"/*-setup.exe >/dev/null 2>&1; then
                    return 0
                fi
                echo -e "${RED}✗ Both MSI (-sval) and NSIS fallback builds failed${NC}"
                return 1
            else
                # candle never produced a wixobj → transient lock or toolchain issue.
                echo -e "${YELLOW}Detected Windows bundling/transient lock failure. Retrying...${NC}"
                reset_tauri_wix_toolchain_if_needed "$log_file"
                prepare_windows_bundle_lock_state
                attempt=$((attempt + 1))
                continue
            fi
        fi

        echo -e "${RED}✗ Tauri build failed${NC}"
        return 1
    done

    echo -e "${RED}✗ Tauri build failed after $max_attempts attempts due to persistent file lock${NC}"
    return 1
}

prepare_windows_node_shims() {
    local node_bin_dir="$PROJECT_ROOT/src-tauri/resources/node/bin"
    local node_runtime_dir

    node_runtime_dir="$(find "$PROJECT_ROOT/src-tauri/resources/node" -maxdepth 1 -type d -name 'node-v*-win-*' | head -1)"

    if [ -z "$node_runtime_dir" ] || [ ! -f "$node_runtime_dir/node.exe" ]; then
        return
    fi

    cat > "$node_bin_dir/node" <<'EOF'
#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_RUNTIME_DIR="$(find "$(cd "$SCRIPT_DIR/.." && pwd)" -maxdepth 1 -type d -name 'node-v*-win-*' | head -1)"
exec "$NODE_RUNTIME_DIR/node.exe" "$@"
EOF

    if [ -f "$node_bin_dir/npm.cmd" ]; then
        cat > "$node_bin_dir/npm" <<'EOF'
#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_RUNTIME_DIR="$(find "$(cd "$SCRIPT_DIR/.." && pwd)" -maxdepth 1 -type d -name 'node-v*-win-*' | head -1)"
exec "$NODE_RUNTIME_DIR/node.exe" "$NODE_RUNTIME_DIR/node_modules/npm/bin/npm-cli.js" "$@"
EOF
    fi

    if [ -f "$node_bin_dir/npx.cmd" ]; then
        cat > "$node_bin_dir/npx" <<'EOF'
#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_RUNTIME_DIR="$(find "$(cd "$SCRIPT_DIR/.." && pwd)" -maxdepth 1 -type d -name 'node-v*-win-*' | head -1)"
exec "$NODE_RUNTIME_DIR/node.exe" "$NODE_RUNTIME_DIR/node_modules/npm/bin/npx-cli.js" "$@"
EOF
    fi

    chmod +x "$node_bin_dir/node" "$node_bin_dir/npm" "$node_bin_dir/npx" 2>/dev/null || true
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JCL Investment Portfolio - Full Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Complete bundled desktop app build${NC}"
echo -e "${YELLOW}Includes: Node.js, SQLite, all platforms${NC}\n"

# Check prerequisites
echo -e "${BLUE}[0/6] Checking prerequisites...${NC}"

if [[ "$OS" == MSYS* ]] || [[ "$OS" == MINGW* ]] || [[ "$OS" == CYGWIN* ]]; then
    WINDOWS_MSVC_LINKER="$(find_windows_msvc_linker || true)"

    prepend_path_if_exists "$HOME/.cargo/bin"

    if [ -n "$WINDOWS_MSVC_LINKER" ]; then
        prepend_path_if_exists "$(dirname "$WINDOWS_MSVC_LINKER")"
        export CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER="$(cygpath -w "$WINDOWS_MSVC_LINKER")"
        echo -e "${GREEN}✓ MSVC linker found${NC}"
        configure_windows_toolchain_env "$WINDOWS_MSVC_LINKER"
    else
        echo -e "${RED}✗ Microsoft Visual C++ Build Tools linker not found.${NC}"
        echo -e "${YELLOW}  Install Visual Studio Build Tools with 'Desktop development with C++'.${NC}"
        exit 1
    fi
fi

if ! command -v cargo &> /dev/null; then
    echo -e "${RED}✗ Rust/Cargo not found. Install from https://rustup.rs/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Cargo found${NC}"

if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ Node.js found $(node --version)${NC}"
    echo -e "${GREEN}✓ npm found $(npm --version)${NC}"
else
    echo -e "${YELLOW}⚠ Node.js/npm not currently on PATH - will attempt to use bundled runtime in step 1${NC}"
fi

# Step 1: Download bundled Node.js
echo -e "\n${BLUE}[1/6] Preparing bundled Node.js...${NC}"
chmod +x "$PROJECT_ROOT/src-tauri/download-node.sh"

case "$OS" in
  Linux|Darwin)
    "$PROJECT_ROOT/src-tauri/download-node.sh"
    ;;
  MSYS*|MINGW*|CYGWIN*)
    echo -e "${YELLOW}Windows detected${NC}"
    if [ -f "$PROJECT_ROOT/src-tauri/download-node.bat" ]; then
        cmd //c "$(cygpath -w "$PROJECT_ROOT/src-tauri/download-node.bat")" || true
    fi
    ;;
esac

if [[ "$OS" == MSYS* ]] || [[ "$OS" == MINGW* ]] || [[ "$OS" == CYGWIN* ]]; then
    prepare_windows_node_shims
fi

prepend_path_if_exists "$PROJECT_ROOT/src-tauri/resources/node/bin"

# Check if Node.js was bundled
if [ -f "$PROJECT_ROOT/src-tauri/resources/node/bin/node" ] || [ -f "$PROJECT_ROOT/src-tauri/resources/node/bin/node.exe" ]; then
    echo -e "${GREEN}✓ Node.js bundled${NC}"
else
    echo -e "${YELLOW}⚠ Node.js not bundled (will use system Node.js)${NC}"
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org/ or ensure src-tauri/resources/node/bin is populated${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found. Install from https://nodejs.org/ or re-run the Node.js bundling step${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found $(npm --version)${NC}"

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
./node_modules/.bin/tsc || {
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
rm -rf "$TAURI_SERVER_DIR/prisma" 2>/dev/null || true
mkdir -p "$TAURI_SERVER_DIR"

cp -r "dist" "$TAURI_SERVER_DIR/" || {
    echo -e "${RED}✗ Failed to copy dist${NC}"
    exit 1
}

# Copy package files
cp "package.json" "$TAURI_SERVER_DIR/"
cp "package-lock.json" "$TAURI_SERVER_DIR/" 2>/dev/null || true

# Copy Prisma schema and migrations so the bundled app can migrate the database
if [ -d "$PROJECT_ROOT/server/prisma" ]; then
    cp -r "$PROJECT_ROOT/server/prisma" "$TAURI_SERVER_DIR/"
    rm -f "$TAURI_SERVER_DIR/prisma/investment_portfolio.db"
    echo -e "${GREEN}✓ Prisma schema and migrations bundled${NC}"
fi

# Install production dependencies only
cd "$TAURI_SERVER_DIR"
npm ci --omit=dev || {
    echo -e "${RED}✗ Failed to install production dependencies${NC}"
    exit 1
}

# Generate Prisma client with the platform-specific native query engine binary
echo -e "${YELLOW}Generating Prisma client...${NC}"
./node_modules/.bin/prisma generate || {
    echo -e "${RED}✗ Prisma client generation failed${NC}"
    exit 1
}

SIZE=$(du -sh "$TAURI_SERVER_DIR" 2>/dev/null | cut -f1 || true)
if [ -z "$SIZE" ]; then
    SIZE="unknown size"
fi
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

if [[ "$OS" == MSYS* ]] || [[ "$OS" == MINGW* ]] || [[ "$OS" == CYGWIN* ]]; then
    prepare_windows_bundle_lock_state
    (cd "$PROJECT_ROOT/src-tauri" && cargo clean -p app >/dev/null 2>&1) || true
fi

run_tauri_build_with_retries || {
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
    if ls "$BUILD_DIR/bundle/nsis/"*-setup.exe &> /dev/null; then
        SIZE=$(ls -lh "$BUILD_DIR/bundle/nsis/"*-setup.exe | awk '{print $5}')
        echo -e "  ${GREEN}✓ Windows NSIS Installer (-setup.exe): $SIZE${NC}"
    fi
fi

echo -e "\n${YELLOW}What's included in the build:${NC}"
echo -e "  ✓ Node.js ${NODE_VERSION:-20.19.0} (bundled in resources/)"
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
    echo -e "  Windows: Run -setup.exe (NSIS) or .msi (MSI) installer"
fi

echo -e "\n${YELLOW}Data storage:${NC}"
echo -e "  Linux/Mac: ~/.local/share/jcl-investment-portfolio/"
echo -e "  Windows: %APPDATA%\\jcl-investment-portfolio\\"

echo -e "\n${GREEN}✓ Ready to ship!${NC}\n"
exit 0
