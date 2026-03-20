# JCL Investment Portfolio - Desktop Bundle Architecture

## Overview

This document describes the complete bundled desktop application architecture for the JCL Investment Portfolio, which combines:

- **NestJS Backend** - Investment data processing and portfolio management
- **React Frontend** - Interactive investment dashboard
- **Tauri Framework** - Cross-platform desktop wrapper
- **Embedded Node.js** - Complete runtime packed with the app
- **SQLite Database** - Local data persistence via Prisma ORM

## Build Architecture

### 6-Step Automated Build Pipeline

```
[0] Prerequisites Check
    ├── Cargo (Rust toolchain)
    ├── Node.js (development)
    └── npm (package manager)
            ↓
[1] Node.js Bundling
    ├── Detect platform/arch
    ├── Download from nodejs.org
    ├── Extract to resources/node/
    └── Strip unnecessary files
            ↓
[2] NestJS Backend Build
    ├── Install dev dependencies
    ├── TypeScript → JavaScript
    ├── Generate dist/
    └── Report file count
            ↓
[3] Server Bundle Preparation
    ├── Copy dist/ to Tauri resources
    ├── Install production-only deps
    ├── Minimize bundle size
    └── Report size
            ↓
[4] React Frontend Build
    ├── Type checking
    ├── Vite bundling
    ├── Generate optimized dist/
    └── Report size
            ↓
[5] Tauri Config Verification
    ├── Validate tauri.conf.json
    ├── Extract version
    └── Prepare for packaging
            ↓
[6] Tauri Build
    ├── Compile Rust frontend
    ├── Bundle with all resources
    ├── Code sign (macOS)
    └── Generate installers
```

### Bundled Resources Structure

```
src-tauri/resources/
├── node/                          # Bundled Node.js runtime
│   ├── bin/
│   │   ├── node (executable)
│   │   └── npm
│   ├── lib/
│   │   └── node_modules/
│   └── ...stripped files...
│
├── server/                        # NestJS backend
│   ├── dist/
│   │   ├── src/                 # Compiled TypeScript
│   │   ├── package.json
│   │   └── ...
│   ├── node_modules/            # Production dependencies only
│   │   ├── @nestjs/common
│   │   ├── prisma
│   │   └── ...
│   └── package-lock.json
│
└── frontend/                      # React app (optional, frontend bundles to Vite dist)
    └── ... (if needed separately)
```

## Runtime Architecture

### Application Startup Sequence

1. **User launches executable**

   ```
   Windows: app.exe
   Linux:   ./app or app.AppImage
   macOS:   JCL Investment Portfolio.app
   ```

2. **Tauri initializes**

   ```
   ├── Load Tauri window configuration
   ├── Set up inter-process communication
   ├── Determine local data directory
   └── Start backend server
   ```

3. **Backend server starts**

   ```
   Node.js Runtime (resources/node/bin/node)
        ↓
   NestJS Server (resources/server/dist/main.js)
        ↓
   Listens on http://localhost:3001
   ```

4. **Database initialization**

   ```
   Prisma checks for database
   ├── Windows: %APPDATA%\jcl-investment-portfolio\database.sqlite
   ├── Linux:   ~/.local/share/jcl-investment-portfolio/database.sqlite
   └── macOS:   ~/.local/share/jcl-investment-portfolio/database.sqlite
        ↓
   Auto-migration on startup
   ```

5. **React frontend loads**
   ```
   Tauri WebView
        ↓
   Load bundled React app (dist/)
        ↓
   Connect to backend at localhost:3001
   ```

### Process Communication Flow

```
┌─────────────────┐
│   Tauri Window  │ (Rust process - file system, OS access)
│  (React v18)    │
└────────┬────────┘
         │ HTTP localhost:3001
         ↓
    ┌─────────────────────────────────────┐
    │  NestJS Backend (Node.js process)   │
    │  ├── Portfolio Service              │
    │  ├── Transaction Service            │
    │  ├── Report Service                 │
    │  └── Authentication Service         │
    └────────┬────────────────────────────┘
             │ SQL
             ↓
        ┌──────────────────┐
        │  SQLite Database │
        │  (local file)    │
        └──────────────────┘
```

## Platform-Specific Considerations

### Linux Distribution

**Artifact Types:**

- **Binary** (`src-tauri/target/release/app`)
  - Requires glibc, system WebKit libraries
  - Recommended for homogeneous environments
- **AppImage** (`.AppImage`)
  - Single-file executable
  - Bundles system dependencies
  - Works across distributions
  - Recommended for end-users
- **Debian Package** (`.deb`)
  - System integration (desktop shortcuts)
  - Dependency management via apt
  - Recommended for IT deployment

**Data Directory:** `~/.local/share/jcl-investment-portfolio/`

### macOS Distribution

**Artifact Type:**

- **Application Bundle** (`.app` directory)
  - Code-signed for Gatekeeper
  - Notarized for Big Sur+ compatibility
  - Drag-and-drop installation

**Requirements:**

- Target minimum macOS 10.13+
- Sign with developer certificate
- Notarize through Apple's service

**Data Directory:** `~/.local/share/jcl-investment-portfolio/`

### Windows Distribution

**Artifact Types:**

- **Executable** (`app.exe`)
  - Direct execution
  - No installation required
- **MSI Installer** (`.msi`)
  - System integration
  - Add/Remove Programs entry
  - Recommended for enterprise

**Requirements:**

- Target Windows 10 Build 19041+
- Optional: Code-sign executable

**Data Directory:** `%APPDATA%\jcl-investment-portfolio\`

## Size Optimization

### Component Sizes (Typical)

| Component            | Size           | Notes                     |
| -------------------- | -------------- | ------------------------- |
| Node.js Runtime      | 45-65 MB       | Platform-dependent        |
| NestJS Backend       | 3-5 MB         | dist/ only                |
| Backend Dependencies | 80-120 MB      | node_modules (production) |
| React Frontend       | 2-4 MB         | Vite optimized            |
| Tauri Framework      | 30-50 MB       | Platform-specific binary  |
| **Total Bundle**     | **160-240 MB** | Platform-dependent        |
| **Installed Size**   | **180-280 MB** | After decompression       |

### Size Reduction Strategies

1. **Strip Node.js**
   - Remove docs, man pages, examples
   - Saves ~20 MB per build

2. **Minimize Backend Deps**
   - Use `npm ci --production` only
   - Exclude dev dependencies (DefinitelyTyped)
   - Saves ~40 MB

3. **Optimize React Build**
   - Vite tree-shaking
   - Minification
   - Code splitting

4. **Tauri Optimizations**
   - Use release mode (`--release`)
   - Strip debug symbols
   - UPX compression (optional)

## Development Workflow

### Local Development (Unbundled)

```bash
# Terminal 1: Backend development
cd server
npm run dev          # Watches src/ → dist/

# Terminal 2: Frontend development
npm run dev          # Vite dev server on port 5173

# Terminal 3: Tauri preview
npm run tauri:dev    # Connects to localhost:5173 & 3001
```

### Production Build

```bash
./build-production.sh    # Single command, full build
```

### Testing Built App

```bash
# Linux
./src-tauri/target/release/app
# or
./src-tauri/target/release/bundle/appimage/app_*.AppImage

# macOS
open -a "src-tauri/target/release/bundle/macos/JCL Investment Portfolio.app"

# Windows
.\src-tauri\target\release\app.exe
# or run .msi installer
```

## Security Considerations

### Authentication

- Default root user created on first launch
- All transactions tracked by user
- Session-based authentication
- JWT tokens for API

### Data Protection

- SQLite database local-only
- Encrypted storage via Prisma
- HTTPS for remote APIs (if configured)
- No data sent to external servers

### Code Signing

**macOS:**

- Sign with Apple Developer Certificate
- Notarize through Apple's service
- Staple notarization ticket

**Windows:**

- Optional Authenticode signing
- Self-signed or CA-signed certificate
- Enables publisher verification

**Linux:**

- No signing required
- Provide GPG signatures for releases

## Distribution Methods

### Direct Download

1. Visit project releases
2. Download binary for platform
3. Extract and run

### Package Managers

**Linux (Debian/Ubuntu):**

```bash
sudo apt install ./jcl-investment-portfolio.deb
# Launch from applications menu
```

**macOS (Homebrew cask - optional):**

```bash
brew install jcl-investment-portfolio
```

**Windows (Chocolatey - optional):**

```bash
choco install jcl-investment-portfolio
```

### Update Strategy

- Embed version check in app
- Direct users to releases page
- Can implement auto-update via Tauri updater

## Troubleshooting

### Common Issues

**"Node.js not found"**

- Check `src-tauri/resources/node/bin/` exists
- Rebuild with `./build-production.sh`

**"Cannot connect to backend"**

- Verify port 3001 not in use
- Check backend logs in data directory
- Restart application

**"Database locked"**

- SQLite connection issue
- Kill any zombie node processes
- Delete `.sqlite-shm` temp files

**"WebView initialization failed"**

- Linux: Install WebKit dependencies (`sudo apt install libwebkit2gtk-4.0-dev`)
- macOS: Xcode CommandLine Tools required
- Windows: WebView2 runtime needed

## Future Improvements

1. **Auto-Updates**
   - Integrate Tauri updater
   - Delta updates for smaller downloads

2. **Native Modules**
   - Use node-gyp for performance-critical code
   - Precompiled binaries for platforms

3. **Offline Mode**
   - Service worker for offline data access
   - Sync when reconnected

4. **Progressive Web App**
   - Alternate distribution as web app
   - Hybrid desktop+web strategy

## Build Matrix

Recommended CI/CD build matrix:

| OS                   | Architecture | Artifact       |
| -------------------- | ------------ | -------------- |
| Linux (Ubuntu 20.04) | x64          | AppImage, .deb |
| Linux (Ubuntu 20.04) | arm64        | AppImage, .deb |
| macOS                | x64 + arm64  | Universal .app |
| Windows              | x64          | .exe, .msi     |

Each builds and signs independently, then combines into releases.
