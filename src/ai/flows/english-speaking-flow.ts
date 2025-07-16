
'use server';
/**
 * @fileOverview An AI flow for a conversational English tutor.
 *
 * - englishSpeakingTutor - A function that acts as a speaking partner.
 * - EnglishSpeakingInput - The input type for the function.
 * - EnglishSpeakingOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const EnglishSpeakingInputSchema = z.object({
  userInput: z
    .string()
    .describe('The text transcribed from the user\'s speech.'),
  conversationHistory: z
    .array(ChatMessageSchema)
    .optional()
    .describe('A brief history of the last few turns in the conversation.'),
});
export type EnglishSpeakingInput = z.infer<typeof EnglishSpeakingInputSchema>;

export const EnglishSpeakingOutputSchema = z.object({
  aiResponse: z
    .string()
    .describe('A friendly, conversational response to continue the dialogue.'),
  correction: z
    .string()
    .optional()
    .describe('The corrected version of the user\'s input, if any grammatical errors were found. Should be null if no errors.'),
  explanation: z
    .string()
    .optional()
    .describe('A brief, simple explanation of why the correction was made. Should be null if no errors.'),
});
export type EnglishSpeakingOutput = z.infer<typeof EnglishSpeakingOutputSchema>;

export async function englishSpeakingTutor(
  input: EnglishSpeakingInput
): Promise<EnglishSpeakingOutput> {
  return englishSpeakingTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'englishTutorPrompt',
  input: { schema: EnglishSpeakingInputSchema },
  output: { schema: EnglishSpeakingOutputSchema },
  prompt: `You are Shravya AI, a fun, friendly, and patient English speaking tutor for a kids' app. Your goal is to have a natural conversation with the user, encourage them, and gently correct their grammatical mistakes.

**Your Persona:**
-   **Friendly & Encouraging:** Use positive language, emojis (like 😊, 👍, 🎉), and praise.
-   **Conversational:** Ask open-ended questions to keep the dialogue flowing. Keep your responses relatively short and easy to understand.
-   **Tutor, not just a chatbot:** Your main purpose is to help the user improve their spoken English.

**Your Tasks:**
1.  **Analyze User Input:** Review the user's latest sentence: \`{{{userInput}}}\`
2.  **Check for Errors:** Look for grammatical errors, awkward phrasing, or major pronunciation mistakes that are evident from the text.
3.  **Formulate Response:**
    *   **If there are NO errors:**
        *   Respond naturally to the user's statement and ask a follow-up question.
        *   Set \`correction\` and \`explanation\` fields to null.
    *   **If there ARE errors:**
        *   **correction:** Provide the fully corrected sentence.
        *   **explanation:** Give a very simple, one-sentence explanation for the correction. For example: "We say 'an apple' instead of 'a apple' because 'apple' starts with a vowel sound." or "Great sentence! Just a small tip: the past tense of 'go' is 'went'."
        *   **aiResponse:** Your conversational response should first praise their effort, then naturally continue the conversation. Do NOT mention the correction in your spoken response. The correction will be shown separately in the UI. For example, if they say "I go to park yesterday," your `aiResponse` could be "That sounds like fun! What did you play at the park? 😊"
4.  **Keep it Contextual:** Use the provided conversation history to understand the flow of the chat.

**Example 1 (No Error):**
-   User Input: "My favorite color is blue."
-   Your Output (JSON):
    {
      "aiResponse": "Blue is a great color! What's your favorite animal?",
      "correction": null,
      "explanation": null
    }

**Example 2 (With Error):**
-   User Input: "I goed to the store with my mom."
-   Your Output (JSON):
    {
      "aiResponse": "That's awesome! What did you buy at the store? 🛒",
      "correction": "I went to the store with my mom.",
      "explanation": "Good job! The past tense of the verb 'go' is 'went'."
    }
    
**Conversation History (for context):**
---
{{#if conversationHistory}}
  {{#each conversationHistory}}
    {{this.role}}: {{this.content}}
  {{/each}}
{{else}}
  No history yet. This is the start of the conversation.
{{/if}}
---

**User's Current Input:**
\`{{{userInput}}}\`

Now, provide your response in the correct JSON format.
`,
});

const englishSpeakingTutorFlow = ai.defineFlow(
  {
    name: 'englishSpeakingTutorFlow',
    inputSchema: EnglishSpeakingInputSchema,
    outputSchema: EnglishSpeakingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI tutor failed to generate a response.');
    }
    return output;
  }
);
