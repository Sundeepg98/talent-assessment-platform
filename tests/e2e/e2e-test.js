const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test data
const testUser = {
    name: 'E2E Test User',
    email: `e2e_${Date.now()}@test.com`,
    password: 'Test123!@#'
};

let authToken = null;
let userId = null;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Test result tracking
const testResults = {
    passed: [],
    failed: [],
    skipped: []
};

// Helper function to log test results
function logTest(name, status, error = null) {
    const symbol = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
    const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
    
    console.log(`${color}${symbol}${colors.reset} ${name}`);
    
    if (status === 'pass') {
        testResults.passed.push(name);
    } else if (status === 'fail') {
        testResults.failed.push({ name, error: error?.message || error });
        if (error) console.log(`  ${colors.red}Error: ${error.message || error}${colors.reset}`);
    } else {
        testResults.skipped.push(name);
    }
}

// Section header
function logSection(title) {
    console.log(`\n${colors.cyan}${colors.bright}═══ ${title} ═══${colors.reset}\n`);
}

// E2E Test Suite
async function runE2ETests() {
    console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════════════════════════╗
║     Talent Assessment Platform - End-to-End Test Suite       ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);

    // 1. HEALTH CHECK
    logSection('System Health Check');
    try {
        const health = await axios.get(`${BASE_URL}/health`);
        logTest('Health endpoint accessible', 'pass');
        logTest('Database connected', health.data.database === 'connected' ? 'pass' : 'fail');
    } catch (error) {
        logTest('Health check', 'fail', error);
    }

    // 2. AUTHENTICATION TESTS
    logSection('Authentication System');
    
    // Test registration
    try {
        const registerRes = await axios.post(`${API_URL}/auth/signup`, testUser);
        authToken = registerRes.data.token;
        userId = registerRes.data.user.id;
        logTest('User registration', 'pass');
        logTest('JWT token received', authToken ? 'pass' : 'fail');
    } catch (error) {
        logTest('User registration', 'fail', error.response?.data || error);
    }

    // Test duplicate registration
    try {
        await axios.post(`${API_URL}/auth/signup`, testUser);
        logTest('Duplicate email prevention', 'fail', 'Should have rejected duplicate');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Duplicate email prevention', 'pass');
        } else {
            logTest('Duplicate email prevention', 'fail', error);
        }
    }

    // Test login
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        logTest('User login', 'pass');
        authToken = loginRes.data.token; // Update token
    } catch (error) {
        logTest('User login', 'fail', error.response?.data || error);
    }

    // Test wrong password
    try {
        await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: 'WrongPassword123'
        });
        logTest('Invalid password rejection', 'fail', 'Should have rejected');
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('Invalid password rejection', 'pass');
        } else {
            logTest('Invalid password rejection', 'fail', error);
        }
    }

    // Test protected route
    try {
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        logTest('Protected route access', 'pass');
        logTest('User data retrieval', meRes.data.email === testUser.email ? 'pass' : 'fail');
    } catch (error) {
        logTest('Protected route access', 'fail', error.response?.data || error);
    }

    // Test unauthorized access
    try {
        await axios.get(`${API_URL}/auth/me`);
        logTest('Unauthorized access prevention', 'fail', 'Should have been blocked');
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            logTest('Unauthorized access prevention', 'pass');
        } else {
            logTest('Unauthorized access prevention', 'fail', error);
        }
    }

    // 3. RESUME PROCESSING TESTS
    logSection('Resume Processing System');
    
    // Create test PDF file
    const testPdfPath = path.join(__dirname, 'test-resume.pdf');
    const pdfExists = fs.existsSync(testPdfPath);
    
    if (!pdfExists) {
        logTest('Resume upload', 'skip', 'Test PDF not found');
        logTest('Resume parsing', 'skip', 'Depends on upload');
        logTest('Resume optimization', 'skip', 'Depends on upload');
    } else {
        // Test resume upload
        try {
            const form = new FormData();
            form.append('resume', fs.createReadStream(testPdfPath));
            
            const uploadRes = await axios.post(`${API_URL}/resume/upload`, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${authToken}`
                }
            });
            logTest('Resume upload', 'pass');
        } catch (error) {
            logTest('Resume upload', 'fail', error.response?.data || error);
        }

        // Test resume optimization
        try {
            const optimizeRes = await axios.post(`${API_URL}/resume/optimize`, {
                resumeText: 'Software Engineer with 5 years experience in Node.js',
                jobDescription: 'Looking for Node.js developer with 3+ years experience'
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            logTest('Resume optimization', 'pass');
        } catch (error) {
            logTest('Resume optimization', 'fail', error.response?.data || error);
        }
    }

    // 4. CODING ASSESSMENT TESTS
    logSection('Coding Assessment System');
    
    let submissionToken = null;
    
    // Test code submission
    try {
        const codeSubmission = {
            sourceCode: 'console.log("Hello World");',
            languageId: 63, // JavaScript
            stdin: '',
            expectedOutput: 'Hello World'
        };
        
        const submitRes = await axios.post(`${API_URL}/coding/submit`, codeSubmission, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        submissionToken = submitRes.data.token;
        logTest('Code submission', submitRes.data.token ? 'pass' : 'fail');
    } catch (error) {
        logTest('Code submission', 'fail', error.response?.data || error);
    }

    // Test submission retrieval
    if (submissionToken) {
        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const resultRes = await axios.get(`${API_URL}/coding/submission/${submissionToken}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            logTest('Code execution result retrieval', 'pass');
            logTest('Code execution status', resultRes.data.status ? 'pass' : 'fail');
        } catch (error) {
            logTest('Code execution result retrieval', 'fail', error.response?.data || error);
        }
    } else {
        logTest('Code execution result retrieval', 'skip', 'No submission token');
    }

    // 5. INTERVIEW SYSTEM TESTS
    logSection('Interview System');
    
    let sessionId = null;
    
    // Start interview session
    try {
        const startRes = await axios.post(`${API_URL}/interview/start`, {
            role: 'frontend',
            level: 'intermediate'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        sessionId = startRes.data.sessionId;
        logTest('Interview session creation', sessionId ? 'pass' : 'fail');
        logTest('Interview questions generation', startRes.data.questions?.length > 0 ? 'pass' : 'fail');
    } catch (error) {
        logTest('Interview session creation', 'fail', error.response?.data || error);
    }

    // Submit interview response
    if (sessionId) {
        try {
            const responseRes = await axios.post(`${API_URL}/interview/response`, {
                sessionId,
                questionIndex: 0,
                response: 'React hooks allow functional components to use state and lifecycle methods.'
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            logTest('Interview response submission', 'pass');
        } catch (error) {
            logTest('Interview response submission', 'fail', error.response?.data || error);
        }

        // Complete interview
        try {
            const completeRes = await axios.post(`${API_URL}/interview/complete`, {
                sessionId
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            logTest('Interview completion', 'pass');
            logTest('Interview analysis', completeRes.data.score !== undefined ? 'pass' : 'fail');
        } catch (error) {
            logTest('Interview completion', 'fail', error.response?.data || error);
        }
    } else {
        logTest('Interview response submission', 'skip', 'No session ID');
        logTest('Interview completion', 'skip', 'No session ID');
    }

    // 6. FRONTEND AVAILABILITY TEST
    logSection('Frontend Services');
    
    try {
        const frontendRes = await axios.get('http://localhost:5173');
        logTest('Frontend server accessible', 'pass');
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            logTest('Frontend server accessible', 'skip', 'Frontend not running');
        } else {
            logTest('Frontend server accessible', 'fail', error);
        }
    }

    // 7. INTEGRATION TESTS
    logSection('Integration Tests');
    
    // Test auth + coding flow
    try {
        // Submit code with auth
        const integrationRes = await axios.post(`${API_URL}/coding/submit`, {
            sourceCode: 'print("Integration Test")',
            languageId: 71, // Python
            stdin: ''
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        logTest('Auth + Coding integration', 'pass');
    } catch (error) {
        logTest('Auth + Coding integration', 'fail', error.response?.data || error);
    }

    // 8. ERROR HANDLING TESTS
    logSection('Error Handling');
    
    // Test 404 handling
    try {
        await axios.get(`${API_URL}/nonexistent`);
        logTest('404 error handling', 'fail', 'Should return 404');
    } catch (error) {
        if (error.response?.status === 404) {
            logTest('404 error handling', 'pass');
        } else {
            logTest('404 error handling', 'fail', error);
        }
    }

    // Test validation errors
    try {
        await axios.post(`${API_URL}/auth/signup`, {
            email: 'invalid-email'
        });
        logTest('Validation error handling', 'fail', 'Should validate input');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Validation error handling', 'pass');
        } else {
            logTest('Validation error handling', 'fail', error);
        }
    }

    // FINAL REPORT
    console.log(`\n${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                      Test Results Summary                     ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
    
    const total = testResults.passed.length + testResults.failed.length + testResults.skipped.length;
    const passRate = ((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100).toFixed(1);
    
    console.log(`
${colors.green}✓ Passed:${colors.reset}  ${testResults.passed.length}
${colors.red}✗ Failed:${colors.reset}  ${testResults.failed.length}
${colors.yellow}○ Skipped:${colors.reset} ${testResults.skipped.length}
────────────────
Total:     ${total}
Pass Rate: ${passRate}%
`);

    if (testResults.failed.length > 0) {
        console.log(`${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
        testResults.failed.forEach(test => {
            console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
            if (test.error) {
                console.log(`    └─ ${test.error}`);
            }
        });
    }

    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total,
            passed: testResults.passed.length,
            failed: testResults.failed.length,
            skipped: testResults.skipped.length,
            passRate: `${passRate}%`
        },
        results: testResults
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'e2e-test-report.json'),
        JSON.stringify(report, null, 2)
    );
    
    console.log(`\n${colors.cyan}Detailed report saved to: e2e-test-report.json${colors.reset}`);
    
    return testResults.failed.length === 0;
}

// Run tests
console.log(`${colors.yellow}Starting E2E tests...${colors.reset}`);
console.log(`${colors.yellow}Make sure the backend server is running on port 5000${colors.reset}\n`);

runE2ETests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error(`${colors.red}Fatal error:${colors.reset}`, error);
        process.exit(1);
    });