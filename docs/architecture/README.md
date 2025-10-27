# 🏗️ Architecture Overview

## System Architecture

The Talent Assessment Platform follows a **3-tier architecture**:

```
┌─────────────────┐
│   Frontend      │  React + Vite
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│   Backend API   │  Node.js + Express
│   (Port 5000)   │
└────────┬────────┘
         │
┌────────▼────────┐
│    MongoDB      │  NoSQL Database
│   (Port 27017)  │
└─────────────────┘
```

## Component Details

### Frontend (React SPA)
- **Technology**: React 18, Vite, TailwindCSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **Authentication**: JWT with Google OAuth support

### Backend API (Express)
- **Technology**: Node.js, Express.js
- **Authentication**: JWT, bcrypt
- **AI Services**: Integrated Gemini AI for resume/interview analysis
- **External APIs**: Judge0 for code execution

### Database (MongoDB)
- **Collections**: Users, Sessions, Submissions, InterviewSessions
- **Indexing**: Email (unique), userId
- **Connection**: Mongoose ODM

## Key Design Decisions

### 1. Monorepo Structure
All services in a single repository for easier development and deployment.

### 2. AI Service Integration
Node.js-based AI services integrated directly in the backend rather than separate microservices.

### 3. Authentication Strategy
JWT-based with support for both traditional email/password and Google OAuth.

## Service Communication

```
Frontend → Backend: REST API calls with JWT in Authorization header
Backend → MongoDB: Mongoose ODM
Backend → AI Services: Direct function calls (same process)
Backend → Judge0: HTTP API calls for code execution
```

## Scalability Considerations

- **Horizontal Scaling**: Stateless backend can be scaled with load balancer
- **Database**: MongoDB can be clustered for high availability
- **Caching**: Redis can be added for session management
- **CDN**: Static assets can be served via CDN