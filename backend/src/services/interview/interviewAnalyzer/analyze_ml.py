#!/usr/bin/env python3
"""
ML-POWERED Interview Analyzer - Bridge Script
Uses the 3-level hybrid AI system for REAL machine learning analysis
"""

import sys
import json
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.response_analyzer import ResponseAnalyzer

def main():
    """Main entry point for ML-powered interview analysis"""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())

        question = input_data.get('question', '').strip()
        response = input_data.get('response', '').strip()
        role = input_data.get('role', 'Software Engineer')

        if not question or not response:
            raise ValueError("Question and response are required")

        # Create ML analyzer instance
        analyzer = ResponseAnalyzer()

        # Prepare batch format (analyzer expects list)
        items = [{
            "question_text": question,
            "response_text": response,
            "role": role
        }]

        # Run ML analysis
        results = analyzer.analyze_batch(items)

        if not results or len(results) == 0:
            raise ValueError("ML analysis returned no results")

        # Extract first result
        ml_result = results[0]

        # Transform to backend-expected format
        objective = ml_result.get('objective', {})
        semantic = ml_result.get('semantic', {})
        llm_feedback = ml_result.get('llm_feedback', {})

        # Calculate overall score from multiple factors
        word_count = objective.get('word_count', 0)
        lexical_div = objective.get('lexical_diversity', 0) * 100
        relevance = semantic.get('relevance_score', 0) * 100
        coherence = semantic.get('topic_coherence', 0) * 100

        # Weighted scoring (semantic understanding is most important)
        score = int(
            relevance * 0.4 +          # 40% - semantic relevance
            coherence * 0.3 +          # 30% - topic coherence
            lexical_div * 0.2 +        # 20% - lexical richness
            min(100, word_count) * 0.1 # 10% - response length
        )

        # Extract LLM feedback
        strengths = llm_feedback.get('strengths', [])
        if isinstance(strengths, str):
            strengths = [strengths]

        weaknesses = llm_feedback.get('weaknesses', [])
        if isinstance(weaknesses, str):
            weaknesses = [weaknesses]

        improvements = llm_feedback.get('improvement_tips', [])
        if isinstance(improvements, str):
            improvements = [improvements]

        # Format response
        output = {
            "score": min(95, max(0, score)),
            "feedback": {
                "strengths": strengths[:3] if strengths else ["Comprehensive analysis complete"],
                "improvements": (improvements or weaknesses)[:3] if (improvements or weaknesses) else ["Continue developing your communication skills"],
                "relevance": int(relevance),
                "completeness": min(100, int(word_count / 2)),
                "clarity": int(coherence)
            },
            "analysis": {
                "ml_powered": True,
                "question_type": "analyzed",
                "word_count": word_count,
                "lexical_diversity": round(objective.get('lexical_diversity', 0), 3),
                "semantic_relevance": round(semantic.get('relevance_score', 0), 3),
                "topic_coherence": round(semantic.get('topic_coherence', 0), 3),
                "role": role,
                "ai_model": "3-Level Hybrid (NLTK + PyTorch + Gemini)"
            },
            "raw_ml_output": {
                "objective_metrics": objective,
                "semantic_metrics": semantic,
                "llm_feedback": llm_feedback
            }
        }

        # Output JSON result
        print(json.dumps(output))

    except Exception as e:
        # Return error with ML fallback
        import traceback
        error_response = {
            "score": 50,
            "feedback": {
                "strengths": ["Attempted to answer the question"],
                "improvements": ["ML analysis encountered an error - manual review recommended"],
                "relevance": 50,
                "completeness": 50,
                "clarity": 50
            },
            "analysis": {
                "ml_powered": False,
                "error": str(e),
                "traceback": traceback.format_exc(),
                "fallback_mode": True
            }
        }
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == "__main__":
    main()
