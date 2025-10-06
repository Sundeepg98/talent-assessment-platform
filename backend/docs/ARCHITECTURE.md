# Architecture Documentation

## Overview

The backend uses **100% Dependency Injection** via Awilix, achieving complete inversion of control with zero manual instantiation.

**Architecture Style:** Service-Oriented with Dependency Injection
**DI Container:** Awilix (PROXY injection mode)
**Coverage:** 100% - All services, repositories, use cases managed by DI

---

## Core Principles

### 1. 100% Dependency Injection
**Every service resolves from the container**

```javascript
// ❌ WRONG - Manual instantiation
const service = new UserService();

// ✅ CORRECT - DI resolution
const service = req.getService('userService');
```

### 2. Service Registration Patterns

#### Pattern A: Class-based Service
```javascript
// File: src/services/myService.js
class MyService {
    constructor({ dependency1, dependency2 }) {
        this.dep1 = dependency1;
        this.dep2 = dependency2;
    }
}
module.exports = MyService;  // Export CLASS, not instance

// Registration in CompleteDIContainer.js
myService: awilix.asClass(require('../../services/myService'))
    .singleton()
```

#### Pattern B: Factory Function
```javascript
// Registration
myService: awilix.asFunction(({ dependency1 }) => ({
    doSomething: async () => {
        return await dependency1.process();
    }
})).singleton()
```

#### Pattern C: Value Registration
```javascript
// For constants, configs, or external libraries
myValue: awilix.asValue({ config: 'value' })
```

### 3. Dependency Naming Convention

**Awilix uses parameter names to resolve dependencies:**

```javascript
// Container has: userRepository, emailService, tokenService

class UserService {
    // ✅ CORRECT - parameter names match registered services
    constructor({ userRepository, emailService, tokenService }) {
        this.userRepo = userRepository;
        this.email = emailService;
        this.tokens = tokenService;
    }
}

// ❌ WRONG - parameter names don't match
constructor(config) {  // Awilix can't resolve "config"
    this.userRepo = config.userRepository;
}
```

---

## Project Structure

```
backend/
├── src/
│   ├── infrastructure/
│   │   ├── config/
│   │   │   └── CompleteDIContainer.js  ← SINGLE source of truth
│   │   ├── cache/
│   │   │   └── cacheService.js
│   │   └── session/
│   │       └── sessionManager.js
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   └── TokenService.js
│   │   ├── assessment/
│   │   │   ├── judge0Service.js
│   │   │   └── questionService.js
│   │   ├── interview/
│   │   │   └── interviewAnalyzer/  ← Python subprocess wrapper
│   │   ├── processing/
│   │   │   ├── pdfProcessor.js
│   │   │   └── resumeAnalyzer/
│   │   └── validation/
│   │       └── fileValidator.js
│   │
│   ├── ai-services/
│   │   └── llm/
│   │       └── geminiService.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── coding.js
│   │   ├── interview.js
│   │   ├── resume.js
│   │   └── monitoring.js
│   │
│   └── models/
│       ├── User.js
│       ├── Submission.js
│       ├── InterviewSession.js
│       └── ResumeAnalysis.js
│
├── server.js  ← Entry point
└── docs/
    ├── ARCHITECTURE.md  ← This file
    └── ML_STRATEGY.md
```

---

## Service Layers

### Layer 1: Infrastructure Services
**Purpose:** External integrations, caching, sessions

| Service | Purpose | Type |
|---------|---------|------|
| `judge0Service` | Code execution API | External API |
| `geminiService` | AI/LLM integration | External API |
| `cacheService` | In-memory caching | Infrastructure |
| `sessionManager` | Session handling | Infrastructure |
| `tokenService` | JWT operations | Infrastructure |
| `emailService` | Email sending | Infrastructure |
| `passwordService` | Password hashing | Infrastructure |

### Layer 2: Domain Services
**Purpose:** Business logic orchestration

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| `authenticationService` | Login/auth logic | tokenService, passwordService, userRepository |
| `interviewAnalysisService` | Interview evaluation | geminiService, cacheService |
| `interviewAnalyzer` | Python ML analyzer | Subprocess wrapper |
| `resumeAnalyzer` | Resume processing | pdfProcessor, geminiService, cacheService |

### Layer 3: Use Cases
**Purpose:** Application-specific workflows

| Use Case | Purpose | Dependencies |
|----------|---------|--------------|
| `registerUserUseCase` | User registration | userRepository, passwordService, tokenService, emailService |
| `loginUseCase` | User login | authenticationService |
| `submitCodeUseCase` | Code submission | judge0Service, submissionRepository, cacheService |
| `getSubmissionStatusUseCase` | Check submission | judge0Service, submissionRepository |
| `analyzeInterviewUseCase` | Interview analysis | interviewAnalysisService, interviewRepository |
| `analyzeResumeUseCase` | Resume analysis | pdfProcessor, geminiService, resumeRepository, cacheService |

### Layer 4: Repositories
**Purpose:** Data access abstraction

| Repository | Model | Operations |
|------------|-------|------------|
| `userRepository` | User | findByEmail, findById, create, update, delete |
| `submissionRepository` | Submission | create, findById, findByUserId, updateStatus |
| `interviewRepository` | InterviewSession | create, findById, findByUserId, updateAnalysis |
| `resumeRepository` | ResumeAnalysis | create, findByUserId, findLatest |

### Layer 5: Middleware
**Purpose:** Request processing pipeline

| Middleware | Purpose | Dependencies |
|------------|---------|--------------|
| `authMiddleware` | JWT verification | tokenService |
| `errorHandler` | Global error handling | None |

---

## Request Flow

### Example: Code Submission

```
1. POST /api/coding/submit
   ↓
2. Route handler (src/routes/coding.js)
   ↓
3. req.getService('submitCodeUseCase')  ← DI resolution
   ↓
4. submitCodeUseCase.execute()
   ├→ submissionRepository.create()
   ├→ judge0Service.submitCode()
   └→ submissionRepository.updateStatus()
   ↓
5. Response to client
```

### DI Resolution Chain

```
submitCodeUseCase (use case)
├→ judge0Service (infrastructure)
├→ submissionRepository (repository)
│   └→ SubmissionModel (model)
└→ cacheService (infrastructure)
```

---

## Adding a New Feature

### Step 1: Create the Service

```javascript
// File: src/services/myFeature/myFeatureService.js
class MyFeatureService {
    constructor({ dependency1, dependency2, cacheService }) {
        this.dep1 = dependency1;
        this.dep2 = dependency2;
        this.cache = cacheService;
    }

    async doSomething(data) {
        // Implementation
        return result;
    }
}

module.exports = MyFeatureService;
```

### Step 2: Register in DI Container

```javascript
// File: src/infrastructure/config/CompleteDIContainer.js

registerDomainServices() {
    this.container.register({
        // ... existing services ...

        // Add your new service
        myFeatureService: awilix.asClass(
            require('../../services/myFeature/myFeatureService')
        ).singleton()
    });
}
```

### Step 3: Create Use Case (Optional)

```javascript
// File: Add to registerUseCases()
myFeatureUseCase: awilix.asFunction(({ myFeatureService, userRepository }) => ({
    execute: async ({ userId, data }) => {
        // Use case logic
        return await myFeatureService.doSomething(data);
    }
})).scoped()
```

### Step 4: Create Route

```javascript
// File: src/routes/myFeature.js
const router = require('express').Router();

router.post('/action', async (req, res) => {
    try {
        const useCase = req.getService('myFeatureUseCase');
        const result = await useCase.execute(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### Step 5: Mount Route

```javascript
// File: server.js
const myFeatureRoutes = require("./src/routes/myFeature");
app.use("/api/my-feature", myFeatureRoutes);
```

---

## Testing with DI

### Unit Testing

```javascript
// src/services/myService.spec.js
describe('MyService', () => {
    test('should do something', async () => {
        // Mock dependencies
        const mockDep = { method: jest.fn() };

        // Inject mocks
        const service = new MyService({ dependency1: mockDep });

        // Test
        await service.doSomething();
        expect(mockDep.method).toHaveBeenCalled();
    });
});
```

### Integration Testing with Real DI

```javascript
// tests/integration/feature.test.js
const CompleteDIContainer = require('../../src/infrastructure/config/CompleteDIContainer');

describe('Feature Integration', () => {
    let container, scope;

    beforeAll(() => {
        container = new CompleteDIContainer();
    });

    beforeEach(() => {
        scope = container.container.createScope();
    });

    test('should work end-to-end', async () => {
        const service = scope.resolve('myFeatureService');
        const result = await service.doSomething();
        expect(result).toBeDefined();
    });
});
```

---

## Common Patterns

### Pattern 1: Service with Optional Dependencies

```javascript
class MyService {
    constructor({ pdfLibrary = null } = {}) {
        this.pdfLib = pdfLibrary;
    }
}

// Registration with explicit injection
myService: awilix.asClass(MyService)
    .inject(() => ({ pdfLibrary: null }))
    .singleton()
```

### Pattern 2: Subprocess Wrapper

```javascript
class SubprocessService {
    constructor() {
        // No DI dependencies - spawns Python
    }

    analyze(data) {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', ['script.py']);
            // ... subprocess handling
        });
    }
}

module.exports = SubprocessService;  // Export class
```

### Pattern 3: Configuration Injection

```javascript
// Registration
myService: awilix.asClass(MyService)
    .inject(() => ({
        apiKey: process.env.API_KEY,
        baseUrl: process.env.BASE_URL
    }))
    .singleton()
```

---

## Service Lifecycle

### Singleton vs Scoped

**Singleton:** One instance for entire application
```javascript
.singleton()  // All requests share same instance
```

**Scoped:** One instance per request
```javascript
.scoped()  // Each request gets new instance
```

**When to Use:**
- **Singleton:** Infrastructure, caching, external APIs, stateless services
- **Scoped:** Use cases, request-specific logic, user sessions

---

## Troubleshooting

### Error: "Could not resolve 'serviceName'"

**Cause:** Service not registered or wrong parameter name

**Fix:**
1. Check service is registered in CompleteDIContainer.js
2. Verify parameter name matches registered service name
3. Ensure constructor uses destructuring: `({ serviceName })`

### Error: "Module not found"

**Cause:** Wrong require() path in registration

**Fix:**
```javascript
// From: src/infrastructure/config/CompleteDIContainer.js
// To: src/services/myService.js
// Path: ../../services/myService

require('../../services/myService')  ✅
require('../services/myService')     ❌
```

### Error: "Cannot instantiate" or "is not a constructor"

**Cause:** Exporting instance instead of class

**Fix:**
```javascript
// ❌ WRONG
module.exports = new MyService();

// ✅ CORRECT
module.exports = MyService;
```

---

## Best Practices

### 1. Always Export Classes for asClass()
```javascript
module.exports = MyService;  // Not: new MyService()
```

### 2. Use Explicit Destructuring
```javascript
constructor({ dep1, dep2 })  // ✅ Clear dependencies
constructor(config)           // ❌ Unclear
```

### 3. Register Everything in One Place
```javascript
// CompleteDIContainer.js is SINGLE source of truth
// No scattered registrations
```

### 4. Use Meaningful Service Names
```javascript
userRepository      ✅ Clear purpose
repo1              ❌ Unclear
```

### 5. Keep Services Focused
```javascript
// One responsibility per service
class UserService {
    // Only user-related operations
}
```

---

## Migration Checklist

When migrating old code to DI:

- [ ] Find all `new ServiceName()` instantiations
- [ ] Export classes, not instances
- [ ] Register in CompleteDIContainer.js
- [ ] Update constructors to use destructuring
- [ ] Replace manual instantiation with `req.getService()`
- [ ] Test DI resolution
- [ ] Update tests to use DI or mock injection
- [ ] Remove old service files

---

## Current Status

✅ **100% DI Coverage Achieved**

**Registered Services:** 20+
**Repositories:** 4
**Use Cases:** 6+
**Middleware:** 2
**Manual Instantiation:** 0

**Last Audit:** 2025-10-06
**Architecture Status:** STABLE
**Technical Debt:** MINIMAL

---

*For ML-specific architecture decisions, see [ML_STRATEGY.md](./ML_STRATEGY.md)*
