import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Configure the model
export const model = genAI.getGenerativeModel({
  model: 'gemini-pro', // Using the stable Gemini Pro model
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
    maxOutputTokens: 2048,
  },
});

// Export the initialized AI instance
export default genAI;

