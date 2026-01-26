#!/bin/bash
# Script to push pure Tier-1 repository to GitHub

echo "=== PUSH PURE TIER-1 TO GITHUB ==="
echo ""
echo "This script will create a NEW GitHub repository with pure Tier-1 content."
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed."
    echo ""
    echo "MANUAL INSTRUCTIONS:"
    echo "1. Go to: https://github.com/new"
    echo "2. Create repository: SeekReap-Tier-1-PURE"
    echo "3. Follow the 'push an existing repository' instructions:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/SeekReap-Tier-1-PURE.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    exit 1
fi

echo "Creating new GitHub repository: SeekReap-Tier-1-PURE"
gh repo create SeekReap-Tier-1-PURE \
    --public \
    --description "Pure Tier-1 behavior contracts - 11 functions, zero contamination" \
    --confirm

echo ""
echo "Pushing pure Tier-1 content..."
git remote add origin https://github.com/$(gh api user | jq -r .login)/SeekReap-Tier-1-PURE.git
git branch -M main
git push -u origin main

echo ""
echo "✅ PURE TIER-1 REPOSITORY CREATED!"
echo "🔗 https://github.com/$(gh api user | jq -r .login)/SeekReap-Tier-1-PURE"
echo ""
echo "Verification steps:"
echo "1. Visit the repository link above"
echo "2. Verify ONLY these files are present:"
echo "   - README.md, LICENSE, requirements.txt"
echo "   - Purification documentation (*.md)"
echo "   - tier1_core/ directory with 5 behavior files"
echo "3. NO other files or directories should exist"
echo ""
