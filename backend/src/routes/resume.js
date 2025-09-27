const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Simple upload endpoint for E2E tests
router.post("/upload", auth, upload.single('resume'), async (req, res) => {
  try {
    const resume = req.file;
    
    if (!resume) {
      return res.status(400).json({ error: "Resume file required" });
    }
    
    // For now, just extract basic text (mock processing)
    const extractedText = `Resume uploaded: ${resume.originalname}
Size: ${resume.size} bytes
Content-Type: ${resume.mimetype}

John Doe
Senior Software Engineer
john.doe@email.com | (555) 123-4567

EXPERIENCE
Software Engineer at Tech Company - 2020-2023
- Developed React applications
- Implemented REST APIs

SKILLS
JavaScript, React, Node.js, Python, MongoDB`;

    const analysis = {
      skills: ["JavaScript", "React", "Node.js", "Python", "MongoDB"],
      experience: "3+ years",
      matchScore: 85
    };
    
    res.json({
      success: true,
      extractedText,
      analysis,
      message: "Resume processed successfully"
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Resume upload failed" });
  }
});

// Resume optimization endpoint
router.post("/optimize", auth, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Resume text and job description required" });
    }
    
    // Mock optimization (in production, would use AI service)
    const optimizedResume = `${resumeText}

OPTIMIZED FOR JOB:
${jobDescription}`;
    const suggestions = [
      "Add more keywords from job description",
      "Highlight relevant experience",
      "Include quantifiable achievements"
    ];
    const matchScore = 75;
    
    res.json({
      success: true,
      optimizedResume,
      suggestions,
      matchScore,
      message: "Resume optimized successfully"
    });
  } catch (error) {
    console.error("Optimization error:", error);
    res.status(500).json({ error: "Resume optimization failed" });
  }
});

// Test endpoint (keep working)
router.post("/test-upload", auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobDescription', maxCount: 1 }
]), (req, res) => {
  try {
    const resume = req.files.resume?.[0];
    const jd = req.files.jobDescription?.[0];
    
    if (!resume || !jd) {
      return res.status(400).json({ msg: "Both files required" });
    }
    
    console.log("Resume file:", resume.originalname, resume.size);
    console.log("JD file:", jd.originalname, jd.size);
    
    res.json({
      success: true,
      resumeSize: resume.size,
      jdSize: jd.size,
      resumeName: resume.originalname,
      jdName: jd.originalname,
      message: "Files received successfully"
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ msg: "Upload failed" });
  }
});

// Analyze endpoint
router.post("/analyze", auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobDescription', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log("🎯 Analyze endpoint called!");
    
    const resume = req.files.resume?.[0];
    const jd = req.files.jobDescription?.[0];
    
    if (!resume || !jd) {
      return res.status(400).json({ msg: "Both files required" });
    }

    console.log("📁 Files received for analysis:");
    console.log("Resume:", resume.originalname, resume.size);
    console.log("JD:", jd.originalname, jd.size);

    console.log("🤖 Calling AI service...");

    const formData = new FormData();
    formData.append('resume_file', resume.buffer, {
      filename: resume.originalname,
      contentType: resume.mimetype
    });
    formData.append('jd_file', jd.buffer, {
      filename: jd.originalname,
      contentType: jd.mimetype
    });

    // Call AI service
    const aiResponse = await axios.post('http://localhost:8000/analyze', formData, {
      headers: formData.getHeaders(),
      timeout: 120000
    });

    console.log("✅ AI service responded successfully");

    // Extract actual data without artificial scoring
    const missingSkills = aiResponse.data.missing_skills || [];
    const improvementTips = aiResponse.data.improvement_tips || [];
    const optimizedResume = aiResponse.data.optimized_resume_text || '';

    console.log(`📊 Raw analysis results:`);
    console.log(`- Missing Skills: ${missingSkills.length}`);
    console.log(`- Improvement Tips: ${improvementTips.length}`);
    console.log(`- Optimized Resume: ${optimizedResume.length} characters`);

    // Return simple, honest response
    res.json({
      success: true,
      analysis: {
        // Raw counts
        missingSkillsCount: missingSkills.length,
        improvementTipsCount: improvementTips.length,
        
        // Actual data
        missingSkills: missingSkills,
        improvementTips: improvementTips,
        optimizedResume: optimizedResume,
        
        // Metadata
        analysisDate: new Date(),
        resumeFileName: resume.originalname,
        jdFileName: jd.originalname,
        
        // Raw AI response for debugging (optional)
        debug: {
          beforeChunks: aiResponse.data.before_missing_chunks?.length || 0,
          afterChunks: aiResponse.data.after_missing_chunks?.length || 0
        }
      }
    });

  } catch (error) {
    console.error("❌ Analyze error:", error.message);
    
    res.status(500).json({ 
      msg: "Analysis failed", 
      details: error.message,
      hint: "Check backend and AI service logs for details"
    });
  }
});

module.exports = router;