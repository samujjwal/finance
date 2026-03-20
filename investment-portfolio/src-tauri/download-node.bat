@echo off
REM Download and setup Node.js runtime for Windows bundling
REM Downloads Node.js v18.19.0 for bundling into desktop app

setlocal enabledelayedexpansion

set NODE_VERSION=18.19.0
set BASE_URL=https://nodejs.org/dist/v%NODE_VERSION%
set SCRIPT_DIR=%~dp0
set RESOURCES_DIR=%SCRIPT_DIR%resources\node

REM Detect architecture
for /f "tokens=*" %%A in ('wmic os get osarchitecture /value ^| find "64"') do (
    set ARCH=x64
)
if not defined ARCH (
    set ARCH=x86
)

set NODE_FILE=node-v%NODE_VERSION%-win-%ARCH%.zip
set NODE_ARCHIVE=%RESOURCES_DIR%\%NODE_FILE%

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
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%BASE_URL%/%NODE_FILE%', '%NODE_ARCHIVE%')}"

if errorlevel 1 (
    echo ✗ Failed to download Node.js
    exit /b 1
)
echo ✓ Downloaded

:extract
echo.
echo Extracting Node.js...

REM Use PowerShell to extract zip
powershell -Command "& {Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%NODE_ARCHIVE%', '%RESOURCES_DIR%')}"

if errorlevel 1 (
    echo ✗ Extraction failed
    exit /b 1
)

REM Move to consistent location
if exist "%RESOURCES_DIR%\node-v%NODE_VERSION%-win-%ARCH%" (
    mkdir "%RESOURCES_DIR%\bin" 2>nul
    move "%RESOURCES_DIR%\node-v%NODE_VERSION%-win-%ARCH%\node.exe" "%RESOURCES_DIR%\bin\node.exe" >nul 2>&1
    move "%RESOURCES_DIR%\node-v%NODE_VERSION%-win-%ARCH%\npm.cmd" "%RESOURCES_DIR%\bin\npm.cmd" >nul 2>&1
    rmdir /s /q "%RESOURCES_DIR%\node-v%NODE_VERSION%-win-%ARCH%" 2>nul
    echo ✓ Extracted to bin\
)

echo.
echo ✓ Node.js v%NODE_VERSION% ready for bundling
echo Location: %RESOURCES_DIR%\bin\node.exe

endlocal
