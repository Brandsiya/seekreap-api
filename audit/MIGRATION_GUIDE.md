# Migration Guide: Tier-1 Purification

## What Changed
This repository underwent architectural purification to establish clean tier boundaries.

### 🔒 Stayed in Tier-1
- `tier1_core/behaviors/` - 11 contracted functions
- Lock documentation and verification
- Minimal repository scaffolding

### 📁 Moved to SeekReap-Miscellaneous-Files
- Application/runtime layers (Tier-2+ code)
- Governance artifacts (planning, phases, cycles)
- Operational scripts and tooling
- Historical data and documentation

## How to Consume Tier-1
```python
import sys
sys.path.insert(0, 'tier1_core')
import behaviors

# Use the 11 contracted functions
result = behaviors.add(2, 3)  # Returns 5

## Verification
```bash
./tier1_core/verify_lock.sh

## Breaking Changes Policy
This version is LOCKED (v1.0.0). Any modification requires:
1. Explicit unlock procedure
2. Versioned fork (v1.1.0+)
3. New lock ceremony
4. Update to all dependent tiers
