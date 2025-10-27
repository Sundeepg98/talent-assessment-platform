// Centralized API configuration
// Uses environment variable VITE_API_URL with localhost fallback

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API = {
  // Base URLs for each service area
  AUTH: `${API_BASE_URL}/api/auth`,
  CODING: `${API_BASE_URL}/api/coding`,
  RESUME: `${API_BASE_URL}/api/resume`,
  INTERVIEW: `${API_BASE_URL}/api/interview`,
  MONITORING: `${API_BASE_URL}/api/monitoring`,
  ASSESSMENTS: `${API_BASE_URL}/api/assessments`,
};

// Export base URL for cases where full URL construction is needed
export { API_BASE_URL };

// Helper to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
};

// Helper for JSON requests with auth
export const getJsonHeaders = () => {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };
};
