
'use server';
/**
 * @fileOverview A chatbot flow for Shravya AI to answer game-related questions.
 *
 * - shravyaAIChat - A function that handles user queries about games in Shravya Playlab.
 * - ShravyaAIChatInput - The input type for the shravyaAIChat function.
 * - ShravyaAIChatOutput - The return type for the shravyaAIChat function.
 */

import { ai } from '@/ai/genkit';
import { GAMES, MATH_PUZZLE_TYPES, ENGLISH_PUZZLE_TYPES } from '@/lib/constants'; // Import all game data
import { z } from 'genkit';

const ShravyaAIChatInputSchema = z.object({
  userInput: z.string().describe('The user question about games in Shravya Playlab.'),
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

// Combine all games into one list for the AI's knowledge base.
const allGamesForPrompt = [
    ...GAMES.map(g => ({ title: g.title, description: g.description, category: g.category })),
    ...MATH_PUZZLE_TYPES.map(g => ({ title: g.name, description: g.description, category: 'Learning' })),
    ...ENGLISH_PUZZLE_TYPES.map(g => ({ title: g.name, description: g.description, category: 'Learning' })),
];


const chatPrompt = ai.definePrompt({
  name: 'shravyaAIChatPrompt',
  input: { schema: ShravyaAIChatInputSchema.extend({ games: z.any() }) },
  output: { schema: ShravyaAIChatOutputSchema },
  prompt: `You are Shravya AI, a fun, friendly, and helpful assistant for Shravya Playlab. Your personality is like a playful older sibling or a fun guide.
Your role is to answer questions specifically about the games available in the playhouse. Be casual, positive, and use emojis to make the conversation engaging! 🌟

**Language Rules:**
- First, detect the primary language of the "User's question".
- If it's Hindi, your entire "Your answer" MUST be in conversational Hindi. Translate game titles and details from the provided list into Hindi for your response. Then, set "responseLanguage" to "hi".
- For any other language, "Your answer" MUST be in conversational English. Set "responseLanguage" to "en".

**Conversation Rules:**
- If the question is not about the games in the provided list, or if you don't know the answer, politely say something like "Hmm, that's not about our games! I'm the expert on all the fun stuff inside Shravya Playlab. Got any game questions? 😊" in the detected language.
- Keep your answers concise but fun!

Here are all the games currently available in Shravya Playlab (use this information for your answers):
{{#each games}}
- **{{this.title}}** (Category: {{this.category}}) - {{this.description}}
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
  async (input): Promise<ShravyaAIChatOutput> => {
    const { output: llmOutput } = await chatPrompt({ userInput: input.userInput, games: allGamesForPrompt });

    if (!llmOutput || !llmOutput.response) {
      return { response: "I'm sorry, I couldn't generate a response right now. Please try again.", responseLanguage: 'en' };
    }

    return {
      response: llmOutput.response,
      responseLanguage: llmOutput.responseLanguage,
    };
  }
);
