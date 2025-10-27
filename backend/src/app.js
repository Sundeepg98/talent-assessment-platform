const express = require('express');
const dotenv = require('dotenv');

console.log('Starting server...');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// Resume optimization routes
app.use('/api/resume', require('./routes/resume'));

// Coding assessment routes
app.use('/api/coding', require('./routes/coding'));

// Interview system routes
app.use('/api/interview', require('./routes/interview'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        message: 'OK',
        database: 'connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
