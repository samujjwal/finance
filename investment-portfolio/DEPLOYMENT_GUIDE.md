# Desktop App Build & Distribution: Complete Guide

## Overview

This guide covers building and distributing the JCL Investment Portfolio desktop application across Windows, macOS, and Linux with embedded Node.js runtime.

**Key Points:**

- ✅ Single command build: `./build-production.sh`
- ✅ Automatic Node.js bundling for all platforms
- ✅ Production-ready installers for each OS
- ✅ Zero external dependencies at runtime

## Prerequisites & Setup

### System Requirements

| Component  | Linux     | macOS     | Windows |
| ---------- | --------- | --------- | ------- |
| Rust       | ✅        | ✅        | ✅      |
| Node.js    | ✅        | ✅        | ✅      |
| C Compiler | GCC/Clang | Xcode CLT | MSVC    |
| WebKit2GTK | ✅        | -         | -       |
| ~5GB Disk  | ✅        | ✅        | ✅      |

### Installation

**macOS:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update && sudo apt-get install -y \
  build-essential libssl-dev pkg-config \
  libwebkit2gtk-4.0-dev curl wget

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows:**

```powershell
# Install Visual Studio Build Tools from:
# https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"

# Install Rust from: https://rustup.rs/
# Run: rustup-init.exe
```

## Building

### Quick Build

```bash
cd investment-portfolio
chmod +x build-production.sh
./build-production.sh
```

**Duration:** 3-8 minutes depending on platform and caching

**Output:**

```
✅ Build completed successfully!
✓ Node.js bundled
✓ Backend compiled (X files)
✓ Frontend built (XXX kB)
✓ ...[platform-specific artifacts]...
✓ Ready to ship!
```

### What the Build Script Does

1. **Verifies Prerequisites** - Checks Cargo, Node.js, npm
2. **Downloads Node.js** - Platform-specific binary
3. **Builds NestJS Backend** - TypeScript → JavaScript
4. **Bundles Server** - Copies to Tauri resources
5. **Builds React Frontend** - Vite optimization
6. **Verifies Tauri Config** - Prepares packaging
7. **Compiles Desktop App** - Creates installers

### Build Artifacts by Platform

**Linux:**

- `src-tauri/target/release/app` - Direct binary (45 MB)
- `src-tauri/target/release/bundle/appimage/app_*.AppImage` - Portable (85 MB)
- `src-tauri/target/release/bundle/deb/app_*.deb` - Debian package (95 MB)

**macOS:**

- `src-tauri/target/release/bundle/macos/JCL Investment Portfolio.app` - Application bundle (160 MB)

**Windows:**

- `src-tauri/target/release/app.exe` - Direct executable (120 MB)
- `src-tauri/target/release/bundle/msi/app_*.msi` - Installer (130 MB)

## Linux Distribution

### AppImage (Recommended for end users)

**Advantages:**

- ✅ Works on any Linux distribution
- ✅ Single file, no dependencies
- ✅ Portable (run from USB)
- ✅ User-friendly

**Distribution:**

```bash
# After build, rename for clarity
cp src-tauri/target/release/bundle/appimage/app_*.AppImage \
   JCL-Investment-Portfolio-v1.0.0-x64.AppImage

# Generate checksums
sha256sum JCL-Investment-Portfolio-v1.0.0-x64.AppImage > checksums.txt

# Upload to GitHub Releases or website
# Users download and run:
chmod +x JCL-Investment-Portfolio-v1.0.0-x64.AppImage
./JCL-Investment-Portfolio-v1.0.0-x64.AppImage
```

### Debian Package

**Advantages:**

- ✅ System integration (Add/Remove Programs)
- ✅ Automatic dependency management
- ✅ Desktop shortcuts
- ✅ Professional packaging

**Distribution:**

```bash
# After build
ls src-tauri/target/release/bundle/deb/app_*.deb

# Test locally
sudo dpkg -i app_*.deb
jcl-investment-portfolio  # Run from menu or terminal

# Uninstall
sudo dpkg -r jcl-investment-portfolio
```

### Multi-Architecture

Build for multiple architectures (if available):

```bash
# Linux x64 (most common)
./build-production.sh  # Creates x64 artifacts

# Linux ARM64 (for Raspberry Pi, AWS Graviton)
# On ARM64 machine, also run:
./build-production.sh  # Creates arm64 artifacts
```

## macOS Distribution

### App Bundle

**Build creates:** `src-tauri/target/release/bundle/macos/JCL Investment Portfolio.app`

**Prerequisites for Distribution:**

- Apple Developer Account ($99/year)
- Company/personal signing certificate

**Code Signing & Notarization:**

```bash
APP_PATH="src-tauri/target/release/bundle/macos/JCL Investment Portfolio.app"

# 1. Sign the app
codesign --deep --force --verify \
  --sign "Developer ID Application: Your Name" "$APP_PATH"

# 2. Create ZIP for notarization
ditto -c -k --sequesterRsrc "$APP_PATH" \
  "JCL-Investment-Portfolio.zip"

# 3. Notarize (requires Apple ID)
xcrun notarytool submit "JCL-Investment-Portfolio.zip" \
  --apple-id your-apple-id@example.com \
  --password your-app-password \
  --team-id XXXXXXXXXX

# Wait for approval (5-10 minutes typically)
# Status check:
xcrun notarytool info REQUEST-ID-UUID \
  --apple-id your-apple-id@example.com

# 4. Staple approval to app
xcrun stapler staple "$APP_PATH"
```

**Create DMG Installer:**

```bash
hdiutil create -volname "JCL Investment Portfolio" \
  -srcfolder "$APP_PATH" \
  -ov -format UDZO \
  JCL-Investment-Portfolio-v1.0.0.dmg

# Distribute via GitHub Releases or website
```

**User Installation:**

1. Download DMG
2. Open DMG
3. Drag app to Applications folder
4. First run: Right-click → Open (bypass Gatekeeper)

## Windows Distribution

### MSI Installer (Professional)

**Build creates:** `src-tauri/target/release/bundle/msi/app_*.msi`

**Features:**

- ✅ Professional installer UI
- ✅ Add/Remove Programs integration
- ✅ Custom installation path
- ✅ Desktop shortcuts

**Distribution:**

```bash
# Complete installer ready in
.\src-tauri\target\release\bundle\msi\app_*.msi

# Distribute directly or via installer host
# Users run: msiexec /i app_*.msi
```

**Optional Code Signing:**

```powershell
# Requires Authenticode certificate

$cert = Get-PfxCertificate -FilePath certificate.pfx
$timestamp = "http://timestamp.comodoca.com/authenticode"

Set-AuthenticodeSignature `
  -FilePath ".\src-tauri\target\release\app.exe" `
  -Certificate $cert `
  -TimestampServer $timestamp
```

### Executable (Portable)

**Build creates:** `src-tauri/target/release/app.exe`

**Distribution:**

- Direct download and run
- No installation required
- Extract and execute

## Automated Multi-Platform Builds

### GitHub Actions CI/CD

Create `.github/workflows/build.yml`:

```yaml
name: Build & Release

on:
  push:
    tags:
      - "v*"

jobs:
  # Linux build
  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: |
          sudo apt-get update && sudo apt-get install -y \
            build-essential libssl-dev pkg-config \
            libwebkit2gtk-4.0-dev curl wget
      - name: Build
        run: ./build-production.sh
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: linux-${{ matrix.arch }}
          path: src-tauri/target/release/bundle/*
    strategy:
      matrix:
        arch: [x64, arm64]

  # macOS build
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: ./build-production.sh
      - name: Code Sign & Notarize (if secrets available)
        if: secrets.APPLE_ID
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: |
          # Signing script
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: macos
          path: src-tauri/target/release/bundle/macos

  # Windows build
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: .\build-production.sh
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows
          path: src-tauri/target/release/bundle/*

  # Create release
  release:
    needs: [build-linux, build-macos, build-windows]
    runs-on: ubuntu-latest
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v3
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: "**/*.[a-zA-Z0-9]*"
```

### Running Locally on All Platforms

Create shell script for testing:

```bash
#!/bin/bash
set -e

echo "🔨 Building for current platform..."
./build-production.sh

echo "✅ Build complete!"
echo "📂 Artifacts:"
find src-tauri/target/release -type f \( \
  -name "*.AppImage" -o \
  -name "*.msi" -o \
  -name "app" -o \
  -name "app.exe" -o \
  -name "*.dmg" \
) -exec ls -lh {} \;
```

## Size Management

### Component Sizes

| Item                 | Size           | Notes              |
| -------------------- | -------------- | ------------------ |
| Node.js Runtime      | 45-65 MB       | Platform-specific  |
| NestJS Backend       | 3-5 MB         | dist/ only         |
| Backend Dependencies | 80-120 MB      | node_modules       |
| React Frontend       | 2-4 MB         | Vite optimized     |
| Tauri Framework      | 30-50 MB       | Platform binary    |
| **Total Bundle**     | **160-240 MB** | Before compression |

### Optimization Tips

1. **Strip Node.js**

   ```bash
   # Remove unnecessary files before bundling
   rm -rf resources/node/share/doc
   rm -rf resources/node/share/man
   ```

2. **Minimize Dependencies**

   ```bash
   # Production only (no devDependencies)
   npm ci --production
   ```

3. **Release Build**
   ```bash
   # Cargo strips debug symbols
   cargo build --release
   ```

## Distribution Platforms

### GitHub Releases

```bash
# Create release with downloads
# Upload artifacts: .AppImage, .dmg, .msi, checksums

# Example files:
# - jcl-1.0.0-x64.AppImage
# - jcl-1.0.0-x64.AppImage.sha256
# - jcl-1.0.0.dmg
# - jcl-1.0.0.dmg.sha256
# - jcl-1.0.0-x64-installer.msi
# - jcl-1.0.0-x64-installer.msi.sha256
# - RELEASE_NOTES.md
```

### Website Download Page

```html
<section class="downloads">
  <h2>Download JCL Investment Portfolio</h2>

  <div class="platform">
    <h3>🐧 Linux</h3>
    <p>Works on any distribution</p>
    <a href="/downloads/jcl-1.0.0-x64.AppImage"> AppImage (85 MB) </a>
  </div>

  <div class="platform">
    <h3>🍎 macOS</h3>
    <p>Intel & Apple Silicon</p>
    <a href="/downloads/jcl-1.0.0.dmg"> DMG (160 MB) </a>
  </div>

  <div class="platform">
    <h3>🪟 Windows</h3>
    <p>Windows 10 & 11</p>
    <a href="/downloads/jcl-1.0.0-installer.msi"> MSI Installer (130 MB) </a>
  </div>
</section>
```

## Version Management

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

```bash
# Update version in all files
# 1. investment-portfolio/package.json
# 2. src-tauri/tauri.conf.json
# 3. server/package.json

# Create GitHub tag
git tag v1.2.3
git push origin v1.2.3

# GitHub Actions automatically builds when tag is pushed
```

### Changelog

Maintain `CHANGELOG.md`:

```markdown
## [1.2.3] - 2024-01-15

### Added

- New portfolio analysis widget
- Export to CSV functionality

### Fixed

- Transaction import bug
- Database synchronization issue

### Changed

- Improved UI responsiveness
- Optimized database queries
```

## Release Checklist

- [ ] Update version numbers (package.json, tauri.conf.json)
- [ ] Update CHANGELOG.md
- [ ] Run full test suite locally
- [ ] Build successfully on all platforms
- [ ] Test each artifact (Windows, macOS, Linux)
- [ ] Create git tag (v1.2.3)
- [ ] Push to GitHub (triggers CI)
- [ ] Verify CI builds complete
- [ ] Download and test CI artifacts
- [ ] Create GitHub Release with notes
- [ ] Generate checksums
- [ ] Update website downloads
- [ ] Announce release
