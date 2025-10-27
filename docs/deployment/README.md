# 🚀 Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+
- Git

## Environment Variables

Create `.env` files for both backend and frontend:

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/talent-assessment
JWT_SECRET=your-secret-key-here
JUDGE0_API_KEY=your-judge0-api-key
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Local Development

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Start MongoDB:**
```bash
sudo systemctl start mongod
```

3. **Start all services:**
```bash
npm run start:all
```

## Production Deployment

### Option 1: Traditional VPS

1. **Setup server:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
# Follow MongoDB installation guide for your OS

# Install PM2
npm install -g pm2
```

2. **Clone and setup:**
```bash
git clone https://github.com/yourusername/talent-assessment-platform.git
cd talent-assessment-platform
npm run install:all
```

3. **Build frontend:**
```bash
cd frontend
npm run build
```

4. **Start with PM2:**
```bash
# Backend
pm2 start backend/server.js --name talent-api

# Serve frontend with nginx
sudo apt install nginx
# Configure nginx to serve frontend/dist
```

### Option 2: Docker

1. **Build images:**
```bash
docker build -t talent-backend ./backend
docker build -t talent-frontend ./frontend
```

2. **Run with docker-compose:**
```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Backend
heroku create talent-api
heroku addons:create mongolab
git push heroku main

# Frontend
heroku create talent-app
heroku buildpacks:set https://github.com/mars/create-react-app-buildpack
git push heroku main
```

#### AWS
- Backend: Elastic Beanstalk or ECS
- Frontend: S3 + CloudFront
- Database: MongoDB Atlas

#### Vercel (Frontend only)
```bash
cd frontend
vercel
```

## Production Checklist

- [ ] Set secure environment variables
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Setup monitoring (e.g., New Relic, DataDog)
- [ ] Configure backup strategy for MongoDB
- [ ] Setup CI/CD pipeline
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Setup error tracking (e.g., Sentry)
- [ ] Configure logging

## Monitoring

### Health Check
```bash
curl https://your-domain.com/health
```

### Logs
```bash
# PM2 logs
pm2 logs talent-api

# Docker logs
docker logs talent-backend
```

## Troubleshooting

### MongoDB Connection Issues
- Check if MongoDB is running: `sudo systemctl status mongod`
- Verify connection string in `.env`
- Check firewall rules

### Port Already in Use
```bash
# Find process using port
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Frontend Not Loading
- Check API_URL in frontend `.env`
- Verify CORS configuration
- Check browser console for errors