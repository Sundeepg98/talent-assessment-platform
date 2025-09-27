const { Server } = require('socket.io');
const crypto = require('crypto');

class VideoInterviewService {
  constructor() {
    this.interviews = new Map();
    this.connections = new Map();
    this.recordings = new Map();
  }

  initializeSocketServer(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log('New WebRTC connection:', socket.id);
      
      socket.on('join-interview', (data) => this.handleJoinInterview(socket, data));
      socket.on('webrtc-offer', (data) => this.handleWebRTCOffer(socket, data));
      socket.on('webrtc-answer', (data) => this.handleWebRTCAnswer(socket, data));
      socket.on('ice-candidate', (data) => this.handleICECandidate(socket, data));
      socket.on('start-recording', (data) => this.handleStartRecording(socket, data));
      socket.on('stop-recording', (data) => this.handleStopRecording(socket, data));
      socket.on('end-interview', (data) => this.handleEndInterview(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });

    return this.io;
  }

  createInterview(candidateId, interviewerId, jobId) {
    const interviewId = crypto.randomBytes(16).toString('hex');
    
    const interview = {
      id: interviewId,
      candidateId,
      interviewerId,
      jobId,
      status: 'scheduled',
      createdAt: new Date(),
      startedAt: null,
      endedAt: null,
      duration: 0,
      recording: null,
      transcript: [],
      emotionData: [],
      participants: [],
      iceServers: this.getICEServers()
    };

    this.interviews.set(interviewId, interview);
    
    return interview;
  }

  handleJoinInterview(socket, { interviewId, userId, role }) {
    const interview = this.interviews.get(interviewId);
    
    if (!interview) {
      socket.emit('error', { message: 'Interview not found' });
      return;
    }

    // Add participant
    interview.participants.push({
      userId,
      role,
      socketId: socket.id,
      joinedAt: new Date()
    });

    // Join room
    socket.join(interviewId);
    
    // Store connection
    this.connections.set(socket.id, {
      interviewId,
      userId,
      role
    });

    // Update interview status
    if (interview.status === 'scheduled' && interview.participants.length === 2) {
      interview.status = 'in_progress';
      interview.startedAt = new Date();
    }

    // Notify others in room
    socket.to(interviewId).emit('participant-joined', {
      userId,
      role,
      socketId: socket.id
    });

    // Send interview details
    socket.emit('interview-joined', {
      interview,
      iceServers: interview.iceServers
    });
  }

  handleWebRTCOffer(socket, { interviewId, offer, targetSocketId }) {
    socket.to(targetSocketId).emit('webrtc-offer', {
      offer,
      senderSocketId: socket.id
    });
  }

  handleWebRTCAnswer(socket, { interviewId, answer, targetSocketId }) {
    socket.to(targetSocketId).emit('webrtc-answer', {
      answer,
      senderSocketId: socket.id
    });
  }

  handleICECandidate(socket, { interviewId, candidate, targetSocketId }) {
    socket.to(targetSocketId).emit('ice-candidate', {
      candidate,
      senderSocketId: socket.id
    });
  }

  handleStartRecording(socket, { interviewId }) {
    const interview = this.interviews.get(interviewId);
    
    if (!interview) return;

    const recordingId = crypto.randomBytes(8).toString('hex');
    
    this.recordings.set(recordingId, {
      interviewId,
      startedAt: new Date(),
      chunks: []
    });

    interview.recording = recordingId;

    socket.to(interviewId).emit('recording-started', {
      recordingId,
      timestamp: new Date()
    });
  }

  handleStopRecording(socket, { interviewId, recordingId }) {
    const recording = this.recordings.get(recordingId);
    
    if (!recording) return;

    recording.endedAt = new Date();
    recording.duration = recording.endedAt - recording.startedAt;

    socket.to(interviewId).emit('recording-stopped', {
      recordingId,
      duration: recording.duration
    });
  }

  handleEndInterview(socket, { interviewId }) {
    const interview = this.interviews.get(interviewId);
    
    if (!interview) return;

    interview.status = 'completed';
    interview.endedAt = new Date();
    interview.duration = interview.endedAt - interview.startedAt;

    // Notify all participants
    this.io.to(interviewId).emit('interview-ended', {
      interviewId,
      duration: interview.duration
    });

    // Clean up connections
    for (const participant of interview.participants) {
      this.connections.delete(participant.socketId);
    }
  }

  handleDisconnect(socket) {
    const connection = this.connections.get(socket.id);
    
    if (!connection) return;

    const { interviewId, userId, role } = connection;
    
    // Notify others
    socket.to(interviewId).emit('participant-left', {
      userId,
      role,
      socketId: socket.id
    });

    // Update interview
    const interview = this.interviews.get(interviewId);
    if (interview) {
      interview.participants = interview.participants.filter(
        p => p.socketId !== socket.id
      );
    }

    // Clean up connection
    this.connections.delete(socket.id);
  }

  getICEServers() {
    // In production, use TURN servers for NAT traversal
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
      ...(process.env.TURN_SERVER ? [{
        urls: process.env.TURN_SERVER,
        username: process.env.TURN_USER,
        credential: process.env.TURN_PASS
      }] : [])
    ];
  }

  async saveRecording(recordingId, chunks) {
    const recording = this.recordings.get(recordingId);
    
    if (!recording) {
      return { success: false, error: 'Recording not found' };
    }

    recording.chunks = chunks;
    recording.savedAt = new Date();

    // In production, save to S3 or cloud storage
    // For now, save locally
    const fileName = `interview_${recording.interviewId}_${recordingId}.webm`;
    const filePath = path.join(process.env.RECORDINGS_PATH || './recordings', fileName);

    try {
      await fs.writeFile(filePath, Buffer.concat(chunks));
      recording.filePath = filePath;
      
      return {
        success: true,
        filePath,
        fileName
      };
    } catch (error) {
      console.error('Save recording error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addTranscript(interviewId, transcript) {
    const interview = this.interviews.get(interviewId);
    
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }

    interview.transcript.push({
      ...transcript,
      timestamp: new Date()
    });

    return { success: true };
  }

  async addEmotionData(interviewId, emotionData) {
    const interview = this.interviews.get(interviewId);
    
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }

    interview.emotionData.push({
      ...emotionData,
      timestamp: new Date()
    });

    return { success: true };
  }

  getInterviewStatus(interviewId) {
    const interview = this.interviews.get(interviewId);
    
    if (!interview) {
      return null;
    }

    return {
      id: interview.id,
      status: interview.status,
      participants: interview.participants.length,
      duration: interview.duration,
      hasRecording: !!interview.recording,
      transcriptLength: interview.transcript.length
    };
  }

  async generateInterviewReport(interviewId) {
    const interview = this.interviews.get(interviewId);
    
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }

    const report = {
      interviewId: interview.id,
      candidateId: interview.candidateId,
      duration: interview.duration,
      summary: {
        totalQuestions: interview.transcript.filter(t => t.role === 'interviewer').length,
        totalResponses: interview.transcript.filter(t => t.role === 'candidate').length,
        averageResponseTime: this.calculateAverageResponseTime(interview.transcript)
      },
      emotionAnalysis: this.analyzeEmotions(interview.emotionData),
      transcript: interview.transcript,
      recommendations: []
    };

    return report;
  }

  calculateAverageResponseTime(transcript) {
    let totalTime = 0;
    let responseCount = 0;

    for (let i = 1; i < transcript.length; i++) {
      if (transcript[i].role === 'candidate' && transcript[i-1].role === 'interviewer') {
        const timeDiff = new Date(transcript[i].timestamp) - new Date(transcript[i-1].timestamp);
        totalTime += timeDiff;
        responseCount++;
      }
    }

    return responseCount > 0 ? totalTime / responseCount / 1000 : 0; // in seconds
  }

  analyzeEmotions(emotionData) {
    if (!emotionData || emotionData.length === 0) {
      return { dominant: 'neutral', confidence: 0 };
    }

    const emotionCounts = {};
    
    for (const data of emotionData) {
      const emotion = data.emotion || 'neutral';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }

    const dominant = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    return {
      dominant,
      distribution: emotionCounts,
      confidence: emotionCounts[dominant] / emotionData.length
    };
  }
}

module.exports = new VideoInterviewService();