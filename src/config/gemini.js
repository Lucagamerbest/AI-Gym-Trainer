// AI Configuration (OpenAI GPT-4o-mini)
// This file initializes the AI service for the AI Gym Trainer app

import { OPENAI_API_KEY } from '@env';
import AIService from '../services/ai/AIService';

// Initialize AI Service with API key
let isInitialized = false;

export const initializeGemini = () => {
  if (isInitialized) {
    return;
  }

  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    throw new Error('OpenAI API key is required. Check your .env.local file.');
  }

  try {
    AIService.initialize(OPENAI_API_KEY);
    isInitialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI:', error);
    throw error;
  }
};

// Export AIService for convenience
export { AIService };
export default AIService;
