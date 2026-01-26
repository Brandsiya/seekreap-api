#!/bin/bash
# Tier-1 Development Environment Setup

echo "🚀 Setting up Tier-1 development environment..."
echo "=============================================="

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python found: $(python3 --version)"
else
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

# Install tools
echo ""
echo "Installing development tools..."
pip install --upgrade pip

# Create virtual environment (optional)
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    echo "✅ Virtual environment created"
fi

echo ""
echo "✅ Tier-1 environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Activate virtual environment: source .venv/bin/activate"
echo "2. Install dependencies: pip install -r requirements.txt"
echo "3. Run verification: python scripts/verify_tier1.py"
echo "4. Install pre-commit: pip install pre-commit && pre-commit install"
echo ""
echo "🛡️ Remember: This repository is permanently locked at Tier-1 purity."
