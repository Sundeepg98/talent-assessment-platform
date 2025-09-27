#!/usr/bin/env python3
"""
Interview Analyzer Service - Integrated into Main Backend
This runs as a subprocess called by Node.js backend
"""

import sys
import json
import os

class InterviewAnalyzer:
    """Lightweight interview analyzer for backend integration"""
    
    def __init__(self):
        self.keywords = {
            'technical': ['algorithm', 'data structure', 'complexity', 'optimization', 
                         'design', 'architecture', 'scalable', 'performance'],
            'behavioral': ['team', 'challenge', 'situation', 'action', 'result',
                          'leadership', 'conflict', 'deadline', 'collaborate'],
            'general': ['experience', 'project', 'responsibility', 'achieve',
                       'goal', 'success', 'learn', 'improve']
        }
    
    def analyze(self, question: str, response: str, role: str = 'Software Engineer'):
        """Analyze interview response"""
        response_lower = response.lower()
        question_lower = question.lower()
        
        # Determine question type
        if any(kw in question_lower for kw in ['technical', 'code', 'algorithm']):
            question_type = 'technical'
        elif any(kw in question_lower for kw in ['tell me about', 'describe', 'situation']):
            question_type = 'behavioral'
        else:
            question_type = 'general'
        
        # Check for relevant keywords
        keywords_found = [kw for kw in self.keywords[question_type] if kw in response_lower]
        
        # Calculate metrics
        word_count = len(response.split())
        
        # Scoring
        relevance_score = min(100, len(keywords_found) * 15)
        completeness_score = min(100, (word_count / 100) * 100)
        
        # STAR method check for behavioral
        star_score = 100
        if question_type == 'behavioral':
            star_elements = sum([
                1 for element in ['situation', 'task', 'action', 'result']
                if element in response_lower
            ])
            star_score = star_elements * 25
        
        # Overall score
        if question_type == 'behavioral':
            score = (relevance_score + completeness_score + star_score) / 3
        else:
            score = (relevance_score + completeness_score) / 2
        
        # Generate feedback
        strengths = []
        improvements = []
        
        if word_count > 50:
            strengths.append("Comprehensive response with good detail")
        else:
            improvements.append("Provide more detailed explanation")
        
        if keywords_found:
            strengths.append(f"Used relevant terminology: {', '.join(keywords_found[:3])}")
        else:
            improvements.append("Include more role-specific keywords and concepts")
        
        if question_type == 'behavioral' and star_score < 100:
            improvements.append("Use STAR method: Situation, Task, Action, Result")
        
        if 'example' in response_lower:
            strengths.append("Provided concrete examples")
        else:
            improvements.append("Include specific examples from your experience")
        
        return {
            "score": min(95, int(score)),
            "feedback": {
                "strengths": strengths[:3],
                "improvements": improvements[:3],
                "relevance": int(relevance_score),
                "completeness": int(completeness_score),
                "clarity": 75  # Default
            },
            "analysis": {
                "question_type": question_type,
                "word_count": word_count,
                "keywords_found": keywords_found[:5],
                "role": role
            }
        }

def main():
    """Main entry point for subprocess calls"""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Create analyzer and process
        analyzer = InterviewAnalyzer()
        result = analyzer.analyze(
            input_data.get('question', ''),
            input_data.get('response', ''),
            input_data.get('role', 'Software Engineer')
        )
        
        # Output JSON result
        print(json.dumps(result))
    except Exception as e:
        # Return error as valid JSON
        error_response = {
            "score": 50,
            "feedback": {
                "strengths": ["Attempted to answer the question"],
                "improvements": ["Could not fully analyze due to processing error"],
                "relevance": 50,
                "completeness": 50,
                "clarity": 50
            },
            "analysis": {
                "error": str(e),
                "question_type": "general",
                "word_count": 0,
                "keywords_found": []
            }
        }
        print(json.dumps(error_response))

if __name__ == "__main__":
    main()