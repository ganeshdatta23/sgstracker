// src/ai/flows/personalized-greeting.ts
'use server';

/**
 * @fileOverview A personalized greeting AI agent that incorporates details of Swamiji's current location.
 *
 * - personalizedGreeting - A function that generates a personalized greeting based on Swamiji's location.
 * - PersonalizedGreetingInput - The input type for the personalizedGreeting function.
 * - PersonalizedGreetingOutput - The return type for the personalizedGreeting function.
 */

import { model } from '../genkit';

interface GreetingInput {
  locationName: string;
}

interface GreetingOutput {
  greeting: string;
  message: string;
}

const SYSTEM_PROMPT = `You are a spiritual guide helping devotees connect with Swamiji. 
Create warm, personalized greetings that make people feel welcome and connected to the divine presence.
Keep responses concise, respectful, and uplifting.`;

const USER_PROMPT = (location: string) => `
Create a brief, warm greeting for a devotee at ${location}.
The greeting should:
1. Welcome them with warmth and spiritual connection
2. Mention their location naturally
3. Include a brief message of hope or blessing
4. Be respectful and culturally appropriate
5. Keep total response under 2-3 sentences
`;

export async function generatePersonalizedGreeting(input: GreetingInput): Promise<GreetingOutput> {
    try {
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
      ],
    });

    const result = await chat.sendMessage(USER_PROMPT(input.locationName));
    const response = await result.response;
    const text = response.text();

    // Split the response into greeting and message
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      greeting: lines[0] || 'Welcome, dear devotee!',
      message: lines[1] || 'May Swamiji\'s blessings be with you.',
    };

  } catch (error: any) {
    console.error('Error in personalizedGreetingFlow. Detail:', error.message);
    const detailMessage = error.message || 'Unknown error occurred';
    
    throw new Error(`Failed to generate personalized greeting. Please ensure the AI service is configured correctly and check server logs for more specific error information.`);
    }
  }

    