import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('Authentication error:', error);
        alert('Authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));

          // Store authentication data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('role', user.role);

          console.log('✅ Google authentication successful:', user);

          // Redirect based on role
          const roleLower = String(user.role).toLowerCase().trim();
          if (roleLower.includes("admin")) {
            navigate("/admin/media");
          } else if (roleLower.includes("photographer")) {
            navigate("/photographer/dashboard");
          } else {
            navigate("/buyer/dashboard");
          }
        } catch (error) {
          console.error('Error processing authentication data:', error);
          alert('Authentication failed. Please try again.');
          navigate('/login');
        }
      } else {
        console.error('Missing authentication data');
        alert('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="text-center">
        <div className="spinner-border text-light mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="text-white mb-2">Completing Sign In</h4>
        <p className="text-white-50">Please wait while we set up your account...</p>
      </div>
    </div>
  );
};

export default AuthCallback;