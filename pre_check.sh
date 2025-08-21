#!/bin/bash

# Exit on any error
set -e

# Check if required commands exist
if ! command -v npm &> /dev/null; then
    echo "Error: npm command not found. Please install Node.js and npm."
    exit 1
fi

if ! command -v uv &> /dev/null; then
    echo "Error: uv command not found. Please install uv (Python package manager)."
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "Error: git command not found. Please install git."
    exit 1
fi

# CDK
pushd cdk

# Check if node_modules exists, if not run npm ci
if [ ! -d "node_modules" ]; then
    echo "node_modules not found in cdk directory. Running npm ci..."
    npm ci
fi

npm run lint

popd

# Web
pushd web

# Check if node_modules exists, if not run npm ci
if [ ! -d "node_modules" ]; then
    echo "node_modules not found in web directory. Running npm ci..."
    npm ci
fi

npm run lint
npm run build

popd

# API
pushd api

# Check if .venv exists or if ruff is not installed
if [ ! -d ".venv" ] || ! uv pip list | grep -q "ruff"; then
    echo "Virtual environment not found or ruff not installed. Running uv sync --group=lint..."
    uv sync --group=lint
fi

uv run ruff check --fix .
uv run ruff format .

popd

echo "All checks passed successfully!"
