# 🎯 Talent Assessment Platform

An AI-powered recruitment platform that revolutionizes the hiring process through intelligent resume analysis, automated interview evaluation, and live coding assessments.

## ⚠️ MANDATORY DEVELOPMENT STANDARDS

**ALL code changes MUST follow these NON-NEGOTIABLE principles:**

### 📋 Required Architecture
- **[Domain-Driven Design (DDD)](./DEVELOPMENT_STANDARDS.md#1-domain-driven-design-ddd)** - Bounded contexts, entities, value objects
- **[SOLID Principles](./DEVELOPMENT_STANDARDS.md#2-solid-principles)** - SRP, OCP, LSP, ISP, DIP
- **[DRY (Don't Repeat Yourself)](./DEVELOPMENT_STANDARDS.md#3-dry-dont-repeat-yourself)** - Zero duplication tolerance
- **[Test-Driven Development (TDD)](./DEVELOPMENT_STANDARDS.md#4-test-driven-development-tdd)** - Tests FIRST, code second

### 🚫 Before ANY Code Change:
1. **READ:** [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md) - Complete standards guide
2. **WRITE TESTS FIRST** - No exceptions
3. **FOLLOW DDD STRUCTURE** - Domain → Application → Infrastructure → Presentation
4. **APPLY SOLID** - Every class, every method
5. **CHECK DRY** - Reuse existing patterns

### ✅ Quick Compliance Check:
```bash
# Run standards check
./scripts/check-standards.sh

# Run tests
npm test

# Check coverage (minimum 80%)
npm run test:coverage
```

**⚠️ WARNING: Code not following these standards will be REJECTED**

---

## 🚀 Features

### Core Capabilities
- **📄 AI Resume Analyzer** - Intelligent matching against job descriptions using Gemini API
- **🎤 Interview Evaluation** - Automated Q&A response analysis and feedback generation
- **💻 Live Coding Environment** - In-browser code execution with Judge0 API integration
- **🔐 Multi-role Support** - Admin, HR, and Candidate dashboards
- **🔗 Google OAuth** - Seamless authentication integration

## 🏗️ Architecture

```
talent-assessment-platform/
├── backend/                 # Node.js/Express REST API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── models/         # MongoDB schemas
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth & validation
│   └── tests/              # Backend tests
├── frontend/               # React/Vite SPA
│   └── src/
│       ├── pages/          # Route components
│       ├── components/     # Reusable UI components
│       └── services/       # API client
└── ai_services4/           # Python/FastAPI microservices
    ├── resume-analyzer/    # Resume optimization service
    └── interview-analyzer/ # Interview evaluation service
```

## 🛠️ Tech Stack

### Backend
- **Framework:** Express.js 5.1
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + Google OAuth 2.0
- **Code Execution:** Judge0 API
- **File Processing:** Multer

### Frontend
- **Framework:** React 19 with Vite 7
- **Code Editor:** Monaco Editor
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Styling:** CSS Modules

### AI Services
- **Framework:** FastAPI
- **AI Model:** Google Gemini API
- **NLP:** NLTK, spaCy
- **PDF Processing:** PyPDF2

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB 5.0+
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone git@github.com:G-karthick0501/new.git talent-assessment-platform
cd talent-assessment-platform
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env  # Configure API URL
npm run dev
```

4. **Setup AI Services**
```bash
cd ai_services4/resume-analyzer
pip install -r requirements.txt
uvicorn app:app --reload --port 8001

cd ../interview-analyzer
pip install -r requirements.txt
uvicorn app:app --reload --port 8002
```

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/talent-assessment
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
JUDGE0_API_KEY=your-judge0-api-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### AI Services (.env)
```env
GEMINI_API_KEY=your-gemini-api-key
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Python service tests
cd ai_services4
pytest
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth

### Resume Analysis
- `POST /api/resume/analyze` - Analyze resume against job description
- `GET /api/resume/results/:id` - Get analysis results

### Interview Management
- `POST /api/interview/start` - Begin interview session
- `POST /api/interview/submit` - Submit responses
- `GET /api/interview/results/:id` - Get evaluation

### Coding Challenges
- `GET /api/coding/problems` - List problems
- `POST /api/coding/submit` - Submit solution
- `GET /api/coding/results/:id` - Get execution results

## 🚦 Project Status

⚠️ **Current Status:** Development Phase

### Known Issues
- Test infrastructure needs setup
- MongoDB connection handling needs timeout
- CORS configuration duplication
- Missing error boundaries

See [ENGINEERING_AUDIT_REPORT.md](./ENGINEERING_AUDIT_REPORT.md) for detailed analysis.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Development:** Node.js/Express Team
- **Frontend Development:** React Team
- **AI/ML Services:** Python/FastAPI Team
- **DevOps:** Infrastructure Team

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the development team

---

**Note:** This platform is under active development. Features and APIs may change.
