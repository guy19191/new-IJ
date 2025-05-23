import OpenAI from 'openai';
import { config } from '../config/config';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a music expert that helps create personalized playlists. Respond with a JSON array of song objects, each containing 'track_name', 'artist', and 'genre' fields."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating ChatGPT response:', error);
      throw new Error('Failed to generate response from ChatGPT');
    }
  }
} 