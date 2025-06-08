
'use server';
/**
 * @fileOverview A chatbot flow for Shravya AI to answer game-related questions.
 *
 * - shravyaAIChat - A function that handles user queries about games in Shravya Playhouse.
 * - ShravyaAIChatInput - The input type for the shravyaAIChat function.
 * - ShravyaAIChatOutput - The return type for the shravyaAIChat function.
 */

import { ai } from '@/ai/genkit';
import { GAMES } from '@/lib/constants'; // Import game data
import { z } from 'genkit';

const ShravyaAIChatInputSchema = z.object({
  userInput: z.string().describe('The user question about games in Shravya Playhouse.'),
});
export type ShravyaAIChatInput = z.infer<typeof ShravyaAIChatInputSchema>;

const ShravyaAIChatOutputSchema = z.object({
  response: z.string().describe("Shravya AI's answer to the user's question."),
});
export type ShravyaAIChatOutput = z.infer<typeof ShravyaAIChatOutputSchema>;

export async function shravyaAIChat(input: ShravyaAIChatInput): Promise<ShravyaAIChatOutput> {
  return shravyaAIChatFlow(input);
}

// Prepare game information for the prompt
const gameInfoForPrompt = GAMES.map(game => ({
    title: game.title,
    description: game.description,
    category: game.category,
}));

const chatPrompt = ai.definePrompt({
  name: 'shravyaAIChatPrompt',
  input: { schema: ShravyaAIChatInputSchema.extend({ games: z.any() }) }, // games will be passed in
  output: { schema: ShravyaAIChatOutputSchema },
  prompt: `You are Shravya AI, a friendly and helpful assistant for Shravya Playhouse.
Your role is to answer questions specifically about the games available in the playhouse.
Be concise, informative, and maintain a positive tone suitable for all ages.
If the question is not about the games, or if you don't know the answer, politely state that you can only answer game-related questions or that you don't have the information.

Here are the games currently available in Shravya Playhouse:
{{#each games}}
- {{this.title}}: {{this.description}} (Category: {{this.category}})
{{/each}}

Based on this information, please answer the following user question.

User's question: {{{userInput}}}

Your answer:`,
});

const shravyaAIChatFlow = ai.defineFlow(
  {
    name: 'shravyaAIChatFlow',
    inputSchema: ShravyaAIChatInputSchema,
    outputSchema: ShravyaAIChatOutputSchema,
  },
  async (input) => {
    const { output } = await chatPrompt({ userInput: input.userInput, games: gameInfoForPrompt });
    return output || { response: "I'm sorry, I couldn't generate a response right now. Please try again." };
  }
);
