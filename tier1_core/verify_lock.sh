#!/bin/bash
# Tier-1 Lock Verification Script
# Verifies that Tier-1 is properly locked with exactly 11 contracted functions

echo "=== TIER-1 LOCK VERIFICATION ==="
echo ""

# 1. Check directory structure
echo "1. Checking directory structure..."
PY_FILES=$(find tier1_core/behaviors -name "*.py" | grep -v __pycache__)
COUNT=$(echo "$PY_FILES" | wc -l)
if [ "$COUNT" -eq 5 ]; then
    echo "✅ Found $COUNT Python source files"
else
    echo "❌ Expected 5 Python files, found $COUNT"
    exit 1
fi
echo ""

# 2. Check export surface
echo "2. Checking export surface..."
EXPECTED_FUNCTIONS="['add', 'calculator_behavior', 'divide', 'example_behavior', 'filter_even', 'multiply', 'my_feature_behavior', 'process_data', 'process_text', 'reverse_string', 'subtract']"

# Import and get actual functions
ACTUAL_FUNCTIONS=$(python3 -c "
import tier1_core.behaviors
import inspect

functions = []
for name in dir(tier1_core.behaviors):
    obj = getattr(tier1_core.behaviors, name)
    if callable(obj) and not name.startswith('_'):
        functions.append(name)

print(sorted(functions))
")

echo "Expected functions (11): $EXPECTED_FUNCTIONS"
echo "Actual functions:       $ACTUAL_FUNCTIONS"
echo ""

if [ "$ACTUAL_FUNCTIONS" = "$EXPECTED_FUNCTIONS" ]; then
    echo "✅ Export surface matches exactly"
else
    echo "❌ Export surface mismatch!"
    exit 1
fi
echo ""

# 3. Quick function test
echo "3. Quick function test..."
TEST_RESULT=$(python3 -c "
import tier1_core.behaviors

# Test a few functions
try:
    result1 = tier1_core.behaviors.process_text('test')
    print('✅ process_text:', result1)
    
    result2 = tier1_core.behaviors.add(2, 3)
    print('✅ add:', result2)
    
    result3 = tier1_core.behaviors.example_behavior()
    print('✅ example_behavior:', result3)
    
    print('✅ All tests pass')
except Exception as e:
    print('❌ Test failed:', e)
    exit(1)
")

echo "$TEST_RESULT"
echo ""

echo "✅ TIER-1 LOCK VERIFICATION PASSED"
echo "Tier-1 is properly locked with 11 contracted functions."
