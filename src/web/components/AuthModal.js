import React, { useState } from 'react';
import { Platform } from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';
import { webAuth } from '../config/firebaseWeb';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (Platform.OS !== 'web' || !isOpen) return null;

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await webAuth.signInWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        result = await webAuth.createAccountWithEmail(email, password, displayName);
      }

      if (result.success) {
        onSuccess?.(result.user);
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await webAuth.signInWithGoogle();
      if (result.success) {
        onSuccess?.(result.user);
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }

    setIsLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    fontSize: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.65, 0.05, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111111',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '440px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '28px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none" style={{ marginBottom: '16px' }}>
            <defs>
              <linearGradient id="authWaveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="15" stroke="url(#authWaveGradient)" strokeWidth="2" fill="none" />
            <path
              d="M6 16 Q10 10, 14 16 T22 16 T26 16"
              stroke="url(#authWaveGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#FFFFFF',
            margin: 0,
          }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '8px',
          }}>
            {mode === 'login' ? 'Sign in to your Workout Wave account' : 'Start your fitness journey today'}
          </p>
        </div>

        {/* Google Sign In */}
        <motion.button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            ...buttonStyle,
            background: '#FFFFFF',
            color: '#000000',
            marginBottom: '20px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </motion.button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth}>
          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#EF4444',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            style={{
              ...buttonStyle,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
              color: '#FFFFFF',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#FFFFFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </motion.button>
        </form>

        {/* Toggle Mode */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#8B5CF6',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        {/* Spinner keyframes */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}
