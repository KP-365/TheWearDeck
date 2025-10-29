import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for session
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to admin panel
        window.location.href = 'http://localhost:8000/admin';
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('Failed to connect to admin panel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">TheWearDeck</h1>
          <p className="mt-2 text-gray-600">Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                placeholder="Admin username"
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
                placeholder="Admin password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-lg rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Signing in...' : 'Admin Login'}
          </button>

          <div className="text-center space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/login" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                ← User Login
              </Link>
              <button
                onClick={() => window.open('http://localhost:3000', '_blank')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                Back to Main App
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Or access admin panel directly: 
              <a 
                href="http://localhost:8000/admin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-black hover:underline ml-1"
              >
                Admin Panel
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
