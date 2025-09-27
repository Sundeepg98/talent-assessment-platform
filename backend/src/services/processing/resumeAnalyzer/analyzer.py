#!/usr/bin/env python3
"""
Resume Analyzer Service - Integrated into Main Backend
This runs as a subprocess called by Node.js backend
"""

import sys
import json
import numpy as np
from typing import Dict, List

class ResumeAnalyzer:
    """Lightweight resume analyzer for backend integration"""
    
    def __init__(self):
        self.skills_db = [
            'python', 'java', 'javascript', 'react', 'nodejs',
            'docker', 'kubernetes', 'aws', 'mongodb', 'sql'
        ]
    
    def analyze(self, resume_text: str, job_description: str) -> Dict:
        """Analyze resume against job description"""
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Extract skills
        resume_skills = [s for s in self.skills_db if s in resume_lower]
        job_skills = [s for s in self.skills_db if s in job_lower]
        
        # Calculate match
        if job_skills:
            matching = set(resume_skills) & set(job_skills)
            score = len(matching) / len(job_skills) * 100
        else:
            score = 50  # Default score
        
        return {
            "ats_score": {
                "score": min(95, score * 0.9),
                "rating": "Good" if score > 60 else "Fair"
            },
            "skills": {
                "matching": list(matching) if job_skills else [],
                "missing": list(set(job_skills) - set(resume_skills))
            },
            "recommendations": [
                "Add more relevant keywords",
                "Quantify your achievements"
            ]
        }

def main():
    """Main entry point for subprocess calls"""
    # Read JSON input from stdin
    input_data = json.loads(sys.stdin.read())
    
    # Create analyzer and process
    analyzer = ResumeAnalyzer()
    result = analyzer.analyze(
        input_data.get('resume_text', ''),
        input_data.get('job_description', '')
    )
    
    # Output JSON result
    print(json.dumps(result))

if __name__ == "__main__":
    main()