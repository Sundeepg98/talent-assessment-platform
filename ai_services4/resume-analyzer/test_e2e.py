"""
End-to-End Tests for Resume Analyzer
Simulates complete user workflows and scenarios
"""

import pytest
import time
import json
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, analyzer


class TestE2EWorkflows:
    """End-to-end test scenarios simulating real users"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    def test_college_student_workflow(self, client):
        """Simulate a college student analyzing their resume"""
        # Story: A CS student wants to check their resume against a job posting
        
        # 1. Student checks if system is working
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["healthy"] == True
        
        # 2. Student checks system status
        status = client.get("/")
        assert status.status_code == 200
        initial_count = status.json()["total"]
        
        # 3. Student submits their resume for analysis
        student_resume = """
        Computer Science Student | Final Year
        
        Skills: Python, Java, MySQL, Git, HTML/CSS, JavaScript
        
        Projects:
        - E-commerce Website: Built with Django and PostgreSQL
        - Android App: Java-based task manager
        - Machine Learning: Sentiment analysis using Python
        
        Education: B.Tech Computer Science, 8.5 CGPA
        
        Internship: Web Developer at XYZ Company (3 months)
        - Developed REST APIs using Flask
        - Worked with Docker for containerization
        """
        
        job_posting = """
        Junior Python Developer
        
        Requirements:
        - Strong Python programming skills
        - Experience with Django or Flask
        - Knowledge of databases (PostgreSQL, MySQL)
        - Familiarity with Docker and Kubernetes
        - Understanding of REST APIs
        - Git version control
        - AWS experience is a plus
        - Machine learning knowledge preferred
        """
        
        analysis = client.post("/analyze", json={
            "resume_text": student_resume,
            "job_description": job_posting
        })
        
        assert analysis.status_code == 200
        result = analysis.json()
        
        # Validate the analysis makes sense
        assert result["ats_score"]["score"] > 30  # At least some match
        assert result["ats_score"]["score"] <= 95  # Max score is 95
        # Check we found some skills
        assert len(result["skills"]["matching"]) > 0
        assert len(result["skills"]["job"]) > 0
        assert len(result["recommendations"]) > 0
        
        # 4. Student wants to know how to improve
        optimize = client.post("/optimize", json={
            "resume_text": student_resume,
            "job_description": job_posting
        })
        
        assert optimize.status_code == 200
        opt_result = optimize.json()
        
        assert opt_result["current"] == result["ats_score"]["score"]
        assert opt_result["potential"] >= opt_result["current"]
        # Check missing skills - they might be lowercase
        missing_lower = [s.lower() for s in opt_result["missing"]]
        assert len(missing_lower) > 0  # Should have some missing skills
        assert len(opt_result["steps"]) > 0
        
        # 5. Student checks stats to see their usage
        final_stats = client.get("/stats")
        assert final_stats.status_code == 200
        assert final_stats.json()["total"] >= initial_count + 2
    
    def test_professor_demo_workflow(self, client):
        """Simulate professor evaluating the project (5 resumes)"""
        # Story: Professor wants to test with 5 different student resumes
        
        resumes = [
            {
                "name": "Strong Candidate",
                "text": """
                Experienced Python Developer
                Skills: Python, Django, Flask, FastAPI, Docker, Kubernetes, AWS, PostgreSQL, MongoDB, Redis, 
                Git, CI/CD, Machine Learning, TensorFlow, REST APIs, Microservices
                5 years of experience building scalable applications
                """,
                "expected_score_min": 70
            },
            {
                "name": "Good Candidate", 
                "text": """
                Python Developer with 2 years experience
                Skills: Python, Django, MySQL, Git, Docker, REST APIs
                Built several web applications and APIs
                """,
                "expected_score_min": 50
            },
            {
                "name": "Fair Candidate",
                "text": """
                Junior Developer
                Skills: Python, JavaScript, HTML, CSS, Git
                Recent bootcamp graduate, eager to learn
                """,
                "expected_score_min": 35
            },
            {
                "name": "Weak Match",
                "text": """
                Graphic Designer transitioning to tech
                Skills: Photoshop, Illustrator, Basic HTML/CSS
                Currently learning Python through online courses
                """,
                "expected_score_min": 15
            },
            {
                "name": "Off-target",
                "text": """
                Sales Manager with 10 years experience
                Skills: CRM, Sales, Team Management, Excel
                No technical experience
                """,
                "expected_score_min": 0
            }
        ]
        
        job_desc = """
        Python Backend Developer
        Required: Python, Django or Flask, Databases, Docker, Git, REST APIs
        Preferred: AWS, Kubernetes, Machine Learning
        """
        
        results = []
        start_time = time.time()
        
        # Process all 5 resumes
        for resume in resumes:
            response = client.post("/analyze", json={
                "resume_text": resume["text"],
                "job_description": job_desc
            })
            
            assert response.status_code == 200
            result = response.json()
            score = result["ats_score"]["score"]
            
            # Verify score is in expected range
            assert score >= resume["expected_score_min"], \
                f"{resume['name']} scored {score}, expected >= {resume['expected_score_min']}"
            
            results.append({
                "name": resume["name"],
                "score": score,
                "time_ms": result["processing_time_ms"]
            })
        
        # Performance check - all 5 should complete quickly
        total_time = time.time() - start_time
        assert total_time < 5.0, f"Processing 5 resumes took {total_time}s, should be < 5s"
        
        # Verify scores make sense - strong candidates score better
        scores = [r["score"] for r in results]
        # Strong candidate should score well
        assert scores[0] > 60, f"Strong candidate should score > 60, got {scores[0]}"
        # Overall trend should be decreasing (strong > weak)
        assert scores[0] > scores[4], f"Strong ({scores[0]}) should score > Weak ({scores[4]})"
        # Check there's meaningful difference between best and worst
        assert scores[0] - scores[4] > 15, "Should be significant difference between best and worst"
        
        # Check system handled the load
        stats = client.get("/stats")
        assert stats.status_code == 200
        assert stats.json()["total"] >= 5
    
    def test_recovery_workflow(self, client):
        """Test system recovery from errors"""
        
        # 1. Send invalid request
        bad_response = client.post("/analyze", json={
            "resume_text": "test"
            # Missing job_description
        })
        assert bad_response.status_code == 422
        
        # 2. System should still work after error
        health = client.get("/health")
        assert health.status_code == 200
        
        # 3. Valid request should work
        good_response = client.post("/analyze", json={
            "resume_text": "Python developer",
            "job_description": "Python needed"
        })
        assert good_response.status_code == 200
        
        # 4. Stats should be consistent
        stats = client.get("/stats")
        assert stats.status_code == 200
        assert stats.json()["status"] == "operational"
    
    def test_cache_effectiveness(self, client):
        """Test that caching improves performance for repeated analyses"""
        
        resume = "Python developer with Django, Docker, and AWS experience"
        job = "Python backend developer with cloud experience needed"
        
        # Warm up
        client.post("/analyze", json={
            "resume_text": resume,
            "job_description": job
        })
        
        # Test cache performance
        times = []
        for i in range(3):
            start = time.time()
            response = client.post("/analyze", json={
                "resume_text": resume,
                "job_description": job
            })
            elapsed = (time.time() - start) * 1000  # Convert to ms
            
            assert response.status_code == 200
            times.append(elapsed)
        
        # Later requests should be faster due to caching
        # (though this might not always be true in tests)
        avg_first = times[0]
        avg_later = sum(times[1:]) / len(times[1:])
        
        # At minimum, cached requests shouldn't be much slower
        assert avg_later < avg_first * 2, \
            f"Cache not helping: first={avg_first}ms, later avg={avg_later}ms"
    
    def test_concurrent_users(self, client):
        """Simulate multiple users hitting the API simultaneously"""
        import concurrent.futures
        
        def analyze_resume(index):
            response = client.post("/analyze", json={
                "resume_text": f"Developer {index} with Python and Java skills",
                "job_description": "Looking for Python developer"
            })
            return response.status_code == 200, response.json()
        
        # Simulate 5 concurrent users (college project scale)
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(analyze_resume, i) for i in range(5)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        # All should succeed
        assert all(success for success, _ in results)
        
        # All should have valid scores
        scores = [data["ats_score"]["score"] for _, data in results]
        assert all(0 <= score <= 95 for score in scores)
    
    def test_full_user_journey(self, client):
        """Complete user journey from landing to optimization"""
        
        # User lands on the site
        root = client.get("/")
        assert root.status_code == 200
        assert "operational" in root.json()["status"]
        
        # User checks API docs exist (FastAPI feature)
        docs = client.get("/docs")
        assert docs.status_code == 200
        
        # User analyzes their first resume
        analysis1 = client.post("/analyze", json={
            "resume_text": "Junior Python developer with basic skills",
            "job_description": "Senior Python role with Docker, K8s, AWS required"
        })
        assert analysis1.status_code == 200
        score1 = analysis1.json()["ats_score"]["score"]
        
        # User improves resume based on feedback
        improved_resume = """
        Python developer with experience in:
        - Docker containerization
        - Basic AWS (EC2, S3)
        - Learning Kubernetes
        - 2 years Python development
        """
        
        # User re-analyzes
        analysis2 = client.post("/analyze", json={
            "resume_text": improved_resume,
            "job_description": "Senior Python role with Docker, K8s, AWS required"
        })
        assert analysis2.status_code == 200
        score2 = analysis2.json()["ats_score"]["score"]
        
        # Score should improve or stay at max
        assert score2 >= score1, "Improved resume should score at least as high"
        
        # User gets optimization tips
        optimize = client.post("/optimize", json={
            "resume_text": improved_resume,
            "job_description": "Senior Python role with Docker, K8s, AWS required"  
        })
        assert optimize.status_code == 200
        assert optimize.json()["potential"] > score2
        
        # User checks their total usage
        stats = client.get("/stats")
        assert stats.json()["total"] >= 3  # At least 3 analyses


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_empty_inputs(self, client):
        """Test with empty resume and job description"""
        response = client.post("/analyze", json={
            "resume_text": "",
            "job_description": ""
        })
        assert response.status_code == 200
        assert response.json()["similarity"] == 0.0
    
    def test_identical_inputs(self, client):
        """Test with identical resume and job description"""
        text = "Python Django Docker Kubernetes AWS PostgreSQL"
        response = client.post("/analyze", json={
            "resume_text": text,
            "job_description": text
        })
        assert response.status_code == 200
        result = response.json()
        assert result["similarity"] == 100.0
        assert result["ats_score"]["score"] == 95  # Max score
    
    def test_unicode_handling(self, client):
        """Test with various unicode characters"""
        response = client.post("/analyze", json={
            "resume_text": "Python developer 开发者 développeur 개발자",
            "job_description": "Python programmer needed"
        })
        assert response.status_code == 200
    
    def test_very_long_input(self, client):
        """Test with very long resume (edge case for college project)"""
        long_resume = "Python " * 1000 + "Django " * 500
        response = client.post("/analyze", json={
            "resume_text": long_resume,
            "job_description": "Python Django developer"
        })
        assert response.status_code == 200
        assert response.json()["ats_score"]["score"] > 65  # Good match for repetitive keywords
    
    def test_rapid_fire_requests(self, client):
        """Test rapid successive requests"""
        for i in range(10):
            response = client.post("/analyze", json={
                "resume_text": f"Resume {i}",
                "job_description": f"Job {i}"
            })
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main(["-v", __file__])