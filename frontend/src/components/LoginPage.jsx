import { useState } from 'react';
import { api } from '../utils/api';
import { Mail, Lock, AlertTriangle, KeyRound, Info, ArrowLeft, Eye, EyeOff, User } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState(1); // 1 = Credentials, 2 = 2FA, 3 = Backup Code, 4 = Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Visual states
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email.trim() || !password) {
      setLoading(false);
      return setError('Please enter both email and password.');
    }

    try {
      const response = await api.login({
        email: email.trim().toLowerCase(),
        password: password
      });

      setSuccess(response.message || 'Credentials verified. Check your email for the verification code.');
      setStep(2); // Progress to 2FA verification step
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!code.trim() || code.trim().length !== 6) {
      setLoading(false);
      return setError('Please enter a valid 6-digit verification code.');
    }

    try {
      const session = await api.verify2fa({
        email: email.trim().toLowerCase(),
        code: code.trim()
      });

      // Set session and token in sessionStorage (or localStorage if Remember Me checked)
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('ih_token', session.token);
      storage.setItem('ih_user_email', session.email);
      storage.setItem('ih_user_name', session.name);

      // Trigger redirect to Dashboard
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!backupCode.trim()) {
      setLoading(false);
      return setError('Please enter your emergency backup recovery code.');
    }

    // Standard static fallback verification code for simulation purposes
    if (backupCode.trim() === 'BACKUP-RECOVERY-CODE-2026') {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('ih_token', 'mock-jwt-session-token-via-backup');
      storage.setItem('ih_user_email', 'admin@inventoryhub.com');
      storage.setItem('ih_user_name', 'Administrator (Backup Session)');
      
      onLoginSuccess();
    } else {
      setError('Invalid backup recovery code. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep(1);
    setCode('');
    setBackupCode('');
    setError('');
    setSuccess('');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (regPassword.length < 6) {
      setLoading(false);
      return setError('Password must be at least 6 characters in length.');
    }

    if (regPassword !== regConfirmPassword) {
      setLoading(false);
      return setError('Passwords do not match. Please verify your inputs.');
    }

    try {
      const response = await api.register({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword
      });

      setSuccess(response.message || 'Account created successfully! You can now sign in.');
      setStep(1); // Redirect back to sign-in card
      setEmail(regEmail.trim().toLowerCase());
      setPassword('');
      // Clear forms
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">


      {/* 1. Top Branding Section */}
      <div className="login-brand-header text-center animate-fade-in">
        <div className="login-logo-circle">
          <svg className="shield-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 11 11 13 15 9"></polyline>
          </svg>
        </div>
        <h1 className="login-brand-title">
          Inventory<span className="logo-subtext">Hub</span>
        </h1>
        <p className="login-brand-subtitle">SECURE BUSINESS DASHBOARD PORTAL</p>
      </div>

      {/* 2. Main Authentication Card */}
      <div className="login-card-wrapper animate-fade-in">
        <div className="glass-card login-form-card">
          
          {step === 1 && (
            /* ================= STEP 1: CREDENTIALS ================= */
            <form onSubmit={handleCredentialsSubmit}>
              {/* 3. Welcome Section */}
              <div className="welcome-message-block text-center mb-4">
                <h2 className="welcome-heading">Welcome to InventoryHub</h2>
                <p className="welcome-body mt-2">
                  Securely manage products, inventory, customers, and orders from one centralized platform.
                </p>
              </div>

              <div className="card-divider"></div>

              {error && (
                <div className="alert alert-danger py-2 mb-4">
                  <AlertTriangle size={16} />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {/* 4. Email Field */}
              <div className="form-group mb-4">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tejaswini@gmail.com"
                    className="form-input icon-padded"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 5. Password Field with show/hide toggle */}
              <div className="form-group mb-4">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input icon-padded pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 6. Security & Session Row (Horizontal alignment of Remember Me and Forgot Password) */}
              <div className="security-session-row mb-5">
                <label className="checkbox-label-wrapper">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="hidden-checkbox"
                  />
                  <div className={`custom-checkbox-box ${rememberMe ? 'checked' : ''}`}>
                    {rememberMe && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="checkbox-checkmark-svg">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="checkbox-text">Remember me</span>
                </label>

                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your administrator to reset your password.'); }} className="forgot-link">
                  Forgot Password?
                </a>
              </div>

              {/* 7. Primary Action Button */}
              <button
                type="submit"
                className="btn btn-primary w-full py-4 sign-in-action"
                disabled={loading}
              >
                <Lock size={16} className="button-icon-svg" />
                <span>{loading ? 'Verifying Identity...' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {step === 2 && (
            /* ================= STEP 2: 2FA VERIFICATION ================= */
            <form onSubmit={handle2FASubmit}>
              <div className="welcome-message-block text-center mb-5 auth-step-heading">
                <div className="auth-step-title">
                  <button type="button" onClick={handleBackToLogin} className="btn-back-link flex-center text-muted" title="Back to Login" aria-label="Back to login">
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="welcome-heading mb-0">Two-Factor Authentication</h2>
                </div>
                <p className="welcome-body mt-2">
                  For enhanced account protection, we have sent a 6-digit verification code to <strong className="text-dark-teal">{email}</strong>. Please enter the code below to complete your login.
                </p>
              </div>

              <div className="card-divider"></div>

              {error && (
                <div className="alert alert-danger py-3 mb-4">
                  <AlertTriangle size={16} />
                  <span className="text-xs">{error}</span>
                </div>
              )}
              {success && (
                <div className="alert alert-success py-3 mb-4">
                  <Info size={16} className="text-emerald" />
                  <span className="text-xs">{success}</span>
                </div>
              )}

              <div className="form-group text-center mb-5">
                <label className="form-label text-center block mb-2">Enter 6-Digit Code</label>
                <div className="input-with-icon max-w-xs mx-auto">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="form-input text-center letter-spaced icon-padded"
                    required
                    disabled={loading}
                  />
                </div>
                
              </div>

              <div className="auth-primary-actions mt-6">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="btn btn-outline py-3 px-4"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary py-3 px-2"
                  disabled={loading}
                >
                  <span>Verify</span>
                </button>
              </div>
              <div className="auth-secondary-actions">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setSuccess('');
                    setResending(true);
                    try {
                      const response = await api.login({ email, password });
                      setSuccess(response.message || 'Verification code resent successfully.');
                    } catch (err) {
                      setError(err.message || 'Failed to resend code.');
                    } finally {
                      setResending(false);
                    }
                  }}
                  className="btn-resend"
                  disabled={loading || resending}
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            /* ================= STEP 3: BACKUP CODE ================= */
            <form onSubmit={handleBackupSubmit}>
              <div className="welcome-message-block text-center mb-5 auth-step-heading">
                <div className="auth-step-title">
                  <button type="button" onClick={handleBackToLogin} className="btn-back-link flex-center text-muted" title="Back to Login" aria-label="Back to login">
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="welcome-heading mb-0">Use Backup Code</h2>
                </div>
                <p className="welcome-body mt-2">
                  If you lost access to your secondary verification device, you can gain immediate access using your 24-character backup recovery code.
                </p>
              </div>

              <div className="card-divider"></div>

              {error && (
                <div className="alert alert-danger py-3 mb-4">
                  <AlertTriangle size={16} />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              <div className="form-group mb-5">
                <label className="form-label">Recovery Backup Code</label>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value)}
                    placeholder="BACKUP-RECOVERY-CODE-2026"
                    className="form-input icon-padded font-mono text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex-between gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="btn btn-outline w-1/3 py-4"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-grow py-4"
                  disabled={loading}
                >
                  <span>Verify Recovery Code</span>
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            /* ================= STEP 4: REGISTER / SIGN UP ================= */
            <form onSubmit={handleRegisterSubmit}>
              {/* Welcome Section */}
              <div className="welcome-message-block text-center mb-4">
                <h2 className="welcome-heading">Create Account</h2>
                <p className="welcome-body mt-2">
                  Sign up for a secure account to manage your business dashboard.
                </p>
              </div>

              <div className="card-divider"></div>

              {error && (
                <div className="alert alert-danger py-2 mb-4">
                  <AlertTriangle size={16} />
                  <span className="text-xs">{error}</span>
                </div>
              )}
              {success && (
                <div className="alert alert-success py-2 mb-4">
                  <Info size={16} className="text-emerald" />
                  <span className="text-xs">{success}</span>
                </div>
              )}

              {/* Name Field */}
              <div className="form-group mb-4">
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter your name"
                    className="form-input icon-padded"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="form-group mb-4">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="form-input icon-padded"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group mb-4">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="form-input icon-padded pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="password-toggle-btn"
                    title={showRegPassword ? "Hide Password" : "Show Password"}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="form-group mb-5">
                <label className="form-label">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input icon-padded pr-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-full py-4"
                disabled={loading}
              >
                <User size={16} className="button-icon-svg" />
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </form>
          )}
        </div>

        {/* 9. Footer Section */}
        <div className="login-footer text-center mt-6">
          <p className="footer-administrator-text">
            {step === 4 ? (
              <>
                Already have an account? <span className="green-link-action" onClick={handleBackToLogin}>Sign In</span>
              </>
            ) : (
              <>
                Don't have an account? <span className="green-link-action" onClick={() => { setStep(4); setError(''); setSuccess(''); }}>Sign Up</span>
              </>
            )}
          </p>
          <div className="footer-shield-logo mt-3">
            <svg className="mini-shield-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 11 11 13 15 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <style>{`
        .login-page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.5rem; /* Cozy margins on top and bottom when scrollable */
          background-color: var(--bg-primary);
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.02) 0%, transparent 50%);
          position: relative;
          overflow-y: auto; /* Graceful scroll fallback for high zoom levels (e.g. 200%) */
          width: 100%;
        }

        .btn-autofill {
          background: var(--accent-indigo);
          border: none;
          color: white;
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background var(--transition-fast);
        }

        .btn-autofill:hover {
          background: var(--accent-violet);
        }

        .auth-step-heading {
          position: relative;
        }

        .auth-step-title {
          align-items: center;
          display: flex;
          justify-content: center;
          min-height: 2rem;
          position: relative;
        }

        .auth-step-title .btn-back-link {
          left: 0;
          position: absolute;
        }

        .auth-primary-actions {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.4fr);
        }

        .auth-secondary-actions {
          align-items: center;
          color: var(--text-muted);
          display: flex;
          font-size: 0.8rem;
          gap: 0.35rem;
          justify-content: center;
          margin-top: 1rem;
        }

        .btn-resend {
          background: transparent;
          border: 0;
          color: var(--accent-indigo);
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.25rem;
        }

        .btn-resend:hover {
          text-decoration: underline;
        }

        .btn-resend:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        /* Top Branding */
        .login-brand-header {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .login-logo-circle {
          width: 3rem;
          height: 3rem;
          background: var(--accent-indigo);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
          margin-bottom: 0.75rem;
        }

        .shield-check-icon {
          width: 1.6rem;
          height: 1.6rem;
        }

        .login-brand-title {
          font-family: var(--font-heading);
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #0f172a;
          margin-bottom: 0.15rem;
        }

        .logo-subtext {
          color: var(--accent-indigo);
          font-weight: 800;
        }

        .login-brand-subtitle {
          color: #64748b;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 0.25rem;
        }

        /* Card Container (Centered, professional compact width) */
        .login-card-wrapper {
          width: 100%;
          max-width: 480px; /* Highly polished, elegant compact width */
          margin-bottom: 1rem;
        }

        .login-form-card {
          padding: 2.25rem 2.5rem !important; /* Balanced, compact padding */
          background: #ffffff !important;
          border-radius: 1.25rem !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: var(--shadow-lg) !important;
        }

        /* Welcome Message */
        .welcome-heading {
          font-size: 1.5rem; /* Balanced size for compact card */
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        .welcome-body {
          color: #475569;
          font-size: 0.875rem;
          line-height: 1.5;
          max-width: 100%;
          margin-left: auto;
          margin-right: auto;
        }

        .card-divider {
          border: 0;
          height: 1px;
          background-color: #f1f5f9;
          margin-top: 1.25rem;
          margin-bottom: 1.5rem;
        }

        /* Inputs and labels */
        .form-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 0.5rem;
          display: block;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1.25rem;
          color: var(--accent-indigo);
          pointer-events: none;
        }

        .icon-padded {
          padding-left: 3.25rem !important;
          width: 100%;
          height: 3rem;
          font-size: 0.95rem !important;
          border-radius: 8px !important;
          background: #f8fafc !important;
          border: 1.2px solid #e2e8f0 !important;
          color: var(--text-primary) !important;
          transition: all var(--transition-fast) !important;
          outline: none !important;
        }

        .icon-padded:focus {
          background: #ffffff !important;
          border-color: var(--accent-indigo) !important;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15) !important;
        }

        .password-toggle-btn {
          position: absolute;
          right: 1.25rem;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color var(--transition-fast);
        }

        .password-toggle-btn:hover {
          color: var(--accent-indigo);
        }

        .forgot-link {
          color: var(--accent-indigo);
          font-size: 0.825rem;
          font-weight: 600;
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .forgot-link:hover {
          color: var(--accent-violet);
          text-decoration: underline;
        }

        /* Custom Checkbox & Forgot Password Row */
        .security-session-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .sign-in-action {
          margin-top: 0.5rem;
        }

        .checkbox-label-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .hidden-checkbox {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          margin: 0;
        }

        .custom-checkbox-box {
          width: 1.15rem;
          height: 1.15rem;
          border-radius: 4px;
          border: 1.5px solid #cbd5e1;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .checkbox-label-wrapper:hover .custom-checkbox-box {
          border-color: var(--accent-indigo);
        }

        .custom-checkbox-box.checked {
          background-color: var(--accent-indigo);
          border-color: var(--accent-indigo);
        }

        .checkbox-checkmark-svg {
          width: 0.7rem;
          height: 0.7rem;
          color: #ffffff;
        }

        .checkbox-text {
          font-size: 0.85rem;
          color: #475569;
          font-weight: 500;
          user-select: none;
        }

        /* Buttons & Actions */
        .button-icon-svg {
          color: currentColor;
        }

        .btn-primary {
          background: var(--accent-gradient) !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 1rem !important;
          height: 3rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.625rem !important;
          cursor: pointer !important;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.18) !important;
          transition: all var(--transition-normal) !important;
        }

        .btn-primary:hover {
          background: var(--accent-gradient) !important;
          box-shadow: 0 6px 14px rgba(79, 70, 229, 0.25) !important;
          transform: translateY(-1px) !important;
        }

        .btn-primary:active {
          transform: translateY(0) !important;
        }

        .btn-primary:focus {
          outline: none !important;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.25) !important;
        }

        .btn-outline {
          background: #ffffff !important;
          border: 1px solid var(--accent-indigo) !important;
          color: var(--accent-indigo) !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          height: 3rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.625rem !important;
          cursor: pointer !important;
          box-shadow: var(--shadow-sm) !important;
          transition: all var(--transition-normal) !important;
        }

        .btn-outline:hover {
          background: rgba(79, 70, 229, 0.04) !important;
          border-color: var(--accent-violet) !important;
          color: var(--accent-violet) !important;
        }

        /* Back Link styles */
        .btn-back-link {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 50%;
          transition: background var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-back-link:hover {
          background: rgba(79, 70, 229, 0.05);
        }

        /* Footer Section */
        .login-footer {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .footer-administrator-text {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 550;
        }

        .green-link-action {
          color: var(--accent-indigo);
          font-weight: 600;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .green-link-action:hover {
          color: var(--accent-violet);
          text-decoration: underline;
        }

        .footer-shield-logo {
          display: flex;
          justify-content: center;
        }

        .mini-shield-svg {
          width: 1.15rem;
          height: 1.15rem;
          color: #cbd5e1;
        }

        /* Alignment Utilities */
        .w-full { width: 100%; }
        .w-1/3 { width: 33.333%; }
        .flex-grow { flex-grow: 1; }
        .max-w-xs { max-w: 20rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .text-emerald { color: var(--success); }
        .font-mono { font-family: monospace; }
        .text-sm { font-size: 0.875rem; }
        .letter-spaced {
          letter-spacing: 0.25em;
          font-size: 1.25rem !important;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .login-form-card {
            padding: 2rem 1.5rem !important;
          }
          .login-brand-title {
            font-size: 1.85rem;
          }
          .welcome-heading {
            font-size: 1.35rem;
          }
          .auth-step-title {
            padding: 0 2rem;
          }
          .auth-primary-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
