#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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
        echo "Windows SDK headers/libs not found" >&2
        return 1
    fi

    IFS='|' read -r sdk_lib_root sdk_include_root sdk_bin_dir <<< "$sdk_layout"

    lib_env="$(join_semicolon_windows_paths "$sdk_lib_root/um/x64" "$sdk_lib_root/ucrt/x64" "$msvc_lib_dir")"
    include_env="$(join_semicolon_windows_paths "$msvc_include_dir" "$sdk_include_root/um" "$sdk_include_root/shared" "$sdk_include_root/ucrt" "$sdk_include_root/winrt")"

    export LIB="$lib_env"
    export INCLUDE="$include_env"

    if [ -f "$sdk_bin_dir/rc.exe" ]; then
        export RC="$(cygpath -w "$sdk_bin_dir/rc.exe")"
        prepend_path_if_exists "$sdk_bin_dir"
    fi
}

prepare_windows_bundle_lock_state() {
    cmd //c "taskkill /F /IM app.exe /T" >/dev/null 2>&1 || true
    cmd //c "taskkill /F /IM \"JCL Investment Portfolio.exe\" /T" >/dev/null 2>&1 || true
    rm -rf "$PROJECT_ROOT/src-tauri/target/release/bundle" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/src-tauri/target/release/server" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/src-tauri/target/release/node" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/src-tauri/target/release/resources" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/src-tauri/target/release/wix/x64/output.msi" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/src-tauri/target/release/wix/x64/output.wixpdb" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/src-tauri/target/release/wix/x64/main.wixpdb" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/src-tauri/target/release/wix/x64/main.wixobj" 2>/dev/null || true
    cmd //c "taskkill /F /IM msiexec.exe /T" >/dev/null 2>&1 || true
    sleep 2
}

main() {
    local linker_path
    local build_mode="${1:-tauri}"

    prepend_path_if_exists "$HOME/.cargo/bin"
    prepend_path_if_exists "$PROJECT_ROOT/src-tauri/resources/node/bin"

    rm -f "$PROJECT_ROOT/src-tauri/resources/server/prisma/investment_portfolio.db"

    linker_path="$(find_windows_msvc_linker)"
    prepend_path_if_exists "$(dirname "$linker_path")"
    export CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER="$(cygpath -w "$linker_path")"
    configure_windows_toolchain_env "$linker_path"

    cd "$PROJECT_ROOT"
    prepare_windows_bundle_lock_state
    (cd "$PROJECT_ROOT/src-tauri" && cargo clean -p app >/dev/null 2>&1) || true

    npm run build:check

    case "$build_mode" in
        tauri)
            npm run tauri:build
            ;;
        cargo-verbose)
            cd "$PROJECT_ROOT/src-tauri"
            cargo build --release -vv
            ;;
        *)
            echo "Unknown build mode: $build_mode" >&2
            return 2
            ;;
    esac
}

main "$@"