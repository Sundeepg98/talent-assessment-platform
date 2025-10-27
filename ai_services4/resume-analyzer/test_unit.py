"""
Unit Tests for Resume Analyzer - TDD Approach
Tests individual components in isolation
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import (
    Analyzer, 
    normalize_text, 
    calculate_percentage,
    clip_value,
    text_to_set,
    get_time_delta,
    BaseRequest,
    ALL_SKILLS,
    SCORE_RATINGS,
    RECOMMENDATIONS,
    config
)


class TestUtilityFunctions:
    """Test all utility functions"""
    
    def test_normalize_text(self):
        """Test text normalization"""
        assert normalize_text("Hello World") == "hello world"
        assert normalize_text("PYTHON") == "python"
        assert normalize_text("") == ""
        assert normalize_text("123 ABC") == "123 abc"
    
    def test_calculate_percentage(self):
        """Test percentage calculation with safe division"""
        assert calculate_percentage(5, 10) == 50.0
        assert calculate_percentage(10, 10) == 100.0
        assert calculate_percentage(0, 10) == 0.0
        assert calculate_percentage(5, 0) == 500.0  # max(0,1) = 1
        assert calculate_percentage(0, 0) == 0.0
    
    def test_clip_value(self):
        """Test value clipping"""
        assert clip_value(0.5) == 0.5
        assert clip_value(1.5) == 1.0
        assert clip_value(-0.5) == 0.0
        assert clip_value(0.7, 0.5, 0.8) == 0.7
        assert clip_value(0.3, 0.5, 0.8) == 0.5
        assert clip_value(0.9, 0.5, 0.8) == 0.8
    
    def test_text_to_set(self):
        """Test list to normalized set conversion"""
        result = text_to_set(["Python", "JAVA", "python"])
        assert result == {"python", "java"}
        assert text_to_set([]) == set()
        assert text_to_set(["TEST"]) == {"test"}
    
    def test_get_time_delta(self):
        """Test time delta calculation"""
        start = datetime.now()
        delta = get_time_delta(start)
        assert delta >= 0
        assert isinstance(delta, float)


class TestAnalyzerClass:
    """Test the main Analyzer class"""
    
    @pytest.fixture
    def analyzer(self):
        """Create analyzer instance for testing"""
        with patch('sentence_transformers.SentenceTransformer') as mock_st:
            mock_model = Mock()
            mock_st.return_value = mock_model
            return Analyzer()
    
    def test_analyzer_initialization(self, analyzer):
        """Test analyzer initializes correctly"""
        assert analyzer.stats["total"] == 0
        assert analyzer.stats["time"] == 0.0
        assert "start" in analyzer.stats
        assert isinstance(analyzer.stats["start"], datetime)
        assert analyzer.cache == {}
    
    def test_get_embedding_caching(self, analyzer):
        """Test embedding caching works"""
        text = "test text"
        
        # Mock the model encode
        if analyzer.model:
            analyzer.model.encode = Mock(return_value=np.array([1, 2, 3]))
        
        # First call
        emb1 = analyzer.get_embedding(text)
        
        # Second call - should use cache
        emb2 = analyzer.get_embedding(text)
        
        # Should be the same object (cached)
        assert np.array_equal(emb1, emb2)
    
    def test_create_fallback_embedding(self, analyzer):
        """Test fallback embedding creation"""
        text = "python django docker"
        embedding = analyzer._create_fallback_embedding(text)
        
        assert len(embedding) == 384  # EMBEDDING_DIM
        assert embedding.dtype == np.float64
        # Should have some non-zero values for skills
        assert np.sum(embedding) > 0
    
    def test_cosine_similarity(self, analyzer):
        """Test cosine similarity calculation"""
        vec1 = np.array([1, 0, 0])
        vec2 = np.array([1, 0, 0])
        assert analyzer._cosine_similarity(vec1, vec2) == 1.0
        
        vec2 = np.array([0, 1, 0])
        assert analyzer._cosine_similarity(vec1, vec2) == 0.0
        
        vec2 = np.array([-1, 0, 0])
        assert analyzer._cosine_similarity(vec1, vec2) == 0.0  # Clipped to 0
        
        # Test zero vectors
        vec1 = np.array([0, 0, 0])
        vec2 = np.array([0, 0, 0])
        assert analyzer._cosine_similarity(vec1, vec2) == 0.0
    
    def test_extract_skills(self, analyzer):
        """Test skill extraction"""
        text = "Python developer with Django and Docker experience"
        skills = analyzer.extract_skills(text)
        
        assert "Python" in skills
        assert "Django" in skills
        assert "Docker" in skills
        assert all(s.title() == s for s in skills)  # All titlecased
    
    def test_get_skill_sets(self, analyzer):
        """Test skill set operations"""
        resume_skills = ["Python", "Django", "Docker"]
        job_skills = ["Python", "Flask", "Docker"]
        
        matching, missing, job_set = analyzer._get_skill_sets(resume_skills, job_skills)
        
        assert matching == {"python", "docker"}
        assert missing == {"flask"}
        assert job_set == {"python", "flask", "docker"}
    
    def test_calculate_score_value(self, analyzer):
        """Test score calculation"""
        score = analyzer._calculate_score_value(0.8, 0.9)
        assert score <= 95  # MAX_SCORE
        assert score > 0
        
        # Perfect scores should hit max
        score = analyzer._calculate_score_value(1.0, 1.0)
        assert score == 95
        
        # Zero scores
        score = analyzer._calculate_score_value(0.0, 0.0)
        assert score == 0
    
    def test_get_rating(self, analyzer):
        """Test rating assignment"""
        rating = analyzer._get_rating(85)
        assert rating["rating"] == "Excellent"
        assert rating["emoji"] == "🌟"
        
        rating = analyzer._get_rating(65)
        assert rating["rating"] == "Good"
        
        rating = analyzer._get_rating(45)
        assert rating["rating"] == "Fair"
        
        rating = analyzer._get_rating(30)
        assert rating["rating"] == "Needs Work"
    
    def test_build_recommendations(self, analyzer):
        """Test recommendation generation"""
        recs = analyzer._build_recommendations(0.8, 60, [])
        assert len(recs) <= 5  # LIMIT_RECOMMENDATIONS
        assert "Quantify your achievements with numbers" in recs
        
        recs = analyzer._build_recommendations(0.3, 30, ["python", "django"])
        assert any("Add these skills" in r for r in recs)
        assert any("keywords" in r for r in recs)
    
    def test_analyze_complete_flow(self):
        """Test complete analysis flow"""
        # Create analyzer without mocking for this test
        analyzer = Analyzer()
        result = analyzer.analyze(
            "Python developer with Django experience",
            "Looking for Python developer"
        )
        
        assert "ats_score" in result
        assert "similarity" in result
        assert "skills" in result
        assert "recommendations" in result
        assert "processing_time_ms" in result
        
        assert result["ats_score"]["score"] >= 0
        assert result["ats_score"]["score"] <= 95
        assert isinstance(result["similarity"], float)
        assert isinstance(result["recommendations"], list)
    
    def test_optimize_reuses_analyze(self, analyzer):
        """Test optimize reuses analyze"""
        with patch.object(analyzer, 'analyze') as mock_analyze:
            mock_analyze.return_value = {
                "ats_score": {"score": 75},
                "skills": {"missing": ["flask"]}
            }
            
            result = analyzer.optimize("resume", "job")
            
            mock_analyze.assert_called_once_with("resume", "job")
            assert result["current"] == 75
            assert result["potential"] == 90  # 75 + 15
            assert result["missing"] == ["flask"]
    
    def test_get_status(self, analyzer):
        """Test status generation"""
        status = analyzer.get_status()
        
        assert status["status"] == "operational"
        assert "model" in status
        assert status["total"] == 0
        assert status["avg_ms"] == 0.0
        assert status["uptime"] >= 0
        assert status["cache"] == 0


class TestRequestModels:
    """Test Pydantic models"""
    
    def test_base_request_model(self):
        """Test BaseRequest model"""
        req = BaseRequest(
            resume_text="test resume",
            job_description="test job"
        )
        assert req.resume_text == "test resume"
        assert req.job_description == "test job"
    
    def test_base_request_validation(self):
        """Test BaseRequest validation"""
        with pytest.raises(Exception):
            BaseRequest(resume_text="test")  # Missing job_description
        
        with pytest.raises(Exception):
            BaseRequest(job_description="test")  # Missing resume_text


class TestConstants:
    """Test all constants are properly defined"""
    
    def test_skills_database(self):
        """Test skills database structure"""
        assert isinstance(ALL_SKILLS, list)
        assert len(ALL_SKILLS) > 0
        assert all(isinstance(s, str) for s in ALL_SKILLS)
        assert "python" in ALL_SKILLS
    
    def test_score_ratings(self):
        """Test score ratings structure"""
        assert isinstance(SCORE_RATINGS, list)
        assert len(SCORE_RATINGS) > 0
        for threshold, rating in SCORE_RATINGS:
            assert isinstance(threshold, int)
            assert isinstance(rating, dict)
            assert "rating" in rating
            assert "emoji" in rating
    
    def test_recommendations_templates(self):
        """Test recommendations structure"""
        assert isinstance(RECOMMENDATIONS, dict)
        assert "skills_missing" in RECOMMENDATIONS
        assert "low_similarity" in RECOMMENDATIONS
        
        # Test lambda function
        result = RECOMMENDATIONS["skills_missing"](["python", "django"])
        assert "python" in result
        assert "django" in result
    
    def test_config_dataclass(self):
        """Test configuration"""
        assert config.title == "Talent Assessment AI Service"
        assert config.version == "3.0.0"
        assert config.host == "0.0.0.0"
        assert config.port == 8000


if __name__ == "__main__":
    pytest.main(["-v", __file__])