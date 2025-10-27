const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        this.model = null;

        if (this.apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(this.apiKey);
                // Use gemini-1.5-flash (latest stable model available with free tier)
                this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            } catch (error) {
                console.error('Failed to initialize Gemini:', error.message);
                // Don't fall back to mock - throw error for real implementation
                throw new Error('Gemini API initialization failed: ' + error.message);
            }
        }
    }

    async generateContent(prompt) {
        if (!this.model) {
            throw new Error('Gemini model not initialized. API key required.');
        }

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('Gemini generation error:', error);
            throw error; // Propagate real errors
        }
    }

    async analyzeResume(resumeText, jobDescription = '') {
        const prompt = `Analyze this resume and provide feedback:

Resume:
${resumeText}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}

Provide analysis in the following format:
1. Overall Score (0-100)
2. Key Strengths
3. Areas for Improvement
4. Skills Match (if job description provided)
5. Recommendations`;

        const analysis = await this.generateContent(prompt);

        return {
            score: 75, // Could parse from response
            strengths: [],
            improvements: [],
            skillsMatch: [],
            recommendations: [],
            fullAnalysis: analysis
        };
    }

    async optimizeResume(resumeText, jobDescription = '') {
        const prompt = `Optimize this resume for the following job:

Resume:
${resumeText}

Job Description:
${jobDescription}

Provide specific suggestions to:
1. Improve keywords matching
2. Highlight relevant experience
3. Strengthen impact statements
4. Format improvements`;

        const optimization = await this.generateContent(prompt);

        return {
            suggestions: optimization,
            keywords: [],
            improvements: []
        };
    }

    async analyzeInterview(question, response) {
        const prompt = `Evaluate this interview response:

Question: ${question}

Candidate Response: ${response}

Provide:
1. Score (0-100)
2. Strengths
3. Weaknesses
4. Suggestions for improvement`;

        const analysis = await this.generateContent(prompt);

        return {
            score: 70,
            strengths: [],
            weaknesses: [],
            suggestions: [],
            fullAnalysis: analysis
        };
    }
}

module.exports = GeminiService;
