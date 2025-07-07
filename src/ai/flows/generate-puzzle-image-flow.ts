
'use server';
/**
 * @fileOverview An AI flow for generating images for puzzles.
 *
 * - generatePuzzleImage - A function that creates an image from a text prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePuzzleImageInputSchema = z.object({
  word: z.string().describe('A single word or a short phrase describing the object to generate.'),
});

// The output is just the data URI string, not a complex object.
const GeneratePuzzleImageOutputSchema = z.string();

export async function generatePuzzleImage(word: string): Promise<string> {
    return generatePuzzleImageFlow({ word });
}

const generatePuzzleImageFlow = ai.defineFlow(
  {
    name: 'generatePuzzleImageFlow',
    inputSchema: GeneratePuzzleImageInputSchema,
    outputSchema: GeneratePuzzleImageOutputSchema,
  },
  async ({ word }) => {
    console.log(`[AI Image Gen] Generating image for: ${word}`);
    const { media } = await ai.generate({
      // Use the specific Gemini 2.0 Flash model for image generation
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A simple, clean, friendly cartoon illustration of a single '${word}' on a plain white background, suitable for a kids' puzzle game.`,
      config: {
        // Must provide both TEXT and IMAGE for this model to work
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error(`AI failed to generate an image for the word: ${word}`);
    }
    
    console.log(`[AI Image Gen] Successfully generated image for: ${word}`);
    return media.url; // The data URI string
  }
);
