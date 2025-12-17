import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { motion, useInView } from 'framer-motion';

// Helper to get image URL from require() result
const getImageUrl = (src) => {
  if (!src) return null;
  // Handle different formats returned by require()
  if (typeof src === 'string') return src;
  if (typeof src === 'object') {
    // Expo/Metro bundler returns { uri: '...' } or { default: '...' }
    return src.uri || src.default || src;
  }
  return src;
};

// Phone mockup component
const PhoneMockup = ({ imageSrc, alt, index, isMain = false }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const imageUrl = getImageUrl(imageSrc);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100, rotateY: index % 2 === 0 ? -15 : 15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateY: 0 } : {}}
      transition={{
        duration: 1,
        delay: index * 0.15,
        ease: [0.65, 0.05, 0, 1],
      }}
      whileHover={{
        y: -20,
        scale: isMain ? 1.02 : 1.05,
        rotateY: 5,
        transition: { duration: 0.4 },
      }}
      style={{
        position: 'relative',
        width: isMain ? '320px' : '280px',
        height: isMain ? '650px' : '570px',
        borderRadius: '40px',
        background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
        padding: '12px',
        boxShadow: isMain
          ? '0 50px 100px -20px rgba(0,0,0,0.5), 0 0 60px rgba(139, 92, 246, 0.2)'
          : '0 30px 60px -15px rgba(0,0,0,0.4)',
        transform: 'perspective(1000px)',
        transformStyle: 'preserve-3d',
        flexShrink: 0,
      }}
    >
      {/* Notch */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120px',
        height: '30px',
        background: '#000',
        borderRadius: '0 0 20px 20px',
        zIndex: 10,
      }} />

      {/* Screen */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '32px',
        overflow: 'hidden',
        background: '#000',
      }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '14px',
          }}>
            Screenshot {index + 1}
          </div>
        )}
      </div>

      {/* Reflection */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '40px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
};

// Auto-scrolling horizontal gallery (marquee style)
const HorizontalGallery = ({ screenshots }) => {
  // Duplicate screenshots for seamless loop
  const duplicatedScreenshots = [...screenshots, ...screenshots];

  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        padding: '60px 0',
      }}
    >
      <motion.div
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          display: 'flex',
          gap: '40px',
          width: 'fit-content',
        }}
      >
        {duplicatedScreenshots.map((screenshot, index) => (
          <PhoneMockup
            key={index}
            index={index % screenshots.length}
            imageSrc={screenshot.src}
            alt={screenshot.alt}
            isMain={false}
          />
        ))}
      </motion.div>
    </div>
  );
};

// Feature highlight with screenshot
const FeatureHighlight = ({ title, description, features, imageSrc, imageAlt, reverse = false, accentColor = '#8B5CF6' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '80px',
        alignItems: 'center',
        padding: '100px 5vw',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.65, 0.05, 0, 1] }}
        style={{ order: reverse ? 2 : 1 }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: '60px' } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            height: '4px',
            background: accentColor,
            marginBottom: '24px',
            borderRadius: '2px',
          }}
        />

        <h3 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: '800',
          color: '#FFFFFF',
          marginBottom: '24px',
          lineHeight: 1.1,
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '18px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.7,
          marginBottom: '40px',
        }}>
          {description}
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: '4px' }}>
                  {feature.title}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                  {feature.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Screenshot */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? -50 : 50, rotateY: reverse ? 10 : -10 }}
        animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.65, 0.05, 0, 1] }}
        style={{
          order: reverse ? 1 : 2,
          display: 'flex',
          justifyContent: 'center',
          perspective: '1000px',
        }}
      >
        <PhoneMockup imageSrc={imageSrc} alt={imageAlt} index={0} isMain />
      </motion.div>
    </motion.div>
  );
};

// Testimonials data
const testimonials = [
  {
    name: 'Marcus Chen',
    role: 'Powerlifter • 3 years training',
    avatar: 'MC',
    text: 'The voice logging is a game changer. I just say my sets while resting and everything gets tracked. Hit a 405 deadlift PR last week and the app celebrated with me.',
    rating: 5,
  },
  {
    name: 'Sarah Mitchell',
    role: 'Personal Trainer • NASM Certified',
    avatar: 'SM',
    text: 'I recommend this to all my clients. The 3D muscle visualization helps them understand which muscles they\'re targeting. Plus the workout import feature saves me hours.',
    rating: 5,
  },
  {
    name: 'Jake Rodriguez',
    role: 'CrossFit Athlete',
    avatar: 'JR',
    text: 'Been using this for 6 months. The PR tracking keeps me motivated and the AI coach suggested deload weeks at exactly the right times. Best free fitness app out there.',
    rating: 5,
  },
  {
    name: 'Emma Thompson',
    role: 'Beginner • Started 4 months ago',
    avatar: 'ET',
    text: 'As someone new to lifting, the exercise library with form tips has been invaluable. I feel confident at the gym now. The nutrition tracking is also super easy.',
    rating: 5,
  },
];

// Testimonial card component
const TestimonialCard = ({ testimonial, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

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
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Stars */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {[...Array(testimonial.rating)].map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: '15px',
        lineHeight: 1.7,
        flex: 1,
      }}>
        "{testimonial.text}"
      </p>

      {/* Author */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: '700',
        }}>
          {testimonial.avatar}
        </div>
        <div>
          <div style={{
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: '14px',
          }}>
            {testimonial.name}
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
          }}>
            {testimonial.role}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Testimonials section
const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div
      ref={ref}
      style={{
        padding: '120px 5vw',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '60px',
      }}>
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
          Testimonials
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.65, 0.05, 0, 1] }}
          style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '800',
            color: '#FFFFFF',
            lineHeight: 1.1,
          }}
        >
          Loved by <span style={{ color: 'rgba(255,255,255,0.3)' }}>Athletes</span>
        </motion.h2>
      </div>

      {/* Testimonials grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
      }}>
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={index} testimonial={testimonial} index={index} />
        ))}
      </div>
    </div>
  );
};

// Import screenshots from assets folder (Expo bundles these properly)
const screenshots = {
  homepage: require('../../../assets/screenshots/homepage.jpg'),
  workoutpage: require('../../../assets/screenshots/workoutpage.jpg'),
  exercisedetail: require('../../../assets/screenshots/exercisedetail.jpg'),
  chart: require('../../../assets/screenshots/chart.jpg'),
  nutritionpage: require('../../../assets/screenshots/nutritionpage.jpg'),
  recipeai: require('../../../assets/screenshots/recipeai.jpg'),
  progressai: require('../../../assets/screenshots/progressai.jpg'),
  scanneditems: require('../../../assets/screenshots/scanneditems.jpg'),
  nutritioninsight: require('../../../assets/screenshots/nutritioninsight.jpg'),
  benchpress: require('../../../assets/screenshots/benchpress.jpg'),
  fastfoodrecipe: require('../../../assets/screenshots/fastfoodrecipe.jpg'),
};

export default function ScreenshotShowcase() {
  if (Platform.OS !== 'web') return null;

  // Gallery screenshots for horizontal scroll
  const galleryScreenshots = [
    { src: screenshots.homepage, alt: 'Home Screen' },
    { src: screenshots.workoutpage, alt: 'Workout Tracking' },
    { src: screenshots.exercisedetail, alt: 'Exercise Detail' },
    { src: screenshots.chart, alt: 'Progress Charts' },
    { src: screenshots.progressai, alt: 'AI Coach' },
    { src: screenshots.nutritionpage, alt: 'Nutrition Dashboard' },
  ];

  return (
    <section style={{ position: 'relative' }}>
      {/* Section header */}
      <div style={{
        textAlign: 'center',
        padding: '100px 5vw 40px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            fontSize: '13px',
            color: '#8B5CF6',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '20px',
          }}
        >
          App Preview
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: 'clamp(32px, 6vw, 64px)',
            fontWeight: '800',
            color: '#FFFFFF',
            lineHeight: 1.1,
          }}
        >
          Designed for
          <span style={{
            background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}> Athletes</span>
        </motion.h2>
      </div>

      {/* Horizontal scroll gallery */}
      <HorizontalGallery screenshots={galleryScreenshots} />

      {/* Feature highlights with screenshots */}
      <FeatureHighlight
        title="Smart Workout Tracking"
        description="Log your exercises with intelligent suggestions, automatic PR detection, and detailed set history."
        features={[
          { title: '500+ Exercises', description: 'Complete exercise library with videos and instructions' },
          { title: 'Auto PR Detection', description: 'Automatically tracks and celebrates your personal records' },
          { title: '3D Muscle Visualization', description: 'See which muscles you\'re targeting in real-time' },
        ]}
        imageSrc={screenshots.workoutpage}
        imageAlt="Workout tracking screen"
        accentColor="#8B5CF6"
      />

      <FeatureHighlight
        title="AI-Powered Coach"
        description="Get personalized recommendations, form tips, and workout suggestions from your intelligent fitness companion."
        features={[
          { title: 'Progress Analysis', description: 'AI analyzes your workout history and trends' },
          { title: 'Recipe Generation', description: 'Create high-protein recipes tailored to your macros' },
          { title: 'Smart Suggestions', description: 'Get personalized workout and nutrition advice' },
        ]}
        imageSrc={screenshots.recipeai}
        imageAlt="AI Coach screen"
        reverse
        accentColor="#06B6D4"
      />

      <FeatureHighlight
        title="Nutrition Tracking"
        description="Log meals, scan barcodes, and track your macros to fuel your fitness goals effectively."
        features={[
          { title: 'Barcode Scanner', description: 'Instantly log food by scanning packages' },
          { title: 'Macro Tracking', description: 'Track protein, carbs, and fats with precision' },
          { title: 'AI Recipe Generation', description: 'Generate recipes that hit your macro targets' },
        ]}
        imageSrc={screenshots.nutritionpage}
        imageAlt="Nutrition dashboard"
        accentColor="#10B981"
      />

      {/* Testimonials */}
      <TestimonialsSection />
    </section>
  );
}
