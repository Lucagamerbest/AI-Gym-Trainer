import React from 'react';
import { Platform } from 'react-native';
import { motion } from 'framer-motion';

// Infinite marquee component
const InfiniteMarquee = ({ items, direction = 'left', speed = 30 }) => {
  const duplicatedItems = [...items, ...items, ...items]; // Triple for seamless loop

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

export default function MarqueeSection() {
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
      padding: '80px 0',
      background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)',
      overflow: 'hidden',
    }}>
      <InfiniteMarquee items={topItems} direction="left" speed={40} />
      <div style={{ height: '20px' }} />
      <InfiniteMarquee items={bottomItems} direction="right" speed={35} />
    </section>
  );
}
