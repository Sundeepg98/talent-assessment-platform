const axios = require('axios');

class Judge0Service {
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.JUDGE0_API_KEY;
        this.baseUrl = config.baseUrl || process.env.JUDGE0_BASE_URL || 'https://judge0-ce.p.rapidapi.com';
        this.apiHost = config.apiHost || 'judge0-ce.p.rapidapi.com';
    }

    async submitCode(code, languageId, stdin = '') {
        if (!this.apiKey) {
            throw new Error('Judge0 API key required');
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/submissions?base64_encoded=false&wait=false`,
                {
                    source_code: code,
                    language_id: languageId,
                    stdin: stdin
                },
                {
                    headers: {
                        'X-RapidAPI-Key': this.apiKey,
                        'X-RapidAPI-Host': this.apiHost,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Judge0 submission error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getSubmission(token) {
        if (!this.apiKey) {
            throw new Error('Judge0 API key required');
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/submissions/${token}?base64_encoded=false`,
                {
                    headers: {
                        'X-RapidAPI-Key': this.apiKey,
                        'X-RapidAPI-Host': this.apiHost
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Judge0 fetch error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = Judge0Service;
