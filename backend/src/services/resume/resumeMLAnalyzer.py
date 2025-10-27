#!/usr/bin/env python3
"""
Resume ML Analyzer - 3-Level Hybrid ML (DDD-Compatible Service)

Architecture:
  Level 1: NLTK Text Processing (text quality metrics)
  Level 2: BERT Embeddings (semantic matching)
  Level 3: Gemini AI (intelligent feedback)

Extracted from ai_services4, upgraded to hybrid ML
"""

import sys
import json
import numpy as np
from functools import lru_cache
from typing import Dict, List, Set, Tuple
import os

# Import 3-Level hybrid components
try:
    from .core.resumeTextProcessor import ResumeTextProcessor
    from .core.resumeLLMEnhancer import ResumeLLMEnhancer
    HYBRID_ML_AVAILABLE = True
except ImportError:
    # Fallback if core modules not available
    HYBRID_ML_AVAILABLE = False
    print("Warning: Hybrid ML components not available, using fallback mode", file=sys.stderr)

# ============ CONFIGURATION ============
EMBEDDING_DIM = 384
MODEL_NAME = "all-MiniLM-L6-v2"
MAX_SKILLS = 100
CACHE_SIZE = 128

# Skills database
SKILLS_DB = {
    'technical': [
        'python', 'java', 'javascript', 'typescript', 'react', 'angular',
        'vue', 'django', 'flask', 'fastapi', 'spring', 'nodejs', 'express',
        'mysql', 'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes',
        'aws', 'azure', 'gcp', 'git', 'jenkins', 'terraform',
        'machine learning', 'deep learning', 'tensorflow', 'pytorch'
    ],
    'soft': [
        'leadership', 'communication', 'teamwork', 'problem solving',
        'critical thinking', 'project management', 'agile', 'scrum'
    ]
}

ALL_SKILLS = sum(SKILLS_DB.values(), [])

# ============ UTILITY FUNCTIONS ============
def normalize_text(text: str) -> str:
    """Normalize text for processing"""
    return text.lower()

def clip_value(value: float, min_val: float = 0, max_val: float = 1) -> float:
    """Clip value to range"""
    return np.clip(value, min_val, max_val)

# ============ MAIN ANALYZER CLASS (DI-Compatible, 3-Level Hybrid) ============
class ResumeMLAnalyzer:
    """
    DDD-compatible 3-Level Hybrid ML Resume Analyzer

    Level 1: NLTK text quality analysis
    Level 2: BERT semantic embeddings
    Level 3: Gemini AI feedback
    """

    def __init__(self, model_name: str = MODEL_NAME, gemini_key: str = None):
        """
        Initialize 3-level hybrid analyzer

        Args:
            model_name: BERT model name for Level 2
            gemini_key: Gemini API key for Level 3 (optional)
        """
        self.model_name = model_name
        self.gemini_key = gemini_key or os.getenv('GEMINI_API_KEY', '')
        self.cache = {}

        # Level 1: Text Processor (NLTK)
        self.text_processor = ResumeTextProcessor() if HYBRID_ML_AVAILABLE else None

        # Level 2: BERT Embeddings
        self.model = self._init_model()

        # Level 3: LLM Enhancer (Gemini)
        self.llm_enhancer = ResumeLLMEnhancer(self.gemini_key) if (HYBRID_ML_AVAILABLE and self.gemini_key) else None

    def _init_model(self):
        """Initialize sentence transformer model"""
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(self.model_name)
            return model
        except Exception as e:
            print(f"Warning: Could not load ML model: {e}", file=sys.stderr)
            return None

    @lru_cache(maxsize=CACHE_SIZE)
    def get_embedding(self, text: str) -> tuple:
        """Get text embedding with caching (returns tuple for hashability)"""
        if not text or not text.strip():
            return tuple(np.zeros(EMBEDDING_DIM))

        if self.model:
            embedding = self.model.encode(text, show_progress_bar=False)
            return tuple(embedding)
        else:
            return tuple(self._create_fallback_embedding(text))

    def _create_fallback_embedding(self, text: str) -> np.ndarray:
        """Create simple embedding without ML model"""
        vector = np.zeros(EMBEDDING_DIM)
        normalized = normalize_text(text)
        words = normalized.split()

        if not words:
            return vector

        # Skill detection
        for i, skill in enumerate(ALL_SKILLS[:MAX_SKILLS]):
            if skill in normalized:
                vector[i] = 1.0

        # Text statistics
        vector[MAX_SKILLS] = len(words) / 1000
        vector[MAX_SKILLS + 1] = len(set(words)) / max(len(words), 1)

        return vector

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts"""
        vec1 = np.array(self.get_embedding(text1))
        vec2 = np.array(self.get_embedding(text2))

        norm1, norm2 = np.linalg.norm(vec1), np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0

        dot = np.dot(vec1, vec2)
        return float(clip_value(dot / (norm1 * norm2)))

    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from text"""
        normalized = normalize_text(text)
        return [s.title() for s in ALL_SKILLS if s in normalized]

    def analyze(self, resume_text: str, job_description: str = "") -> Dict:
        """
        3-Level Hybrid ML Analysis
        Returns comprehensive analysis with all 3 levels of metrics
        """
        # ===== LEVEL 1: NLTK TEXT QUALITY ANALYSIS =====
        text_quality = None
        text_quality_score = 0
        if self.text_processor:
            try:
                text_quality = self.text_processor.analyze_quality(resume_text)
                text_quality_score = self.text_processor.calculate_text_quality_score(text_quality)
            except Exception as e:
                print(f"Warning: Text quality analysis failed: {e}", file=sys.stderr)
                text_quality = {"error": str(e)}

        # ===== LEVEL 2: BERT SEMANTIC ANALYSIS =====
        # Extract skills
        resume_skills = self.extract_skills(resume_text)
        job_skills = self.extract_skills(job_description) if job_description else []

        # Calculate BERT similarity
        similarity = self.calculate_similarity(resume_text, job_description) if job_description else 0.5

        # Calculate skill match
        resume_set = {normalize_text(s) for s in resume_skills}
        job_set = {normalize_text(s) for s in job_skills}
        matching = resume_set & job_set
        missing = job_set - resume_set

        skill_match = len(matching) / max(len(job_set), 1) if job_set else 0

        # Level 2 score (semantic matching)
        semantic_score = (similarity * 0.6 + skill_match * 0.4) * 100

        # ===== LEVEL 3: GEMINI LLM ENHANCEMENT =====
        llm_feedback = None
        llm_relevance_score = 0
        if self.llm_enhancer and job_description:
            try:
                llm_feedback = self.llm_enhancer.enhance_analysis(
                    resume_text,
                    job_description,
                    list(matching),
                    list(missing),
                    similarity
                )
                llm_relevance_score = llm_feedback.get('relevance_score', semantic_score)
            except Exception as e:
                print(f"Warning: LLM enhancement failed: {e}", file=sys.stderr)
                llm_feedback = {"error": str(e), "fallback_mode": True}

        # ===== CALCULATE FINAL WEIGHTED SCORE =====
        if text_quality and llm_feedback and 'error' not in llm_feedback:
            # Full 3-level hybrid scoring
            final_score = (
                text_quality_score * 0.25 +
                semantic_score * 0.40 +
                llm_relevance_score * 0.35
            )
            ml_model = "3-Level Hybrid (NLTK + BERT + Gemini)"
        elif text_quality:
            # 2-level (NLTK + BERT)
            final_score = (
                text_quality_score * 0.40 +
                semantic_score * 0.60
            )
            ml_model = "2-Level Hybrid (NLTK + BERT)"
        else:
            # 1-level (BERT only - fallback)
            final_score = semantic_score * 0.95
            ml_model = "1-Level (BERT only)"

        # Clamp score to realistic range
        final_score = min(95, max(0, final_score))

        # Generate rating
        if final_score >= 80:
            rating = "Excellent"
        elif final_score >= 60:
            rating = "Good"
        elif final_score >= 40:
            rating = "Fair"
        else:
            rating = "Needs Work"

        # Build recommendations (combine all levels)
        recommendations = []
        if text_quality and text_quality.get('action_verb_count', 0) < 10:
            recommendations.append("Add more action verbs to describe accomplishments")
        if text_quality and text_quality.get('quantifiable_achievements', 0) < 5:
            recommendations.append("Include quantifiable achievements (numbers, percentages)")
        if similarity < 0.5:
            recommendations.append("Use more keywords from the job description")
        if skill_match < 0.5:
            recommendations.append("Highlight more relevant technical skills")
        if missing:
            recommendations.append(f"Add these skills: {', '.join(list(missing)[:5])}")
        if not recommendations:
            recommendations.append("Excellent match - consider minor enhancements")

        # ===== BUILD COMPREHENSIVE RESPONSE =====
        response = {
            "score": round(final_score, 1),
            "rating": rating,

            # Level 1: Text Quality Metrics
            "text_quality": text_quality,
            "text_quality_score": round(text_quality_score, 1) if text_quality else None,

            # Level 2: Semantic Analysis
            "semantic_analysis": {
                "similarity": round(similarity, 3),
                "skills_match": round(skill_match, 3),
                "resume_skills": resume_skills[:10],
                "job_skills": job_skills[:10],
                "matching_skills": list(matching)[:10],
                "missing_skills": list(missing)[:10]
            },

            # Level 3: LLM Feedback
            "llm_feedback": llm_feedback,

            # Meta information
            "recommendations": recommendations[:7],
            "ml_powered": True,
            "ml_model": ml_model,
            "hybrid_ml_enabled": HYBRID_ML_AVAILABLE,
            "gemini_enabled": self.llm_enhancer is not None
        }

        return response

    def optimize(self, resume_text: str, job_description: str) -> Dict:
        """
        Generate optimization suggestions
        Returns domain-friendly format
        """
        analysis = self.analyze(resume_text, job_description)

        suggestions = []

        # Similarity-based suggestions
        if analysis['similarity'] < 0.6:
            suggestions.append("Incorporate more keywords and terminology from the job description")

        # Skill-based suggestions
        missing = analysis['missing_skills']
        if missing:
            suggestions.append(f"Add relevant skills: {', '.join(missing[:3])}")

        # General improvements
        if len(resume_text.split()) < 200:
            suggestions.append("Expand your experience section with more detailed descriptions")

        suggestions.append("Quantify achievements with specific numbers and metrics")
        suggestions.append("Use action verbs to describe your accomplishments")

        return {
            "optimization_suggestions": suggestions[:5],
            "missing_skills": missing[:10],
            "similarity_score": analysis['similarity'],
            "improvements": [
                "Align resume content with job requirements",
                "Highlight relevant skills and technologies",
                "Provide concrete examples and achievements"
            ]
        }

# ============ MAIN ENTRY POINT (For subprocess calls) ============
def main():
    """Main entry point for backend subprocess integration"""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())

        resume_text = input_data.get('resume_text', '')
        job_description = input_data.get('job_description', '')
        operation = input_data.get('operation', 'analyze')  # analyze or optimize

        if not resume_text:
            raise ValueError("resume_text is required")

        # Create analyzer instance (with optional Gemini key)
        gemini_key = input_data.get('gemini_key', os.getenv('GEMINI_API_KEY', ''))
        analyzer = ResumeMLAnalyzer(gemini_key=gemini_key)

        # Perform operation
        if operation == 'optimize':
            result = analyzer.optimize(resume_text, job_description)
        else:
            result = analyzer.analyze(resume_text, job_description)

        # Output JSON result
        print(json.dumps(result))

    except Exception as e:
        # Return error as valid JSON
        import traceback
        error_response = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "score": 50,
            "rating": "Error",
            "recommendations": ["Processing error occurred - manual review recommended"]
        }
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == "__main__":
    main()
