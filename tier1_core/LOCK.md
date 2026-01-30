# TIER-1 CORE LOCK

## LOCK SCOPE
This directory (`tier1_core/`) is the **only mutable execution surface** in Tier-1.

## SURFACE LOCK RULES:
1. **Only structural transformations** allowed
2. **No protocol semantics, policy meaning, or governance logic** may be added
3. **No protocol redefinition** permitted
4. **All semantic interpretation and policy composition** belongs in Tier-2+

## MUTATION CONSTRAINTS:
- New behaviors must follow calculator.py structural pattern
- Changes require verification of Tier-0 conformance
- No framework dependencies may be introduced
- No infrastructure code may be added

## AUTHORITY BOUNDARY:
Tier-1 is an **implementation tier only**.
Tier-0 remains the **sole normative authority**.
This lock restricts surface, not computational capability.
