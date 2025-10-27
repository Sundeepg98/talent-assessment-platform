// frontend/src/services/api/resumeAnalysisApi.js

import { API, getAuthHeaders } from '../../config/api';

export const resumeAnalysisService = {
  // File validation
  validateFile(file) {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf'];

    if (!file) {
      errors.push('File is required');
      return errors;
    }

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${this.formatFileSize(maxSize)}`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('Only PDF files are allowed');
    }

    return errors;
  },

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Test file upload (maps to backend /upload endpoint)
  async testUpload(resumeFile, jdFile) {
    const formData = new FormData();

    formData.append('resume', resumeFile);
    if (jdFile) {
      formData.append('jobDescription', jdFile);
    }

    const response = await fetch(`${API.RESUME}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    const data = await response.json();

    return {
      success: response.ok,
      ...data
    };
  },

  // Analyze resume (maps to backend /optimize endpoint)
  async analyzeResume(resumeFile, jdFile) {
    const formData = new FormData();

    formData.append('resume', resumeFile);
    if (jdFile) {
      formData.append('jobDescription', jdFile);
    }

    const response = await fetch(`${API.RESUME}/optimize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    const data = await response.json();

    return {
      success: response.ok,
      ...data
    };
  }
};