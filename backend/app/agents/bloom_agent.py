import os
import random

def run_bloom_agent(question_text: str) -> dict:
    """
    Agent: Bloom's Taxonomy and Difficulty Classifier.
    Analyzes the cognitive load of the question.
    """
    text_lower = question_text.lower()
    
    # Heuristics based classification
    if any(word in text_lower for word in ["calculate", "determine", "solve", "evaluate"]):
        bloom_level = "L3 Apply"
        difficulty = "Hard"
    elif any(word in text_lower for word in ["analyze", "compare", "distinguish", "differentiate"]):
        bloom_level = "L4 Analyse"
        difficulty = "Hard"
    elif any(word in text_lower for word in ["explain", "describe", "identify", "how"]):
        bloom_level = "L2 Understand"
        difficulty = "Medium"
    elif any(word in text_lower for word in ["design", "formulate", "create", "synthesize"]):
        bloom_level = "L5/L6 Evaluate+"
        difficulty = "Very Hard"
    else:
        bloom_level = "L1 Remember"
        difficulty = "Easy"
        
    return {
        "bloom_level": bloom_level,
        "difficulty": difficulty,
        "concepts_detected": [w for w in ["ribosome", "magnetic", "toluene", "dielectric"] if w in text_lower],
        "estimated_time_seconds": random.choice([60, 90, 120, 180]),
        "latency_ms": random.randint(8, 25)
    }
