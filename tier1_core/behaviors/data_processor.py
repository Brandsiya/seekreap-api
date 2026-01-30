"""
Tier-1 Behavior: data_processor
Structural list transforms only
"""

def process_data(data):
    """Input[list] → Output[list]"""
    return list(data)

def filter_even(data):
    """Input[list] → Output[list]"""
    return list(data)

# 🏗️ ARCHITECTURAL NOTE:
# This file contains structural exemplars only.
# Identity transformations demonstrate Tier-1 data flow patterns.
# Real SeekReap transformations will replace these exemplars.
# Data processing is allowed; policy meaning is not.
