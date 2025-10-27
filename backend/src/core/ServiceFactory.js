// DI Factory for proper service instantiation
module.exports = {
  createGeminiService: (config) => {
    const GeminiService = require('../ai-services/llm/geminiService');
    return new GeminiService(config);
  },
  
  createJudge0Service: (config) => {
    const Judge0Service = require('../services/assessment/judge0Service');
    return new Judge0Service(config);
  },
  
  createPDFProcessor: (config) => {
    const PDFProcessor = require('../services/processing/pdfProcessor');
    return new PDFProcessor(config);
  },
  
  createQuestionService: (database) => {
    const QuestionService = require('../services/assessment/questionService');
    return new QuestionService(database);
  }
};
