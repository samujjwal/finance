#!/usr/bin/env bash
# =============================================================================
# Windows Production Build — JCL Investment Portfolio
# =============================================================================
# Run this script under Git Bash (MSYS2 / MINGW64) on Windows.
#
# Usage:
#   bash scripts/build-windows.sh
#
# Produces:
#   src-tauri/target/release/bundle/msi/*.msi
#   src-tauri/target/release/bundle/nsis/*-setup.exe
#
# Prerequisites:
#   * Visual Studio 2019+ Build Tools with "Desktop development with C++"
#   * Windows 10/11 SDK (installed alongside Build Tools)
#   * Rust + cargo (from https://rustup.rs/)
#   * Git Bash / MSYS2 environment
#   * Internet access (for Node.js download if not already cached)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

step() { echo ""; echo -e "${BLUE}━━━  $*  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
ok()   { echo -e "${GREEN}  ✓  $*${NC}"; }
warn() { echo -e "${YELLOW}  ⚠  $*${NC}"; }
log()  { echo -e "     $*"; }
fail() { echo -e "${RED}  ✗  $*${NC}"; exit 1; }

# ── Guard: must be Windows (Git Bash / MSYS2 / Cygwin) ────────────────────────
case "$(uname -s)" in
  MSYS*|MINGW*|CYGWIN*) ;;
  *) fail "This script is Windows-only. Run it under Git Bash (MSYS2/MINGW64)." ;;
esac

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   JCL Investment Portfolio — Windows Production Build     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# Toolchain helpers
# =============================================================================

prepend_path_if_exists() { [[ -d "$1" ]] && export PATH="$1:$PATH" || true; }

join_semicolon_windows_paths() {
    local out="" p w
    for p in "$@"; do
        [[ -n "$p" && -d "$p" ]] || continue
        w="$(cygpath -w "$p")"
        out="${out:+${out};}${w}"
    done
    printf '%s\n' "$out"
}

find_msvc_linker() {
    local root candidate
    for root in \
        "/c/Program Files/Microsoft Visual Studio" \
        "/c/Program Files (x86)/Microsoft Visual Studio"
    do
        [[ -d "$root" ]] || continue
        candidate="$(find "$root" \
            -path '*/VC/Tools/MSVC/*/bin/Hostx64/x64/link.exe' \
            2>/dev/null | sort | tail -1)"
        [[ -n "$candidate" ]] && { printf '%s\n' "$candidate"; return 0; }
    done
    return 1
}

find_windows_sdk() {
    # 1. Standard installation under Program Files (x86)\Windows Kits\10
    local lib_base="/c/Program Files (x86)/Windows Kits/10/Lib"
    local inc_base="/c/Program Files (x86)/Windows Kits/10/Include"
    local bin_base="/c/Program Files (x86)/Windows Kits/10/bin"
    if [[ -d "$lib_base" && -d "$inc_base" ]]; then
        local latest ver
        latest="$(find "$lib_base" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -V | tail -1)"
        ver="$(basename "$latest")"
        if [[ -d "$latest/um/x64" && -d "$latest/ucrt/x64" \
           && -d "$inc_base/$ver/um" && -d "$inc_base/$ver/shared" \
           && -d "$inc_base/$ver/ucrt" ]]; then
            printf '%s|%s|%s\n' "$latest" "$inc_base/$ver" "$bin_base/$ver/x64"
            return 0
        fi
    fi

    # 2. SDK extracted to a temp directory by a previous build tool
    #    (Git Bash maps $TEMP to /tmp; also check the Windows AppData/Local/Temp)
    local temp_root include_root include_ver bin_root
    for temp_root in "/tmp" "/c/Users/$USERNAME/AppData/Local/Temp" "${TEMP:-}"; do
        [[ -n "$temp_root" ]] || continue
        if [[ -d "$temp_root/winsdk_x64/c/um/x64" && -d "$temp_root/winsdk_x64/c/ucrt/x64" ]]; then
            include_root="$temp_root/winsdk_headers/c/Include"
            if [[ -d "$include_root" ]]; then
                include_ver="$(find "$include_root" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -V | tail -1)"
                if [[ -n "$include_ver" \
                   && -d "$include_ver/um" && -d "$include_ver/shared" \
                   && -d "$include_ver/ucrt" ]]; then
                    bin_root="$temp_root/winsdk_headers/c/bin/$(basename "$include_ver")/x64"
                    printf '%s|%s|%s\n' "$temp_root/winsdk_x64/c" "$include_ver" "$bin_root"
                    return 0
                fi
            fi
        fi
    done

    return 1
}

setup_msvc_toolchain() {
    local linker="$1"
    local bin_dir tools_dir inc_dir lib_dir
    bin_dir="$(dirname "$linker")"
    tools_dir="$(cd "$bin_dir/../../.." && pwd)"
    inc_dir="$tools_dir/include"
    lib_dir="$tools_dir/lib/x64"

    # Put the MSVC bin dir on PATH FIRST so it shadows Git's /usr/bin/link.exe.
    # If this is not done before any rustc/cargo call, the wrong linker is used.
    prepend_path_if_exists "$bin_dir"
    export CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER="$(cygpath -w "$linker")"

    local sdk_layout
    sdk_layout="$(find_windows_sdk)" \
        || fail "Windows SDK not found.\nInstall Windows 10/11 SDK via Visual Studio Installer,\nor ensure the winsdk_x64 + winsdk_headers directories exist under TEMP."

    local sdk_lib sdk_inc sdk_bin
    IFS='|' read -r sdk_lib sdk_inc sdk_bin <<< "$sdk_layout"

    local lib_env inc_env
    lib_env="$(join_semicolon_windows_paths "$sdk_lib/um/x64" "$sdk_lib/ucrt/x64" "$lib_dir")"
    inc_env="$(join_semicolon_windows_paths "$inc_dir" "$sdk_inc/um" "$sdk_inc/shared" "$sdk_inc/ucrt" "$sdk_inc/winrt")"

    [[ -n "$lib_env" && -n "$inc_env" ]] \
        || fail "Could not compose LIB/INCLUDE from SDK layout."

    export LIB="$lib_env"
    export INCLUDE="$inc_env"

    if [[ -f "$sdk_bin/rc.exe" ]]; then
        export RC="$(cygpath -w "$sdk_bin/rc.exe")"
        prepend_path_if_exists "$sdk_bin"
        ok "RC: $sdk_bin/rc.exe"
    else
        warn "rc.exe not found at $sdk_bin — resource compilation may fail"
    fi
}

# =============================================================================
# Bundle cleanup helpers
# =============================================================================

kill_locked_processes() {
    cmd //c "taskkill /F /IM app.exe /T"                       >/dev/null 2>&1 || true
    cmd //c "taskkill /F /IM \"JCL Investment Portfolio.exe\" /T" >/dev/null 2>&1 || true
    cmd //c "taskkill /F /IM msiexec.exe /T"                   >/dev/null 2>&1 || true
}

clean_stale_release_artifacts() {
    # These directories are regenerated by Tauri during bundling.
    # Stale copies from interrupted runs cause "os error 183" (file already exists).
    local rel="$PROJECT_ROOT/src-tauri/target/release"
    rm -rf  "$rel/bundle"    2>/dev/null || true
    rm -rf  "$rel/server"    2>/dev/null || true
    rm -rf  "$rel/node"      2>/dev/null || true
    rm -rf  "$rel/resources" 2>/dev/null || true
    # Stale WiX intermediate files
    rm -f   "$rel/wix/x64/output.msi"    2>/dev/null || true
    rm -f   "$rel/wix/x64/output.wixpdb" 2>/dev/null || true
    rm -f   "$rel/wix/x64/main.wixpdb"   2>/dev/null || true
    rm -f   "$rel/wix/x64/main.wixobj"   2>/dev/null || true
}

prepare_for_packaging() {
    log "Killing processes that may lock bundle files..."
    kill_locked_processes
    log "Removing stale Tauri release artifacts..."
    clean_stale_release_artifacts
    # Clean the app crate's incremental state so Rust picks up resource changes.
    log "Cleaning app crate..."
    (cd "$PROJECT_ROOT/src-tauri" && cargo clean -p app 2>/dev/null) || true
    sleep 1
}

# =============================================================================
# WiX MSI fallback: rerun light.exe with -sval (skip ICE validation)
# ICE30 errors occur with large resource trees on Tauri's WiX manifests.
# =============================================================================

run_light_exe_sval_fallback() {
    local wix_dir="$PROJECT_ROOT/src-tauri/target/release/wix/x64"
    local msi_dir="$PROJECT_ROOT/src-tauri/target/release/bundle/msi"
    local wix_tools_dir
    wix_tools_dir="${LOCALAPPDATA:-$USERPROFILE/AppData/Local}/tauri/WixTools314"

    local light_exe
    light_exe="$(cygpath "$wix_tools_dir/light.exe" 2>/dev/null || echo "$wix_tools_dir/light.exe")"

    [[ -f "$light_exe" ]]           || { warn "light.exe not found — skipping MSI sval fallback"; return 1; }
    [[ -f "$wix_dir/main.wixobj" ]] || { warn "main.wixobj missing — candle must have failed"; return 1; }

    local product_name version msi_filename
    product_name="$(grep '"productName"' "$PROJECT_ROOT/src-tauri/tauri.conf.json" 2>/dev/null \
        | head -1 | sed 's/.*"productName"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')"
    version="$(grep '"version"' "$PROJECT_ROOT/package.json" 2>/dev/null \
        | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')"
    msi_filename="${product_name}_${version}_x64_en-US.msi"

    mkdir -p "$msi_dir"

    local wix_tools_w wix_dir_w msi_out_w
    wix_tools_w="$(cygpath -w "$wix_tools_dir")"
    wix_dir_w="$(cygpath -w "$wix_dir")"
    msi_out_w="$(cygpath -w "$msi_dir")\\${msi_filename}"

    log "Running light.exe -sval (skipping ICE validation)..."
    "$light_exe" -nologo -sval \
        -ext "${wix_tools_w}\\WixUIExtension.dll" \
        -ext "${wix_tools_w}\\WixUtilExtension.dll" \
        -cultures:en-us \
        -loc "${wix_dir_w}\\locale.wxl" \
        -out "$msi_out_w" \
        "${wix_dir_w}\\main.wixobj" 2>&1 | grep -Ev "^[[:space:]]*$" || true

    if ls "$msi_dir"/*.msi >/dev/null 2>&1; then
        local sz
        sz="$(ls -lh "$msi_dir"/*.msi | awk '{print $5}')"
        ok "MSI created via -sval fallback ($sz)"
        return 0
    fi
    warn "MSI creation failed even with -sval"
    return 1
}

# =============================================================================
# Tauri packaging with retry + WiX fallback
# =============================================================================

run_tauri_packaging() {
    local log_file="$PROJECT_ROOT/src-tauri/target/tauri-build.log"
    mkdir -p "$(dirname "$log_file")"

    local attempt
    for attempt in 1 2 3; do
        log "Tauri build attempt $attempt/3..."
        if npm run tauri:build > "$log_file" 2>&1; then
            cat "$log_file"
            return 0
        fi
        cat "$log_file"

        local wixobj="$PROJECT_ROOT/src-tauri/target/release/wix/x64/main.wixobj"

        if grep -Eq "failed to run .*light\.exe|failed to bundle project|os error 32" \
                "$log_file" 2>/dev/null; then

            if [[ -f "$wixobj" ]]; then
                # candle succeeded; light.exe failed (ICE validation on large resource tree)
                warn "light.exe failed after candle succeeded — trying -sval MSI + NSIS..."
                run_light_exe_sval_fallback || true
                log "Building NSIS installer..."
                npm run tauri:build -- --bundles nsis >> "$log_file" 2>&1 || true
                cat "$log_file"

                local msi_dir="$PROJECT_ROOT/src-tauri/target/release/bundle/msi"
                local nsis_dir="$PROJECT_ROOT/src-tauri/target/release/bundle/nsis"
                if ls "$msi_dir"/*.msi      >/dev/null 2>&1 \
                || ls "$nsis_dir"/*-setup.exe >/dev/null 2>&1; then
                    return 0
                fi
                fail "Both MSI (-sval) and NSIS fallback builds failed"
            else
                # candle never ran — transient file-lock; retry after cleanup
                warn "candle failed (transient lock?); cleaning and retrying..."
                clean_stale_release_artifacts
                kill_locked_processes
                sleep 3
                continue
            fi
        fi

        # Non-WiX failure — no point retrying
        fail "Tauri build failed (see log above)"
    done

    fail "Tauri build failed after 3 attempts (persistent file lock)"
}

# =============================================================================
# STEP 0 — Toolchain
# =============================================================================
step "[0/6] Windows toolchain setup"

prepend_path_if_exists "$HOME/.cargo/bin"

MSVC_LINKER="$(find_msvc_linker)" \
    || fail "MSVC linker (link.exe) not found.\nInstall Visual Studio Build Tools with 'Desktop development with C++'."

setup_msvc_toolchain "$MSVC_LINKER"
ok "MSVC linker: $MSVC_LINKER"

command -v cargo &>/dev/null || fail "Rust/Cargo not found. Install from https://rustup.rs/"
ok "Cargo: $(cargo --version)"

# =============================================================================
# STEP 1 — Bundled Node.js runtime
# =============================================================================
step "[1/6] Bundled Node.js runtime"

NODE_BIN_DIR="$PROJECT_ROOT/src-tauri/resources/node/bin"
NODE_EXE="$NODE_BIN_DIR/node.exe"

if [[ ! -f "$NODE_EXE" ]]; then
    NODE_DOWNLOAD_BAT="$PROJECT_ROOT/src-tauri/download-node.bat"
    [[ -f "$NODE_DOWNLOAD_BAT" ]] \
        || fail "download-node.bat not found and node.exe not cached. Cannot continue."
    log "Running download-node.bat..."
    cmd //c "$(cygpath -w "$NODE_DOWNLOAD_BAT")" \
        || warn "download-node.bat reported an error (may be a re-run on existing download)"
fi

[[ -f "$NODE_EXE" ]] || fail "node.exe still missing at $NODE_EXE after download-node.bat"
ok "Bundled node.exe found"

# Create bash-callable npm / npx shims if not already present.
#
# download-node.bat copies npm.cmd (Windows batch) and xcopy's npm into bin/node_modules.
# That xcopy is incomplete — internal npm sub-dependencies (minipass, cacache, …)
# lose their relative paths and crash.  The original extracted copy under
# node-v*-win-x64/node_modules/npm is intact; always use that as the CLI source.
NODE_WIN_DIR="$(find "$PROJECT_ROOT/src-tauri/resources/node" \
    -maxdepth 1 -type d -name 'node-v*-win-x64' 2>/dev/null | sort | tail -1)"

NPM_SHIM="$NODE_BIN_DIR/npm"
NPX_SHIM="$NODE_BIN_DIR/npx"

if [[ -n "$NODE_WIN_DIR" ]]; then
    NPM_CLI_SRC="$NODE_WIN_DIR/node_modules/npm/bin/npm-cli.js"
    NPX_CLI_SRC="$NODE_WIN_DIR/node_modules/npm/bin/npx-cli.js"
else
    # Fallback: try the xcopy'd copy (may be broken but worth trying)
    NPM_CLI_SRC="$NODE_BIN_DIR/node_modules/npm/bin/npm-cli.js"
    NPX_CLI_SRC="$NODE_BIN_DIR/node_modules/npm/bin/npx-cli.js"
fi

# Always (re)write shims so a previous broken shim from bin/node_modules is replaced.
if [[ -f "$NPM_CLI_SRC" ]]; then
    printf '#!/usr/bin/env bash\nexec "%s" "%s" "$@"\n' "$NODE_EXE" "$NPM_CLI_SRC" > "$NPM_SHIM"
    chmod +x "$NPM_SHIM"
    ok "npm shim -> $(basename "${NODE_WIN_DIR:-bin}")/node_modules/npm"
else
    warn "Bundled npm CLI not found — will rely on system npm"
fi

if [[ -f "$NPX_CLI_SRC" ]]; then
    printf '#!/usr/bin/env bash\nexec "%s" "%s" "$@"\n' "$NODE_EXE" "$NPX_CLI_SRC" > "$NPX_SHIM"
    chmod +x "$NPX_SHIM"
fi

# When Tauri runs `beforeBuildCommand` it spawns a cmd.exe child process that
# does NOT inherit bash shims.  cmd.exe needs npm.cmd / npx.cmd (Windows batch
# files) to be on PATH.  Copy them from the original win-x64 archive directory
# into the bin dir so both bash and cmd.exe can find npm.
if [[ -n "$NODE_WIN_DIR" ]]; then
    # npm.cmd / npx.cmd are sometimes absent from the extracted Node.js directory
    # because PowerShell's ZipFile::ExtractToDirectory can silently skip them on
    # certain Windows configurations.  Create them from known-good content so
    # cmd.exe can find npm during Tauri's beforeBuildCommand.
    # Placed in NODE_WIN_DIR (not bin/) so %~dp0 correctly resolves to the
    # directory that contains both node.exe and node_modules\.
    for _npm_cmd in npm npx; do
        if [[ ! -f "$NODE_WIN_DIR/${_npm_cmd}.cmd" ]]; then
            _cli="node_modules\\npm\\bin\\${_npm_cmd}-cli.js"
            printf '@ECHO OFF\r\nSETLOCAL\r\nSET "NODE_EXE=%%~dp0node.exe"\r\nSET "CLI_JS=%%~dp0%s"\r\n"%%NODE_EXE%%" "%%CLI_JS%%" %%*\r\n' \
                "$_cli" > "$NODE_WIN_DIR/${_npm_cmd}.cmd"
            log "Created ${_npm_cmd}.cmd in $(basename "$NODE_WIN_DIR")"
        fi
    done
    # Copy into bin/ too so bash PATH lookups work when bin/ is first on PATH.
    for _cmd_file in npm.cmd npx.cmd; do
        [[ -f "$NODE_WIN_DIR/$_cmd_file" && ! -f "$NODE_BIN_DIR/$_cmd_file" ]] \
            && cp "$NODE_WIN_DIR/$_cmd_file" "$NODE_BIN_DIR/$_cmd_file"
    done
    # Add win-x64 dir to PATH so cmd.exe child processes (Tauri beforeBuildCommand)
    # find npm.cmd; this directory is on PATH before bin/ to ensure the real
    # npm.cmd (not the bash shim) is used by any native Windows child process.
    prepend_path_if_exists "$NODE_WIN_DIR"
fi

# Put bundled Node first on PATH so all subsequent npm/node calls use it.
prepend_path_if_exists "$NODE_BIN_DIR"
command -v node &>/dev/null || fail "node not on PATH after adding bundled bin dir"
command -v npm  &>/dev/null || fail "npm not on PATH after adding bundled bin dir"
ok "Node: $(node --version)   npm: $(npm --version)"

# =============================================================================
# STEP 2 — NestJS backend compilation
# =============================================================================
step "[2/6] NestJS backend compilation"

SERVER_SRC="$PROJECT_ROOT/server"
[[ -f "$SERVER_SRC/package.json" ]] || fail "server/package.json not found"

cd "$SERVER_SRC"

# Use npm install (not npm ci) so the lock file is automatically updated if
# package.json has changed since the last lock-file commit.  The updated
# package-lock.json is copied to the bundle in step 3 so the bundle's own
# npm ci step works correctly.
log "Installing backend dependencies (npm install)..."
npm install --production=false || fail "npm install failed for backend"

log "Compiling TypeScript (tsc)..."
# Use the local tsc so we never depend on a global install.
./node_modules/.bin/tsc || fail "TypeScript compilation failed"

# NestJS outputs to dist/src/main.js when the default tsconfig is used.
EXPECTED_ENTRY="$SERVER_SRC/dist/src/main.js"
[[ -f "$EXPECTED_ENTRY" ]] \
    || fail "Compiled entrypoint not found at $EXPECTED_ENTRY — check tsconfig outDir."

JS_COUNT=$(find dist -type f -name '*.js' 2>/dev/null | wc -l)
ok "Backend compiled ($JS_COUNT .js files; entry: dist/src/main.js)"

cd "$PROJECT_ROOT"

# =============================================================================
# STEP 3 — Server bundle (production deps + Prisma client)
# =============================================================================
step "[3/6] Server bundle preparation"

BUNDLE_SERVER="$PROJECT_ROOT/src-tauri/resources/server"

# Start clean so we don't carry stale compiled files or old node_modules.
rm -rf  "$BUNDLE_SERVER/dist"         2>/dev/null || true
rm -rf  "$BUNDLE_SERVER/node_modules" 2>/dev/null || true
rm -rf  "$BUNDLE_SERVER/prisma"       2>/dev/null || true
mkdir -p "$BUNDLE_SERVER"

log "Copying compiled backend (dist/) and package.json..."
cp -r "$SERVER_SRC/dist"         "$BUNDLE_SERVER/"
cp    "$SERVER_SRC/package.json" "$BUNDLE_SERVER/"
[[ -f "$SERVER_SRC/package-lock.json" ]] \
    && cp "$SERVER_SRC/package-lock.json" "$BUNDLE_SERVER/"

if [[ -d "$SERVER_SRC/prisma" ]]; then
    cp -r "$SERVER_SRC/prisma" "$BUNDLE_SERVER/"
    # Never bundle the local SQLite database file — it is created at runtime
    # in %APPDATA%\jcl-investment-portfolio during first launch.
    rm -f "$BUNDLE_SERVER/prisma/investment_portfolio.db"
    ok "Prisma schema bundled (local .db file excluded)"
fi

cd "$BUNDLE_SERVER"

# Use npm install rather than npm ci: the bundle dir is wiped clean on every
# run so there is no existing node_modules to validate against a lock file.
# --omit=dev installs only production deps; --no-audit speeds up the install.
log "Installing production-only dependencies (npm install --omit=dev)..."
npm install --omit=dev --no-audit || fail "Failed to install production server dependencies"

log "Generating Prisma client (Windows native binary)..."
./node_modules/.bin/prisma generate || fail "Prisma client generation failed"

cd "$PROJECT_ROOT"

BUNDLE_SIZE=$(du -sh "$BUNDLE_SERVER" 2>/dev/null | cut -f1 || echo "?")
ok "Server bundle ready ($BUNDLE_SIZE)"

# =============================================================================
# STEP 4 — React frontend build
# =============================================================================
step "[4/6] React frontend build"

cd "$PROJECT_ROOT"
[[ -f package.json ]] || fail "Root package.json not found"

if [[ ! -d node_modules ]]; then
    log "Installing frontend dependencies..."
    npm ci || fail "npm ci failed for frontend"
fi

log "TypeScript check + Vite production build..."
npm run build:check || fail "Frontend build failed"

[[ -d dist ]] || fail "Frontend dist/ missing after build"
FRONTEND_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "?")
ok "Frontend built ($FRONTEND_SIZE)"

# =============================================================================
# STEP 5 — Pre-packaging verification
# =============================================================================
step "[5/6] Pre-packaging verification"

TAURI_CONF="$PROJECT_ROOT/src-tauri/tauri.conf.json"
[[ -f "$TAURI_CONF" ]] || fail "src-tauri/tauri.conf.json not found"

VERSION="$(grep '"version"' "$PROJECT_ROOT/package.json" \
    | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')"
ok "App version: $VERSION"

# Confirm the two runtime assets that the Rust launcher requires at runtime.
[[ -f "$NODE_EXE" ]] \
    || fail "Bundled node.exe not found at $NODE_EXE"
[[ -f "$BUNDLE_SERVER/dist/src/main.js" ]] \
    || fail "Server entrypoint missing at $BUNDLE_SERVER/dist/src/main.js"

ok "Runtime assets verified (node.exe + dist/src/main.js)"

# =============================================================================
# STEP 6 — Tauri packaging (MSI + NSIS)
# =============================================================================
step "[6/6] Tauri packaging (MSI + NSIS)"

prepare_for_packaging
run_tauri_packaging

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Build completed successfully!                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Artifacts:"

BUILD_DIR="$PROJECT_ROOT/src-tauri/target/release"

if ls "$BUILD_DIR/bundle/msi/"*.msi >/dev/null 2>&1; then
    for f in "$BUILD_DIR/bundle/msi/"*.msi; do
        sz="$(ls -lh "$f" | awk '{print $5}')"
        echo -e "  ${GREEN}✓${NC}  MSI  : $(basename "$f")  ($sz)"
        echo "        $f"
    done
fi

if ls "$BUILD_DIR/bundle/nsis/"*-setup.exe >/dev/null 2>&1; then
    for f in "$BUILD_DIR/bundle/nsis/"*-setup.exe; do
        sz="$(ls -lh "$f" | awk '{print $5}')"
        echo -e "  ${GREEN}✓${NC}  NSIS : $(basename "$f")  ($sz)"
        echo "        $f"
    done
fi

if [[ -f "$BUILD_DIR/app.exe" ]]; then
    sz="$(ls -lh "$BUILD_DIR/app.exe" | awk '{print $5}')"
    echo -e "  ${GREEN}✓${NC}  EXE  : app.exe  ($sz)"
fi

echo ""
