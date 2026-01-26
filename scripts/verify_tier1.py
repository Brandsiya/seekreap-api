#!/usr/bin/env python3
"""
TIER-1 PURITY VERIFICATION SCRIPT
Validates that repository maintains Tier-1 architectural purity.
"""

import os
import sys
import ast
import json
import argparse
from pathlib import Path
from typing import List, Dict

# Tier-1 purity rules
FORBIDDEN_IMPORTS = [
    'django', 'flask', 'fastapi', 'starlette', 'sanic', 'tornado',
    'boto3', 'aws', 'azure', 'google.cloud', 'gcp',
    'sqlalchemy', 'sqlmodel', 'psycopg2', 'mysql', 'redis',
    'celery', 'kombu', 'docker', 'kubernetes', 'sentry',
    'requests', 'httpx', 'authlib'
]

FORBIDDEN_FILE_PATTERNS = [
    'Dockerfile', 'docker-compose', 'render.yaml', 'railway.json',
    'serverless.yml', '.env', '.github/workflows', 'terraform'
]

class Tier1Violation:
    def __init__(self, filepath: str, violation_type: str, message: str, line: int = None):
        self.filepath = filepath
        self.violation_type = violation_type
        self.message = message
        self.line = line

    def __str__(self):
        loc = f"Line {self.line}" if self.line else "File"
        return f"[{self.violation_type}] {loc}: {self.filepath} - {self.message}"

def check_python_file(filepath: Path) -> List[Tier1Violation]:
    violations = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read())

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    for forbidden in FORBIDDEN_IMPORTS:
                        if forbidden in alias.name:
                            violations.append(Tier1Violation(
                                str(filepath),
                                "FORBIDDEN_IMPORT",
                                f"Import '{alias.name}' contains '{forbidden}'",
                                node.lineno if hasattr(node, 'lineno') else None
                            ))
    except (SyntaxError, UnicodeDecodeError):
        pass

    return violations

def analyze_repository(root_dir: Path):
    all_violations = []
    stats = {'files_checked': 0, 'python_files': 0}

    for filepath in root_dir.rglob('*'):
        if any(ignore in str(filepath) for ignore in ['.git', '__pycache__', '.venv']):
            continue

        stats['files_checked'] += 1

        # Check file patterns
        for pattern in FORBIDDEN_FILE_PATTERNS:
            if pattern in str(filepath):
                all_violations.append(Tier1Violation(
                    str(filepath),
                    "FORBIDDEN_FILE",
                    f"File matches forbidden pattern: {pattern}"
                ))

        # Check Python files
        if filepath.suffix == '.py':
            stats['python_files'] += 1
            all_violations.extend(check_python_file(filepath))

    return all_violations, stats

def main():
    parser = argparse.ArgumentParser(description='Verify Tier-1 architectural purity')
    parser.add_argument('--strict', action='store_true', help='Exit with error if violations found')
    parser.add_argument('--report', action='store_true', help='Generate JSON report')

    args = parser.parse_args()
    root_dir = Path('.').resolve()

    violations, stats = analyze_repository(root_dir)

    print("\n" + "="*80)
    print("TIER-1 PURITY VERIFICATION")
    print("="*80)
    print(f"\nFiles checked: {stats['files_checked']}")
    print(f"Python files: {stats['python_files']}")
    print(f"Violations found: {len(violations)}")

    if violations:
        print("\n🚨 VIOLATIONS:")
        for violation in violations:
            print(f"  • {violation}")

        if args.strict:
            sys.exit(1)
    else:
        print("\n✅ TIER-1 PURITY: 100% CLEAN")

    if args.report:
        report = {
            'violations': [
                {'filepath': v.filepath, 'type': v.violation_type,
                 'message': v.message, 'line': v.line}
                for v in violations
            ],
            'stats': stats,
            'passed': len(violations) == 0
        }

        with open('tier1_verification_report.json', 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n📄 Report saved to: tier1_verification_report.json")

if __name__ == '__main__':
    main()
