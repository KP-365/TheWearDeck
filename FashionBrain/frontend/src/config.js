// Configuration file - can be edited to set API URL
// This file can be modified after build if needed

// Set your backend API URL here
// Options:
// 1. Leave empty to auto-detect
// 2. Set to your Render backend URL (e.g., 'https://your-backend.onrender.com')
// 3. Set to localhost for development (e.g., 'http://localhost:8000')

export const API_CONFIG = {
  // Set this to your backend URL, or leave empty for auto-detection
  baseUrl: '',
  
  // Auto-detection settings
  autoDetect: true,
  
  // Known backend URLs by hostname pattern (optional)
  hostnameMappings: {
    // Add mappings like:
    // 'your-frontend.vercel.app': 'https://your-backend.onrender.com'
  }
};

// Helper to get API URL
export const getConfiguredApiUrl = () => {
  // If explicitly configured, use it
  if (API_CONFIG.baseUrl && API_CONFIG.baseUrl.trim().length > 0) {
    return API_CONFIG.baseUrl.replace(/\/$/, '');
  }
  
  // Check hostname mappings
  if (typeof window !== 'undefined' && API_CONFIG.hostnameMappings) {
    const hostname = window.location.hostname;
    if (API_CONFIG.hostnameMappings[hostname]) {
      return API_CONFIG.hostnameMappings[hostname].replace(/\/$/, '');
    }
不使用}
  
  return null; // Let auto-detection handle it
};

