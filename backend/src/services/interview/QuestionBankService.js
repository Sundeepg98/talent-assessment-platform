/**
 * Real Question Bank Service
 * Manages interview questions with categorization and difficulty levels
 */
class QuestionBankService {
  constructor() {
    // In a real implementation, these could come from MongoDB
    // For now, using structured in-memory bank with proper categorization
    this.questionBank = {
      technical: {
        easy: [
          "What is the difference between let, const, and var in JavaScript?",
          "Explain what a REST API is and how it works.",
          "What is the purpose of version control systems like Git?",
          "What is the difference between SQL and NoSQL databases?"
        ],
        medium: [
          "Explain the concept of asynchronous programming and how promises work.",
          "What are the SOLID principles in object-oriented design?",
          "Describe the differences between microservices and monolithic architecture.",
          "How would you optimize a slow database query?"
        ],
        hard: [
          "Design a distributed caching system that handles cache invalidation.",
          "Explain how you would implement a real-time collaborative editing system.",
          "Describe your approach to designing a scalable API rate limiting system.",
          "How would you debug a memory leak in a production Node.js application?"
        ]
      },
      behavioral: {
        easy: [
          "Tell me about yourself and your background.",
          "Why are you interested in this position?",
          "What are your greatest strengths?",
          "Where do you see yourself in 5 years?"
        ],
        medium: [
          "Describe a challenging project you worked on and how you overcame obstacles.",
          "Tell me about a time you had to work with a difficult team member.",
          "Describe a situation where you had to learn a new technology quickly.",
          "How do you handle tight deadlines and pressure?"
        ],
        hard: [
          "Tell me about a time you made a significant technical decision that had major implications.",
          "Describe a situation where you had to convince your team to adopt a different approach.",
          "How did you handle a situation where you disagreed with your manager's decision?",
          "Tell me about a project that failed and what you learned from it."
        ]
      }
    };
  }

  /**
   * Get questions based on interview type and difficulty
   */
  getQuestions({ interviewType = 'technical', difficulty = 'medium', count = 5 }) {
    const questions = this.questionBank[interviewType]?.[difficulty] || [];

    // Return requested number of questions (with shuffling)
    const shuffled = this._shuffle([...questions]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get a single random question
   */
  getRandomQuestion({ interviewType = 'technical', difficulty = 'medium' }) {
    const questions = this.questionBank[interviewType]?.[difficulty] || [];

    if (questions.length === 0) {
      return "Tell me about yourself"; // Fallback
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  /**
   * Get next question for session (sequential)
   */
  getNextQuestion({ interviewType = 'technical', difficulty = 'medium', currentIndex = 0 }) {
    const questions = this.questionBank[interviewType]?.[difficulty] || [];

    if (currentIndex >= questions.length) {
      return null; // No more questions
    }

    return {
      questionText: questions[currentIndex],
      questionNumber: currentIndex + 1,
      totalQuestions: questions.length,
      hasMore: currentIndex + 1 < questions.length
    };
  }

  /**
   * Get all available categories
   */
  getCategories() {
    return Object.keys(this.questionBank);
  }

  /**
   * Get difficulty levels
   */
  getDifficultyLevels() {
    return ['easy', 'medium', 'hard'];
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  _shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = QuestionBankService;
