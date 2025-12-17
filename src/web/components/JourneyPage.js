import React from 'react';
import { Platform } from 'react-native';
import { motion } from 'framer-motion';

export default function JourneyPage({ onBack }) {
  if (Platform.OS !== 'web') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: '#000000',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
    }}>
      {/* Background gradient */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.65, 0.05, 0, 1] }}
        onClick={onBack}
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50px',
          padding: '14px 28px',
          color: '#FFFFFF',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 100,
          backdropFilter: 'blur(10px)',
        }}
        whileHover={{ background: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.95 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </motion.button>

      {/* Main content - centered */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
        style={{
          textAlign: 'center',
          width: '90%',
          maxWidth: '600px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.65, 0.05, 0, 1] }}
          style={{
            fontSize: 'clamp(40px, 10vw, 64px)',
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: '16px',
            lineHeight: 1.1,
          }}
        >
          Get the App
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.65, 0.05, 0, 1] }}
          style={{
            fontSize: 'clamp(16px, 3vw, 20px)',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '40px',
            lineHeight: 1.5,
          }}
        >
          Download Workout Wave on your device
        </motion.p>

        {/* Official App Store Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.65, 0.05, 0, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
          }}
        >
          {/* App Store Badge - Official */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'block', position: 'relative' }}
          >
            <img
              src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
              alt="Download on the App Store"
              style={{ height: '60px', width: 'auto' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
            }}>
              Coming Soon
            </div>
          </motion.a>

          {/* Google Play Badge - Official */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'block', position: 'relative', marginTop: '10px' }}
          >
            <img
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              alt="Get it on Google Play"
              style={{ height: '90px', width: 'auto', marginTop: '-15px', marginBottom: '-15px' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
            }}>
              Coming Soon
            </div>
          </motion.a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.4)',
            marginTop: '60px',
          }}
        >
          Available on iOS and Android
        </motion.p>
      </motion.div>

      {/* Global styles */}
      <style>{`
        html, body, #root {
          background: #000000 !important;
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}
