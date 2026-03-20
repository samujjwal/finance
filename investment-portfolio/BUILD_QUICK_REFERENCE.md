# Quick Reference: Bundled Desktop App Build System

## One-Command Build

```bash
./build-production.sh
```

**What it does:** Full build pipeline for current platform (≈3-8 min)  
**Output:** Platform-specific installers + bundled Node.js

## Build Outputs

| OS          | File                           | Type           | Size   |
| ----------- | ------------------------------ | -------------- | ------ |
| **Linux**   | `app_*.AppImage`               | Portable app   | 85 MB  |
| **Linux**   | `app_*.deb`                    | System package | 95 MB  |
| **macOS**   | `JCL Investment Portfolio.app` | App bundle     | 160 MB |
| **Windows** | `app_*.msi`                    | Installer      | 130 MB |
| **Windows** | `app.exe`                      | Executable     | 120 MB |

All located in: `src-tauri/target/release/bundle/`

## Prerequisites

### macOS

```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Linux

```bash
sudo apt-get install -y build-essential libssl-dev pkg-config libwebkit2gtk-4.0-dev curl
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Windows

- Install Visual Studio Build Tools (Desktop C++)
- Run: rustup-init.exe from https://rustup.rs/

## Key Files

| File                             | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `build-production.sh`            | Main build script (6-step pipeline) |
| `src-tauri/download-node.sh`     | Linux/macOS Node.js bundler         |
| `src-tauri/download-node.bat`    | Windows Node.js bundler             |
| `src-tauri/resources/node/`      | Bundled Node.js runtime             |
| `src-tauri/resources/server/`    | NestJS backend bundle               |
| `DEPLOYMENT_GUIDE.md`            | Full distribution guide             |
| `DESKTOP_BUNDLE_ARCHITECTURE.md` | Technical architecture              |

## Build Steps (Automated)

```
[0/6] Prerequisites check
      ├─ Cargo ✓
      ├─ Node.js ✓
      └─ npm ✓
[1/6] Bundle Node.js
[2/6] Build NestJS backend
[3/6] Bundle server (production deps)
[4/6] Build React frontend
[5/6] Verify Tauri config
[6/6] Compile desktop app
```

## Bundled Components

- **Node.js 18.19.0** - Runtime (stripped, ~50 MB)
- **NestJS Backend** - API server (~5 MB compiled)
- **React 19 Frontend** - UI (~3 MB bundled)
- **SQLite** - Database (via Prisma ORM)
- **Tauri** - Desktop framework (~40 MB)

**Total:** 160-240 MB per platform

## Distribution Quick Steps

### Linux

```bash
# AppImage (recommended)
cp src-tauri/target/release/bundle/appimage/app_*.AppImage \
   jcl-investment-portfolio.AppImage
chmod +x jcl-investment-portfolio.AppImage
./jcl-investment-portfolio.AppImage
```

### macOS

```bash
# App bundle
open "src-tauri/target/release/bundle/macos/JCL Investment Portfolio.app"

# For distribution: wrap in DMG
hdiutil create -volname "JCL Investment Portfolio" \
  -srcfolder "src-tauri/target/release/bundle/macos/JCL Investment Portfolio.app" \
  -ov -format UDZO \
  JCL-Portfolio.dmg
```

### Windows

```bash
# Direct MSI installer
msiexec /i src-tauri/target/release/bundle/msi/app_*.msi

# Or portable EXE
.\src-tauri\target\release\app.exe
```

## Data Storage Location

- **Linux/macOS**: `~/.local/share/jcl-investment-portfolio/`
- **Windows**: `%APPDATA%\jcl-investment-portfolio\`

## Common Issues

| Issue                       | Solution                                                        |
| --------------------------- | --------------------------------------------------------------- |
| Build fails on dependencies | `sudo apt-get install -y build-essential libwebkit2gtk-4.0-dev` |
| Node.js not bundled         | Check `src-tauri/resources/node/bin/node` exists                |
| WebView not found           | Linux: install libwebkit2gtk-4.0-dev                            |
| Can't sign macOS app        | Requires Apple Developer Account + certificate                  |
| Windows build fails         | Install Visual Studio Build Tools (C++ desktop dev)             |

## Performance Metrics

- **Startup time:** 2-3 seconds
- **Memory footprint:** 150-200 MB
- **Database:** SQLite (local file)
- **API response:** <100ms (localhost)

## Version Management

```bash
# Update version in:
# 1. investment-portfolio/package.json
# 2. src-tauri/tauri.conf.json
# 3. server/package.json

# Create release tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions automatically builds when tag pushed
```

## Development vs Production

```bash
# Development
npm run tauri:dev          # Hot reload, debugging

# Production
./build-production.sh      # Optimized, bundled, signed
```

## Size Optimization

- Strip Node.js: Remove `/share/doc`, `/share/man` (~20 MB saved)
- Production deps only: `npm ci --production` (~40 MB saved)
- Tauri release mode: Automatic debug stripping
- Vite tree-shaking: Automatic code splitting

## Platform-Specific Commands

### List all artifacts

```bash
find src-tauri/target/release -name "app*" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.msi" -o -name "*.dmg"
```

### Test Linux artifact

```bash
./src-tauri/target/release/app                    # Direct binary
./src-tauri/target/release/bundle/appimage/app_*.AppImage  # AppImage
```

### Test macOS artifact

```bash
open "src-tauri/target/release/bundle/macos/JCL Investment Portfolio.app"
```

### Test Windows artifact

```powershell
.\src-tauri\target\release\app.exe                # Direct exe
msiexec /i .\src-tauri\target\release\bundle\msi\app_*.msi  # MSI
```

## Documentation

- **Architecture**: See [DESKTOP_BUNDLE_ARCHITECTURE.md](./DESKTOP_BUNDLE_ARCHITECTURE.md)
- **Deployment**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Build Script**: [build-production.sh](./build-production.sh)

## Release Checklist

- [ ] Update version (3 files)
- [ ] Update CHANGELOG.md
- [ ] Run ./build-production.sh
- [ ] Test all artifacts
- [ ] Create git tag
- [ ] Push to GitHub (triggers CI)
- [ ] Download CI artifacts
- [ ] Create GitHub Release
- [ ] Generate checksums
- [ ] Update website
- [ ] Announce release

## Troubleshoot Build

```bash
# Clean and rebuild
rm -rf src-tauri/target
./build-production.sh

# Verbose output
RUST_LOG=debug ./build-production.sh

# Check Node.js bundled
ls -la src-tauri/resources/node/bin/

# Check server bundled
ls -la src-tauri/resources/server/dist/
```

---

**TL;DR:** `./build-production.sh` → complete, cross-platform, production-ready desktop app with bundled Node.js
