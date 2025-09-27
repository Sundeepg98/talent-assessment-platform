#!/usr/bin/env python3
"""
TALENT ASSESSMENT AI - 100% DRY COMPLIANT VERSION
Zero repetition, maximum reusability
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Set, Tuple, Optional
from functools import lru_cache, wraps
from dataclasses import dataclass
import numpy as np
import logging
import time
from datetime import datetime

# ============ CONSTANTS - Single Definition ============
EMBEDDING_DIM = 384
MODEL_NAME = "all-MiniLM-L6-v2"
MAX_SKILLS = 100
MAX_DISPLAY = 15
CACHE_SIZE = 128
TEXT_NORM_DIVISOR = 1000

# Score thresholds
SCORE_EXCELLENT = 80
SCORE_GOOD = 60
SCORE_FAIR = 40

# Score weights
WEIGHT_SIMILARITY = 0.6
WEIGHT_SKILLS = 0.4
SCORE_BOOST = 0.95
MAX_SCORE = 95

# Response limits
LIMIT_RECOMMENDATIONS = 5
LIMIT_SKILLS_DISPLAY = 10

# ============ CONFIGURATION ============
@dataclass
class Config:
    """All configuration in one place"""
    title: str = "Talent Assessment AI Service"
    version: str = "3.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    log_format: str = '%(asctime)s - %(levelname)s - %(message)s'
    
config = Config()

# ============ LOGGING SETUP ============
logging.basicConfig(level=logging.INFO, format=config.log_format)
logger = logging.getLogger(__name__)

# ============ SKILLS DATABASE ============
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

# Flatten once
ALL_SKILLS = sum(SKILLS_DB.values(), [])

# ============ SCORE DEFINITIONS ============
SCORE_RATINGS = [
    (SCORE_EXCELLENT, {"rating": "Excellent", "emoji": "🌟"}),
    (SCORE_GOOD, {"rating": "Good", "emoji": "✅"}),
    (SCORE_FAIR, {"rating": "Fair", "emoji": "📊"}),
    (0, {"rating": "Needs Work", "emoji": "📈"})
]

# ============ RECOMMENDATIONS TEMPLATES ============
RECOMMENDATIONS = {
    'skills_missing': lambda skills: f"Add these skills: {', '.join(skills[:5])}",
    'low_similarity': "Use more keywords from the job description",
    'low_skills': "Highlight more relevant technical skills",
    'quantify': "Quantify your achievements with numbers",
    'action_verbs': "Use action verbs to describe accomplishments"
}

# ============ BASE REQUEST MODEL ============
class BaseRequest(BaseModel):
    """Single request model for all endpoints"""
    resume_text: str
    job_description: str

# ============ UTILITY FUNCTIONS - DRY Helpers ============
def normalize_text(text: str) -> str:
    """Single text normalization function"""
    return text.lower()

def text_to_set(items: List[str]) -> Set[str]:
    """Convert list to normalized set"""
    return {normalize_text(item) for item in items}

def calculate_percentage(numerator: int, denominator: int) -> float:
    """Safe percentage calculation"""
    return (numerator / max(denominator, 1)) * 100

def get_time_delta(start: datetime) -> float:
    """Calculate time difference in seconds"""
    return (datetime.now() - start).total_seconds()

def clip_value(value: float, min_val: float = 0, max_val: float = 1) -> float:
    """Clip value to range"""
    return np.clip(value, min_val, max_val)

# ============ DECORATORS - DRY Pattern ============
def timed_operation(func):
    """Decorator to time operations and update stats"""
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        start = time.time()
        result = func(self, *args, **kwargs)
        elapsed = time.time() - start
        
        # Update stats if this is the analyzer instance
        if hasattr(self, 'stats'):
            self.stats["total"] += 1
            self.stats["time"] += elapsed
        
        if isinstance(result, dict):
            result['processing_time_ms'] = round(elapsed * 1000, 2)
        return result
    return wrapper

def cached_operation(func):
    """LRU cache decorator wrapper"""
    return lru_cache(maxsize=CACHE_SIZE)(func)

# ============ MAIN ANALYZER CLASS ============
class Analyzer:
    """Single analyzer with zero repetition"""
    
    def __init__(self):
        self.model = self._init_model()
        self.cache = {}
        self.stats = self._init_stats()
    
    def _init_stats(self) -> Dict:
        """Initialize statistics once"""
        return {
            "total": 0,
            "time": 0.0,
            "start": datetime.now()
        }
    
    def _init_model(self):
        """Initialize model with single try-except"""
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(MODEL_NAME)
            logger.info(f"✅ Model loaded: {MODEL_NAME}")
            return model
        except Exception as e:
            logger.info(f"📊 Fallback mode: {e}")
            return None
    
    @cached_operation
    def _get_embedding_cached(self, text_hash: int) -> np.ndarray:
        """Cached embedding generation"""
        # This is called only if not in cache
        text = str(text_hash)  # Convert back for processing
        
        if self.model:
            return self.model.encode(text, show_progress_bar=False)
        else:
            return self._create_fallback_embedding(text)
    
    def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding with caching"""
        if not text or not text.strip():
            return np.zeros(EMBEDDING_DIM)
        return self._get_embedding_cached(hash(text))
    
    def _create_fallback_embedding(self, text: str) -> np.ndarray:
        """Create embedding without ML model"""
        vector = np.zeros(EMBEDDING_DIM)
        normalized = normalize_text(text)
        words = normalized.split()
        
        # If text is empty, return zero vector
        if not words:
            return vector
        
        # Single loop for skill detection
        for i, skill in enumerate(ALL_SKILLS[:MAX_SKILLS]):
            if skill in normalized:
                vector[i] = 1.0
        
        # Add statistics
        vector[MAX_SKILLS] = len(words) / TEXT_NORM_DIVISOR
        vector[MAX_SKILLS + 1] = len(set(words)) / max(len(words), 1)
        
        return vector
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Single cosine similarity implementation"""
        norm1, norm2 = np.linalg.norm(vec1), np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        dot = np.dot(vec1, vec2)
        return float(clip_value(dot / (norm1 * norm2)))
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity"""
        return self._cosine_similarity(
            self.get_embedding(text1),
            self.get_embedding(text2)
        )
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from text"""
        normalized = normalize_text(text)
        return [s.title() for s in ALL_SKILLS if s in normalized]
    
    def _get_skill_sets(self, resume_skills: List[str], job_skills: List[str]) -> Tuple[Set, Set, Set]:
        """Get skill sets - single computation"""
        resume_set = text_to_set(resume_skills)
        job_set = text_to_set(job_skills)
        matching = resume_set & job_set
        missing = job_set - resume_set
        return matching, missing, job_set
    
    def _calculate_score_value(self, similarity: float, skill_match: float) -> float:
        """Calculate raw score value"""
        raw = (similarity * WEIGHT_SIMILARITY + skill_match * WEIGHT_SKILLS)
        score = raw * 100 * SCORE_BOOST
        return min(MAX_SCORE, score)
    
    def _get_rating(self, score: float) -> Dict:
        """Get rating based on score"""
        for threshold, rating in SCORE_RATINGS:
            if score >= threshold:
                return {"score": round(score, 1), **rating}
        return {"score": round(score, 1), **SCORE_RATINGS[-1][1]}
    
    def _build_recommendations(self, similarity: float, skill_pct: float, missing: List[str]) -> List[str]:
        """Build recommendations list"""
        recs = []
        
        # Conditional recommendations
        if missing:
            recs.append(RECOMMENDATIONS['skills_missing'](missing))
        if similarity < 0.6:
            recs.append(RECOMMENDATIONS['low_similarity'])
        if skill_pct < 50:
            recs.append(RECOMMENDATIONS['low_skills'])
        
        # Always add these
        recs.extend([RECOMMENDATIONS['quantify'], RECOMMENDATIONS['action_verbs']])
        
        return recs[:LIMIT_RECOMMENDATIONS]
    
    @timed_operation
    def analyze(self, resume: str, job_desc: str) -> Dict:
        """Main analysis - fully DRY"""
        # Extract data
        similarity = self.calculate_similarity(resume, job_desc)
        resume_skills = self.extract_skills(resume)
        job_skills = self.extract_skills(job_desc)
        
        # Process skills
        matching, missing, job_set = self._get_skill_sets(resume_skills, job_skills)
        skill_pct = calculate_percentage(len(matching), len(job_set))
        
        # Calculate score
        score = self._calculate_score_value(similarity, skill_pct / 100)
        
        # Stats are updated automatically by decorator
        
        # Build response
        return {
            "ats_score": self._get_rating(score),
            "similarity": round(similarity * 100, 2),
            "skills": {
                "resume": resume_skills[:MAX_DISPLAY],
                "job": job_skills[:MAX_DISPLAY],
                "matching": list(matching)[:LIMIT_SKILLS_DISPLAY],
                "missing": list(missing)[:LIMIT_SKILLS_DISPLAY],
                "coverage": round(skill_pct, 1)
            },
            "recommendations": self._build_recommendations(
                similarity, skill_pct, list(missing)
            )
        }
    
    def optimize(self, resume: str, job_desc: str) -> Dict:
        """Optimization - reuses analyze completely"""
        analysis = self.analyze(resume, job_desc)
        current = analysis["ats_score"]["score"]
        
        return {
            "current": current,
            "potential": min(MAX_SCORE, current + 15),
            "missing": analysis["skills"]["missing"],
            "steps": [
                {"action": "Add missing skills", "impact": "+10"},
                {"action": "Improve keywords", "impact": "+5"},
                {"action": "Quantify achievements", "impact": "+3"}
            ]
        }
    
    def get_status(self) -> Dict:
        """Get system status"""
        return {
            "status": "operational",
            "model": MODEL_NAME if self.model else "fallback",
            "total": self.stats["total"],
            "avg_ms": round(self.stats["time"] * 1000 / max(self.stats["total"], 1), 2),
            "uptime": round(get_time_delta(self.stats["start"]), 2),
            "cache": len(self.cache)
        }

# ============ SINGLETON INSTANCE ============
analyzer = Analyzer()

# ============ APP FACTORY ============
def create_app() -> FastAPI:
    """Create app with all middleware"""
    app = FastAPI(
        title=config.title,
        version=config.version,
        docs_url="/docs"
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        logger.error(f"Error: {exc}")
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)}
        )
    
    return app

app = create_app()

# ============ ENDPOINT FACTORY ============
def create_endpoint(path: str, method: str, handler, request_model=None):
    """Factory for creating endpoints - ultimate DRY"""
    async def endpoint_handler(request: request_model = None):
        if request:
            return handler(request.resume_text, request.job_description)
        return handler()
    
    # Register endpoint
    route_decorator = getattr(app, method.lower())
    route_decorator(path)(endpoint_handler)

# ============ REGISTER ALL ENDPOINTS - DRY ============
endpoints = [
    ("/", "get", analyzer.get_status, None),
    ("/analyze", "post", analyzer.analyze, BaseRequest),
    ("/optimize", "post", analyzer.optimize, BaseRequest),
    ("/health", "get", lambda: {"healthy": True, "time": datetime.now().isoformat()}, None),
    ("/stats", "get", analyzer.get_status, None),
]

for path, method, handler, model in endpoints:
    create_endpoint(path, method, handler, model)

# ============ MAIN EXECUTION ============
if __name__ == "__main__":
    import uvicorn
    print(f"\n{'='*50}")
    print(f"{config.title} - 100% DRY")
    print(f"{'='*50}")
    print(f"http://localhost:{config.port}")
    print(f"{'='*50}\n")
    uvicorn.run(app, host=config.host, port=config.port)