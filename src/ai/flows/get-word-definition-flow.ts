
'use server';
/**
 * @fileOverview An AI flow for getting a kid-friendly word definition.
 *
 * - getWordDefinition - A function that returns a simple definition for a word.
 * - WordDefinitionInput - The input type for the definition function.
 * - WordDefinitionOutput - The return type for the definition function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WordDefinitionInputSchema = z.object({
  word: z.string().describe('The word to be defined.'),
});
export type WordDefinitionInput = z.infer<typeof WordDefinitionInputSchema>;

const WordDefinitionOutputSchema = z.object({
  definition: z
    .string()
    .describe('A short, simple, kid-friendly definition of the word.'),
});
export type WordDefinitionOutput = z.infer<typeof WordDefinitionOutputSchema>;

export async function getWordDefinition(
  input: WordDefinitionInput
): Promise<WordDefinitionOutput> {
  return getWordDefinitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWordDefinitionPrompt',
  input: { schema: WordDefinitionInputSchema },
  output: { schema: WordDefinitionOutputSchema },
  prompt: `You are a helpful assistant for a kids' game. Provide a short, simple, one-sentence, kid-friendly definition for the word: '{{{word}}}'.

Start your definition with what the word is, for example, "An animal that..." or "A type of fruit that...". Do not start with "It means...".
Do not include the original word in the definition if possible.
Keep it very simple for a 6-8 year old.

Word: {{{word}}}
`,
});

const getWordDefinitionFlow = ai.defineFlow(
  {
    name: 'getWordDefinitionFlow',
    inputSchema: WordDefinitionInputSchema,
    outputSchema: WordDefinitionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate a definition from the AI model.');
    }
    return output;
  }
);
