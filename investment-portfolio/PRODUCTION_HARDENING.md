# JCL Investment Portfolio - Production Hardening Guide

## Overview
This document outlines the production hardening and deployment process for the JCL Investment Portfolio desktop application.

## Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js Express server
- **Desktop Runtime**: Tauri (Rust)
- **Database**: SQLite (bundled)

## Security Features

### 1. Content Security Policy (CSP)
- Restricts resource loading to trusted sources
- Prevents XSS attacks
- Limits external connections to localhost backend only

### 2. Process Isolation
- Node.js runtime runs in separate process
- Automatic restart on failure
- Process monitoring with health checks

### 3. Error Handling & Logging
- Comprehensive error logging to files
- Crash report generation
- Panic handling with stack traces

## Production Build Process

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js dependencies
npm ci
```

### Build Commands
```bash
# Production build with bundled Node.js runtime
./build-production.sh

# Or manual build:
npm run build
cd src-tauri && cargo build --release
```

## Deployment Structure
```
jcl-investment-portfolio/
├── jcl-investment-portfolio     # Main executable
├── start.sh/bat/command          # Startup script
├── resources/
│   ├── node/                     # Bundled Node.js runtime
│   └── backend/                  # Backend server files
├── reports/                      # Data files
├── investment_portfolio.db       # SQLite database
├── logs/                         # Application logs (created at runtime)
├── crashes/                      # Crash reports (created on failure)
└── VERSION.txt                   # Build information
```

## Runtime Features

### Auto-Recovery System
- **Process Monitoring**: Checks Node.js process every 5 seconds
- **Automatic Restart**: Restarts failed backend automatically
- **Health Checks**: Backend health endpoint monitoring
- **Graceful Shutdown**: Proper cleanup on application exit

### Logging System
- **Console Output**: Real-time logging to stdout
- **File Logging**: Rotating log files in `logs/` directory
- **Error Levels**: Debug, Info, Warning, Error
- **Crash Reports**: Detailed crash information in `crashes/` directory

### Security Measures
- **Sandboxed Backend**: Backend runs with limited privileges
- **Local Only**: Backend only accepts localhost connections
- **Resource Limits**: Memory and process monitoring
- **Secure CSP**: Restricts frontend resource access

## Monitoring & Maintenance

### Process Status
The application includes a Process Monitor component that shows:
- Node.js runtime status
- Backend server status
- Last restart timestamp
- Manual restart capability

### Log Locations
- **Application Logs**: `logs/jcl-investment-YYYY-MM-DD.log`
- **Crash Reports**: `crashes/crash-YYYYMMDD_HHMMSS.txt`
- **Backend Logs**: Included in application logs

### Health Checks
- **Frontend**: Process monitoring UI
- **Backend**: `GET /health` endpoint
- **Database**: SQLite file integrity checks

## Troubleshooting

### Common Issues

#### Backend Won't Start
1. Check logs for error messages
2. Verify Node.js runtime installation
3. Check port 3001 availability
4. Manually restart via Process Monitor

#### Application Crashes
1. Check `crashes/` directory for crash reports
2. Review application logs
3. Verify database file integrity
4. Check system resources

#### Performance Issues
1. Monitor memory usage in logs
2. Check database file size
3. Review backend response times
4. Verify system resources

### Recovery Procedures

#### Manual Backend Restart
```bash
# Via application UI
1. Open Process Monitor
2. Click "Restart Backend" button

# Via command line
./jcl-investment-portfolio --restart-backend
```

#### Database Recovery
```bash
# Backup current database
cp investment_portfolio.db investment_portfolio.db.backup

# Restore from backup (if available)
cp backups/portfolio_YYYY-MM-DD.db investment_portfolio.db
```

## Performance Optimization

### Build Optimizations
- **Release Mode**: Optimized Rust compilation
- **Bundle Size**: Minified frontend assets
- **Resource Compression**: Compressed assets in distribution

### Runtime Optimizations
- **Process Pooling**: Reused Node.js processes
- **Memory Management**: Automatic garbage collection
- **Connection Pooling**: Database connection reuse

## Security Best Practices

### Data Protection
- **Local Storage**: All data stored locally
- **Encryption**: Sensitive data encryption (future enhancement)
- **Access Control**: Process isolation and privilege separation

### Network Security
- **Local Only**: Backend only accepts localhost connections
- **CSP Headers**: Restrict resource loading
- **No External Dependencies**: Self-contained application

## Updates & Maintenance

### Version Management
- **Semantic Versioning**: Follow SemVer guidelines
- **Build Information**: Version details in VERSION.txt
- **Checksum Verification**: SHA256 checksums for integrity

### Update Process
1. Backup current installation
2. Stop running application
3. Replace application files
4. Verify database compatibility
5. Start new version
6. Monitor for issues

## Support

### Contact Information
- **Development Team**: JCL Investment
- **Documentation**: See project README
- **Issues**: Report via project issue tracker

### Support Information to Include
- Application version (from VERSION.txt)
- Operating system and version
- Error logs and crash reports
- Steps to reproduce issue
