# ML Strategy Documentation

## Current State (As of 2025-10-06)

### Active Implementation: Lightweight (Keyword Matching)

**Location:** `src/services/interview/interviewAnalyzer/analyzer.py`

**Approach:**
- Basic keyword matching against role-specific dictionaries
- Sentiment analysis based on word patterns
- Response length and clarity scoring
- **NO ML models** - pure rule-based logic
- **Execution Path:** `index.js` → spawns `analyzer.py` subprocess

**Advantages:**
- ✅ Fast (< 100ms response time)
- ✅ No dependencies (pure Python stdlib)
- ✅ Predictable results
- ✅ Low resource usage
- ✅ Works offline

**Limitations:**
- ❌ Limited semantic understanding
- ❌ Cannot detect nuanced quality
- ❌ No context awareness
- ❌ Basic pattern matching only

---

### Available But Unused: Full ML (PyTorch + BERT)

**Location:** `src/services/interview/interviewAnalyzer/core/semantic_analyzer.py`

**Approach:**
- **Model:** sentence-transformers/all-MiniLM-L6-v2 (BERT-based)
- **Framework:** PyTorch 2.8.0+cpu
- **Embeddings:** 384-dimensional sentence vectors
- **Similarity:** Cosine similarity for relevance scoring
- **Caching:** Embedding cache for performance

**Status:** ✅ CODE EXISTS ✅ TESTED ✅ WORKING ❌ NOT IN EXECUTION PATH

**Why Not Used:**
1. Not imported by `index.js`
2. analyzer.py doesn't use it
3. No configuration to enable it
4. User may not want PyTorch dependency (132 MB)

**Advantages:**
- ✅ Real semantic understanding
- ✅ Context-aware analysis
- ✅ Better quality assessment
- ✅ Handles paraphrasing

**Limitations:**
- ❌ Slower (300-500ms first run, ~100ms cached)
- ❌ Large dependency (PyTorch 132 MB)
- ❌ Requires pip install
- ❌ Higher resource usage (CPU/memory)

---

## Recommended Strategy: HYBRID APPROACH

### Implementation Plan

#### 1. Configuration-Based Selection

**Environment Variable:**
```bash
USE_ML_ANALYSIS=false  # Default: lightweight
USE_ML_ANALYSIS=true   # Enable PyTorch/BERT
```

#### 2. Fallback Chain
```
1st attempt: Try ML analysis (if enabled)
    ↓ (on error or disabled)
2nd attempt: Use keyword matching (always works)
```

#### 3. Code Changes Required

**File:** `src/services/interview/interviewAnalyzer/analyzer.py`

Add at the top:
```python
import os
USE_ML = os.getenv('USE_ML_ANALYSIS', 'false').lower() == 'true'

if USE_ML:
    try:
        from core.semantic_analyzer import SemanticAnalyzer
        ML_AVAILABLE = True
    except ImportError:
        print("[WARNING] ML analysis requested but dependencies not installed")
        ML_AVAILABLE = False
else:
    ML_AVAILABLE = False
```

In `analyze()` method:
```python
def analyze(self, question: str, response: str, role: str):
    if ML_AVAILABLE:
        try:
            return self._analyze_with_ml(question, response, role)
        except Exception as e:
            print(f"[WARNING] ML analysis failed: {e}, using fallback")
            return self._analyze_keyword_based(question, response, role)
    else:
        return self._analyze_keyword_based(question, response, role)
```

#### 4. Dependencies

**For Lightweight (Current):**
```
# NO dependencies - pure Python stdlib
```

**For Full ML (Optional):**
```bash
pip install torch sentence-transformers
# OR use requirements.txt:
torch==2.8.0+cpu
sentence-transformers==3.3.1
```

---

## Testing Status

### Lightweight Analyzer
- ✅ Tested via subprocess spawn
- ✅ Integrated with DI container
- ✅ Returns valid analysis structure
- ✅ Works with all test cases

### ML Analyzer (semantic_analyzer.py)
- ✅ Tested standalone
- ✅ Model loads successfully
- ✅ Embeddings generate correctly
- ✅ Similarity scoring works
- ❌ NOT integrated into execution path

---

## Decision Matrix

| Criteria | Lightweight | Full ML | Hybrid |
|----------|-------------|---------|--------|
| **Speed** | Excellent (< 100ms) | Good (100-500ms) | Good (fallback if slow) |
| **Accuracy** | Basic | High | High (when enabled) |
| **Dependencies** | None | PyTorch (132 MB) | Optional |
| **Resource Usage** | Minimal | Moderate | Moderate (when enabled) |
| **Setup Complexity** | None | pip install | Optional pip install |
| **Offline Support** | Yes | Yes (after download) | Yes |
| **Production Ready** | ✅ YES | ⚠️ NOT WIRED | ⚠️ NEEDS CONFIG |

---

## Recommendation: **HYBRID** (Default OFF)

### Why Hybrid?

1. **Backwards Compatible:** No breaking changes, works without ML
2. **Opt-In ML:** Users who want better accuracy can enable it
3. **Graceful Degradation:** Falls back automatically on error
4. **Resource Conscious:** No forced 132 MB dependency
5. **Best of Both Worlds:** Fast for basic, accurate for premium

### Implementation Effort

- **Time:** ~2 hours
- **Changes:** 1 file (analyzer.py)
- **Testing:** Update integration tests
- **Documentation:** .env.example update
- **Risk:** LOW (fallback ensures no breakage)

---

## Current Verdict

**Status:** System uses ONLY lightweight keyword matching.

**PyTorch Infrastructure:**
- ✅ Installed and working
- ✅ Code exists and tested
- ❌ Not wired into execution path

**Action Required:** Decide between:
1. **Keep As-Is** - Lightweight only, remove unused ML code
2. **Switch to ML** - Make PyTorch required, wire semantic_analyzer
3. **Implement Hybrid** - Configuration-based selection (RECOMMENDED)

---

*Last Updated: 2025-10-06*
*Author: AI/ML Audit & Refactoring*
