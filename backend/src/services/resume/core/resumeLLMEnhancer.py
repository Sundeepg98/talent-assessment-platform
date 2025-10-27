#!/usr/bin/env python3
"""
Resume LLM Enhancer - Level 3 of 3-Level Hybrid ML
Provides intelligent feedback using Google Gemini AI
"""

import os
import requests
import json
import re
from typing import Dict, List


class ResumeLLMEnhancer:
    """
    Gemini AI-powered resume analysis and optimization
    """

    def __init__(self, api_key: str = None):
        """
        Initialize LLM enhancer with Gemini API key

        Args:
            api_key: Google Gemini API key (if None, tries from environment)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY', '')
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        self.max_retries = 2

    def _call_gemini_api(self, prompt: str) -> str:
        """
        Call Gemini API with prompt and return response text

        Args:
            prompt: Text prompt for Gemini

        Returns:
            str: Gemini's response text
        """
        if not self.api_key:
            return ""  # Fallback if no API key

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        headers = {"Content-Type": "application/json"}

        try:
            resp = requests.post(
                f"{self.api_url}?key={self.api_key}",
                headers=headers,
                json=payload,
                timeout=30
            )

            if resp.status_code == 200:
                candidates = resp.json().get("candidates", [])
                if candidates:
                    return candidates[0]["content"]["parts"][0]["text"].strip()

        except Exception as e:
            print(f"Gemini API error: {e}")

        return ""

    def _clean_json_output(self, raw_output: str) -> str:
        """Clean Gemini output for JSON parsing"""
        cleaned = raw_output.strip()

        # Remove code fences
        cleaned = re.sub(r'^```json\s*', '', cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r'^```\s*$', '', cleaned, flags=re.MULTILINE)

        # Fix common JSON issues
        cleaned = re.sub(r',\s*}', '}', cleaned)  # Trailing commas in objects
        cleaned = re.sub(r',\s*]', ']', cleaned)  # Trailing commas in arrays

        return cleaned.strip()

    def _safe_json_parse(self, raw_output: str) -> Dict:
        """
        Safely parse JSON with fallback

        Returns:
            dict: Parsed feedback or fallback structure
        """
        try:
            cleaned = self._clean_json_output(raw_output)
            parsed = json.loads(cleaned)

            # Validate structure
            required_keys = ['strengths', 'improvements', 'recommendations', 'relevance_score']
            for key in required_keys:
                if key not in parsed:
                    if key == 'relevance_score':
                        parsed[key] = 50
                    else:
                        parsed[key] = []

            return parsed

        except Exception as e:
            print(f"JSON parse error: {e}")
            return {
                "strengths": ["Could not generate LLM feedback"],
                "improvements": ["Manual review recommended"],
                "recommendations": ["Ensure resume is well-formatted"],
                "relevance_score": 50
            }

    def enhance_analysis(
        self,
        resume_text: str,
        job_description: str,
        matching_skills: List[str],
        missing_skills: List[str],
        similarity_score: float
    ) -> Dict:
        """
        Generate enhanced feedback using Gemini AI

        Args:
            resume_text: Full resume text
            job_description: Job description text
            matching_skills: Skills that match between resume and JD
            missing_skills: Skills in JD but missing from resume
            similarity_score: BERT similarity score (0-1)

        Returns:
            dict: Enhanced feedback with strengths, improvements, recommendations
        """
        if not self.api_key:
            return self._get_fallback_feedback()

        # Create context-aware prompt
        prompt = self._create_resume_optimization_prompt(
            resume_text,
            job_description,
            matching_skills,
            missing_skills,
            similarity_score
        )

        # Call Gemini with retry logic
        raw_output = None
        for attempt in range(self.max_retries):
            raw_output = self._call_gemini_api(prompt)
            if raw_output:
                break

        if not raw_output:
            return self._get_fallback_feedback()

        # Parse and return feedback
        return self._safe_json_parse(raw_output)

    def _create_resume_optimization_prompt(
        self,
        resume: str,
        job_desc: str,
        matches: List[str],
        gaps: List[str],
        similarity: float
    ) -> str:
        """
        Create a comprehensive prompt for Gemini to analyze resume

        Returns:
            str: Formatted prompt for Gemini API
        """
        prompt = f"""
You are an expert technical recruiter analyzing a resume against a job description.

**Job Description:**
{job_desc[:500]}...

**Resume Summary:**
{resume[:500]}...

**Current Analysis:**
- Matching Skills: {', '.join(matches[:10]) if matches else 'None identified'}
- Missing Skills: {', '.join(gaps[:10]) if gaps else 'None identified'}
- Semantic Similarity Score: {similarity:.2f} (0=poor, 1=excellent)

**Your Task:**
Provide actionable feedback to improve this candidate's resume for this specific role.

**Required Output Format (JSON):**
{{
  "strengths": [
    "Top 3 strongest points that match the job requirements"
  ],
  "improvements": [
    "Top 3 specific areas to improve for better alignment"
  ],
  "recommendations": [
    "Top 3 concrete actions to enhance the resume"
  ],
  "relevance_score": <number 0-100 indicating overall job fit>
}}

**Guidelines:**
1. Be specific and actionable (not generic advice)
2. Reference actual skills from the job description
3. Consider both technical skills and soft skills
4. Focus on demonstrable achievements
5. Suggest quantifiable metrics where missing

Return ONLY valid JSON, no additional text.
"""
        return prompt

    def _get_fallback_feedback(self) -> Dict:
        """
        Provide fallback feedback when Gemini is unavailable

        Returns:
            dict: Basic feedback structure
        """
        return {
            "strengths": [
                "Resume contains relevant technical experience",
                "Clear work history provided",
                "Skills section present"
            ],
            "improvements": [
                "Add more quantifiable achievements (e.g., '20% performance improvement')",
                "Align technical skills more closely with job requirements",
                "Include specific project outcomes and metrics"
            ],
            "recommendations": [
                "Highlight accomplishments using action verbs (achieved, improved, led)",
                "Add missing skills mentioned in job description",
                "Quantify impact with numbers, percentages, or metrics"
            ],
            "relevance_score": 60,
            "fallback_mode": True
        }

    def optimize_resume(
        self,
        resume_text: str,
        job_description: str,
        current_score: float
    ) -> Dict:
        """
        Generate optimized resume suggestions

        Args:
            resume_text: Original resume text
            job_description: Target job description
            current_score: Current resume score (0-100)

        Returns:
            dict: Optimization suggestions
        """
        if not self.api_key:
            return {
                "optimized_sections": [],
                "keyword_suggestions": [],
                "format_improvements": [],
                "fallback_mode": True
            }

        prompt = f"""
You are a resume optimization expert. Analyze this resume and suggest specific improvements.

**Current Resume:**
{resume_text[:800]}...

**Target Job:**
{job_description[:400]}...

**Current Score:** {current_score}/100

**Task:**
Provide concrete optimization suggestions to increase the score.

**Output Format (JSON):**
{{
  "optimized_sections": [
    "Specific section improvements (e.g., 'Professional Summary: Add 5+ years experience mention')"
  ],
  "keyword_suggestions": [
    "Critical keywords to add from job description"
  ],
  "format_improvements": [
    "Structural changes to improve readability"
  ]
}}

Return ONLY valid JSON.
"""

        raw_output = self._call_gemini_api(prompt)
        if not raw_output:
            return {"optimized_sections": [], "keyword_suggestions": [], "format_improvements": []}

        try:
            cleaned = self._clean_json_output(raw_output)
            parsed = json.loads(cleaned)
            return parsed
        except:
            return {"optimized_sections": [], "keyword_suggestions": [], "format_improvements": []}


# Test function for direct execution
def main():
    """Test the LLM enhancer"""
    import sys

    try:
        input_data = json.loads(sys.stdin.read())

        resume_text = input_data.get('resume_text', '')
        job_desc = input_data.get('job_description', '')
        matching_skills = input_data.get('matching_skills', [])
        missing_skills = input_data.get('missing_skills', [])
        similarity = input_data.get('similarity', 0.5)
        gemini_key = input_data.get('gemini_key', '')

        enhancer = ResumeLLMEnhancer(api_key=gemini_key)
        feedback = enhancer.enhance_analysis(
            resume_text,
            job_desc,
            matching_skills,
            missing_skills,
            similarity
        )

        result = {
            "llm_feedback": feedback,
            "llm_engine": "Gemini-2.0-Flash",
            "success": True
        }

        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "error": str(e),
            "success": False
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
