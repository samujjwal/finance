# JCL Investment Portfolio - Desktop Application Guide

## Overview

This is a complete production desktop application that bundles:

- **Backend**: NestJS server (Node.js) running on port 3001
- **Frontend**: React application with Vite
- **Desktop**: Tauri wrapper for native desktop experience
- **Database**: SQLite with auto-initialization

## Features

✓ **One-click installation** - Everything is bundled, database creates automatically  
✓ **Auto-server startup** - NestJS server starts automatically when app opens  
✓ **Zero configuration** - Database created in user's app data directory  
✓ **Seamless sync** - Desktop app monitors server health and shows status  
✓ **Root user auto-setup** - First run creates root user (root/password123#)  
✓ **Cross-platform** - Available for Windows, macOS, and Linux

## Building the Desktop App

### Requirements

- Node.js 20.19+ and npm
- Rust and Cargo (for Tauri)
- Git

### Quick Build

```bash
# Make build script executable
chmod +x build-production.sh

# Run the production build
./build-production.sh
```

This will:

1. Build NestJS backend (TypeScript → JavaScript)
2. Bundle Node.js runtime and server files
3. Build React frontend with Vite
4. Compile Tauri desktop wrapper
5. Generate native installers/bundles

### Build Output

The final application bundles will be in `src-tauri/target/release/`:

**Linux:**

- `bundle/appimage/app_*.AppImage` - Portable AppImage
- `bundle/deb/app_*.deb` - Debian package

**macOS:**

- `bundle/macos/JCL Investment Portfolio.app` - Application bundle

**Windows:**

- `app.exe` - Portable executable
- `bundle/msi/*.msi` - Windows installer

## Application Architecture

### Directory Structure

```
investment-portfolio/
├── server/                 # NestJS backend
│   ├── src/               # TypeScript source
│   ├── dist/              # Compiled JavaScript
│   └── package.json
├── src/                   # React frontend
│   ├── components/
│   ├── services/
│   ├── App.tsx
│   └── index.html
├── src-tauri/             # Tauri desktop wrapper
│   ├── src/
│   │   ├── main.rs        # Tauri Rust code
│   │   └── server_manager.rs  # Server management
│   └── resources/
│       └── server/        # Bundled server (created at build time)
└── build-production.sh    # Build script
```

### Data Flow

1. **User launches desktop app** → Tauri wrapper starts
2. **Tauri setup runs** → Starts NestJS server if not running
3. **Server initializes** → Creates database if needed, seeds fee rates
4. **React app loads** → Connects to `http://localhost:3001`
5. **Portfolio features work** → All data stored locally in SQLite

### Database Location

- **Linux/macOS**: `~/.local/share/jcl-investment-portfolio/investment_portfolio.db`
- **Windows**: `%APPDATA%\jcl-investment-portfolio\investment_portfolio.db`

## Development vs Production

### Development Mode

```bash
npm run tauri:dev
```

- Hot-reload for React components
- Server runs in development mode
- Connect to `http://localhost:1420`

### Production Mode

```bash
./build-production.sh
```

- Optimized JavaScript/CSS bundles
- Compiled Rust binary
- Server bundled inside executable
- All assets embedded

## Server Management Commands

The Tauri app provides these commands to manage the server:

### TypeScript/Frontend API

```typescript
import { tauriServerCommands } from "@/services/tauri-server";

// Start the server
await tauriServerCommands.startServer();

// Stop the server
await tauriServerCommands.stopServer();

// Check if server is running
const isRunning = await tauriServerCommands.isServerRunning();

// Get detailed server status
const status = await tauriServerCommands.getServerStatus();

// Get database path
const dbPath = await tauriServerCommands.getDatabasePath();

// Get API URL
const apiUrl = await tauriServerCommands.getApiUrl();
```

## First-Run Setup

When the user first launches the app:

1. **Database Creation**
   - SQLite database created automatically
   - Schema initialized from Prisma migrations
   - Fee rates table seeded (28 rows of NEPSE data)

2. **Root User Creation**
   - Auto-created root user
   - Username: `root`
   - Password: `password123#`
   - Role: ROOT (unrestricted access)

3. **Setup Wizard**
   - Prompts for new user creation
   - Provides optional Excel import
   - Shows completion status

## Authentication

### Root User

- Created automatically on first run
- Used for administrative setup
- Credentials: root / password123#

### Customer Users

- Created via Setup Wizard
- Can log in after creation
- Restricted to portfolio management features

## Fee Rates & Tax Configuration

The app includes a complete NEPSE fee structure:

### Equity Brokerage (Tiered)

- 0-50,000: 0.36%
- 50,001-100,000: 0.30%
- 100,001-500,000: 0.27%
- 500,001-1,000,000: 0.25%
- 1,000,000+: 0.24%

### Fixed Charges

- SEBON: 0.015%
- DP Charge: Rs. 25 flat

### Capital Gains Tax

- Individual Short-term: 7.5%
- Individual Long-term: 5%
- Institutional: 10%

All rates are stored in the database and can be updated via the admin interface.

## Troubleshooting

### Server Won't Start

1. Check database directory permissions
2. Ensure port 3001 is not in use
3. Check logs in the app's data directory

### Database Issues

1. Delete the database file to reset (all data lost)
2. Restart the app to recreate database

### Network Connectivity

1. Ensure desktop app can access `http://localhost:3001`
2. Check firewall settings
3. Verify Node.js process is running (check task manager)

## Performance Optimization

### For Deployment

- Build script automatically optimizes assets
- Frontend minified and bundled with Vite
- Backend compiled to optimized JavaScript
- Assets cached efficiently

### For Users

- All computation done locally
- No external service dependencies
- Fast startup time (~2-3 seconds)
- Minimal memory footprint

## Security Considerations

1. **Local-only**: Application runs entirely locally
2. **No telemetry**: No data sent outside the computer
3. **SQLite file**: Encryption can be added to database file
4. **Port binding**: Server only accessible on localhost
5. **CORS**: Configured only for local Tauri port

## Updating the Application

### For Developers:

1. Make code changes
2. Run `./build-production.sh`
3. Distribute new installer

### For Users:

1. Download new installer
2. Close running application
3. Run new installer (overwrites previous installation)
4. Data is preserved (stored in app data directory, not installation directory)

## Support & Documentation

- **Setup Guide**: See `docs/` folder
- **API Documentation**: Available at `http://localhost:3001/api/docs` when server is running
- **Source Code**: Available on production bundle creation

---

**Version**: 1.0.0  
**Built With**: NestJS, React, Tauri, SQLite  
**License**: MIT
