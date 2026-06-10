import os
import json
import random

def run_bloom_agent(question_text: str) -> dict:
    """
    Agent: Bloom's Taxonomy and Difficulty Classifier.
    Analyzes the cognitive load of the question.
    """
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import JsonOutputParser
            
            model = ChatOpenAI(model="gpt-4o", temperature=0.1)
            prompt = ChatPromptTemplate.from_template(
                "You are an expert educational psychologist. Analyze the following question text and classify it according to Bloom's Taxonomy and estimated cognitive difficulty.\n"
                "Question: {question}\n\n"
                "Return a JSON response matching this exact schema:\n"
                "{{\n"
                "  \"bloom_level\": \"L1 Remember / L2 Understand / L3 Apply / L4 Analyse / L5 Evaluate / L6 Create\",\n"
                "  \"difficulty\": \"Easy / Medium / Hard / VeryHard\",\n"
                "  \"concepts_detected\": [\"concept1\", \"concept2\"]\n"
                "}}"
            )
            chain = prompt | model | JsonOutputParser()
            res = chain.invoke({"question": question_text})
            
            # Normalize difficulty string (strip space)
            diff = res.get("difficulty", "Medium").replace(" ", "")
            if diff not in ["Easy", "Medium", "Hard", "VeryHard"]:
                diff = "Medium"
                
            return {
                "bloom_level": res.get("bloom_level", "L1 Remember"),
                "difficulty": diff,
                "concepts_detected": res.get("concepts_detected", []),
                "estimated_time_seconds": random.choice([60, 90, 120, 180])
            }
        except Exception as e:
            print(f"Bloom Agent LLM call failed: {e}. Using heuristic fallback.")

    # Heuristics based fallback classification
    text_lower = question_text.lower()
    
    if any(word in text_lower for word in ["design", "formulate", "create", "synthesize"]):
        bloom_level = "L6 Create"
        difficulty = "VeryHard"
    elif any(word in text_lower for word in ["evaluate", "judge", "critique", "defend"]):
        bloom_level = "L5 Evaluate"
        difficulty = "VeryHard"
    elif any(word in text_lower for word in ["analyze", "compare", "distinguish", "differentiate"]):
        bloom_level = "L4 Analyse"
        difficulty = "Hard"
    elif any(word in text_lower for word in ["calculate", "determine", "solve", "apply"]):
        bloom_level = "L3 Apply"
        difficulty = "Hard"
    elif any(word in text_lower for word in ["explain", "describe", "identify", "how"]):
        bloom_level = "L2 Understand"
        difficulty = "Medium"
    else:
        bloom_level = "L1 Remember"
        difficulty = "Easy"
        
    return {
        "bloom_level": bloom_level,
        "difficulty": difficulty,
        "concepts_detected": [w for w in ["ribosome", "magnetic", "toluene", "dielectric"] if w in text_lower],
        "estimated_time_seconds": random.choice([60, 90, 120, 180])
    }
