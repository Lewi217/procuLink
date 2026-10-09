#!/bin/bash

# Ensure script stops on first error
set -e

echo "Setting up ProcuLink virtual environment..."

# Check if uv is installed, if not install it
if ! command -v uv &> /dev/null
then
    echo "uv could not be found, installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # Source bashrc/zshrc or export PATH if necessary, but uv installer usually advises on that.
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo "Creating virtual environment using uv..."
uv venv

echo "Syncing dependencies..."
uv sync

echo "Setup complete! Run 'source .venv/bin/activate' to activate your environment."
