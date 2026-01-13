#!/bin/bash
set -e

# Get the script directory (where vercel.json is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing dependencies from: $SCRIPT_DIR"

# Install backend dependencies
if [ -d "$SCRIPT_DIR/backend" ] && [ -f "$SCRIPT_DIR/backend/package.json" ]; then
  echo "Installing backend dependencies..."
  cd "$SCRIPT_DIR/backend"
  npm install
  cd "$SCRIPT_DIR"
else
  echo "Backend directory or package.json not found, skipping..."
fi

# Install frontend dependencies  
if [ -d "$SCRIPT_DIR/frontend" ] && [ -f "$SCRIPT_DIR/frontend/package.json" ]; then
  echo "Installing frontend dependencies..."
  cd "$SCRIPT_DIR/frontend"
  npm install
  cd "$SCRIPT_DIR"
else
  echo "Frontend directory or package.json not found, skipping..."
fi

echo "Installation complete!"
