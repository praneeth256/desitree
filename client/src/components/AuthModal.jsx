import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
        });
      }
      onClose();
    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay open" onClick={onClose}>
      <div className="auth-box" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>✕</button>
        <h2>{mode === 'login' ? 'Welcome back' : 'Join DesiTree'}</h2>
        <p>
          {mode === 'login'
            ? 'Sign in to your account'
            : 'Create your free account'
          }
        </p>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              className="auth-input"
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange('name')}
              required
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange('email')}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange('password')}
            required
          />
          <button className="btn-full" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
          {error && <div className="auth-error">{error}</div>}
        </form>
        <div className="auth-switch">
          {mode === 'login' ? "No account?" : "Have an account?"}{' '}
          <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </div>
    </div>
  );
}