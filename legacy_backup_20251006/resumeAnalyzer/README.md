# Resume Analyzer Service (INTEGRATED)

## ✅ This is the ONLY location for resume analyzer!

### Previous Location (DELETED):
- ~~ai_services4/resume-analyzer/~~ - NO LONGER EXISTS

### Current Location (CORRECT):
- `backend/src/services/resumeAnalyzer/` - THIS DIRECTORY

## Architecture:
- **index.js** - Node.js wrapper that calls Python subprocess
- **analyzer.py** - Lightweight Python analyzer
- **analyzer_full.py** - Full-featured analyzer (from original app.py)

## How It Works:
1. Node.js backend calls this service directly
2. No separate Python server needed
3. Runs as subprocess, not separate service
4. Falls back to JavaScript if Python fails

## Usage:
```javascript
const resumeAnalyzer = require('../services/resumeAnalyzer');

const result = await resumeAnalyzer.analyzeResume(resumeText, jobDescription);
```

## Benefits:
- Single backend service (no port 8000)
- Integrated architecture
- Better for deployment
- Cleaner codebase