import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import {auth} from './Firebase';
import './Login.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError(null);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate('/Booking');
    } catch (error) {
      console.error("Error logging in:", error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      navigate('/bookings');
    } catch (error) {
      console.error("Error registering:", error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!form.email) {
      setError('Please enter your email to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email);
      setError('Password reset email sent. Please check your inbox.');
    } catch (error) {
      console.error("Error resetting password:", error);
      setError('Failed to send reset email.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegister ? 'Sign up to get started' : 'Log in to continue'}</p>
        </div>

        <div className="login-form">
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="login-input"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="login-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="login-actions">
            {!isRegister ? (
              <>
                <button 
                  onClick={handleLogin} 
                  disabled={loading}
                  className="login-button"
                >
                  {loading ? 'Logging In...' : 'Log In'}
                </button>
                <div className="login-links">
                  <span onClick={handleResetPassword}>Forgot Password?</span>
                  <span onClick={() => setIsRegister(true)}>Create Account</span>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={handleRegister} 
                  disabled={loading}
                  className="login-button"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
                <div className="login-links">
                  <span onClick={() => setIsRegister(false)}>Already have an account?</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
