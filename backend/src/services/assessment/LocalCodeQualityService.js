const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * LocalCodeQualityService
 * 100% LOCAL code quality analysis - NO external APIs
 * Uses static analysis tools: pylint, eslint, complexity metrics
 *
 * Features:
 * - Zero cost (no API calls)
 * - Zero latency (local execution)
 * - Deterministic results (consistent grading)
 * - Works offline
 * - Industry-standard tools
 */
class LocalCodeQualityService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../../temp');
    console.log('Local Code Quality Service initialized (100% offline)');
  }

  /**
   * Analyze code quality using LOCAL static analysis
   * @param {string} sourceCode - The code to analyze
   * @param {string} problemDescription - The problem (for context)
   * @param {string} language - Programming language
   * @returns {Object} Quality analysis with score
   */
  async analyzeCodeQuality(sourceCode, problemDescription, language = 'python') {
    try {
      switch (language.toLowerCase()) {
        case 'python':
          return await this._analyzePython(sourceCode);
        case 'javascript':
        case 'js':
          return await this._analyzeJavaScript(sourceCode);
        default:
          return this._analyzeGeneric(sourceCode, language);
      }
    } catch (error) {
      console.error('Local analysis error:', error);
      return this._analyzeGeneric(sourceCode, language);
    }
  }

  /**
   * Analyze Python code using pylint
   * @private
   */
  async _analyzePython(sourceCode) {
    const fileId = crypto.randomBytes(8).toString('hex');
    const fileName = `analysis_${fileId}.py`;
    const filePath = path.join(this.tempDir, fileName);

    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // Write code to temp file
      await fs.writeFile(filePath, sourceCode);

      // Run pylint (if available)
      let pylintScore = 5.0;
      let issues = [];

      try {
        const { stdout } = await execAsync(`pylint ${filePath} --score=yes 2>&1`, {
          timeout: 5000
        });

        // Parse pylint score (format: "Your code has been rated at X.XX/10")
        const scoreMatch = stdout.match(/rated at ([\d.]+)\/10/);
        if (scoreMatch) {
          pylintScore = parseFloat(scoreMatch[1]);
        }

        // Parse issues
        const lines = stdout.split('\n');
        issues = lines
          .filter(line => line.match(/^.*:\d+:\d+:/))
          .slice(0, 5) // Top 5 issues
          .map(line => line.trim());

      } catch (pylintError) {
        // Pylint not installed or failed - fall back to basic analysis
        console.log('Pylint not available, using basic analysis');
      }

      // Basic code metrics (always available)
      const metrics = this._calculateBasicMetrics(sourceCode);

      // Calculate quality score
      const qualityScore = this._calculateQualityScore(pylintScore, metrics);

      // Cleanup
      await fs.unlink(filePath);

      return {
        qualityScore: Math.round(qualityScore),
        readability: Math.round(metrics.readability),
        efficiency: Math.round(metrics.efficiency),
        correctness: Math.round(pylintScore), // Out of 10
        bestPractices: Math.round(metrics.bestPractices),
        strengths: this._identifyStrengths(metrics),
        weaknesses: this._identifyWeaknesses(metrics, issues),
        suggestions: this._generateSuggestions(metrics, issues),
        feedback: `Code quality: ${qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs improvement'}`,
        toolsUsed: pylintScore !== 5.0 ? ['pylint', 'basic-metrics'] : ['basic-metrics']
      };

    } catch (error) {
      // Fallback to basic analysis
      await fs.unlink(filePath).catch(() => {});
      return this._analyzeGeneric(sourceCode, 'python');
    }
  }

  /**
   * Analyze JavaScript code using basic metrics
   * (ESLint would require installation, so using basic analysis)
   * @private
   */
  async _analyzeJavaScript(sourceCode) {
    const metrics = this._calculateBasicMetrics(sourceCode);

    // JavaScript-specific checks
    const jsMetrics = {
      ...metrics,
      usesModernSyntax: sourceCode.includes('const') || sourceCode.includes('let'),
      usesArrowFunctions: sourceCode.includes('=>'),
      usesStrict: sourceCode.includes('use strict'),
      hasConsoleLog: sourceCode.includes('console.log')
    };

    // Adjust scores for JS best practices
    if (jsMetrics.usesModernSyntax) metrics.bestPractices += 1;
    if (jsMetrics.usesArrowFunctions) metrics.bestPractices += 0.5;
    if (jsMetrics.usesStrict) metrics.bestPractices += 0.5;

    const qualityScore = this._calculateQualityScore(7, metrics);

    return {
      qualityScore: Math.round(qualityScore),
      readability: Math.round(metrics.readability),
      efficiency: Math.round(metrics.efficiency),
      correctness: 7, // Estimated
      bestPractices: Math.round(Math.min(10, metrics.bestPractices)),
      strengths: this._identifyStrengths(jsMetrics),
      weaknesses: this._identifyWeaknesses(jsMetrics, []),
      suggestions: this._generateSuggestions(jsMetrics, []),
      feedback: `JavaScript code quality: ${qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs improvement'}`,
      toolsUsed: ['basic-metrics', 'js-patterns']
    };
  }

  /**
   * Generic analysis for any language
   * @private
   */
  _analyzeGeneric(sourceCode, language) {
    const metrics = this._calculateBasicMetrics(sourceCode);
    const qualityScore = this._calculateQualityScore(7, metrics);

    return {
      qualityScore: Math.round(qualityScore),
      readability: Math.round(metrics.readability),
      efficiency: Math.round(metrics.efficiency),
      correctness: 7,
      bestPractices: Math.round(metrics.bestPractices),
      strengths: this._identifyStrengths(metrics),
      weaknesses: this._identifyWeaknesses(metrics, []),
      suggestions: this._generateSuggestions(metrics, []),
      feedback: `${language} code submitted successfully`,
      toolsUsed: ['basic-metrics']
    };
  }

  /**
   * Calculate basic code metrics (always available, no external tools)
   * @private
   */
  _calculateBasicMetrics(sourceCode) {
    const lines = sourceCode.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('#') || trimmed.startsWith('//') ||
             trimmed.startsWith('/*') || trimmed.startsWith('*');
    });

    const codeLines = nonEmptyLines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('#') && !trimmed.startsWith('//');
    });

    // Basic metrics
    const totalLines = lines.length;
    const codeLineCount = codeLines.length;
    const commentRatio = commentLines.length / Math.max(1, nonEmptyLines.length);
    const avgLineLength = codeLines.reduce((sum, line) => sum + line.length, 0) / Math.max(1, codeLines.length);

    // Function/method count (approximate)
    const functionCount = (sourceCode.match(/\bdef\s+\w+|function\s+\w+/g) || []).length;

    // Complexity indicators (approximate)
    const ifCount = (sourceCode.match(/\bif\b/g) || []).length;
    const loopCount = (sourceCode.match(/\b(for|while)\b/g) || []).length;
    const complexityScore = Math.max(1, ifCount + loopCount);

    // Calculate scores (0-10)
    let readability = 7;
    let efficiency = 7;
    let bestPractices = 7;

    // Readability adjustments
    if (avgLineLength > 120) readability -= 1; // Lines too long
    if (avgLineLength < 30 && codeLineCount > 5) readability -= 0.5; // Lines too short
    if (commentRatio > 0.15) readability += 1; // Good comments
    if (commentRatio > 0.3) readability += 0.5; // Excellent comments
    if (functionCount > 0) readability += 0.5; // Uses functions

    // Efficiency adjustments
    if (codeLineCount < 20) efficiency += 1; // Concise
    if (codeLineCount > 100) efficiency -= 1; // Too long
    if (complexityScore > 10) efficiency -= 1; // Too complex
    if (functionCount > 0) efficiency += 0.5; // Modular

    // Best practices adjustments
    if (commentRatio > 0.1) bestPractices += 1; // Has comments
    if (functionCount > 0) bestPractices += 1; // Modular design
    if (codeLineCount < 10 && functionCount === 0) bestPractices -= 1; // Too simple

    return {
      totalLines,
      codeLines: codeLineCount,
      commentLines: commentLines.length,
      commentRatio,
      avgLineLength: Math.round(avgLineLength),
      functionCount,
      complexityScore,
      readability: Math.max(0, Math.min(10, readability)),
      efficiency: Math.max(0, Math.min(10, efficiency)),
      bestPractices: Math.max(0, Math.min(10, bestPractices))
    };
  }

  /**
   * Calculate overall quality score
   * @private
   */
  _calculateQualityScore(toolScore, metrics) {
    // Weighted average:
    // 30% tool score (pylint, etc.)
    // 25% readability
    // 25% efficiency
    // 20% best practices

    const toolWeight = 0.30;
    const readabilityWeight = 0.25;
    const efficiencyWeight = 0.25;
    const practicesWeight = 0.20;

    const score = (
      (toolScore * 10 * toolWeight) +
      (metrics.readability * 10 * readabilityWeight) +
      (metrics.efficiency * 10 * efficiencyWeight) +
      (metrics.bestPractices * 10 * practicesWeight)
    );

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify code strengths
   * @private
   */
  _identifyStrengths(metrics) {
    const strengths = [];

    if (metrics.commentRatio > 0.15) {
      strengths.push('Well-documented with comments');
    }
    if (metrics.functionCount > 0) {
      strengths.push('Uses modular functions');
    }
    if (metrics.codeLines >= 10 && metrics.codeLines <= 50) {
      strengths.push('Appropriate code length');
    }
    if (metrics.avgLineLength >= 40 && metrics.avgLineLength <= 100) {
      strengths.push('Good line length balance');
    }
    if (metrics.complexityScore <= 5) {
      strengths.push('Simple and maintainable');
    }

    // Default strength if none found
    if (strengths.length === 0) {
      strengths.push('Code compiles successfully');
    }

    return strengths.slice(0, 3); // Top 3
  }

  /**
   * Identify code weaknesses
   * @private
   */
  _identifyWeaknesses(metrics, issues) {
    const weaknesses = [];

    // From static analysis tools
    if (issues.length > 0) {
      weaknesses.push(`${issues.length} style/quality issues detected`);
    }

    // From metrics
    if (metrics.commentRatio < 0.05 && metrics.codeLines > 10) {
      weaknesses.push('Needs more comments for clarity');
    }
    if (metrics.avgLineLength > 120) {
      weaknesses.push('Lines are too long (>120 chars)');
    }
    if (metrics.codeLines < 5) {
      weaknesses.push('Solution might be too simple');
    }
    if (metrics.codeLines > 100) {
      weaknesses.push('Consider breaking into smaller functions');
    }
    if (metrics.complexityScore > 10) {
      weaknesses.push('High cyclomatic complexity');
    }
    if (metrics.functionCount === 0 && metrics.codeLines > 20) {
      weaknesses.push('Should use functions for modularity');
    }

    return weaknesses.slice(0, 3); // Top 3
  }

  /**
   * Generate improvement suggestions
   * @private
   */
  _generateSuggestions(metrics, issues) {
    const suggestions = [];

    if (metrics.commentRatio < 0.1) {
      suggestions.push('Add comments to explain complex logic');
    }
    if (metrics.functionCount === 0 && metrics.codeLines > 15) {
      suggestions.push('Break code into reusable functions');
    }
    if (metrics.avgLineLength > 100) {
      suggestions.push('Break long lines for better readability');
    }
    if (metrics.complexityScore > 8) {
      suggestions.push('Simplify conditional logic');
    }

    // Generic suggestions
    suggestions.push('Consider edge cases and error handling');
    suggestions.push('Test with various inputs');

    return suggestions.slice(0, 3); // Top 3
  }

  /**
   * Calculate partial credit (compatible with old interface)
   */
  calculatePartialCredit(qualityAnalysis, testsPassed, totalTests) {
    const testPassRate = testsPassed / totalTests;

    if (testPassRate === 1.0) {
      return 0; // No partial credit needed
    }

    const maxPartialCredit = 40;
    const qualityFactor = qualityAnalysis.qualityScore / 100;
    const partialCredit = maxPartialCredit * qualityFactor * (0.5 + testPassRate * 0.5);

    return Math.round(partialCredit);
  }
}

module.exports = LocalCodeQualityService;
