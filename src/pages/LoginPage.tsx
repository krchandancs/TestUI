/**
 * LoginPage.tsx — src/pages/LoginPage.tsx
 * Public route — shown when the user is not authenticated.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pathscribe.css';
import { useAuth } from '../contexts/AuthContext';

const EyeIcon: React.FC<{ open: boolean }> = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#00A4EF" d="M13 1h10v10H13z"/>
    <path fill="#7FBA00" d="M1 13h10v10H1z"/>
    <path fill="#FFB900" d="M13 13h10v10H13z"/>
  </svg>
);

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError('');
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      navigate('/', { replace: true });
    } else {
      setError('Incorrect email or password. Please try again.');
    }
  };

  return (
    <div className="ps-login-page">
      <div className="ps-login-bg" aria-hidden="true" />

      <div className="ps-login-wrap">
        <div className="ps-login-card">

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            {/* ForMedrix — dominant */}
            <img src="/formedrix-logo.svg" alt="ForMedrix AI"
              style={{ height: 90, display: 'block', margin: '0 auto' }} />

            {/* PathScribe product logo */}
            <div style={{ marginTop: 18, marginBottom: 6 }}>
              <img src="/pathscribe-logo-clean.svg" alt="PathScribe"
                style={{ height: 44, display: 'block', margin: '0 auto' }} />
            </div>

            {/* Descriptor */}
            <div style={{ fontSize: 13, color: '#64748b', letterSpacing: '0.03em', marginTop: 8 }}>
              Clinical Pathology Reporting
            </div>

            {/* Version */}
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>v0.9.0</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="ps-login-field" style={{ marginTop: 8 }}>
              <label className="ps-login-field-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                className="ps-login-input"
              />
            </div>

            <div className="ps-login-field">
              <label className="ps-login-field-label">Password</label>
              <div className="ps-login-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="ps-login-input"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="ps-login-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 7,
                background: '#fef2f2', border: '1px solid #fecaca',
                fontSize: 13, color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="ps-login-submit">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <a href="#" className="ps-login-forgot" onClick={e => e.preventDefault()}>
              Forgot password?
            </a>
          </form>

          {/* Social */}
          <div className="ps-login-divider">
            <div className="ps-login-divider-line" />
            <span className="ps-login-divider-text">or continue with</span>
            <div className="ps-login-divider-line" />
          </div>

          <button type="button" className="ps-login-social">
            <GoogleIcon /> Google
          </button>
          <button type="button" className="ps-login-social">
            <MicrosoftIcon /> Microsoft
          </button>

          <p className="ps-login-footer-text">
            Your credentials are never stored by ForMedrix AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
