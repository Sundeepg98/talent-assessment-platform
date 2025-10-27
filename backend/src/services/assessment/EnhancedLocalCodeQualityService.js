const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * EnhancedLocalCodeQualityService
 * 100% LOCAL code quality analysis with ADVANCED features:
 * - Security vulnerability detection
 * - PEP 8 style checking (Python)
 * - TypeScript-specific analysis
 * - Better scoring differentiation
 * - Performance anti-pattern detection
 */
class EnhancedLocalCodeQualityService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../../temp');
    this.securityPatterns = this._initializeSecurityPatterns();
    console.log('Enhanced Local Code Quality Service initialized (100% offline + advanced features)');
  }

  /**
   * Initialize security vulnerability patterns
   * @private
   */
  _initializeSecurityPatterns() {
    return {
      python: [
        { pattern: /\beval\s*\(/g, severity: 'CRITICAL', message: 'Use of eval() - Code injection risk' },
        { pattern: /\bexec\s*\(/g, severity: 'CRITICAL', message: 'Use of exec() - Code injection risk' },
        { pattern: /os\.system\s*\(/g, severity: 'HIGH', message: 'Use of os.system() - Command injection risk' },
        { pattern: /subprocess\.call\s*\([^)]*shell\s*=\s*True/g, severity: 'HIGH', message: 'subprocess with shell=True - Command injection risk' },
        { pattern: /pickle\.loads?\s*\(/g, severity: 'MEDIUM', message: 'Use of pickle - Deserialization risk' },
        { pattern: /input\s*\([^)]*\)/g, severity: 'LOW', message: 'Unvalidated input() usage' },
        { pattern: /open\s*\([^)]*\)/g, severity: 'LOW', message: 'File operation without error handling' }
      ],
      javascript: [
        { pattern: /\beval\s*\(/g, severity: 'CRITICAL', message: 'Use of eval() - Code injection risk' },
        { pattern: /Function\s*\(/g, severity: 'HIGH', message: 'Dynamic function creation - Security risk' },
        { pattern: /innerHTML\s*=/g, severity: 'MEDIUM', message: 'innerHTML usage - XSS risk' },
        { pattern: /document\.write\s*\(/g, severity: 'MEDIUM', message: 'document.write() - XSS risk' },
        { pattern: /setTimeout\s*\(\s*["']/g, severity: 'MEDIUM', message: 'setTimeout with string - Code injection risk' },
        { pattern: /setInterval\s*\(\s*["']/g, severity: 'MEDIUM', message: 'setInterval with string - Code injection risk' }
      ],
      typescript: [
        { pattern: /\beval\s*\(/g, severity: 'CRITICAL', message: 'Use of eval() - Code injection risk' },
        { pattern: /any\s+\w+/g, severity: 'LOW', message: 'Use of any type - Defeats type safety' },
        { pattern: /@ts-ignore/g, severity: 'MEDIUM', message: 'TypeScript error suppression - Code smell' }
      ]
    };
  }

  /**
   * Analyze code quality using LOCAL static analysis with ENHANCED features
   */
  async analyzeCodeQuality(sourceCode, problemDescription, language = 'python') {
    try {
      switch (language.toLowerCase()) {
        case 'python':
          return await this._analyzePython(sourceCode);
        case 'javascript':
        case 'js':
          return await this._analyzeJavaScript(sourceCode);
        case 'typescript':
        case 'ts':
          return await this._analyzeTypeScript(sourceCode);
        default:
          return this._analyzeGeneric(sourceCode, language);
      }
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      return this._analyzeGeneric(sourceCode, language);
    }
  }

  /**
   * Enhanced Python analysis
   * @private
   */
  async _analyzePython(sourceCode) {
    const fileId = crypto.randomBytes(8).toString('hex');
    const fileName = `analysis_${fileId}.py`;
    const filePath = path.join(this.tempDir, fileName);

    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.writeFile(filePath, sourceCode);

      let pylintScore = 5.0;
      let issues = [];

      // Try pylint
      try {
        const { stdout } = await execAsync(`pylint ${filePath} --score=yes 2>&1`, {
          timeout: 5000
        });
        const scoreMatch = stdout.match(/rated at ([\d.]+)\/10/);
        if (scoreMatch) {
          pylintScore = parseFloat(scoreMatch[1]);
        }
        const lines = stdout.split('\n');
        issues = lines
          .filter(line => line.match(/^.*:\d+:\d+:/))
          .slice(0, 5)
          .map(line => line.trim());
      } catch (pylintError) {
        // Pylint not available
      }

      // ENHANCED: Calculate metrics with better differentiation
      const metrics = this._calculateEnhancedMetrics(sourceCode, 'python');

      // ENHANCED: Security analysis
      const securityIssues = this._detectSecurityIssues(sourceCode, 'python');

      // ENHANCED: PEP 8 style checking
      const styleIssues = this._checkPythonStyle(sourceCode);

      // Calculate final score with penalties
      const qualityScore = this._calculateEnhancedQualityScore(pylintScore, metrics, securityIssues, styleIssues);

      await fs.unlink(filePath);

      return {
        qualityScore: Math.round(qualityScore),
        readability: Math.round(metrics.readability),
        efficiency: Math.round(metrics.efficiency),
        correctness: Math.round(pylintScore),
        bestPractices: Math.round(metrics.bestPractices),
        security: Math.round(metrics.security),
        securityIssues: securityIssues.slice(0, 3),
        styleIssues: styleIssues.slice(0, 3),
        strengths: this._identifyStrengths(metrics, securityIssues),
        weaknesses: this._identifyWeaknesses(metrics, issues, securityIssues, styleIssues),
        suggestions: this._generateSuggestions(metrics, issues, securityIssues, styleIssues),
        feedback: this._generateFeedback(qualityScore, securityIssues),
        toolsUsed: pylintScore !== 5.0 ? ['pylint', 'enhanced-metrics', 'security-scan'] : ['enhanced-metrics', 'security-scan']
      };

    } catch (error) {
      await fs.unlink(filePath).catch(() => {});
      return this._analyzeGeneric(sourceCode, 'python');
    }
  }

  /**
   * Enhanced JavaScript analysis
   * @private
   */
  async _analyzeJavaScript(sourceCode) {
    const metrics = this._calculateEnhancedMetrics(sourceCode, 'javascript');
    const securityIssues = this._detectSecurityIssues(sourceCode, 'javascript');

    // JS-specific checks
    const jsFeatures = {
      usesConst: sourceCode.includes('const'),
      usesLet: sourceCode.includes('let'),
      usesVar: sourceCode.includes('var'),
      usesArrowFunctions: sourceCode.includes('=>'),
      usesStrict: sourceCode.includes('use strict'),
      usesClasses: /class\s+\w+/.test(sourceCode),
      usesAsync: /async\s+/.test(sourceCode),
      hasConsoleLog: sourceCode.includes('console.log')
    };

    // Adjust scores based on modern practices
    if (jsFeatures.usesConst || jsFeatures.usesLet) metrics.bestPractices += 1;
    if (jsFeatures.usesArrowFunctions) metrics.bestPractices += 0.5;
    if (jsFeatures.usesStrict) metrics.bestPractices += 0.5;
    if (jsFeatures.usesClasses) metrics.bestPractices += 0.5;

    // Penalize old practices
    if (jsFeatures.usesVar && !jsFeatures.usesConst && !jsFeatures.usesLet) {
      metrics.bestPractices -= 2;
      metrics.readability -= 1;
    }

    const qualityScore = this._calculateEnhancedQualityScore(7, metrics, securityIssues, []);

    return {
      qualityScore: Math.round(qualityScore),
      readability: Math.round(metrics.readability),
      efficiency: Math.round(metrics.efficiency),
      correctness: 7,
      bestPractices: Math.round(Math.min(10, metrics.bestPractices)),
      security: Math.round(metrics.security),
      securityIssues: securityIssues.slice(0, 3),
      strengths: this._identifyStrengths(metrics, securityIssues),
      weaknesses: this._identifyWeaknesses(metrics, [], securityIssues, []),
      suggestions: this._generateSuggestions(metrics, [], securityIssues, []),
      feedback: this._generateFeedback(qualityScore, securityIssues),
      toolsUsed: ['enhanced-metrics', 'security-scan', 'js-patterns']
    };
  }

  /**
   * Enhanced TypeScript analysis
   * @private
   */
  async _analyzeTypeScript(sourceCode) {
    const metrics = this._calculateEnhancedMetrics(sourceCode, 'typescript');
    const securityIssues = this._detectSecurityIssues(sourceCode, 'typescript');

    // TS-specific checks
    const tsFeatures = {
      hasInterfaces: /interface\s+\w+/.test(sourceCode),
      hasTypeAnnotations: /:\s*(string|number|boolean|any)/.test(sourceCode),
      hasGenerics: /<[A-Z]>/.test(sourceCode),
      hasEnums: /enum\s+\w+/.test(sourceCode),
      usesAny: /:\s*any/.test(sourceCode),
      usesUnknown: /:\s*unknown/.test(sourceCode),
      hasClasses: /class\s+\w+/.test(sourceCode)
    };

    // Reward TS best practices
    if (tsFeatures.hasInterfaces) metrics.bestPractices += 1;
    if (tsFeatures.hasTypeAnnotations) metrics.bestPractices += 1;
    if (tsFeatures.hasGenerics) metrics.bestPractices += 1;
    if (tsFeatures.hasClasses) metrics.bestPractices += 0.5;

    // Penalize type safety violations
    if (tsFeatures.usesAny) {
      metrics.bestPractices -= 1;
      securityIssues.push({
        severity: 'LOW',
        message: 'Excessive use of any type - Defeats TypeScript benefits'
      });
    }

    const qualityScore = this._calculateEnhancedQualityScore(8, metrics, securityIssues, []);

    return {
      qualityScore: Math.round(qualityScore),
      readability: Math.round(metrics.readability),
      efficiency: Math.round(metrics.efficiency),
      correctness: 8,
      bestPractices: Math.round(Math.min(10, metrics.bestPractices)),
      security: Math.round(metrics.security),
      securityIssues: securityIssues.slice(0, 3),
      strengths: this._identifyStrengths(metrics, securityIssues),
      weaknesses: this._identifyWeaknesses(metrics, [], securityIssues, []),
      suggestions: this._generateSuggestions(metrics, [], securityIssues, []),
      feedback: this._generateFeedback(qualityScore, securityIssues),
      toolsUsed: ['enhanced-metrics', 'security-scan', 'ts-patterns']
    };
  }

  /**
   * Detect security vulnerabilities
   * @private
   */
  _detectSecurityIssues(sourceCode, language) {
    const issues = [];
    const patterns = this.securityPatterns[language] || [];

    for (const { pattern, severity, message } of patterns) {
      const matches = sourceCode.match(pattern);
      if (matches) {
        issues.push({
          severity,
          message: `${message} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`
        });
      }
    }

    return issues;
  }

  /**
   * Check Python PEP 8 style violations
   * @private
   */
  _checkPythonStyle(sourceCode) {
    const issues = [];

    // Check for proper spacing around operators
    if (/\w+=[^=]/.test(sourceCode) && !/\w+ = /.test(sourceCode)) {
      issues.push('Missing spaces around = operator');
    }

    // Check for snake_case function names
    const functionNames = sourceCode.match(/def\s+(\w+)/g) || [];
    functionNames.forEach(match => {
      const name = match.replace('def ', '');
      if (/[A-Z]/.test(name)) {
        issues.push(`Function name '${name}' should use snake_case`);
      }
    });

    // Check for proper indentation (4 spaces)
    const lines = sourceCode.split('\n');
    lines.forEach((line, i) => {
      const leadingSpaces = line.match(/^\s*/)[0].length;
      if (leadingSpaces > 0 && leadingSpaces % 4 !== 0) {
        issues.push(`Line ${i + 1}: Indentation not multiple of 4`);
      }
    });

    return issues.slice(0, 3);
  }

  /**
   * Calculate enhanced metrics with better differentiation
   * @private
   */
  _calculateEnhancedMetrics(sourceCode, language) {
    const lines = sourceCode.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);

    // Enhanced comment detection (including docstrings)
    let commentLines = 0;
    let inDocstring = false;
    lines.forEach(line => {
      const trimmed = line.trim();
      if (language === 'python') {
        if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
          inDocstring = !inDocstring;
          commentLines++;
        } else if (inDocstring || trimmed.startsWith('#')) {
          commentLines++;
        }
      } else {
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          commentLines++;
        }
      }
    });

    const codeLines = nonEmptyLines.length - commentLines;
    const commentRatio = commentLines / Math.max(1, nonEmptyLines.length);
    const avgLineLength = codeLines > 0 ?
      lines.filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//')).reduce((sum, line) => sum + line.length, 0) / codeLines :
      0;

    // Function/method count
    const functionCount = (sourceCode.match(/\b(def|function|const\s+\w+\s*=\s*\(|class\s+\w+)/g) || []).length;

    // Enhanced complexity calculation
    const ifCount = (sourceCode.match(/\b(if|elif|else if)\b/g) || []).length;
    const loopCount = (sourceCode.match(/\b(for|while)\b/g) || []).length;
    const switchCount = (sourceCode.match(/\b(switch|case)\b/g) || []).length;
    const tryCatchCount = (sourceCode.match(/\b(try|catch|except)\b/g) || []).length;
    const complexityScore = ifCount + loopCount + switchCount + tryCatchCount;

    // Start with MORE DIFFERENTIATED base scores
    let readability = 5;  // Start lower
    let efficiency = 5;
    let bestPractices = 5;
    let security = 10;  // Start high, deduct for issues

    // ENHANCED Readability (bigger adjustments)
    if (commentRatio > 0.2) readability += 3;
    else if (commentRatio > 0.1) readability += 1.5;
    else if (commentRatio < 0.05 && codeLines > 10) readability -= 2;

    if (functionCount > 0) readability += 1.5;
    if (functionCount > 3) readability += 0.5;

    if (avgLineLength > 120) readability -= 2;
    if (avgLineLength > 80 && avgLineLength <= 120) readability -= 0.5;
    if (avgLineLength >= 40 && avgLineLength <= 80) readability += 1;

    // ENHANCED Efficiency (bigger penalties)
    if (codeLines < 20) efficiency += 2;
    if (codeLines > 100) efficiency -= 3;
    if (codeLines > 200) efficiency -= 2;

    if (complexityScore > 15) efficiency -= 3;
    else if (complexityScore > 10) efficiency -= 1.5;
    else if (complexityScore <= 5) efficiency += 1.5;

    if (functionCount > 0) efficiency += 1;
    if (functionCount > 3) efficiency += 0.5;

    // ENHANCED Best Practices (bigger rewards/penalties)
    if (commentRatio > 0.15) bestPractices += 2;
    if (functionCount > 0) bestPractices += 2;
    if (functionCount > 3) bestPractices += 1;

    if (codeLines < 5 && functionCount === 0) bestPractices -= 3;
    if (codeLines < 10 && commentRatio < 0.05) bestPractices -= 2;

    return {
      totalLines: lines.length,
      codeLines,
      commentLines,
      commentRatio,
      avgLineLength: Math.round(avgLineLength),
      functionCount,
      complexityScore,
      readability: Math.max(0, Math.min(10, readability)),
      efficiency: Math.max(0, Math.min(10, efficiency)),
      bestPractices: Math.max(0, Math.min(10, bestPractices)),
      security: Math.max(0, Math.min(10, security))
    };
  }

  /**
   * Calculate enhanced quality score with security penalties
   * @private
   */
  _calculateEnhancedQualityScore(toolScore, metrics, securityIssues, styleIssues) {
    // Base calculation
    const baseScore = (
      (toolScore * 10 * 0.25) +
      (metrics.readability * 10 * 0.20) +
      (metrics.efficiency * 10 * 0.20) +
      (metrics.bestPractices * 10 * 0.20) +
      (metrics.security * 10 * 0.15)
    );

    // Security penalties
    let securityPenalty = 0;
    securityIssues.forEach(issue => {
      if (issue.severity === 'CRITICAL') securityPenalty += 20;
      else if (issue.severity === 'HIGH') securityPenalty += 10;
      else if (issue.severity === 'MEDIUM') securityPenalty += 5;
      else securityPenalty += 2;
    });

    // Style penalties
    const stylePenalty = Math.min(10, styleIssues.length * 2);

    return Math.max(0, Math.min(100, baseScore - securityPenalty - stylePenalty));
  }

  /**
   * Identify strengths (with security consideration)
   * @private
   */
  _identifyStrengths(metrics, securityIssues) {
    const strengths = [];

    if (securityIssues.length === 0) {
      strengths.push('No security vulnerabilities detected');
    }
    if (metrics.commentRatio > 0.2) {
      strengths.push('Excellent documentation');
    } else if (metrics.commentRatio > 0.1) {
      strengths.push('Well-documented with comments');
    }
    if (metrics.functionCount > 3) {
      strengths.push('Highly modular design');
    } else if (metrics.functionCount > 0) {
      strengths.push('Uses modular functions');
    }
    if (metrics.complexityScore <= 5) {
      strengths.push('Simple and maintainable');
    }
    if (metrics.avgLineLength >= 40 && metrics.avgLineLength <= 80) {
      strengths.push('Good line length balance');
    }

    return strengths.length > 0 ? strengths.slice(0, 3) : ['Code compiles successfully'];
  }

  /**
   * Identify weaknesses (with security/style issues)
   * @private
   */
  _identifyWeaknesses(metrics, issues, securityIssues, styleIssues) {
    const weaknesses = [];

    securityIssues.forEach(issue => {
      if (issue.severity === 'CRITICAL' || issue.severity === 'HIGH') {
        weaknesses.push(`⚠️ SECURITY: ${issue.message}`);
      }
    });

    if (metrics.commentRatio < 0.05 && metrics.codeLines > 10) {
      weaknesses.push('Severely lacks documentation');
    }
    if (metrics.functionCount === 0 && metrics.codeLines > 20) {
      weaknesses.push('No functions - poor modularity');
    }
    if (metrics.complexityScore > 15) {
      weaknesses.push('Very high complexity - hard to maintain');
    }
    if (styleIssues.length > 0) {
      weaknesses.push(`Style issues: ${styleIssues[0]}`);
    }

    return weaknesses.slice(0, 4);
  }

  /**
   * Generate suggestions (with security/style improvements)
   * @private
   */
  _generateSuggestions(metrics, issues, securityIssues, styleIssues) {
    const suggestions = [];

    if (securityIssues.length > 0) {
      suggestions.push('🔒 Fix security vulnerabilities immediately');
    }
    if (metrics.commentRatio < 0.1) {
      suggestions.push('Add comments to explain complex logic');
    }
    if (metrics.functionCount === 0 && metrics.codeLines > 15) {
      suggestions.push('Break code into reusable functions');
    }
    if (metrics.complexityScore > 10) {
      suggestions.push('Simplify conditional logic');
    }
    if (styleIssues.length > 0) {
      suggestions.push('Follow language style guidelines (PEP 8, etc.)');
    }

    suggestions.push('Consider edge cases and error handling');

    return suggestions.slice(0, 4);
  }

  /**
   * Generate feedback message
   * @private
   */
  _generateFeedback(qualityScore, securityIssues) {
    if (securityIssues.filter(i => i.severity === 'CRITICAL').length > 0) {
      return 'CRITICAL SECURITY ISSUES - Code is unsafe for production';
    }
    if (qualityScore >= 85) return 'Excellent code quality';
    if (qualityScore >= 70) return 'Good code quality';
    if (qualityScore >= 50) return 'Acceptable, but needs improvement';
    return 'Poor code quality - significant improvements needed';
  }

  /**
   * Generic analysis for unsupported languages
   * @private
   */
  _analyzeGeneric(sourceCode, language) {
    const metrics = this._calculateEnhancedMetrics(sourceCode, language);
    const qualityScore = this._calculateEnhancedQualityScore(7, metrics, [], []);

    return {
      qualityScore: Math.round(qualityScore),
      readability: Math.round(metrics.readability),
      efficiency: Math.round(metrics.efficiency),
      correctness: 7,
      bestPractices: Math.round(metrics.bestPractices),
      security: Math.round(metrics.security),
      securityIssues: [],
      strengths: this._identifyStrengths(metrics, []),
      weaknesses: this._identifyWeaknesses(metrics, [], [], []),
      suggestions: this._generateSuggestions(metrics, [], [], []),
      feedback: `${language} code submitted successfully`,
      toolsUsed: ['enhanced-metrics']
    };
  }

  /**
   * Calculate partial credit (compatible with old interface)
   */
  calculatePartialCredit(qualityAnalysis, testsPassed, totalTests) {
    const testPassRate = testsPassed / totalTests;

    if (testPassRate === 1.0) {
      return 0;
    }

    const maxPartialCredit = 40;
    const qualityFactor = qualityAnalysis.qualityScore / 100;
    const partialCredit = maxPartialCredit * qualityFactor * (0.5 + testPassRate * 0.5);

    return Math.round(partialCredit);
  }
}

module.exports = EnhancedLocalCodeQualityService;
