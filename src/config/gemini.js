// Google Gemini AI Configuration
// This file initializes Gemini AI for the AI Gym Trainer app

import { GOOGLE_GEMINI_API_KEY } from '@env';
import AIService from '../services/ai/AIService';

// Initialize AI Service with API key
let isInitialized = false;

export const initializeGemini = () => {
  if (isInitialized) {
    console.log('✅ Gemini already initialized');
    return;
  }

  if (!GOOGLE_GEMINI_API_KEY) {
    console.error('❌ GOOGLE_GEMINI_API_KEY not found in environment variables');
    throw new Error('Gemini API key is required. Check your .env.local file.');
  }

  try {
    AIService.initialize(GOOGLE_GEMINI_API_KEY);
    isInitialized = true;
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error);
    throw error;
  }
};

// Export AIService for convenience
export { AIService };
export default AIService;
