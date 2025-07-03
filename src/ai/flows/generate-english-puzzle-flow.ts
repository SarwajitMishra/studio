
'use server';
/**
 * @fileOverview An AI flow for generating English puzzles for kids.
 *
 * - generateEnglishPuzzle - A function that creates a new puzzle on demand.
 * - GenerateEnglishPuzzleInput - The input type for the puzzle generation.
 *   - puzzleType: 'matchWord' or 'missingLetter'.
 *   - difficulty: 'easy', 'medium', or 'hard'.
 *   - wordsToExclude: An optional array of words to avoid repetition.
 * - EnglishPuzzleItem - The output type, representing a single puzzle.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { EnglishPuzzleItem } from '@/lib/constants';
import { searchImages } from '@/services/pixabay';

// Define Zod schemas that match the existing types for validation and structured output.
const GenerateEnglishPuzzleInputSchema = z.object({
  puzzleType: z.enum(['matchWord', 'missingLetter']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  wordsToExclude: z
    .array(z.string())
    .optional()
    .describe('A list of words that should not be used for the puzzle to avoid repetition.'),
});
export type GenerateEnglishPuzzleInput = z.infer<typeof GenerateEnglishPuzzleInputSchema>;

// Schemas for the AI model's direct output.
const WordMatchPuzzleSchema = z.object({
  type: z.enum(['matchWord']).describe("The type of puzzle, which must be 'matchWord' for this schema."),
  correctWord: z.string().describe('The single, correct word for the puzzle.'),
  options: z.array(z.string()).length(4).describe('An array of 4 words, including the correct one and three plausible distractors.'),
});

const MissingLetterPuzzleSchema = z.object({
  type: z.enum(['missingLetter']).describe("The type of puzzle, which must be 'missingLetter' for this schema."),
  fullWord: z.string().describe('The complete, correct word.'),
  wordPattern: z.string().describe('The word with one letter replaced by an underscore (e.g., "AP_LE").'),
  correctLetter: z.string().length(1).describe('The single correct letter that was replaced.'),
  options: z.array(z.string().length(1)).length(4).describe('An array of 4 single letters, including the correct one and three distractors.'),
  hint: z.string().describe('A short, simple hint or an alternative meaning for the word to help the user guess.'),
});

const EnglishPuzzleOutputSchema = z.union([WordMatchPuzzleSchema, MissingLetterPuzzleSchema]);

// This is the main function that the client will call.
export async function generateEnglishPuzzle(input: GenerateEnglishPuzzleInput): Promise<EnglishPuzzleItem> {
  const llmResponse = await generateEnglishPuzzleFlow(input);

  if (llmResponse.type === 'matchWord') {
    return {
      id: `ai-${Date.now()}`,
      difficulty: input.difficulty,
      imageSrc: 'https://placehold.co/400x300.png', // Default placeholder
      imageAlt: llmResponse.correctWord,
      imageQuery: llmResponse.correctWord,
      type: 'matchWord',
      correctWord: llmResponse.correctWord,
      options: llmResponse.options,
    };
  } else { // 'missingLetter'
    return {
      id: `ai-${Date.now()}`,
      difficulty: input.difficulty,
      type: 'missingLetter',
      fullWord: llmResponse.fullWord,
      wordPattern: llmResponse.wordPattern,
      correctLetter: llmResponse.correctLetter,
      options: llmResponse.options,
      hint: llmResponse.hint,
    };
  }
}

// Define the prompt for the AI model.
const puzzleGenerationPrompt = ai.definePrompt({
  name: 'englishPuzzleGeneratorPrompt',
  input: { schema: GenerateEnglishPuzzleInputSchema },
  output: { schema: EnglishPuzzleOutputSchema },
  prompt: `You are an expert puzzle creator for a kids' English learning app. Your task is to generate a single new puzzle based on the requested type and difficulty.

**Crucially, for 'matchWord' puzzles, all words you generate must be simple, common, concrete nouns that can be easily represented by a picture (e.g., 'apple', 'house', 'dog', 'car'). Avoid abstract concepts, verbs, or adjectives (e.g., 'bright', 'happy', 'run'). For 'missingLetter' puzzles, the words can be slightly more varied but should still be age-appropriate.**

- **Difficulty levels:**
  - **easy:** Simple, common words (3-4 letters).
  - **medium:** Slightly more complex words (5-7 letters).
  - **hard:** Longer or less common words (8+ letters).

- **Word Exclusion:**
  - If a list of words to exclude is provided, you MUST NOT use any of those words.
  - Excluded words: {{#if wordsToExclude}}
      {{#each wordsToExclude}}'{{this}}' {{/each}}
    {{else}}
      None
    {{/if}}

- **Puzzle Specifics based on '{{puzzleType}}':**
  - If the puzzle type is 'matchWord':
    - **Task:** Generate one correct word and three plausible but incorrect distractor words. All words should match the difficulty level. The final 'options' array must contain exactly 4 words and must include the correct word.
    - **Your output JSON 'type' field must be 'matchWord'.**
  - If the puzzle type is 'missingLetter':
    - **Task:** Generate a word matching the difficulty. Create a pattern by replacing ONE letter with an underscore. Provide the correct letter and three distractor letters as options. The final 'options' array must contain exactly 4 single letters and must include the correct letter.
    - **IMPORTANT:** You MUST also provide a short, simple hint or an alternative meaning for the word in the 'hint' field to help the user. For example, if the word is "ELEPHANT", a good hint would be "A very large gray animal with a trunk."
    - **Your output JSON 'type' field must be 'missingLetter'.**

- **Final Output:** Your response must be a single JSON object matching the requested output schema. Do NOT create an image query.

**Puzzle Request:**
- **Puzzle Type:** {{puzzleType}}
- **Difficulty:** {{difficulty}}
`,
});

// Define the Genkit flow
const generateEnglishPuzzleFlow = ai.defineFlow(
  {
    name: 'generateEnglishPuzzleFlow',
    inputSchema: GenerateEnglishPuzzleInputSchema,
    outputSchema: EnglishPuzzleOutputSchema,
  },
  async (input) => {
    const { output } = await puzzleGenerationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate a puzzle from the AI model.');
    }
    return output;
  }
);
