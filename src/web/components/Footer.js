import React from 'react';
import { Platform } from 'react-native';
import { motion } from 'framer-motion';

export default function Footer() {
  if (Platform.OS !== 'web') return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '80px 5vw 40px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Top section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '60px',
          marginBottom: '80px',
        }}>
          {/* Brand */}
          <div style={{ maxWidth: '300px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#8B5CF6',
              }} />
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>
                AI Gym Trainer
              </span>
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '14px',
              lineHeight: 1.7,
            }}>
              Your AI-powered fitness companion. Track workouts, log nutrition,
              and crush your goals.
            </p>
          </div>

          {/* Links */}
          <div style={{
            display: 'flex',
            gap: '80px',
            flexWrap: 'wrap',
          }}>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Download'] },
              { title: 'Company', links: ['About', 'Blog', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms'] },
            ].map((column) => (
              <div key={column.title}>
                <h4 style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}>
                  {column.title}
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}>
                  {column.links.map((link) => (
                    <li key={link} style={{ marginBottom: '12px' }}>
                      <motion.a
                        href={`#${link.toLowerCase()}`}
                        whileHover={{ color: '#FFFFFF' }}
                        style={{
                          color: 'rgba(255,255,255,0.5)',
                          textDecoration: 'none',
                          fontSize: '14px',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {link}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: '30px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '13px',
          }}>
            {currentYear} AI Gym Trainer
          </div>

          {/* Social links */}
          <div style={{
            display: 'flex',
            gap: '24px',
          }}>
            {[
              { name: 'X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
              { name: 'GitHub', icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' },
            ].map((social) => (
              <motion.a
                key={social.name}
                href="#"
                whileHover={{ color: '#FFFFFF' }}
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.icon} />
                </svg>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
