@echo off
REM Download and setup Node.js runtime for Windows bundling
REM Downloads Node.js v20.19.0 for bundling into desktop app

setlocal enabledelayedexpansion

set NODE_VERSION=20.19.0
set BASE_URL=https://nodejs.org/dist/v%NODE_VERSION%
set SCRIPT_DIR=%~dp0
set RESOURCES_DIR=%SCRIPT_DIR%resources\node

REM Detect architecture
if /I "%PROCESSOR_ARCHITECTURE%"=="ARM64" set ARCH=arm64
if /I "%PROCESSOR_ARCHITEW6432%"=="ARM64" set ARCH=arm64
if /I "%PROCESSOR_ARCHITECTURE%"=="AMD64" set ARCH=x64
if /I "%PROCESSOR_ARCHITEW6432%"=="AMD64" set ARCH=x64
if not defined ARCH for /f "tokens=*" %%A in ('wmic os get osarchitecture /value ^| find "64"') do (
    set ARCH=x64
)
if not defined ARCH (
    set ARCH=x86
)

set NODE_FILE=node-v%NODE_VERSION%-win-%ARCH%.zip
set NODE_ARCHIVE=%RESOURCES_DIR%\%NODE_FILE%
set NODE_HOME=%RESOURCES_DIR%\node-v%NODE_VERSION%-win-%ARCH%

echo.
echo ========================================
echo Node.js Bundle Setup for Windows
echo ========================================
echo Detected: Windows %ARCH%
echo Archive: %NODE_FILE%

REM Create directory
if not exist "%RESOURCES_DIR%" mkdir "%RESOURCES_DIR%"

REM Check if already downloaded
if exist "%NODE_ARCHIVE%" (
    echo ✓ Archive already exists
    goto extract
)

echo.
echo Downloading Node.js v%NODE_VERSION%...
powershell -NoProfile -Command "& {$source='%BASE_URL%/%NODE_FILE%'; $destination='%NODE_ARCHIVE%'; try { Start-BitsTransfer -Source $source -Destination $destination -ErrorAction Stop } catch { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile($source, $destination) }}"

if errorlevel 1 (
    echo ✗ Failed to download Node.js
    exit /b 1
)
echo ✓ Downloaded

:extract
echo.
echo Extracting Node.js...

if exist "%NODE_HOME%\node.exe" goto stage

REM Use PowerShell to extract zip
powershell -Command "& {Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%NODE_ARCHIVE%', '%RESOURCES_DIR%')}"

if errorlevel 1 (
    echo ✗ Extraction failed
    exit /b 1
)

REM Move to consistent location
:stage
if exist "%NODE_HOME%" (
    mkdir "%RESOURCES_DIR%\bin" 2>nul
    mkdir "%RESOURCES_DIR%\bin\node_modules" 2>nul
    copy "%NODE_HOME%\node.exe" "%RESOURCES_DIR%\bin\node.exe" >nul 2>&1
    copy "%NODE_HOME%\npm.cmd" "%RESOURCES_DIR%\bin\npm.cmd" >nul 2>&1
    copy "%NODE_HOME%\npx.cmd" "%RESOURCES_DIR%\bin\npx.cmd" >nul 2>&1
    copy "%NODE_HOME%\npm" "%RESOURCES_DIR%\bin\npm" >nul 2>&1
    copy "%NODE_HOME%\npx" "%RESOURCES_DIR%\bin\npx" >nul 2>&1
    xcopy "%NODE_HOME%\node_modules\npm" "%RESOURCES_DIR%\bin\node_modules\npm\" /E /I /Y >nul 2>&1
    echo ✓ Extracted to bin\
)

echo.
echo ✓ Node.js v%NODE_VERSION% ready for bundling
echo Location: %RESOURCES_DIR%\bin\node.exe

endlocal
