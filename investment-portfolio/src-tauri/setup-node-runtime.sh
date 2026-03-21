#!/bin/bash

# Node.js Runtime Setup Script for JCL Investment Portfolio
# This script downloads and sets up Node.js runtime for bundling

set -e

NODE_VERSION="20.19.0"
ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

# Determine Node.js download URL
case "$OS" in
  linux*)
    case "$ARCH" in
      x86_64) NODE_ARCH="x64" ;;
      aarch64) NODE_ARCH="arm64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    FILENAME="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
    BASE_URL="https://nodejs.org/dist/v${NODE_VERSION}"
    ;;
  darwin*)
    case "$ARCH" in
      x86_64) NODE_ARCH="x64" ;;
      arm64) NODE_ARCH="arm64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    FILENAME="node-v${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
    BASE_URL="https://nodejs.org/dist/v${NODE_VERSION}"
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

echo "Setting up Node.js ${NODE_VERSION} for ${OS}-${ARCH}..."
echo "Downloading: ${FILENAME}"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Download Node.js
curl -L "${BASE_URL}/${FILENAME}" -o node.tar.gz

# Verify download
if [ ! -f node.tar.gz ]; then
    echo "Failed to download Node.js"
    exit 1
fi

# Extract Node.js
if [[ "$FILENAME" == *.tar.xz ]]; then
    tar -xf node.tar.gz
else
    tar -xzf node.tar.gz
fi

# Move to resources directory
NODE_DIR="node-v${NODE_VERSION}-${OS}-${NODE_ARCH}"
RESOURCES_DIR="$(dirname "$0")/../resources/node"

# Clean up existing installation
rm -rf "$RESOURCES_DIR/bin"

# Copy Node.js binaries
mkdir -p "$RESOURCES_DIR/bin"
cp -r "$NODE_DIR/bin" "$RESOURCES_DIR/"
cp -r "$NODE_DIR/lib" "$RESOURCES_DIR/" 2>/dev/null || true

# Make binaries executable
chmod +x "$RESOURCES_DIR/bin/node"
chmod +x "$RESOURCES_DIR/bin/npm"
chmod +x "$RESOURCES_DIR/bin/npx" 2>/dev/null || true

# Create version file
echo "$NODE_VERSION" > "$RESOURCES_DIR/VERSION"

# Cleanup
cd /
rm -rf "$TEMP_DIR"

echo "Node.js runtime setup complete!"
echo "Node.js version: $("$RESOURCES_DIR/bin/node" --version)"
echo "Installation path: $RESOURCES_DIR"
