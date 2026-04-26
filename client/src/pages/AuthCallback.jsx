import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('Authentication failed:', error);
        navigate('/signin?error=auth_failed');
        return;
      }

      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));

          // Store the token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Update auth context
          setAuth({ token, user });

          // Redirect based on role
          navigate(user.role === 'admin' ? '/admin' : '/');
        } catch (error) {
          console.error('Error processing auth callback:', error);
          navigate('/signin?error=callback_failed');
        }
      } else {
        navigate('/signin?error=missing_params');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="auth-callback">
      <div className="auth-callback-content">
        <h2>Signing you in...</h2>
        <div className="loading-spinner"></div>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}