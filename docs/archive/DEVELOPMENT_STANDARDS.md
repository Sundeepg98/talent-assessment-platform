# 🏗️ DEVELOPMENT STANDARDS & ARCHITECTURAL PRINCIPLES
## Mandatory for All Features & Actions

> **⚠️ CRITICAL**: This document defines NON-NEGOTIABLE standards that MUST be followed for EVERY feature, bug fix, enhancement, or any code change in the Talent Assessment Platform.

---

## 📋 QUICK REFERENCE CHECKLIST

### Before ANY Code Change:
- [ ] Review relevant Domain context
- [ ] Write tests FIRST (TDD)
- [ ] Check for existing patterns to follow (DRY)
- [ ] Ensure SOLID compliance
- [ ] Update documentation

---

## 🎯 CORE PRINCIPLES (MANDATORY)

### 1. Domain-Driven Design (DDD)
**EVERY feature MUST follow this structure:**

```
backend/src/
├── domain/              # Business logic & rules
│   ├── identity/       # User management context
│   ├── assessment/     # Assessment context  
│   ├── coding/        # Coding challenges context
│   └── analytics/     # Analytics context
├── application/        # Use cases & orchestration
├── infrastructure/     # External concerns
└── presentation/      # API layer
```

#### DDD Rules:
- **Entities**: Business objects with identity (User, Assessment, Resume)
- **Value Objects**: Immutable values (Email, Password, Score)
- **Aggregates**: Consistency boundaries
- **Repositories**: Data access abstractions
- **Domain Services**: Complex business operations
- **Use Cases**: Application workflows

#### Example - Adding New Feature:
```javascript
// ❌ WRONG - Direct implementation in routes
app.post('/api/feature', async (req, res) => {
  // Business logic here - VIOLATION!
});

// ✅ CORRECT - DDD Structure
// 1. Domain Entity
class Feature extends Entity {
  constructor(id, name, value) {
    super(id);
    this.name = name;
    this.value = new FeatureValue(value);
  }
}

// 2. Use Case
class CreateFeatureUseCase {
  async execute(dto) {
    const feature = Feature.create(dto);
    return this.repository.save(feature);
  }
}

// 3. Controller
class FeatureController {
  async create(req, res) {
    const result = await this.useCase.execute(req.body);
    res.json(result);
  }
}
```

---

### 2. SOLID Principles

#### Single Responsibility (SRP)
```javascript
// ❌ WRONG - Multiple responsibilities
class UserService {
  createUser() {}
  sendEmail() {}
  generatePDF() {}
  validatePayment() {}
}

// ✅ CORRECT - Single responsibility
class UserService {
  createUser() {}
}
class EmailService {
  sendEmail() {}
}
class PDFService {
  generatePDF() {}
}
```

#### Open/Closed (OCP)
```javascript
// ✅ CORRECT - Extensible without modification
class BaseAnalyzer {
  analyze(data) {
    throw new Error('Must implement');
  }
}

class ResumeAnalyzer extends BaseAnalyzer {
  analyze(data) {
    // Implementation
  }
}

class CodeAnalyzer extends BaseAnalyzer {
  analyze(data) {
    // Implementation
  }
}
```

#### Liskov Substitution (LSP)
```javascript
// ✅ CORRECT - Subtypes are substitutable
function processAnalyzer(analyzer: BaseAnalyzer) {
  return analyzer.analyze(data);
}

// Works with any analyzer type
processAnalyzer(new ResumeAnalyzer());
processAnalyzer(new CodeAnalyzer());
```

#### Interface Segregation (ISP)
```javascript
// ✅ CORRECT - Specific interfaces
interface Readable {
  read(id: string): Promise<Entity>;
}

interface Writable {
  write(entity: Entity): Promise<void>;
}

class ReadOnlyRepository implements Readable {
  read(id) { /* ... */ }
}

class FullRepository implements Readable, Writable {
  read(id) { /* ... */ }
  write(entity) { /* ... */ }
}
```

#### Dependency Inversion (DIP)
```javascript
// ✅ CORRECT - Depend on abstractions
class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService
  ) {}
  
  // Not coupled to concrete implementations
}
```

---

### 3. DRY (Don't Repeat Yourself)

#### Mandatory Patterns:
1. **BaseRepository** for all repositories
2. **Shared ValidationRules** for common validations
3. **Error handling** through central ErrorHandler
4. **Common utilities** in shared/utils

```javascript
// ✅ CORRECT - Reuse base functionality
class UserRepository extends BaseRepository {
  constructor() {
    super(UserModel, User);
  }
  // Only add specific methods
}

// ✅ CORRECT - Shared validation
const userSchema = Joi.object({
  email: ValidationRules.email,
  password: ValidationRules.password,
  role: ValidationRules.role
});
```

---

### 4. Test-Driven Development (TDD)

#### The TDD Cycle (MANDATORY):
1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code while tests pass

#### Test Structure:
```javascript
// ALWAYS write test FIRST
describe('CreateUserUseCase', () => {
  it('should create user with valid data', async () => {
    // Arrange
    const dto = { email: 'test@test.com', password: 'Pass123!' };
    
    // Act
    const user = await useCase.execute(dto);
    
    // Assert
    expect(user.email).toBe('test@test.com');
  });
  
  it('should reject duplicate email', async () => {
    // Test for business rule
  });
});
```

#### Coverage Requirements:
- **Minimum**: 80% coverage
- **Target**: 90% coverage
- **Critical paths**: 100% coverage

---

## 🚀 IMPLEMENTATION WORKFLOW

### For EVERY New Feature:

1. **Domain Analysis**
   ```
   - Which bounded context?
   - What entities/value objects?
   - What business rules?
   ```

2. **Write Tests First**
   ```bash
   # Create test file
   tests/unit/domain/{context}/NewFeature.test.js
   tests/integration/NewFeature.integration.test.js
   ```

3. **Implement Domain Layer**
   ```
   domain/{context}/entities/NewEntity.js
   domain/{context}/valueObjects/NewValueObject.js
   ```

4. **Create Use Case**
   ```
   application/useCases/NewFeatureUseCase.js
   ```

5. **Add Infrastructure**
   ```
   infrastructure/persistence/NewRepository.js
   ```

6. **Wire Presentation**
   ```
   presentation/http/controllers/NewController.js
   ```

---

## 🔍 CODE REVIEW CHECKLIST

### Before Committing:
- [ ] Tests written first (TDD)
- [ ] Tests passing with >80% coverage
- [ ] Domain logic in domain layer
- [ ] Use cases for orchestration
- [ ] Repository pattern for data access
- [ ] No code duplication (DRY)
- [ ] Single responsibility per class (SOLID)
- [ ] Dependencies injected, not created
- [ ] Value objects for domain concepts
- [ ] Error handling through AppError
- [ ] Validation through shared rules
- [ ] Documentation updated

---

## 📁 PROJECT STRUCTURE REFERENCE

```
talent-assessment-platform/
├── backend/
│   ├── src/
│   │   ├── domain/              # Core business logic
│   │   │   ├── shared/          # Shared domain concepts
│   │   │   ├── identity/        # User management
│   │   │   │   ├── entities/
│   │   │   │   ├── valueObjects/
│   │   │   │   ├── repositories/
│   │   │   │   └── services/
│   │   │   ├── assessment/      # Assessment management
│   │   │   ├── coding/          # Coding challenges
│   │   │   └── analytics/       # Analytics & reporting
│   │   ├── application/         # Use cases & DTOs
│   │   │   ├── useCases/
│   │   │   ├── dto/
│   │   │   └── mappers/
│   │   ├── infrastructure/      # External integrations
│   │   │   ├── persistence/     # Database
│   │   │   ├── external/        # Third-party APIs
│   │   │   ├── messaging/       # Events/Queue
│   │   │   └── security/        # Auth/Encryption
│   │   ├── presentation/        # API Layer
│   │   │   └── http/
│   │   │       ├── controllers/
│   │   │       ├── middlewares/
│   │   │       └── validators/
│   │   └── shared/              # Cross-cutting concerns
│   │       ├── interfaces/
│   │       ├── exceptions/
│   │       ├── utils/
│   │       └── constants/
│   └── tests/                   # All tests
│       ├── unit/
│       ├── integration/
│       └── e2e/
└── frontend/
    └── [Similar DDD structure]
```

---

## 🛠️ COMMON PATTERNS

### Repository Pattern
```javascript
class BaseRepository {
  constructor(model, entity) {
    this.model = model;
    this.entity = entity;
  }
  
  async findById(id) {
    const doc = await this.model.findById(id);
    return this.toDomainEntity(doc);
  }
  
  async save(entity) {
    const doc = this.toPersistence(entity);
    await this.model.save(doc);
    return entity;
  }
}
```

### Use Case Pattern
```javascript
class UseCase {
  constructor(repository, validator, eventBus) {
    this.repository = repository;
    this.validator = validator;
    this.eventBus = eventBus;
  }
  
  async execute(dto) {
    // 1. Validate
    await this.validator.validate(dto);
    
    // 2. Business logic
    const entity = this.createEntity(dto);
    
    // 3. Persist
    const saved = await this.repository.save(entity);
    
    // 4. Publish events
    await this.eventBus.publish('EntityCreated', saved);
    
    // 5. Return DTO
    return this.toDTO(saved);
  }
}
```

### Value Object Pattern
```javascript
class Email {
  constructor(value) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
    Object.freeze(this);
  }
  
  validate(value) {
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email');
    }
  }
  
  get value() {
    return this._value;
  }
  
  equals(other) {
    return other instanceof Email && 
           this._value === other._value;
  }
}
```

---

## ⚡ QUICK COMMANDS

### Generate New Feature Structure:
```bash
# Use the scaffolding script
./scripts/generate-feature.sh feature-name context-name
```

### Run Tests:
```bash
npm test                 # All tests
npm run test:unit       # Unit tests only
npm run test:e2e        # E2E tests
npm run test:coverage   # With coverage
```

### Validate Code:
```bash
npm run lint            # Check code style
npm run validate        # Lint + tests
```

---

## 🔴 VIOLATIONS & CONSEQUENCES

### What Happens on Violation:
1. **Code Review Rejection** - PR will not be merged
2. **Refactoring Required** - Must fix before proceeding
3. **Technical Debt Logged** - Tracked for metrics

### Common Violations to Avoid:
- ❌ Business logic in controllers
- ❌ Direct database access from presentation layer
- ❌ Concrete dependencies instead of interfaces
- ❌ No tests for new features
- ❌ Copy-pasted code
- ❌ God objects with multiple responsibilities
- ❌ Anemic domain models

---

## 📚 REFERENCES

### Essential Reading:
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Clean Architecture - Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Test-Driven Development - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)

### Project Documentation:
- `DDD_ARCHITECTURE_REFACTOR.md` - DDD implementation details
- `ARCHITECTURE_DECISION.md` - Architectural decisions
- `PERFECT_10_UPGRADE.sh` - Setup scripts

---

## ✅ REMEMBER: These standards are NOT optional!

**Every single line of code must comply with these principles.**

**The system will enforce these standards automatically through:**
- Pre-commit hooks
- CI/CD pipelines
- Code review checklists
- Automated testing

---

*Last Updated: 2025-09-26*
*Version: 1.0.0*