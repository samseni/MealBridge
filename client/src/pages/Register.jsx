import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth.api';
import Alert from '../components/common/Alert';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor',
    org_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authAPI.register(formData);

      // Show success message
      setSuccess('Account created successfully! Please login to continue.');

      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'donor',
        org_name: '',
        phone: ''
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-8">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🍛 MealBridge</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="label">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="label">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <label className="label">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label className="label">
              I am a *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input cursor-pointer"
              required
            >
              <option value="donor">🍽️ Donor (Restaurant/Hotel/Individual)</option>
              <option value="ngo">🤝 NGO/Volunteer</option>
            </select>
          </div>

          {formData.role === 'ngo' && (
            <div className="animate-slide-down">
              <label className="label">
                Organization Name *
              </label>
              <input
                type="text"
                name="org_name"
                value={formData.org_name}
                onChange={handleChange}
                className="input"
                required={formData.role === 'ngo'}
                placeholder="Your NGO Name"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary disabled:opacity-50 mt-6"
          >
            {loading ? 'Creating Account...' : '✅ Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}