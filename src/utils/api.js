const getApiUrl = () => {
  // 1) Prefer explicit deployment base URL via Vite env (REQUIRED for production)
  // Vite replaces import.meta.env at build time
  const envBase = import.meta.env?.VITE_API_BASE;
  if (envBase && typeof envBase === 'string' && envBase.trim().length > 0) {
    return envBase.replace(/\/$/, '');
  }

  // 2) Fallbacks ONLY for local development
  if (typeof window !== 'undefined') {
    try {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol || 'http:';

      // Only use localhost for actual localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000';
      }

      // If we're on a deployed domain (not localhost) and VITE_API_BASE is missing,
      // log a warning but still try hostname fallback (won't work but gives useful error)
      if (hostname && !hostname.includes('localhost')) {
        console.error('⚠️ VITE_API_BASE not set! API calls will fail. Set VITE_API_BASE in Vercel environment variables.');
      }

      // Replit special case
      if (hostname.includes('replit.dev') || hostname.includes('repl.co') || hostname.includes('replit.app')) {
        const baseHost = hostname.replace(/--\d+/, '');
        return `${protocol}//${baseHost}--8000`;
      }

      // Fallback - likely won't work in production but better than nothing
      return `${protocol}//${hostname}:8000`;
    } catch (_e) {
      return 'http://localhost:8000';
    }
  }

  return 'http://localhost:8000';
};

const API_URL = getApiUrl();

// Export for debugging and external use (like Onboarding page)
export { getApiUrl, API_URL };

export const api = {
  async get(endpoint, token = null) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for production
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `API error: ${response.statusText}`;
        try {
          const errorData = await response.clone().json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
        }
        const error = new Error(errorMessage);
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
      
      // Try to parse JSON response
      let responseData;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        // If JSON parsing fails, create basic error
        if (!response.ok) {
          const error = new Error(`API error: ${response.statusText}`);
          error.status = response.status;
          throw error;
        }
        throw new Error('Invalid response from server');
      }
      
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
        const error = new Error(responseData.detail || responseData.message || `API error: ${response.statusText}`);
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
