module.exports = {
  GoogleGenerativeAI: class {
    constructor() {}
    getGenerativeModel() {
      return {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => 'AI generated content' }
        })
      };
    }
  }
};