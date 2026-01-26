"""
Tier-1 Behaviors Package
Pure export manifest for contracted behaviors only
"""

# my_feature.py exports
from .my_feature import (
    process_text,
    reverse_string,
    my_feature_behavior,
)

# calculator.py exports
from .calculator import (
    add,
    subtract,
    multiply,
    divide,
    calculator_behavior,
)

# data_processor.py exports
from .data_processor import (
    process_data,
    filter_even,
)

# example.py exports
from .example import example_behavior

# Explicit export list
__all__ = [
    # my_feature
    'process_text',
    'reverse_string',
    'my_feature_behavior',
    
    # calculator
    'add',
    'subtract',
    'multiply',
    'divide',
    'calculator_behavior',
    
    # data_processor
    'process_data',
    'filter_even',
    
    # example
    'example_behavior',
]

# Remove module objects from public surface (lock requirement)
del my_feature
del calculator
del data_processor
del example
