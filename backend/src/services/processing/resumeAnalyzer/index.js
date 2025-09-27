const CacheService = require('../cacheService');
const PDFProcessor = require('../pdfProcessor');
const GeminiService = require('../../ai-services/llm/geminiService');

class ResumeAnalyzerService {
    constructor(config = {}) {
        this.cacheService = config.cacheService || new CacheService();
        this.pdfProcessor = config.pdfProcessor || new PDFProcessor();
        this.aiService = config.aiService || new GeminiService(config);
    }

    async analyzeResume(resumePath, jobDescription) {
        // Generate cache key
        const cacheKey = this.cacheService.generateKey('analyze', resumePath, jobDescription);
        
        // Check cache
        const cached = this.cacheService.get(cacheKey);
        if (cached) return cached;
        
        try {
            // Extract text from resume
            const resumeText = await this.pdfProcessor.extractText(resumePath);
            
            // Analyze with AI
            const prompt = `
                Analyze the following resume against the job description:
                
                Resume: ${resumeText}
                
                Job Description: ${jobDescription}
                
                Provide:
                1. Match score (0-100)
                2. Key strengths
                3. Areas for improvement
                4. Missing skills
                5. Overall recommendation
            `;
            
            const analysis = await this.aiService.generateContent(prompt);
            
            // Parse and structure the response
            const result = {
                analysis,
                score: this._extractScore(analysis),
                strengths: this._extractStrengths(analysis),
                improvements: this._extractImprovements(analysis),
                timestamp: new Date()
            };
            
            // Cache the result
            this.cacheService.set(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('Resume analysis error:', error);
            throw error;
        }
    }

    _extractScore(text) {
        const match = text.match(/(\d+)\/100|\d+%/);
        return match ? parseInt(match[1] || match[0]) : 0;
    }

    _extractStrengths(text) {
        // Extract strengths section
        const strengthsMatch = text.match(/strengths?:([^]*?)(?:areas?|improvements?|missing|$)/i);
        return strengthsMatch ? strengthsMatch[1].trim() : '';
    }

    _extractImprovements(text) {
        // Extract improvements section
        const improvementsMatch = text.match(/improvements?:([^]*?)(?:missing|recommendation|$)/i);
        return improvementsMatch ? improvementsMatch[1].trim() : '';
    }
}

module.exports = ResumeAnalyzerService;
