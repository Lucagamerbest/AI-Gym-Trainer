import React, { useRef, useState } from 'react';
import { Platform } from 'react-native';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

// Text reveal animation with clip-path (Lando Norris style)
const RevealText = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.65, 0.05, 0, 1], // Lando Norris cubic-bezier
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Split text animation - each word reveals separately
const SplitRevealText = ({ text, delay = 0, style = {} }) => {
  const words = text.split(' ');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', gap: '0 12px', ...style }}>
      {words.map((word, i) => (
        <div key={i} style={{ overflow: 'hidden' }}>
          <motion.span
            initial={{ y: '110%', rotateX: -45 }}
            animate={isInView ? { y: 0, rotateX: 0 } : { y: '110%', rotateX: -45 }}
            transition={{
              duration: 0.75,
              delay: delay + i * 0.08,
              ease: [0.65, 0.05, 0, 1],
            }}
            style={{ display: 'inline-block', transformOrigin: 'top' }}
          >
            {word}
          </motion.span>
        </div>
      ))}
    </div>
  );
};

// Magnetic button effect
const MagneticButton = ({ children, onClick, primary = false }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.3;
    const y = (clientY - top - height / 2) * 0.3;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const buttonStyle = {
    padding: primary ? '20px 48px' : '18px 40px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '60px',
    cursor: 'pointer',
    border: 'none',
    position: 'relative',
    overflow: 'hidden',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    ...(primary ? {
      background: '#FFFFFF',
      color: '#000000',
    } : {
      background: 'transparent',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    }),
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      style={buttonStyle}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: 1.05,
        boxShadow: primary ? '0 0 40px rgba(255,255,255,0.3)' : 'none',
      }}
      whileTap={{ scale: 0.95 }}
    >
      {primary && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      {primary && (
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ position: 'relative', zIndex: 1 }}
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </motion.svg>
      )}
    </motion.button>
  );
};

// Parallax image/video container
const ParallaxContainer = ({ children, speed = 0.5 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
};

// Feature highlight item for hero section
const FeatureHighlightItem = ({ title, description, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
      style={{
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <div style={{
        fontSize: 'clamp(28px, 4vw, 42px)',
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: '8px',
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '15px',
        color: 'rgba(255,255,255,0.4)',
      }}>
        {description}
      </div>
    </motion.div>
  );
};

export default function HeroSection({ onGetStarted, onLearnMore }) {
  if (Platform.OS !== 'web') return null;

  return (
    <section style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Main hero content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '120px 5vw 80px',
        textAlign: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Eyebrow text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <motion.div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#8B5CF6',
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            fontWeight: '500',
          }}>
            The Future of Fitness
          </span>
        </motion.div>

        {/* Main title with split reveal */}
        <div style={{
          fontSize: 'clamp(42px, 10vw, 120px)',
          fontWeight: '800',
          lineHeight: 0.95,
          marginBottom: '32px',
          color: '#FFFFFF',
        }}>
          <RevealText delay={0.4}>
            <span style={{ display: 'block' }}>Transform Your</span>
          </RevealText>
          <RevealText delay={0.5}>
            <span style={{
              display: 'block',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #8B5CF6 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient 4s linear infinite',
            }}>
              Fitness Journey
            </span>
          </RevealText>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            lineHeight: 1.7,
            marginBottom: '48px',
          }}
        >
          Track workouts, log nutrition, and crush your goals with an
          AI-powered coach that adapts to you.
        </motion.p>

        {/* Explore Features Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <MagneticButton onClick={onLearnMore}>
            Explore Features
          </MagneticButton>
        </motion.div>

        {/* App Store Badges - Official Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '40px',
            flexWrap: 'wrap',
          }}
        >
          {/* App Store Badge - Official */}
          <motion.a
            href="#"
            onClick={(e) => { e.preventDefault(); onGetStarted(); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'block' }}
          >
            <img
              src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
              alt="Download on the App Store"
              style={{ height: '70px', width: 'auto' }}
            />
          </motion.a>

          {/* Google Play Badge - Official */}
          <motion.a
            href="#"
            onClick={(e) => { e.preventDefault(); onGetStarted(); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'block' }}
          >
            <img
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              alt="Get it on Google Play"
              style={{ height: '104px', width: 'auto', marginTop: '-17px', marginBottom: '-17px' }}
            />
          </motion.a>
        </motion.div>
      </div>

      {/* Feature highlights bar - full width */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8, ease: [0.65, 0.05, 0, 1] }}
        style={{
          width: '100%',
          padding: '60px 5vw',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <FeatureHighlightItem
          title="Voice Logging"
          description="Speak your sets, hands-free"
          delay={1.4}
        />
        <FeatureHighlightItem
          title="AI Recipes"
          description="Custom meals for your macros"
          delay={1.5}
        />
        <FeatureHighlightItem
          title="Smart Import"
          description="Screenshot to workout plan"
          delay={1.6}
        />
        <FeatureHighlightItem
          title="3D Muscle Map"
          description="See what you're training"
          delay={1.7}
        />
      </motion.div>

      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </section>
  );
}
