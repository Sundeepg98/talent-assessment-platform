class QuestionService {
    constructor(database) {
        this.db = database;
        // Real questions stored in memory if no DB
        this.inMemoryQuestions = [
            { 
                id: 1, 
                question: 'Explain the difference between let, const, and var in JavaScript', 
                category: 'javascript',
                difficulty: 'medium',
                expectedTime: 5
            },
            { 
                id: 2, 
                question: 'What is the event loop in Node.js?', 
                category: 'nodejs',
                difficulty: 'hard',
                expectedTime: 7
            },
            { 
                id: 3, 
                question: 'Describe your experience with RESTful APIs', 
                category: 'api',
                difficulty: 'medium',
                expectedTime: 5
            },
            { 
                id: 4, 
                question: 'How do you handle state management in React?', 
                category: 'react',
                difficulty: 'medium',
                expectedTime: 6
            },
            { 
                id: 5, 
                question: 'Explain SOLID principles with examples', 
                category: 'design',
                difficulty: 'hard',
                expectedTime: 10
            },
            { 
                id: 6, 
                question: 'What is dependency injection and why is it important?', 
                category: 'architecture',
                difficulty: 'medium',
                expectedTime: 5
            },
            { 
                id: 7, 
                question: 'How do you ensure code quality in your projects?', 
                category: 'practices',
                difficulty: 'easy',
                expectedTime: 4
            },
            { 
                id: 8, 
                question: 'Describe a challenging bug you fixed recently', 
                category: 'behavioral',
                difficulty: 'medium',
                expectedTime: 5
            }
        ];
    }

    async getQuestions(category) {
        if (this.db && this.db.questions) {
            try {
                const filter = category ? { category } : {};
                return await this.db.questions.find(filter);
            } catch (error) {
                console.error('Database query error:', error);
                // Fall back to in-memory questions
                return this._getInMemoryQuestions(category);
            }
        }
        
        return this._getInMemoryQuestions(category);
    }

    _getInMemoryQuestions(category) {
        if (category) {
            return this.inMemoryQuestions.filter(q => q.category === category);
        }
        return this.inMemoryQuestions;
    }

    async addQuestion(question) {
        if (!question.question || !question.category) {
            throw new Error('Question and category are required');
        }

        if (this.db && this.db.questions) {
            try {
                return await this.db.questions.create(question);
            } catch (error) {
                console.error('Database insert error:', error);
            }
        }
        
        // Add to in-memory storage
        const newQuestion = {
            id: this.inMemoryQuestions.length + 1,
            ...question,
            createdAt: new Date()
        };
        this.inMemoryQuestions.push(newQuestion);
        return newQuestion;
    }

    async getRandomQuestions(count = 5) {
        const allQuestions = await this.getQuestions();
        
        if (allQuestions.length === 0) {
            throw new Error('No questions available');
        }
        
        // Fisher-Yates shuffle algorithm for true randomness
        const shuffled = [...allQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    async getQuestionById(id) {
        if (this.db && this.db.questions) {
            try {
                return await this.db.questions.findById(id);
            } catch (error) {
                console.error('Database query error:', error);
            }
        }
        
        return this.inMemoryQuestions.find(q => q.id === id);
    }
}

module.exports = QuestionService;
