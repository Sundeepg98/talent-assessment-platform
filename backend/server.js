require("dotenv").config(); 
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./src/routes/auth");
const codingRoutes = require("./src/routes/coding");
const resumeRoutes = require("./src/routes/resume");
const { errorHandler, notFound } = require("./src/middleware/errorHandler"); 

const app = express();

// Single CORS configuration - DRY principle
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://accounts.google.com'
    ];
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json()); // parse JSON request bodies

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  next();
});
app.use("/api/coding", codingRoutes); 
app.use("/api/resume", resumeRoutes);
// simple health check
app.get("/", (req, res) => res.send("API up"));

app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(200).json(healthcheck);
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);
// MongoDB connection with timeout and retry logic
async function connectDB(retries = 3) {
  const mongoOptions = {
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    socketTimeoutMS: 45000, // 45 second socket timeout
    family: 4 // Use IPv4, skip trying IPv6
  };

  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, mongoOptions);
      console.log("✅ MongoDB connected");
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
      });
      
      return true;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        return false;
      }
      console.log(`Retrying in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  return false;
}

async function start() {
  try {
    // Try to connect to MongoDB with retries
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      console.warn("⚠️  Starting server without database connection");
      console.warn("⚠️  Database-dependent features will be disabled");
    }
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log("✅ Server running on port", PORT);
      if (!dbConnected) {
        console.log("⚠️  Running in degraded mode - no database");
      }
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
