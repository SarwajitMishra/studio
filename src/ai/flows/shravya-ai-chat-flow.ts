
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
  responseLanguage: z.string().describe("The BCP-47 language code of the response (e.g., 'en' for English, 'hi' for Hindi)."),
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
  input: { schema: ShravyaAIChatInputSchema.extend({ games: z.any() }) },
  output: { schema: ShravyaAIChatOutputSchema },
  prompt: `You are Shravya AI, a friendly and helpful assistant for Shravya Playhouse.
Your role is to answer questions specifically about the games available in the playhouse.
Be concise, informative, and maintain a positive tone suitable for all ages.

Detect the primary language of the "User's question".
- If the primary language of the "User's question" is Hindi, then your entire "Your answer" MUST be in Hindi. You should translate game titles and relevant details from the provided game list into Hindi accurately for your response. Set "responseLanguage" to "hi".
- Otherwise, "Your answer" MUST be in English. Set "responseLanguage" to "en".

If the question is not about the games in the provided list, or if you don't know the answer, politely state that you can only answer game-related questions or that you don't have the information, using the detected language (Hindi or English).

Here are the games currently available in Shravya Playhouse (use this information for your answers):
{{#each games}}
- Title: {{this.title}} (Category: {{this.category}})
  Description: {{this.description}}
{{/each}}

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
    return output || { response: "I'm sorry, I couldn't generate a response right now. Please try again.", responseLanguage: 'en' };
  }
);

