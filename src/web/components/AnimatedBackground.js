import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { motion } from 'framer-motion';

// Mobile detection hook - uses user agent for reliable detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
    const isSmallScreen = window.innerWidth < 900;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return isMobileUA || (isSmallScreen && hasTouch);
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 900;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileUA || (isSmallScreen && hasTouch));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Gradient orbs with subtle movement (desktop only)
const GradientOrb = ({ color, size, x, y, blur, delay, isMobile }) => {
  // Static version for mobile
  if (isMobile) {
    return (
      <div
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          filter: `blur(${blur}px)`,
          left: x,
          top: y,
          opacity: 0.4,
        }}
      />
    );
  }

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: `blur(${blur}px)`,
        left: x,
        top: y,
        opacity: 0.6,
      }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -20, 30, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration: 20,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

// Subtle grid pattern
const GridPattern = () => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
      `,
      backgroundSize: '80px 80px',
      maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
    }} />
  );
};

// Noise texture overlay
const NoiseOverlay = () => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      opacity: 0.03,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      pointerEvents: 'none',
    }} />
  );
};

export default function AnimatedBackground() {
  const isMobile = useIsMobile();

  if (Platform.OS !== 'web') return null;

  // Simplified background for mobile - just static gradients, no animations
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#000000',
        zIndex: -1,
      }}>
        {/* Simple static gradient for mobile */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)',
        }} />
        {/* Single static orb */}
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
          left: '50%',
          top: '30%',
          transform: 'translateX(-50%)',
          opacity: 0.5,
        }} />
        {/* Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      background: '#000000',
      zIndex: -1,
    }}>
      {/* Base gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
      }} />

      {/* Gradient orbs */}
      <GradientOrb
        color="radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)"
        size="600px"
        x="10%"
        y="20%"
        blur={80}
        delay={0}
        isMobile={false}
      />
      <GradientOrb
        color="radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)"
        size="500px"
        x="70%"
        y="60%"
        blur={100}
        delay={5}
        isMobile={false}
      />
      <GradientOrb
        color="radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)"
        size="400px"
        x="50%"
        y="80%"
        blur={80}
        delay={10}
        isMobile={false}
      />

      {/* Grid pattern */}
      <GridPattern />

      {/* Noise texture */}
      <NoiseOverlay />

      {/* Vignette effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
