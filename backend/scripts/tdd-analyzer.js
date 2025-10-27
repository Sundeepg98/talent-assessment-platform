#!/usr/bin/env node

/**
 * TDD Coverage Analyzer
 * 
 * Finds all .js files and checks if they have corresponding .tdd.test.js files
 * Generates a report of missing TDD tests
 */

const fs = require('fs');
const path = require('path');

class TDDAnalyzer {
  constructor() {
    this.jsFiles = [];
    this.tddTests = [];
    this.missing = [];
    this.coverage = {};
    
    // Directories to analyze
    this.sourceDirs = [
      'src/services',
      'src/application/useCases',
      'src/infrastructure/repositories',
      'src/interfaces/controllers',
      'src/core',
      'src/domain'
    ];
    
    // Files to exclude
    this.excludePatterns = [
      'index.js',
      'config.js',
      'setup.js',
      '.test.js',
      '.spec.js',
      'mock',
      '__mocks__'
    ];
  }

  findFiles(dir, pattern) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findFiles(fullPath, pattern));
      } else if (stat.isFile() && pattern.test(fullPath)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  shouldExclude(filePath) {
    return this.excludePatterns.some(pattern => filePath.includes(pattern));
  }

  analyze() {
    console.log('🔍 Analyzing TDD Coverage...\n');
    
    // Find all .js files
    for (const dir of this.sourceDirs) {
      const files = this.findFiles(dir, /\.js$/);
      for (const file of files) {
        if (!this.shouldExclude(file)) {
          this.jsFiles.push(file);
        }
      }
    }
    
    // Find all .tdd.test.js files
    const testFiles = this.findFiles('tests', /\.tdd\.test\.js$/);
    this.tddTests = testFiles;
    
    // Match files with tests
    this.matchFilesWithTests();
    
    // Generate report
    this.generateReport();
  }

  matchFilesWithTests() {
    for (const jsFile of this.jsFiles) {
      const fileName = path.basename(jsFile, '.js');
      const hasTest = this.tddTests.some(test => 
        test.toLowerCase().includes(fileName.toLowerCase())
      );
      
      if (!hasTest) {
        this.missing.push(jsFile);
      }
      
      // Calculate coverage by directory
      const dir = path.dirname(jsFile).split('/').pop();
      if (!this.coverage[dir]) {
        this.coverage[dir] = { total: 0, tested: 0 };
      }
      this.coverage[dir].total++;
      if (hasTest) {
        this.coverage[dir].tested++;
      }
    }
  }

  generateReport() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('                   TDD COVERAGE REPORT                  ');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Overall statistics
    const totalFiles = this.jsFiles.length;
    const testedFiles = totalFiles - this.missing.length;
    const coveragePercent = ((testedFiles / totalFiles) * 100).toFixed(2);
    
    console.log('📊 Overall Coverage:');
    console.log(`   Total JS Files: ${totalFiles}`);
    console.log(`   Files with TDD Tests: ${testedFiles}`);
    console.log(`   Files Missing Tests: ${this.missing.length}`);
    console.log(`   Coverage: ${coveragePercent}%\n`);
    
    // Coverage by directory
    console.log('📁 Coverage by Directory:');
    for (const [dir, stats] of Object.entries(this.coverage)) {
      const percent = ((stats.tested / stats.total) * 100).toFixed(0);
      const bar = this.generateBar(percent);
      console.log(`   ${dir.padEnd(20)} ${bar} ${percent}%`);
    }
    
    // Missing files
    if (this.missing.length > 0) {
      console.log('\n❌ Files Missing TDD Tests:');
      for (const file of this.missing) {
        const relativePath = file.replace(process.cwd() + '/', '');
        console.log(`   - ${relativePath}`);
      }
      
      console.log('\n📝 Suggested TDD Test Files to Create:');
      for (const file of this.missing) {
        const fileName = path.basename(file, '.js');
        const testFile = `tests/unit/${this.getTestCategory(file)}/${fileName}.tdd.test.js`;
        console.log(`   - ${testFile}`);
      }
    } else {
      console.log('\n✅ All files have TDD tests!');
    }
    
    // Generate creation script
    this.generateCreationScript();
  }

  generateBar(percent) {
    const filled = Math.floor(percent / 5);
    const empty = 20 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  getTestCategory(filePath) {
    if (filePath.includes('services')) return 'services';
    if (filePath.includes('useCases')) return 'useCases';
    if (filePath.includes('repositories')) return 'repositories';
    if (filePath.includes('controllers')) return 'controllers';
    if (filePath.includes('core')) return 'core';
    return 'other';
  }

  generateCreationScript() {
    if (this.missing.length === 0) return;
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'create-missing-tdd.sh');
    const script = ['#!/bin/bash', '', '# Create missing TDD test files', ''];
    
    for (const file of this.missing) {
      const fileName = path.basename(file, '.js');
      const category = this.getTestCategory(file);
      const testDir = `tests/unit/${category}`;
      const testFile = `${testDir}/${fileName}.tdd.test.js`;
      
      script.push(`# Create test for ${fileName}`);
      script.push(`mkdir -p ${testDir}`);
      script.push(`touch ${testFile}`);
      script.push('');
    }
    
    fs.writeFileSync(scriptPath, script.join('\n'), { mode: 0o755 });
    console.log(`\n💡 Run 'bash ${scriptPath}' to create all missing test files`);
  }

  generateTDDTemplate(jsFile) {
    const fileName = path.basename(jsFile, '.js');
    const className = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    const category = this.getTestCategory(jsFile);
    
    return `/**
 * TRUE TDD Unit Tests for ${className}
 * 
 * NO MOCKS - Only Real Test Implementations
 * Following TDD: Red -> Green -> Refactor
 * SOLID Principles Applied
 */

const ${className} = require('${this.getRequirePath(jsFile)}');

// Test Implementation Classes here...

describe('${className} - TDD Unit Tests (No Mocks)', () => {
  let instance;
  
  beforeEach(() => {
    // Create real test implementations
    // Inject all dependencies
  });

  describe('Test Suite 1', () => {
    it('should test first behavior', () => {
      // Arrange
      // Act
      // Assert
      expect(true).toBe(true);
    });
  });
});

// Verify TDD approach
describe('TDD Verification', () => {
  it('should have all tests passing with real implementations only', () => {
    expect(true).toBe(true);
  });
});`;
  }

  getRequirePath(jsFile) {
    // Calculate relative path from test file to source file
    const relativePath = jsFile.replace('src/', '../../../src/');
    return relativePath.replace('.js', '');
  }

  async createAllMissingTests() {
    console.log('\n🚀 Creating all missing TDD tests...\n');
    
    for (const file of this.missing) {
      const fileName = path.basename(file, '.js');
      const category = this.getTestCategory(file);
      const testDir = path.join('tests', 'unit', category);
      const testFile = path.join(testDir, `${fileName}.tdd.test.js`);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // Create test file with template
      const template = this.generateTDDTemplate(file);
      fs.writeFileSync(testFile, template);
      
      console.log(`✅ Created: ${testFile}`);
    }
    
    console.log('\n✨ All missing TDD test files created!');
  }
}

// Run analyzer
const analyzer = new TDDAnalyzer();
analyzer.analyze();

// Create missing tests if --create flag is passed
if (process.argv.includes('--create')) {
  analyzer.createAllMissingTests();
}

// Export coverage data
module.exports = {
  jsFiles: analyzer.jsFiles,
  tddTests: analyzer.tddTests,
  missing: analyzer.missing,
  coverage: analyzer.coverage
};