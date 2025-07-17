
'use server';
/**
 * @fileOverview An AI flow for analyzing blog post content for grammar, spelling, and style.
 *
 * - analyzeBlogContent - A function that provides corrections and suggestions for a blog post.
 * - AnalyzeBlogContentInput - The input type for the analysis function.
 * - AnalyzeBlogContentOutput - The return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeBlogContentInputSchema = z.object({
  content: z.string().min(50).describe('The blog post content to be analyzed.'),
});
export type AnalyzeBlogContentInput = z.infer<typeof AnalyzeBlogContentInputSchema>;

const AnalyzeBlogContentOutputSchema = z.object({
  correctedContent: z
    .string()
    .describe('The full blog post with grammar and spelling mistakes corrected.'),
  suggestions: z
    .array(z.string())
    .describe('An array of 2-3 actionable suggestions for improving the post.'),
});
export type AnalyzeBlogContentOutput = z.infer<typeof AnalyzeBlogContentOutputSchema>;

export async function analyzeBlogContent(
  input: AnalyzeBlogContentInput
): Promise<AnalyzeBlogContentOutput> {
  return analyzeBlogContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBlogContentPrompt',
  input: { schema: AnalyzeBlogContentInputSchema },
  output: { schema: AnalyzeBlogContentOutputSchema },
  prompt: `You are a friendly and helpful writing assistant for a children's educational app called Shravya Playlab. Your task is to analyze a blog post written by a community member and provide constructive feedback.

The target audience is parents and children. The tone should be positive, encouraging, and clear.

**Blog Post Content:**
---
{{{content}}}
---

**Your Tasks:**
1.  **Correct Grammar and Spelling:** Carefully review the text. Fix all grammatical errors, spelling mistakes, and typos. Provide the fully corrected, ready-to-publish text in the 'correctedContent' field of your JSON output.
2.  **Provide Suggestions:** Offer 2-3 actionable suggestions to improve the post's clarity, engagement, or style. These suggestions should be encouraging and easy to understand. For example, suggest breaking up long paragraphs, adding a question to engage readers, or using simpler words. Put these suggestions in the 'suggestions' array.

**IMPORTANT:** Your response MUST be a single, valid JSON object that strictly follows the specified output schema. Do not include any text or explanations outside of the JSON structure.
`,
});

const analyzeBlogContentFlow = ai.defineFlow(
  {
    name: 'analyzeBlogContentFlow',
    inputSchema: AnalyzeBlogContentInputSchema,
    outputSchema: AnalyzeBlogContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get analysis from the AI model.');
    }
    return output;
  }
);
