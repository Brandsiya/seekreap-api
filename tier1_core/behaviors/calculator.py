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
