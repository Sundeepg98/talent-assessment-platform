const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    sourceCode: {
        type: String,
        required: true
    },
    languageId: {
        type: Number,
        required: true
    },
    judge0Token: {
        type: String,
        required: false // Make optional for flexibility
    },
    stdin: String,
    stdout: String,
    stderr: String,
    status: {
        id: Number,
        description: String
    },
    time: String,
    memory: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Submission', submissionSchema);
