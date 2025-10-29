import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Add timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 3000); // Max 3 seconds for auth check
    
    if (token) {
      // Verify token and get user
      api.get('/auth/me', token)
        .then(data => {
          setUser(data.user);
        })
        .catch((error) => {
          // Clear invalid/expired tokens
          if (error.status === 401 || error.status === 403) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setLoading(false);
        });
    } else {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [token]);

  const signup = async (email, password, name) => {
    try {
      const data = await api.post('/auth/signup', { email, password, name });
      
      // Handle email confirmation case
      if (data.requires_confirmation) {
        return {
          success: true,
          message: data.message || 'Account created! Please check your email to confirm your account.',
          requires_confirmation: true
        };
      }
      
      // Handle immediate signup success
      if (data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        // New users need onboarding
        setNeedsOnboarding(true);
      }
      
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account. Please check your credentials and try again.');
    }
  };

  const signin = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      setUser(data.user);
      
      // Check if user needs onboarding
      if (data.user && !data.user.onboarding_completed) {
        setNeedsOnboarding(true);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to sign in. Please check your credentials and try again.');
    }
  };

  const signout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setNeedsOnboarding(false);
  };

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      needsOnboarding, 
      signup, 
      signin, 
      signout, 
      completeOnboarding 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
