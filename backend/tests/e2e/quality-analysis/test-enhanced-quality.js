/**
 * Test Enhanced Code Quality Service
 * Compare with basic version to validate improvements
 */

const LocalCodeQualityService = require('./services/assessment/LocalCodeQualityService');
const EnhancedLocalCodeQualityService = require('./services/assessment/EnhancedLocalCodeQualityService');

const testCases = {
  python_excellent: `
"""
Fibonacci calculator with multiple approaches.
Demonstrates clean code, documentation, and best practices.
"""

def fibonacci_iterative(n):
    """
    Calculate nth Fibonacci number using iterative approach.

    Args:
        n (int): Position in Fibonacci sequence

    Returns:
        int: nth Fibonacci number
    """
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return n

    prev, curr = 0, 1
    for _ in range(2, n + 1):
        prev, curr = curr, prev + curr
    return curr

# Test
print(fibonacci_iterative(10))
`,

  python_security_bad: `
import os

def execute_command(user_input):
    os.system(user_input)
    return "Done"

cmd = input("Enter command: ")
result = execute_command(cmd)
`,

  python_poor: `
x=[1,2,3,4,5]
y=0
for i in x:
 if i>2:
  y+=i
print(y)
`,

  javascript_excellent: `
'use strict';

/**
 * Binary Search Tree implementation
 */
class BinarySearchTree {
    constructor() {
        this.root = null;
    }

    /**
     * Insert a value into the tree
     * @param {number} value
     * @returns {BinarySearchTree}
     */
    insert(value) {
        const newNode = { value, left: null, right: null };

        if (!this.root) {
            this.root = newNode;
            return this;
        }

        let current = this.root;
        while (true) {
            if (value < current.value) {
                if (!current.left) {
                    current.left = newNode;
                    return this;
                }
                current = current.left;
            } else {
                if (!current.right) {
                    current.right = newNode;
                    return this;
                }
                current = current.right;
            }
        }
    }
}

const tree = new BinarySearchTree();
tree.insert(5);
`,

  javascript_security_bad: `
function runCode(userCode) {
    eval(userCode);
}

const input = prompt("Enter code:");
runCode(input);
`,

  typescript_excellent: `
/**
 * Generic Queue implementation
 */
interface QueueItem<T> {
    value: T;
    next: QueueItem<T> | null;
}

class Queue<T> {
    private head: QueueItem<T> | null = null;
    private tail: QueueItem<T> | null = null;
    private size: number = 0;

    enqueue(value: T): void {
        const newItem: QueueItem<T> = { value, next: null };

        if (!this.tail) {
            this.head = this.tail = newItem;
        } else {
            this.tail.next = newItem;
            this.tail = newItem;
        }
        this.size++;
    }

    dequeue(): T | null {
        if (!this.head) return null;

        const value = this.head.value;
        this.head = this.head.next;

        if (!this.head) this.tail = null;
        this.size--;

        return value;
    }
}
`
};

async function compareServices() {
  console.log('\n🔬 ==========================================');
  console.log('   COMPARING BASIC vs ENHANCED QUALITY SERVICE');
  console.log('==========================================\n');

  const basicService = new LocalCodeQualityService();
  const enhancedService = new EnhancedLocalCodeQualityService();

  const results = [];

  for (const [name, code] of Object.entries(testCases)) {
    const [lang, quality] = name.split('_');

    console.log(`\n📊 Test: ${name.toUpperCase()}\n${'─'.repeat(50)}`);

    const basic = await basicService.analyzeCodeQuality(code, 'Test', lang);
    const enhanced = await enhancedService.analyzeCodeQuality(code, 'Test', lang);

    console.log(`BASIC Service:`);
    console.log(`  Score: ${basic.qualityScore}/100`);
    console.log(`  Readability: ${basic.readability}/10`);
    console.log(`  Best Practices: ${basic.bestPractices}/10`);
    console.log(`  Strengths: ${basic.strengths.slice(0, 2).join(', ')}`);

    console.log(`\nENHANCED Service:`);
    console.log(`  Score: ${enhanced.qualityScore}/100 (${enhanced.qualityScore > basic.qualityScore ? '+' : ''}${enhanced.qualityScore - basic.qualityScore})`);
    console.log(`  Readability: ${enhanced.readability}/10`);
    console.log(`  Best Practices: ${enhanced.bestPractices}/10`);
    console.log(`  Security: ${enhanced.security}/10`);
    if (enhanced.securityIssues.length > 0) {
      console.log(`  🔒 Security Issues:`);
      enhanced.securityIssues.forEach(issue => {
        console.log(`     [${issue.severity}] ${issue.message}`);
      });
    }
    console.log(`  Strengths: ${enhanced.strengths.slice(0, 2).join(', ')}`);

    const improvement = quality === 'excellent' ?
      (enhanced.qualityScore > basic.qualityScore ? '✅ BETTER' : '⚠️ WORSE') :
      quality === 'security_bad' ?
      (enhanced.qualityScore < basic.qualityScore ? '✅ DETECTED' : '⚠️ MISSED') :
      quality === 'poor' ?
      (enhanced.qualityScore < basic.qualityScore ? '✅ BETTER' : '⚠️ WORSE') :
      'ℹ️';

    console.log(`  Result: ${improvement}`);

    results.push({
      name,
      lang,
      quality,
      basic: basic.qualityScore,
      enhanced: enhanced.qualityScore,
      diff: enhanced.qualityScore - basic.qualityScore,
      securityDetected: enhanced.securityIssues.length > 0
    });
  }

  // Summary
  console.log('\n\n📊 SUMMARY\n' + '═'.repeat(50));

  console.log('\nScore Differentiation:');
  const excellentImprovement = results.filter(r => r.quality === 'excellent' && r.diff > 0).length;
  const poorPenalty = results.filter(r => r.quality === 'poor' && r.diff < 0).length;
  const securityDetected = results.filter(r => r.quality === 'security_bad' && r.securityDetected).length;

  console.log(`  Excellent code scored higher: ${excellentImprovement}/${results.filter(r => r.quality === 'excellent').length} ✅`);
  console.log(`  Poor code penalized: ${poorPenalty}/${results.filter(r => r.quality === 'poor').length} ✅`);
  console.log(`  Security issues detected: ${securityDetected}/${results.filter(r => r.quality === 'security_bad').length} ${securityDetected > 0 ? '✅' : '⚠️'}`);

  console.log('\nScore Ranges:');
  console.log('  Basic Service:');
  console.log(`    Min: ${Math.min(...results.map(r => r.basic))}`);
  console.log(`    Max: ${Math.max(...results.map(r => r.basic))}`);
  console.log(`    Range: ${Math.max(...results.map(r => r.basic)) - Math.min(...results.map(r => r.basic))}`);

  console.log('  Enhanced Service:');
  console.log(`    Min: ${Math.min(...results.map(r => r.enhanced))}`);
  console.log(`    Max: ${Math.max(...results.map(r => r.enhanced))}`);
  console.log(`    Range: ${Math.max(...results.map(r => r.enhanced)) - Math.min(...results.map(r => r.enhanced))}`);

  console.log('\n🎯 VERDICT:');
  if (securityDetected > 0 && excellentImprovement > 0 && poorPenalty > 0) {
    console.log('  ✅ ENHANCED SERVICE SIGNIFICANTLY BETTER');
    console.log('  ✅ Security detection working');
    console.log('  ✅ Better score differentiation');
    console.log('  ✅ Ready for production use');
  } else {
    console.log('  ⚠️ Some improvements needed');
  }

  console.log('\n');

  return results;
}

compareServices()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
