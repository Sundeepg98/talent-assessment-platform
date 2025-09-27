/**
 * Processing Services
 * Domain: processing
 * 
 * Services for file processing, text analysis, and document handling
 */

module.exports = {
  pdfProcessor: require('./pdfProcessor'),
  resume: require('./resume'),
  resumeAnalyzer: require('./resumeAnalyzer'),
  textAnalysis: require('./textAnalysis')
};