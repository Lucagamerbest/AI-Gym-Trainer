import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, ScrollView } from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';

// Import sections
import AnimatedBackground from './components/AnimatedBackground';
import HeroSection from './components/HeroSection';
import MarqueeSection from './components/MarqueeSection';
import ScreenshotShowcase from './components/ScreenshotShowcase';
import FeaturesSection from './components/FeaturesSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import JourneyPage from './components/JourneyPage';
import AuthPage from './components/AuthPage';
import WebDashboard from './components/WebDashboard';
import { webAuth } from './config/firebaseWeb';

// Navigation bar - minimal design
const NavBar = ({ onLogin, user, onSignOut, onGoToDashboard }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return;

    const handleClickOutside = () => setShowProfileMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileMenu]);

  if (Platform.OS !== 'web') return null;

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.65, 0.05, 0, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: scrolled ? '16px 5vw' : '24px 5vw',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: scrolled ? 'rgba(0, 0, 0, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.65, 0.05, 0, 1)',
      }}
    >
      {/* Logo */}
      <motion.div
        whileHover={{ opacity: 0.7 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Wave Logo */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" stroke="url(#waveGradient)" strokeWidth="2" fill="none" />
          <path
            d="M6 16 Q10 10, 14 16 T22 16 T26 16"
            stroke="url(#waveGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#FFFFFF',
          letterSpacing: '0.5px',
        }}>
          Workout Wave
        </span>
      </motion.div>

      {/* Nav links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {user ? (
          <div style={{ position: 'relative' }}>
            {/* User profile button - opens dropdown */}
            <motion.div
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '8px',
                background: showProfileMenu ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                  }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}>
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span style={{
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
                style={{
                  transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </motion.div>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '8px',
                    minWidth: '180px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Dashboard option */}
                  <motion.button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onGoToDashboard();
                    }}
                    whileHover={{ background: 'rgba(139, 92, 246, 0.2)' }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </motion.button>

                  {/* Divider */}
                  <div style={{
                    height: '1px',
                    background: 'rgba(255,255,255,0.1)',
                    margin: '4px 0',
                  }} />

                  {/* Sign Out option */}
                  <motion.button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSignOut();
                    }}
                    whileHover={{ background: 'rgba(239, 68, 68, 0.2)' }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#EF4444',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease: [0.65, 0.05, 0, 1] }}
            onClick={onLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              fontWeight: '500',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            whileHover={{ color: '#FFFFFF' }}
          >
            Sign Up or Login
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
};

// Loading screen - minimal design
const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress from 0 to 100
    const duration = 1800;
    const steps = 60;
    const increment = 100 / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= 100) {
        setProgress(100);
        clearInterval(interval);
        setTimeout(onComplete, 200);
      } else {
        setProgress(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (Platform.OS !== 'web') return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Logo text with reveal animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.65, 0.05, 0, 1] }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '48px',
          }}
        >
          {/* Wave Logo */}
          <motion.svg
            width="40"
            height="40"
            viewBox="0 0 32 32"
            fill="none"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <defs>
              <linearGradient id="loadingWaveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="15" stroke="url(#loadingWaveGradient)" strokeWidth="2" fill="none" />
            <path
              d="M6 16 Q10 10, 14 16 T22 16 T26 16"
              stroke="url(#loadingWaveGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </motion.svg>
          <span style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: '2px',
          }}>
            Workout Wave
          </span>
        </motion.div>

        {/* Progress counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '72px',
            fontWeight: '800',
            color: '#FFFFFF',
            fontFamily: '"Inter", -apple-system, sans-serif',
            marginBottom: '24px',
          }}
        >
          {progress}%
        </motion.div>

        {/* Progress bar */}
        <div style={{
          width: '200px',
          height: '2px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '1px',
          overflow: 'hidden',
          margin: '0 auto',
        }}>
          <motion.div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#8B5CF6',
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Download modal component
const DownloadModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.65, 0.05, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          borderRadius: '24px',
          padding: '48px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '24px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        <h2 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#FFFFFF',
          marginBottom: '12px',
        }}>
          Get the App
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '40px',
        }}>
          Download AI Gym Trainer on your device
        </p>

        {/* App Store buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {/* App Store */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: '#FFFFFF',
              color: '#000000',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            App Store
            <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>(Coming Soon)</span>
          </motion.a>

          {/* Google Play */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: 'transparent',
              color: '#FFFFFF',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
            </svg>
            Google Play
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>(Coming Soon)</span>
          </motion.a>
        </div>

        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.3)',
          marginTop: '32px',
        }}>
          Available on iOS and Android
        </p>
      </motion.div>
    </motion.div>
  );
};

export default function LandingPage({ onEnterApp }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showDownload, setShowDownload] = useState(false);
  const [showJourneyPage, setShowJourneyPage] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true); // Show dashboard by default when logged in

  // Listen for auth state changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const unsubscribe = webAuth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Only render on web
  if (Platform.OS !== 'web') {
    return null;
  }

  const handleGetStarted = () => {
    setShowJourneyPage(true);
  };

  const handleOpenApp = () => {
    setShowDownload(true);
  };

  const handleLogin = () => {
    setShowAuthPage(true);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
    setShowAuthPage(false);
    console.log('User authenticated:', user.email);
  };

  const handleSignOut = async () => {
    const result = await webAuth.signOut();
    if (result.success) {
      setCurrentUser(null);
      setShowDashboard(true); // Reset for next login
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Go to home/landing page (without signing out)
  const handleGoHome = () => {
    setShowDashboard(false);
  };

  // Go to dashboard
  const handleGoToDashboard = () => {
    setShowDashboard(true);
  };

  // Show Dashboard if user is logged in AND wants to see dashboard
  if (currentUser && !isLoading && showDashboard) {
    return (
      <WebDashboard
        user={currentUser}
        onSignOut={handleSignOut}
        onGoHome={handleGoHome}
      />
    );
  }

  // Show Auth Page
  if (showAuthPage && !isLoading) {
    return (
      <AuthPage
        onSuccess={handleAuthSuccess}
        onBack={() => setShowAuthPage(false)}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
    }}>
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {!isLoading && !showJourneyPage && (
        <>
          {/* Animated background */}
          <AnimatedBackground />

          {/* Navigation */}
          <NavBar onLogin={handleLogin} user={currentUser} onSignOut={handleSignOut} onGoToDashboard={handleGoToDashboard} />

          {/* Main content */}
          <main>
            {/* Hero Section */}
            <HeroSection
              onGetStarted={handleGetStarted}
              onLearnMore={scrollToFeatures}
            />

            {/* Marquee Section - scrolling text */}
            <MarqueeSection />

            {/* Screenshot Showcase with Feature Highlights */}
            <div id="features">
              <ScreenshotShowcase />
            </div>

            {/* Additional Features Grid */}
            <FeaturesSection />

            {/* CTA Section */}
            <CTASection onGetStarted={handleGetStarted} />

            {/* Footer */}
            <Footer />
          </main>
        </>
      )}

      {!isLoading && showJourneyPage && (
        <JourneyPage
          onBack={() => setShowJourneyPage(false)}
        />
      )}

      {/* Download Modal */}
      <AnimatePresence>
        {showDownload && (
          <DownloadModal isOpen={showDownload} onClose={() => setShowDownload(false)} />
        )}
      </AnimatePresence>

      {/* Global styles with Inter font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          background: #000000;
          color: #FFFFFF;
          overflow-x: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #8B5CF6;
        }

        ::selection {
          background: rgba(139, 92, 246, 0.4);
          color: #FFFFFF;
        }

        /* Smooth scroll behavior for Lenis-like effect */
        html.lenis {
          height: auto;
        }

        .lenis.lenis-smooth {
          scroll-behavior: auto;
        }

        /* Hide scrollbar for cleaner look on certain elements */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Gradient text animation keyframes */
        @keyframes gradient {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
