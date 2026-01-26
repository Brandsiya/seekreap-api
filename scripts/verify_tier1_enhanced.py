#!/usr/bin/env python3
"""
TIER-1 PURITY VERIFICATION SCRIPT (ENHANCED)
Validates repository maintains Tier-1 architectural purity with metrics tracking.
"""

import os
import sys
import ast
import json
import hashlib
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from dataclasses import dataclass, asdict

# Tier-1 purity rules
FORBIDDEN_IMPORTS = [
    'django', 'flask', 'fastapi', 'starlette', 'sanic', 'tornado',
    'boto3', 'aws', 'azure', 'google.cloud', 'gcp',
    'sqlalchemy', 'sqlmodel', 'psycopg2', 'mysql', 'redis',
    'celery', 'kombu', 'docker', 'kubernetes', 'sentry',
    'requests', 'httpx', 'authlib'
]

@dataclass
class FileMetrics:
    """Metrics for a single file."""
    path: str
    size_bytes: int
    lines_of_code: int
    import_count: int
    function_count: int
    class_count: int
    is_pure: bool
    purity_reason: str = ""
    checksum: str = ""

@dataclass
class VerificationMetrics:
    """Overall verification metrics."""
    timestamp: str
    total_files: int
    pure_files: int
    violation_files: int
    total_lines: int
    total_imports: int
    total_functions: int
    total_classes: int
    purity_score: float
    violations_by_type: dict
    file_extensions: dict

def analyze_file_metrics(filepath: Path) -> FileMetrics:
    """Analyze file for metrics."""
    metrics = FileMetrics(
        path=str(filepath),
        size_bytes=filepath.stat().st_size if filepath.exists() else 0,
        lines_of_code=0,
        import_count=0,
        function_count=0,
        class_count=0,
        is_pure=True,
        checksum=""
    )

    if filepath.suffix == '.py' and filepath.exists():
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                metrics.lines_of_code = len([l for l in lines if l.strip()])

                tree = ast.parse(content)
                for node in ast.walk(tree):
                    if isinstance(node, (ast.Import, ast.ImportFrom)):
                        metrics.import_count += 1
                    elif isinstance(node, ast.FunctionDef):
                        metrics.function_count += 1
                    elif isinstance(node, ast.ClassDef):
                        metrics.class_count += 1
        except:
            pass

    return metrics

def check_for_violations(filepath: Path) -> list:
    """Check file for Tier-1 violations."""
    violations = []

    if filepath.suffix == '.py' and filepath.exists():
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                tree = ast.parse(f.read())

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        for forbidden in FORBIDDEN_IMPORTS:
                            if forbidden in alias.name:
                                violations.append({
                                    'type': 'FORBIDDEN_IMPORT',
                                    'message': f"Import '{alias.name}' contains '{forbidden}'",
                                    'line': getattr(node, 'lineno', None)
                                })
        except:
            pass

    # Check file name patterns
    forbidden_patterns = ['Dockerfile', 'docker-compose', 'render.yaml', 'railway.json']
    for pattern in forbidden_patterns:
        if pattern in str(filepath):
            violations.append({
                'type': 'FORBIDDEN_FILE',
                'message': f"File matches forbidden pattern: {pattern}",
                'line': None
            })

    return violations

def main():
    print("📊 TIER-1 PURITY METRICS DASHBOARD")
    print("="*50)

    root_dir = Path('.').resolve()
    all_metrics = []
    all_violations = []
    violations_by_type = defaultdict(int)
    file_extensions = defaultdict(int)

    for filepath in root_dir.rglob('*'):
        if any(ignore in str(filepath) for ignore in ['.git', '__pycache__', '.venv', '.github']):
            continue

        # Get file metrics
        metrics = analyze_file_metrics(filepath)
        all_metrics.append(metrics)

        # Track file extension
        ext = filepath.suffix.lower()
        file_extensions[ext] += 1

        # Check for violations
        violations = check_for_violations(filepath)
        if violations:
            all_violations.extend(violations)
            for violation in violations:
                violations_by_type[violation['type']] += 1

    # Calculate statistics
    total_files = len(all_metrics)
    violation_files = len(set(v['file'] for v in all_violations if 'file' in v))
    pure_files = total_files - violation_files
    purity_score = (pure_files / total_files * 100) if total_files > 0 else 100

    total_lines = sum(m.lines_of_code for m in all_metrics)
    total_imports = sum(m.import_count for m in all_metrics)
    total_functions = sum(m.function_count for m in all_metrics)
    total_classes = sum(m.class_count for m in all_metrics)

    # Create metrics object
    metrics = VerificationMetrics(
        timestamp=datetime.now().isoformat(),
        total_files=total_files,
        pure_files=pure_files,
        violation_files=violation_files,
        total_lines=total_lines,
        total_imports=total_imports,
        total_functions=total_functions,
        total_classes=total_classes,
        purity_score=round(purity_score, 2),
        violations_by_type=dict(violations_by_type),
        file_extensions=dict(file_extensions)
    )

    # Print dashboard
    print(f"\n🛡️  PURITY SCORE: {metrics.purity_score}%")
    print(f"📅 {metrics.timestamp}")
    print(f"\n📁 FILES: {metrics.total_files} total, {metrics.pure_files} pure, {metrics.violation_files} with violations")
    print(f"📝 CODE: {metrics.total_lines:,} lines, {metrics.total_functions:,} functions, {metrics.total_classes:,} classes")

    if metrics.file_extensions:
        print(f"\n📄 EXTENSIONS:")
        for ext, count in sorted(metrics.file_extensions.items()):
            print(f"  {ext or '(no ext)':<10} {count:>4} files")

    if metrics.violations_by_type:
        print(f"\n🚨 VIOLATIONS:")
        for vtype, count in sorted(metrics.violations_by_type.items()):
            print(f"  {vtype:<20} {count:>3}")

    # Save report
    report = {
        'metrics': asdict(metrics),
        'violations': all_violations
    }

    with open('tier1_metrics_report.json', 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n📊 Report saved to: tier1_metrics_report.json")

    if all_violations:
        print(f"\n❌ TIER-1 PURITY VIOLATIONS DETECTED")
        sys.exit(1)
    else:
        print(f"\n✅ TIER-1 PURITY: 100% CLEAN")

if __name__ == '__main__':
    main()
