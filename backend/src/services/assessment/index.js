/**
 * Assessment Services
 * Domain: assessment
 * 
 * Services for code execution, testing, and evaluation
 */

module.exports = {
  judge0Service: require('./judge0Service'),
  mockJudge0Service: require('./mockJudge0Service'),
  realJudge0Service: require('./realJudge0Service'),
  questionService: require('./questionService'),
  questionBank: require('./questionBank')
};