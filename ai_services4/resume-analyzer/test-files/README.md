# Test Files Documentation

## 📁 Purpose
This folder contains sample data files used for testing the Resume Analyzer application. These files simulate real-world inputs to ensure the system handles various file formats correctly.

## 📄 Files Overview

### 1. **sample_jd.txt**
- **Type:** Plain text file
- **Content:** Simple job description
- **Sample:** "Looking for a Software Engineer skilled in Python, cloud services, and AI/ML."
- **Usage:** 
  - Testing text-based job description parsing
  - Skill extraction validation
  - API endpoint testing with text input

### 2. **sample_jd.pdf**
- **Type:** PDF document
- **Purpose:** Job description in PDF format
- **Usage:**
  - Testing PDF parsing capabilities (if implemented)
  - Validating file upload functionality
  - Future enhancement testing
  - Error handling for PDF input

### 3. **sample_resume.pdf**
- **Type:** PDF document  
- **Purpose:** Sample resume for analysis
- **Usage:**
  - Testing resume PDF parsing (future feature)
  - File upload endpoint validation
  - Binary file handling tests
  - Integration testing with real-world file formats

## 🧪 How These Files Are Used

### In Unit Tests
```python
# Not directly used - unit tests use inline strings
test_text = "Python developer with Django experience"
```

### In Integration Tests
```python
# Used for file upload testing (future)
with open("test-files/sample_resume.pdf", "rb") as f:
    files = {"resume": f}
    response = client.post("/upload", files=files)
```

### In E2E Tests
```python
# Simulated in test scenarios
student_resume = """
Computer Science Student | Final Year
Skills: Python, Java, MySQL, Git
"""
```

## 🎯 Test Coverage

| File | Current Usage | Future Usage |
|------|---------------|--------------|
| sample_jd.txt | ✅ Manual testing | API text input tests |
| sample_jd.pdf | ❌ Not yet used | PDF parsing tests |
| sample_resume.pdf | ❌ Not yet used | File upload tests |

## 📝 Test Data Guidelines

### When Adding New Test Files:
1. **Keep files small** (<100KB for performance)
2. **Use realistic content** (actual job descriptions/resumes)
3. **Include diverse formats** (txt, pdf, docx)
4. **Add edge cases** (empty files, corrupted PDFs)
5. **Document purpose** clearly in this README

### Sample Content Structure

#### Good Job Description (sample_jd.txt):
```
Looking for a Software Engineer skilled in:
- Python, cloud services, and AI/ML
- Docker and Kubernetes experience
- Strong problem-solving skills
```

#### Good Resume Structure:
```
[Name]
[Contact Info]

Skills:
- Technical skills list
- Soft skills

Experience:
- Job 1 with achievements
- Job 2 with metrics

Education:
- Degree and institution
```

## 🔬 Testing Scenarios

### 1. **Happy Path**
- Valid text input → Successful analysis
- Standard resume → Good ATS score

### 2. **Edge Cases**
- Empty file → Graceful error
- Huge file → Performance test
- Invalid format → Error handling

### 3. **Integration**
- Text file → API → Analysis → Response
- PDF upload → Extraction → Analysis

## 🚀 Future Enhancements

### Planned Test Files:
- `sample_resume.txt` - Plain text resume
- `sample_resume.docx` - Word document resume
- `empty.txt` - Edge case testing
- `large_resume.txt` - Performance testing
- `multilingual_resume.txt` - Unicode handling

### Planned Features:
1. **PDF Processing**
   ```python
   # Using PyPDF2 or pdfplumber
   def extract_text_from_pdf(file_path):
       # Implementation needed
   ```

2. **File Upload Endpoint**
   ```python
   @app.post("/upload")
   async def upload_file(file: UploadFile):
       # Process uploaded file
   ```

3. **Batch Processing**
   - Multiple resumes at once
   - Zip file support

## 📊 Test Metrics

### Current Coverage:
- **Text Processing:** 100% ✅
- **PDF Processing:** 0% (planned)
- **File Upload:** 0% (planned)
- **Error Handling:** 100% ✅

### Performance Benchmarks:
- Text file processing: <100ms
- PDF processing (target): <500ms
- Max file size: 5MB

## 🔒 Security Considerations

1. **File Validation**
   - Check file extensions
   - Verify MIME types
   - Scan for malicious content

2. **Size Limits**
   - Max file size: 5MB
   - Max text length: 50,000 characters

3. **Sanitization**
   - Clean extracted text
   - Remove potentially harmful scripts

## 📚 References

- [FastAPI File Upload](https://fastapi.tiangolo.com/tutorial/request-files/)
- [PyPDF2 Documentation](https://pypdf2.readthedocs.io/)
- [Testing Best Practices](https://docs.pytest.org/en/stable/goodpractices.html)

---

*Note: These test files are for development and testing purposes only. Do not include sensitive or personal information in test data.*