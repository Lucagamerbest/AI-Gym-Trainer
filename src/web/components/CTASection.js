import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { motion, useInView } from 'framer-motion';

export default function CTASection({ onGetStarted, isMobile = false }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  if (Platform.OS !== 'web') return null;

  // Mobile: simplified static version
  if (isMobile) {
    return (
      <section
        style={{
          padding: '80px 20px',
          position: 'relative',
          overflow: 'hidden',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Static gradient background on mobile */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6' }} />
            <span style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              Start Today
            </span>
          </div>

          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#FFFFFF',
            lineHeight: 1.1,
            marginBottom: '20px',
          }}>
            Ready to{' '}
            <span style={{
              background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Level Up
            </span>
            ?
          </h2>

          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '32px',
            lineHeight: 1.6,
          }}>
            Voice logging, AI coaching, and smart workout imports.
          </p>

          <button
            onClick={onGetStarted}
            style={{
              background: '#FFFFFF',
              color: '#000000',
              border: 'none',
              padding: '16px 36px',
              borderRadius: '60px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Launch App
          </button>

          {/* Feature tags */}
          <div style={{
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            {['Voice', 'AI Recipes', 'Import', '3D Map'].map((feature, index) => (
              <div
                key={index}
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  padding: '8px 16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      style={{
        padding: '160px 5vw',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Background gradient orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#8B5CF6',
          }} />
          <span style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '3px',
          }}>
            Start Today
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.65, 0.05, 0, 1] }}
          style={{
            fontSize: 'clamp(40px, 8vw, 80px)',
            fontWeight: '800',
            color: '#FFFFFF',
            lineHeight: 1.05,
            marginBottom: '32px',
          }}
        >
          Ready to{' '}
          <span style={{
            background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Level Up
          </span>
          ?
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.65, 0.05, 0, 1] }}
          style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '48px',
            lineHeight: 1.7,
            maxWidth: '500px',
            margin: '0 auto 48px',
          }}
        >
          Voice logging, AI coaching, and smart workout imports. Your fitness journey starts here.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.65, 0.05, 0, 1] }}
        >
          <motion.button
            onClick={onGetStarted}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: '#FFFFFF',
              color: '#000000',
              border: 'none',
              padding: '20px 48px',
              borderRadius: '60px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Launch App
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </motion.button>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            marginTop: '64px',
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
            flexWrap: 'wrap',
          }}
        >
          {[
            'Voice Logging',
            'AI Recipes',
            'Smart Import',
            '3D Muscle Map',
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                padding: '12px 24px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '30px',
              }}
            >
              {feature}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
