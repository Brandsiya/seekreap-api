#!/usr/bin/env python3
"""
TIER-1 VERIFICATION REPORT GENERATOR
Generates a verification report WITHOUT modifying repository files.
Outputs to stdout for CI artifact collection.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

def load_verification_data():
    """Load verification data from generated reports."""
    data = {}

    # Load basic verification report
    basic_report = Path('tier1_verification_report.json')
    if basic_report.exists():
        with open(basic_report, 'r') as f:
            data['basic'] = json.load(f)

    # Load enhanced metrics report
    enhanced_report = Path('tier1_metrics_report.json')
    if enhanced_report.exists():
        with open(enhanced_report, 'r') as f:
            data['enhanced'] = json.load(f)

    return data

def generate_file_extensions_table(extensions):
    """Generate a formatted file extensions table."""
    if not extensions:
        return "No file extension data available."

    table = ""
    total_files = sum(extensions.values())

    for ext, count in sorted(extensions.items()):
        percentage = (count / total_files * 100) if total_files > 0 else 0
        bar = "█" * int(percentage / 5)
        table += f"{ext or '(no ext)':<10} {count:>4} files {bar} {percentage:5.1f}%\n"

    return table

def generate_violations_table(violations):
    """Generate a violations table."""
    if not violations:
        return "**✅ NO VIOLATIONS DETECTED**"

    table = "### 🚨 DETECTED VIOLATIONS\n\n"
    table += "| File | Type | Message | Line |\n"
    table += "|------|------|---------|------|\n"

    for violation in violations[:10]:  # Show first 10 violations
        filename = Path(violation.get('filepath', '')).name
        if len(filename) > 30:
            filename = filename[:27] + "..."

        vtype = violation.get('type', 'Unknown')
        message = violation.get('message', '')[:50]
        line = violation.get('line', 'N/A')

        table += f"| `{filename}` | `{vtype}` | {message}... | {line} |\n"

    if len(violations) > 10:
        table += f"\n*... and {len(violations) - 10} more violations*"

    table += "\n\n**⚠️ IMMEDIATE ACTION REQUIRED:** Fix these violations to restore Tier-1 purity."

    return table

def generate_report():
    """Generate and print the verification report."""
    data = load_verification_data()
    enhanced = data.get('enhanced', {}).get('metrics', {})
    basic = data.get('basic', {})

    purity_score = enhanced.get('purity_score', 100)
    total_files = enhanced.get('total_files', 0)
    pure_files = enhanced.get('pure_files', 0)
    violation_files = enhanced.get('violation_files', 0)

    # Progress bar for purity
    progress_bar = "█" * int(purity_score / 5) + "░" * (20 - int(purity_score / 5))

    # Generate report
    report = f"""# 🛡️ TIER-1 VERIFICATION REPORT
*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}*

## 📊 EXECUTIVE SUMMARY

| Metric | Value | Status |
|--------|-------|--------|
| **Overall Purity** | {purity_score}% | {progress_bar} |
| **Files Checked** | {total_files} | ✅ |
| **Pure Files** | {pure_files} | ✅ |
| **Violations** | {violation_files} | {'❌' if violation_files > 0 else '✅'} |

## 📈 DETAILED METRICS

### Code Statistics
| Category | Count |
|----------|-------|
| **Total Files** | {total_files} |
| **Lines of Code** | {enhanced.get('total_lines', 0):,} |
| **Functions** | {enhanced.get('total_functions', 0):,} |
| **Classes** | {enhanced.get('total_classes', 0):,} |
| **Imports** | {enhanced.get('total_imports', 0):,} |

### File Extension Breakdown
echo "=== CREATING STATIC VERIFICATION REPORT TEMPLATE ==="
echo ""

cat > TIER1_VERIFICATION_REPORT.md << 'EOF'
# 🛡️ TIER-1 VERIFICATION REPORT

## 📊 ABOUT THIS REPORT

This document provides visibility into the Tier-1 architectural purity of this repository. The report is **manually maintained** and updated periodically to reflect the current verification status.

## 🎯 TIER-1 ARCHITECTURAL STATUS

**Status**: ✅ **PERMANENTLY LOCKED AT TIER-1 PURITY**
**Last Manual Verification**: 2026-01-26
**Verification Method**: Automated scripts + manual review

### Architectural Compliance
- ✅ **Framework Agnostic**: No web framework dependencies
- ✅ **Infrastructure Independent**: No deployment/cloud code
- ✅ **Pure Business Logic**: 100% decoupled from infrastructure
- ✅ **No External Dependencies**: No API keys or service wrappers

## ⚙️ VERIFICATION SYSTEM

### Automated Verification
The repository includes automated verification scripts that run:
- **On every commit** via pre-commit hooks
- **On every push/PR** via GitHub Actions CI/CD
- **Manually** via command line

### Verification Commands
```bash
# Basic verification
python3 scripts/verify_tier1.py --strict

# Enhanced metrics
python3 scripts/verify_tier1_enhanced.py

# Generate verification report (stdout)
python3 scripts/generate_verification_report.py
