#!/usr/bin/env python3
"""
Resume Text Processor - Level 1 of 3-Level Hybrid ML
Provides text quality metrics using NLTK
"""

import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from collections import Counter
import re

# Download required NLTK data
nltk.download('punkt', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('stopwords', quiet=True)


class ResumeTextProcessor:
    """
    NLTK-based text analysis for resume quality assessment
    """

    def __init__(self):
        from nltk.corpus import stopwords
        self.stop_words = set(stopwords.words('english'))

    def word_count(self, text: str) -> int:
        """Count total words in text"""
        words = word_tokenize(text)
        return len(words)

    def sentence_count(self, text: str) -> int:
        """Count total sentences in text"""
        sentences = sent_tokenize(text)
        return len(sentences)

    def avg_sentence_length(self, text: str) -> float:
        """Calculate average sentence length"""
        sentences = sent_tokenize(text)
        if not sentences:
            return 0.0
        words = word_tokenize(text)
        return len(words) / len(sentences)

    def lexical_diversity(self, text: str) -> float:
        """
        Calculate lexical diversity (unique words / total words)
        Higher values indicate richer vocabulary
        """
        words = word_tokenize(text.lower())
        if not words:
            return 0.0
        # Filter out punctuation and stopwords for better metric
        words_filtered = [w for w in words if w.isalnum() and w not in self.stop_words]
        if not words_filtered:
            return 0.0
        return len(set(words_filtered)) / len(words_filtered)

    def pos_diversity(self, text: str) -> float:
        """
        Calculate part-of-speech diversity
        Measures variety of grammatical structures used
        """
        from nltk import pos_tag
        words = word_tokenize(text)
        if not words:
            return 0.0
        tags = [tag for word, tag in pos_tag(words)]
        if not tags:
            return 0.0
        return len(set(tags)) / len(tags)

    def action_verb_count(self, text: str) -> int:
        """
        Count action verbs (important for resume impact)
        Action verbs indicate accomplishments and responsibilities
        """
        from nltk import pos_tag

        # Common resume action verbs
        action_verbs = {
            'achieved', 'improved', 'implemented', 'developed', 'managed',
            'led', 'created', 'designed', 'optimized', 'increased', 'reduced',
            'streamlined', 'coordinated', 'executed', 'launched', 'delivered',
            'spearheaded', 'established', 'enhanced', 'transformed', 'built'
        }

        words = word_tokenize(text.lower())
        tags = pos_tag(words)

        # Count both POS-tagged verbs and explicit action verbs
        verb_count = sum(1 for word, tag in tags if tag.startswith('VB') and word in action_verbs)
        return verb_count

    def quantifiable_achievements(self, text: str) -> int:
        """
        Count quantifiable achievements (numbers, percentages, metrics)
        Resumes with metrics are more impactful
        """
        # Pattern: numbers, percentages, dollar amounts, time periods
        patterns = [
            r'\d+%',              # Percentages
            r'\$\d+[KMB]?',       # Dollar amounts
            r'\d+\+',             # 10+, 100+
            r'\d+x',              # 2x, 10x improvements
            r'\d+[,\d]*',         # Any number
        ]

        count = 0
        for pattern in patterns:
            matches = re.findall(pattern, text)
            count += len(matches)

        return count

    def flesch_reading_ease(self, text: str) -> float:
        """
        Calculate Flesch Reading Ease score
        Higher scores = easier to read
        Target for resumes: 60-70 (standard)
        """
        sentences = sent_tokenize(text)
        words = word_tokenize(text)

        if not sentences or not words:
            return 0.0

        # Count syllables (simplified)
        def count_syllables(word):
            word = word.lower()
            count = 0
            vowels = 'aeiouy'
            if word[0] in vowels:
                count += 1
            for index in range(1, len(word)):
                if word[index] in vowels and word[index - 1] not in vowels:
                    count += 1
            if word.endswith('e'):
                count -= 1
            if count == 0:
                count += 1
            return count

        total_syllables = sum(count_syllables(word) for word in words if word.isalnum())

        # Flesch Reading Ease formula
        if len(sentences) == 0 or len(words) == 0:
            return 0.0

        score = 206.835 - 1.015 * (len(words) / len(sentences)) - 84.6 * (total_syllables / len(words))

        # Clamp to 0-100 range
        return max(0.0, min(100.0, score))

    def analyze_quality(self, text: str) -> dict:
        """
        Comprehensive text quality analysis
        Returns all NLTK-based metrics in one dict
        """
        return {
            "word_count": self.word_count(text),
            "sentence_count": self.sentence_count(text),
            "avg_sentence_length": round(self.avg_sentence_length(text), 2),
            "lexical_diversity": round(self.lexical_diversity(text), 3),
            "pos_diversity": round(self.pos_diversity(text), 3),
            "action_verb_count": self.action_verb_count(text),
            "quantifiable_achievements": self.quantifiable_achievements(text),
            "readability_score": round(self.flesch_reading_ease(text), 1)
        }

    def calculate_text_quality_score(self, metrics: dict) -> float:
        """
        Calculate overall text quality score from metrics
        Returns 0-100 score based on text quality
        """
        # Scoring weights
        scores = []

        # Word count (optimal: 300-800 words)
        word_count = metrics.get('word_count', 0)
        if 300 <= word_count <= 800:
            scores.append(100)
        elif word_count < 300:
            scores.append((word_count / 300) * 100)
        else:
            scores.append(max(0, 100 - (word_count - 800) / 10))

        # Lexical diversity (optimal: > 0.6)
        lexical = metrics.get('lexical_diversity', 0)
        scores.append(min(100, lexical * 150))

        # POS diversity (optimal: > 0.3)
        pos_div = metrics.get('pos_diversity', 0)
        scores.append(min(100, pos_div * 300))

        # Action verbs (optimal: 10-30)
        action_verbs = metrics.get('action_verb_count', 0)
        if 10 <= action_verbs <= 30:
            scores.append(100)
        elif action_verbs < 10:
            scores.append((action_verbs / 10) * 100)
        else:
            scores.append(max(50, 100 - (action_verbs - 30) * 2))

        # Quantifiable achievements (optimal: 5-20)
        quant = metrics.get('quantifiable_achievements', 0)
        if 5 <= quant <= 20:
            scores.append(100)
        elif quant < 5:
            scores.append((quant / 5) * 100)
        else:
            scores.append(max(50, 100 - (quant - 20) * 3))

        # Readability (optimal: 60-70)
        readability = metrics.get('readability_score', 0)
        if 60 <= readability <= 70:
            scores.append(100)
        else:
            # Distance from optimal range
            if readability < 60:
                scores.append(max(0, readability * 1.5))
            else:
                scores.append(max(0, 100 - (readability - 70) * 2))

        # Weighted average
        return sum(scores) / len(scores)


# Test function for direct execution
def main():
    """Test the text processor"""
    import sys
    import json

    try:
        # Read from stdin
        input_data = json.loads(sys.stdin.read())
        text = input_data.get('text', '')

        processor = ResumeTextProcessor()
        metrics = processor.analyze_quality(text)
        quality_score = processor.calculate_text_quality_score(metrics)

        result = {
            "metrics": metrics,
            "quality_score": round(quality_score, 1),
            "text_processor": "NLTK",
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
