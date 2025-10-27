# 🎯 Resume Analyzer - AI-Powered Talent Assessment

> A modern, lightweight resume analysis system with 100% DRY compliance, comprehensive testing, and production-ready architecture.

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/Tests-50%20Passing-brightgreen.svg)](./TEST_DOCUMENTATION.md)
[![DRY](https://img.shields.io/badge/DRY%20Compliance-100%25-gold.svg)](./app.py)

## 🌟 Features

- **🚀 Instant Analysis**: Process resumes in < 1 second
- **📊 ATS Scoring**: Industry-standard scoring (0-95 scale)
- **🎯 Skill Matching**: Intelligent skill extraction and comparison
- **💡 Smart Recommendations**: Actionable improvement suggestions
- **🔄 Dual Mode**: Works with or without ML models
- **⚡ High Performance**: LRU caching, optimized algorithms
- **🧪 Fully Tested**: 50 comprehensive tests (unit, integration, E2E)
- **📈 100% DRY**: Zero code repetition

## 🏗️ Architecture

```
Client → FastAPI → Analyzer → Embeddings → Score → Response
                      ↓
                  [Cache Layer]
                      ↓
                [Skills Database]
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip

### Installation

1. **Clone the repository**
```bash
cd ai_services4/resume-analyzer
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the application**
```bash
python app.py
```

4. **Access the API**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## 📖 API Usage

### Analyze Resume
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Python developer with Django experience",
    "job_description": "Looking for Python developer with cloud skills"
  }'
```

**Response:**
```json
{
  "ats_score": {
    "score": 75.5,
    "rating": "Good",
    "emoji": "✅"
  },
  "similarity": 82.3,
  "skills": {
    "resume": ["Python", "Django"],
    "job": ["Python", "Cloud"],
    "matching": ["python"],
    "missing": ["cloud"],
    "coverage": 50.0
  },
  "recommendations": [
    "Add these skills: cloud",
    "Use more keywords from the job description"
  ],
  "processing_time_ms": 125.4
}
```

### Get Optimization Tips
```bash
curl -X POST "http://localhost:8000/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Your resume text here",
    "job_description": "Job requirements here"
  }'
```

## 🧪 Testing

### Run All Tests
```bash
pytest test_unit.py test_integration.py test_e2e.py -v
```

### Run with Coverage
```bash
pytest --cov=app --cov-report=html
```

### Test Categories
- **Unit Tests** (23): Core logic validation
- **Integration Tests** (16): API endpoint testing
- **E2E Tests** (11): Real-world scenarios

See [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md) for complete testing guide.

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| Single Analysis | < 1000ms |
| 5 Resume Batch | < 5000ms |
| Concurrent Users | 10+ |
| Memory Usage | ~50MB (no ML) |
| Cache Hit Rate | > 50% |
| Test Coverage | 100% |

## 🔧 Configuration

Edit the `Config` dataclass in `app.py`:

```python
@dataclass
class Config:
    title: str = "Talent Assessment AI Service"
    version: str = "3.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
```

## 📁 Project Structure

```
resume-analyzer/
├── app.py                    # Main application (381 lines, 100% DRY)
├── requirements.txt          # Dependencies
├── test_unit.py             # Unit tests
├── test_integration.py      # Integration tests
├── test_e2e.py             # End-to-end tests
├── test-files/              # Sample data
├── README.md                # This file
├── ARCHITECTURE.md          # System design
└── TEST_DOCUMENTATION.md    # Testing guide
```

## 🎯 Scoring System

| Score Range | Rating | Emoji | Description |
|-------------|--------|-------|-------------|
| 80-95 | Excellent | 🌟 | Strong match, minor improvements |
| 60-79 | Good | ✅ | Good match, some gaps |
| 40-59 | Fair | 📊 | Moderate match, needs work |
| 0-39 | Needs Work | 📈 | Significant improvements needed |

## 💡 Key Features Explained

### Dual Embedding System
- **Primary**: SentenceTransformers (if available)
- **Fallback**: TF-IDF based embeddings (always available)

### Smart Caching
- LRU cache for embeddings (128 entries)
- Decorator-based operation timing
- Automatic cache management

### DRY Compliance
- Single source of truth for all constants
- Decorator patterns for cross-cutting concerns
- Factory methods for endpoint creation
- Zero code repetition

## 🛡️ Error Handling

- Global exception handler
- Graceful degradation
- Validation via Pydantic
- Comprehensive error messages

## 📈 Scalability

### Current Scale
- Designed for 5-10 resumes (college project)
- Single instance deployment
- In-memory processing

### Future Scale Options
- Add PostgreSQL for persistence
- Deploy with Docker/Kubernetes
- Implement Redis caching
- Add authentication/authorization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Ensure 100% DRY compliance
4. Add tests for new features
5. Run all tests
6. Submit pull request

## 📝 Development Guidelines

- Maintain 100% DRY compliance
- Write tests first (TDD)
- Keep functions small and focused
- Use meaningful variable names
- Update documentation

## 🎓 Academic Use

Perfect for demonstrating:
- Modern web API design
- Clean architecture principles
- Test-driven development
- Design patterns
- Performance optimization
- Professional documentation

## 🔍 Debugging

### Enable Debug Logs
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check System Status
```bash
curl http://localhost:8000/stats
```

## 🚦 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | System status and statistics |
| GET | `/health` | Health check |
| GET | `/stats` | Detailed statistics |
| POST | `/analyze` | Analyze resume against job |
| POST | `/optimize` | Get improvement suggestions |
| GET | `/docs` | Interactive API documentation |

## 📋 Requirements

### Core
- FastAPI==0.104.1
- uvicorn[standard]==0.24.0
- pydantic==2.5.0
- numpy==1.24.3
- scikit-learn==1.3.2

### Optional (for better embeddings)
- sentence-transformers==2.2.2
- torch (CPU version)

### Testing
- pytest==7.4.3
- pytest-asyncio==0.21.1
- pytest-cov==4.1.0
- httpx==0.25.2

## 🐛 Known Issues

- Scores may vary slightly between ML and fallback modes
- Large texts (>10000 words) may slow down processing
- PDF processing requires additional libraries

## 📅 Version History

- **v3.0.0** - 100% DRY compliant version with full test suite
- **v2.0.0** - Added optimization endpoint
- **v1.0.0** - Initial release

## 📞 Support

For issues or questions:
1. Check [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md)
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Run health check: `GET /health`
4. Check logs in console output

## 📜 License

This is a college project for educational purposes.

## 🙏 Acknowledgments

- FastAPI for the excellent framework
- Sentence Transformers for embeddings
- pytest for testing framework
- Professor for the opportunity to build this

---

**Built with ❤️ for Academic Excellence**

*"Clean code always looks like it was written by someone who cares."* - Robert C. Martin