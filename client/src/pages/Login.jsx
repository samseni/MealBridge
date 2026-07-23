import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/common/Alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ email, password });
      const role = response?.data?.user?.role;

      // Navigate based on role
      if (role === 'donor') {
        navigate('/donor');
      } else if (role === 'ngo') {
        navigate('/ngo');
      } else if (role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        // Default fallback if role is not recognized
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🍛 MealBridge</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
              placeholder="your@email.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">
                Password *
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary disabled:opacity-50 mt-6"
          >
            {loading ? 'Signing in...' : '🍛 Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}