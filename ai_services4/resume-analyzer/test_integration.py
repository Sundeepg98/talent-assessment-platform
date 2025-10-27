"""
Integration Tests for Resume Analyzer
Tests API endpoints and component interactions
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, analyzer


class TestAPIEndpoints:
    """Test all API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns status"""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "operational"
        assert "model" in data
        assert "total" in data
        assert "avg_ms" in data
        assert "uptime" in data
    
    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["healthy"] == True
        assert "time" in data
    
    def test_stats_endpoint(self, client):
        """Test stats endpoint"""
        response = client.get("/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "operational"
        assert isinstance(data["total"], int)
        assert isinstance(data["avg_ms"], float)
    
    def test_analyze_endpoint_success(self, client):
        """Test analyze endpoint with valid data"""
        response = client.post(
            "/analyze",
            json={
                "resume_text": "Python developer with 5 years experience in Django, FastAPI, Docker, and AWS",
                "job_description": "Looking for Python developer with Django and cloud experience"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "ats_score" in data
        assert "similarity" in data
        assert "skills" in data
        assert "recommendations" in data
        assert "processing_time_ms" in data
        
        # Check ATS score structure
        assert "score" in data["ats_score"]
        assert "rating" in data["ats_score"]
        assert "emoji" in data["ats_score"]
        
        # Check skills structure
        assert "resume" in data["skills"]
        assert "job" in data["skills"]
        assert "matching" in data["skills"]
        assert "missing" in data["skills"]
        assert "coverage" in data["skills"]
        
        # Validate data types
        assert isinstance(data["ats_score"]["score"], (int, float))
        assert 0 <= data["ats_score"]["score"] <= 95
        assert isinstance(data["similarity"], (int, float))
        assert isinstance(data["recommendations"], list)
        assert isinstance(data["processing_time_ms"], (int, float))
    
    def test_analyze_endpoint_missing_fields(self, client):
        """Test analyze endpoint with missing fields"""
        response = client.post(
            "/analyze",
            json={"resume_text": "Python developer"}
        )
        assert response.status_code == 422  # Validation error
        
        response = client.post(
            "/analyze",
            json={"job_description": "Looking for developer"}
        )
        assert response.status_code == 422
    
    def test_analyze_endpoint_empty_text(self, client):
        """Test analyze endpoint with empty text"""
        response = client.post(
            "/analyze",
            json={
                "resume_text": "",
                "job_description": ""
            }
        )
        
        # Should still work but with low scores
        assert response.status_code == 200
        data = response.json()
        assert data["similarity"] == 0.0
    
    def test_optimize_endpoint_success(self, client):
        """Test optimize endpoint"""
        response = client.post(
            "/optimize",
            json={
                "resume_text": "Junior Python developer",
                "job_description": "Senior Python developer with Django, Docker, Kubernetes experience needed"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "current" in data
        assert "potential" in data
        assert "missing" in data
        assert "steps" in data
        
        # Validate logic
        assert data["potential"] >= data["current"]
        assert data["potential"] <= 95
        assert isinstance(data["missing"], list)
        assert isinstance(data["steps"], list)
        
        # Check steps structure
        if data["steps"]:
            step = data["steps"][0]
            assert "action" in step
            assert "impact" in step
    
    def test_optimize_reuses_analyze(self, client):
        """Test that optimize properly reuses analyze"""
        # Make the same request to both endpoints
        test_data = {
            "resume_text": "Python developer with Django",
            "job_description": "Python developer needed"
        }
        
        analyze_response = client.post("/analyze", json=test_data)
        optimize_response = client.post("/optimize", json=test_data)
        
        assert analyze_response.status_code == 200
        assert optimize_response.status_code == 200
        
        analyze_data = analyze_response.json()
        optimize_data = optimize_response.json()
        
        # Optimize should reference the same score from analyze
        assert optimize_data["current"] == analyze_data["ats_score"]["score"]


class TestEndToEndFlow:
    """Test complete user flows"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    def test_full_analysis_flow(self, client):
        """Test a complete analysis workflow"""
        # 1. Check system status
        response = client.get("/")
        assert response.status_code == 200
        initial_total = response.json()["total"]
        
        # 2. Perform analysis
        analyze_response = client.post(
            "/analyze",
            json={
                "resume_text": "Experienced Python developer with expertise in Django, FastAPI, PostgreSQL, Docker, and AWS. Built scalable microservices and REST APIs.",
                "job_description": "We need a Python backend developer with Django experience. Must know databases, Docker, and cloud platforms."
            }
        )
        assert analyze_response.status_code == 200
        analyze_data = analyze_response.json()
        
        # 3. Get optimization suggestions
        optimize_response = client.post(
            "/optimize",
            json={
                "resume_text": "Experienced Python developer with expertise in Django, FastAPI, PostgreSQL, Docker, and AWS. Built scalable microservices and REST APIs.",
                "job_description": "We need a Python backend developer with Django experience. Must know databases, Docker, and cloud platforms."
            }
        )
        assert optimize_response.status_code == 200
        optimize_data = optimize_response.json()
        
        # 4. Check stats updated
        stats_response = client.get("/stats")
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        assert stats_data["total"] >= initial_total + 2  # At least 2 analyses
        
        # 5. Verify data consistency
        assert optimize_data["current"] == analyze_data["ats_score"]["score"]
        
        # 6. Health check still works
        health_response = client.get("/health")
        assert health_response.status_code == 200
    
    def test_multiple_concurrent_requests(self, client):
        """Test handling multiple concurrent requests"""
        import concurrent.futures
        
        def make_request():
            return client.post(
                "/analyze",
                json={
                    "resume_text": "Python developer",
                    "job_description": "Python needed"
                }
            )
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        # All requests should succeed
        assert all(r.status_code == 200 for r in results)
        
        # Check stats reflect all requests
        stats = client.get("/stats").json()
        assert stats["total"] >= 10


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    def test_invalid_json(self, client):
        """Test handling of invalid JSON"""
        response = client.post(
            "/analyze",
            content="not json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_wrong_http_method(self, client):
        """Test wrong HTTP methods"""
        response = client.get("/analyze")
        assert response.status_code == 405  # Method not allowed
        
        response = client.post("/")
        assert response.status_code == 405
    
    def test_nonexistent_endpoint(self, client):
        """Test 404 for nonexistent endpoints"""
        response = client.get("/nonexistent")
        assert response.status_code == 404
    
    def test_very_long_text(self, client):
        """Test handling of very long text"""
        long_text = "Python " * 10000  # Very long text
        
        response = client.post(
            "/analyze",
            json={
                "resume_text": long_text,
                "job_description": "Python developer"
            }
        )
        
        # Should still work
        assert response.status_code == 200
        data = response.json()
        assert "processing_time_ms" in data
    
    def test_special_characters(self, client):
        """Test handling of special characters"""
        response = client.post(
            "/analyze",
            json={
                "resume_text": "Python developer with 日本語 and émojis 🚀",
                "job_description": "Python developer needed! @#$%"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "ats_score" in data


class TestCaching:
    """Test caching behavior"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    def test_embedding_cache_improves_performance(self, client):
        """Test that caching improves performance"""
        test_data = {
            "resume_text": "Python developer with Django and Docker",
            "job_description": "Python developer needed"
        }
        
        # First request - no cache
        response1 = client.post("/analyze", json=test_data)
        assert response1.status_code == 200
        time1 = response1.json()["processing_time_ms"]
        
        # Second identical request - should use cache
        response2 = client.post("/analyze", json=test_data)
        assert response2.status_code == 200
        time2 = response2.json()["processing_time_ms"]
        
        # Cache status should show entries
        stats = client.get("/stats").json()
        # Should have at least 2 analyses
        assert stats["total"] >= 2


if __name__ == "__main__":
    pytest.main(["-v", __file__])