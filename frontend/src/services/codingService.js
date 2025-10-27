// frontend/src/services/codingService.js
import { API, getJsonHeaders, getAuthHeaders } from '../config/api';

export const codingService = {
  async submitCode(sourceCode, languageId, stdin = '') {
    const response = await fetch(`${API.CODING}/submit`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ sourceCode, languageId, stdin })
    });
    return await response.json();
  },

  async getSubmissionResults(token) {
    const response = await fetch(`${API.CODING}/submission/${token}`, {
      headers: getAuthHeaders()
    });
    return await response.json();
  }
};