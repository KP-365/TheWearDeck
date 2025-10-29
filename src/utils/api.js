const getApiUrl = () => {
  // 1) Prefer explicit deployment base URL via Vite env
 // Vite replaces import.meta.env at build time
  const envBase = import.meta.env?.VITE_API_BASE;
  
  if (envBase && typeof envBase === 'string' && envBase.trim().length > 0) {
    return envBase.replace(/\/$/, '');
  }

  // 2) Fallbacks for local/dev environments
  if (typeof window !== 'undefined') {
    try {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol || 'http:';

      if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
        return 'http://localhost:8000';
      }

      if (hostname.includes('replit.dev') || hostname.includes('repl.co') || hostname.includes('replit.app')) {
        const baseHost = hostname.replace(/--\d+/, '');
        return `${protocol}//${baseHost}--8000`;
      }

      return `${protocol}//${hostname}:8000`;
    } catch (_e) {
      return 'http://localhost:8000';
    }
  }

  return 'http://localhost:8000';
};

const API_URL = getApiUrl();

export const api = {
  async get(endpoint, token = null) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = new Error(`API error: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw error;
    }
  },
  
  async post(endpoint, data, token = null) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for POST
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseData = await response.json();
      
      // Handle special case for signup with email confirmation
      if (!response.ok && endpoint === '/auth/signup' && responseData.detail && 
          (responseData.detail.includes('Email confirmation required') || 
           responseData.detail.includes('check your email'))) {
        return {
          success: true,
          message: responseData.detail,
          requires_confirmation: true,
          user: {
            id: 'pending',
            email: data.email,
            name: data.name || data.email.split('@')[0]
          }
        };
      }
      
      if (!response.ok) {
        const error = new Error(responseData.detail || `API error: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw error;
    }
  },
};
