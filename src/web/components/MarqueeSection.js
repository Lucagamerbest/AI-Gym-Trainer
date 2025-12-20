import React from 'react';
import { Platform } from 'react-native';
import { motion } from 'framer-motion';

// Infinite marquee component - uses CSS animation on mobile for performance
const InfiniteMarquee = ({ items, direction = 'left', speed = 30, isMobile = false }) => {
  const duplicatedItems = [...items, ...items, ...items]; // Triple for seamless loop

  // CSS animation class name based on direction
  const animationClass = direction === 'left' ? 'marquee-left' : 'marquee-right';

  // Mobile: Use pure CSS animation (more performant)
  if (isMobile) {
    return (
      <div style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
      }}>
        <div
          className={animationClass}
          style={{
            display: 'inline-flex',
            gap: '30px',
            animation: `${animationClass} ${speed}s linear infinite`,
          }}
        >
          {duplicatedItems.map((item, index) => (
            <span
              key={index}
              style={{
                fontSize: '28px',
                fontWeight: '800',
                color: item.highlight ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                textTransform: 'uppercase',
                letterSpacing: '-1px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              {item.text}
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: item.highlight ? '#8B5CF6' : 'rgba(255,255,255,0.15)',
              }} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Desktop: Use framer-motion
  return (
    <div style={{
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
    }}>
      <motion.div
        animate={{
          x: direction === 'left' ? ['0%', '-33.33%'] : ['-33.33%', '0%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          display: 'inline-flex',
          gap: '60px',
        }}
      >
        {duplicatedItems.map((item, index) => (
          <span
            key={index}
            style={{
              fontSize: 'clamp(48px, 8vw, 120px)',
              fontWeight: '800',
              color: item.highlight ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
              textTransform: 'uppercase',
              letterSpacing: '-2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '40px',
            }}
          >
            {item.text}
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: item.highlight ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
            }} />
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default function MarqueeSection({ isMobile = false }) {
  if (Platform.OS !== 'web') return null;

  const topItems = [
    { text: 'Voice Logging', highlight: true },
    { text: 'AI Recipes', highlight: false },
    { text: 'Smart Import', highlight: true },
    { text: '3D Muscle Map', highlight: false },
  ];

  const bottomItems = [
    { text: 'Track Workouts', highlight: false },
    { text: 'Log Nutrition', highlight: true },
    { text: 'PR Tracking', highlight: false },
    { text: 'Progress Charts', highlight: true },
  ];

  return (
    <section style={{
      padding: isMobile ? '40px 0' : '80px 0',
      background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)',
      overflow: 'hidden',
    }}>
      <InfiniteMarquee items={topItems} direction="left" speed={isMobile ? 20 : 40} isMobile={isMobile} />
      <div style={{ height: isMobile ? '12px' : '20px' }} />
      <InfiniteMarquee items={bottomItems} direction="right" speed={isMobile ? 18 : 35} isMobile={isMobile} />

      {/* CSS keyframes for mobile animation */}
      {isMobile && (
        <style>{`
          @keyframes marquee-left {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-33.33%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-33.33%); }
            100% { transform: translateX(0%); }
          }
        `}</style>
      )}
    </section>
  );
}
