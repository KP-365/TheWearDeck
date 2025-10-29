import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signin, needsOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await signin(email, password);
      console.log('✅ Login successful:', data);
      
      // Ensure token is definitely set
      if (data?.access_token) {
        localStorage.setItem('token', data.access_token);
        console.log('✅ Token saved to localStorage');
      } else {
        console.error('❌ No access_token in response');
      }
      
      // Check if user needs onboarding
      const onboardingStatus = data?.user?.onboarding_completed;
      const needOnboarding = onboardingStatus === undefined || onboardingStatus === false;
      
      // Determine target path
      const targetPath = needOnboarding ? '/onboarding' : '/feed';
      console.log('🎯 Navigating to:', targetPath);
      
      // Use replace instead of href to avoid adding to history
      // This ensures a clean redirect
      setTimeout(() => {
        window.location.replace(targetPath);
      }, 100);
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">TheWearDeck</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-black hover:underline">
                Sign up
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Admin?{' '}
              <Link to="/admin" className="font-medium text-black hover:underline">
                Admin Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
