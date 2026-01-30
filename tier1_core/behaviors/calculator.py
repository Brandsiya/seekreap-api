"""
Tier-1 Behavior: calculator
Structural numeric operations only
"""

def add(a, b):
    """Input[int, int] → Output[int]"""
    return a + b

def subtract(a, b):
    """Input[int, int] → Output[int]"""
    return a - b

def multiply(a, b):
    """Input[int, int] → Output[int]"""
    return a * b

def divide(a, b):
    """Input[int, int] → Output[float]"""
    if b == 0:
        raise ZeroDivisionError
    return a / b

def calculator_behavior():
    """Contract placeholder"""
    return ""

# 🏗️ ARCHITECTURAL NOTE:
# This file contains structural exemplars only.
# These functions demonstrate Tier-1 atomic behavior patterns.
# Real SeekReap behaviors will replace these exemplars.
# Computation is allowed; protocol semantics are not.
