# 📡 API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication (`/auth`)

#### POST `/auth/signup`
Register a new user.
```json
Request:
{
  "name": "string",
  "email": "string",
  "password": "string"
}

Response: 201
{
  "token": "jwt_token",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

#### POST `/auth/login`
Authenticate existing user.
```json
Request:
{
  "email": "string",
  "password": "string"
}

Response: 200
{
  "token": "jwt_token",
  "user": { ... }
}
```

#### GET `/auth/me`
Get current user profile. **Requires authentication**.
```json
Response: 200
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string"
}
```

### Resume Processing (`/resume`)

#### POST `/resume/upload`
Upload resume for analysis. **Requires authentication**.
```
Content-Type: multipart/form-data
Field: resume (PDF file)

Response: 200
{
  "extractedText": "string",
  "analysis": { ... }
}
```

#### POST `/resume/optimize`
Optimize resume for job description. **Requires authentication**.
```json
Request:
{
  "resumeText": "string",
  "jobDescription": "string"
}

Response: 200
{
  "optimizedResume": "string",
  "suggestions": ["string"],
  "matchScore": number
}
```

### Coding Assessment (`/coding`)

#### POST `/coding/submit`
Submit code for execution. **Requires authentication**.
```json
Request:
{
  "sourceCode": "string",
  "languageId": number,
  "stdin": "string"
}

Response: 200
{
  "token": "submission_token",
  "submissionId": "string"
}
```

#### GET `/coding/submission/:token`
Get code execution results. **Requires authentication**.
```json
Response: 200
{
  "status": { "description": "string" },
  "stdout": "string",
  "stderr": "string",
  "time": "string",
  "memory": number
}
```

### Interview System (`/interview`)

#### POST `/interview/start`
Start interview session. **Requires authentication**.
```json
Request:
{
  "role": "frontend|backend|fullstack",
  "level": "junior|intermediate|senior"
}

Response: 200
{
  "sessionId": "string",
  "questions": [{ ... }]
}
```

#### POST `/interview/response`
Submit interview response. **Requires authentication**.
```json
Request:
{
  "sessionId": "string",
  "questionIndex": number,
  "response": "string"
}

Response: 200
{
  "saved": true,
  "feedback": "string"
}
```

#### POST `/interview/complete`
Complete interview session. **Requires authentication**.
```json
Request:
{
  "sessionId": "string"
}

Response: 200
{
  "analysis": { ... },
  "score": number,
  "recommendations": ["string"]
}
```

### Health Check

#### GET `/health`
Check system health. **No authentication required**.
```json
Response: 200
{
  "message": "OK",
  "database": "connected",
  "uptime": number,
  "timestamp": "ISO 8601"
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error