import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { motion, useInView } from 'framer-motion';

// Feature card data - minimalist design
const features = [
  {
    number: '01',
    title: 'Voice Logging',
    description: 'Say "3 sets of 8 at 135" and watch it auto-log. Natural language workout tracking.',
    color: '#8B5CF6',
  },
  {
    number: '02',
    title: 'Import From Screenshots',
    description: 'Take a photo of any workout plan or recipe. AI parses and imports it instantly.',
    color: '#06B6D4',
  },
  {
    number: '03',
    title: '3D Muscle Visualization',
    description: 'See which muscles you\'re working with an interactive 3D body model.',
    color: '#10B981',
  },
  {
    number: '04',
    title: 'PR Tracking',
    description: 'Automatically detects and celebrates personal records. Never miss a milestone.',
    color: '#F59E0B',
  },
  {
    number: '05',
    title: 'Workout Programs',
    description: '50+ curated programs from PPL to Arnold\'s Golden Six. Or create your own.',
    color: '#EC4899',
  },
  {
    number: '06',
    title: 'Barcode Scanner',
    description: 'Scan food packages for instant nutrition data. Log meals in seconds.',
    color: '#8B5CF6',
  },
];

// Minimalist feature card - Lando Norris style
const FeatureCard = ({ feature, index, isMobile = false }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  // Mobile: static version
  if (isMobile) {
    return (
      <div
        style={{
          padding: '24px 0',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: feature.color,
            letterSpacing: '1px',
            minWidth: '32px',
          }}>
            {feature.number}
          </span>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: '6px',
            }}>
              {feature.title}
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.5,
            }}>
              {feature.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.65, 0.05, 0, 1],
      }}
      style={{
        padding: '40px 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr',
        gap: '32px',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* Number */}
        <motion.span
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: feature.color,
            letterSpacing: '2px',
          }}
        >
          {feature.number}
        </motion.span>

        {/* Content */}
        <div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: '8px',
          }}>
            {feature.title}
          </h3>
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6,
            maxWidth: '500px',
          }}>
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function FeaturesSection({ isMobile = false }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  if (Platform.OS !== 'web') return null;

  // Mobile: simplified layout
  if (isMobile) {
    return (
      <section style={{ padding: '60px 20px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            fontSize: '11px',
            color: '#8B5CF6',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '12px',
          }}>
            More Features
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#FFFFFF',
            lineHeight: 1.2,
          }}>
            Built for <span style={{ color: 'rgba(255,255,255,0.3)' }}>Serious</span> Athletes
          </h2>
        </div>
        <div>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} isMobile={true} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      style={{
        padding: '120px 5vw',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Section header - minimal style */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '80px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '40px',
      }}>
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
            style={{
              fontSize: '13px',
              color: '#8B5CF6',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              marginBottom: '20px',
            }}
          >
            More Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.65, 0.05, 0, 1] }}
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: '800',
              color: '#FFFFFF',
              lineHeight: 1.1,
            }}
          >
            Built for <span style={{ color: 'rgba(255,255,255,0.3)' }}>Serious</span> Athletes
          </motion.h2>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: '72px',
            fontWeight: '800',
            color: 'rgba(255,255,255,0.05)',
            lineHeight: 1,
          }}
        >
          06
        </motion.div>
      </div>

      {/* Features list */}
      <div>
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
