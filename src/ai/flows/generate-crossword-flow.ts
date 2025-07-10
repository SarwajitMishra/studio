
'use server';
/**
 * @fileOverview An AI flow for generating crossword puzzles.
 *
 * - generateCrossword - A function that creates a new crossword puzzle on demand.
 * - GenerateCrosswordInput - The input type for the puzzle generation.
 * - CrosswordPuzzle - The output type, representing a complete crossword puzzle.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {CrosswordPuzzle, CrosswordWord} from '@/lib/crossword-puzzles';

const GenerateCrosswordInputSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
});
export type GenerateCrosswordInput = z.infer<
  typeof GenerateCrosswordInputSchema
>;

const CrosswordWordSchema = z.object({
  clue: z.string().describe('The clue for the word.'),
  answer: z
    .string()
    .describe('The answer word, in all uppercase letters.'),
  direction: z.enum(['across', 'down']).describe("The word's direction."),
  row: z.number().int().nonnegative().describe('The starting row (0-indexed).'),
  col: z.number().int().nonnegative().describe('The starting column (0-indexed).'),
});

const CrosswordPuzzleSchema = z.object({
  id: z.string().describe('A unique ID for the puzzle.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  gridSize: z
    .number()
    .int()
    .describe('The size of the square grid (e.g., 7 for a 7x7 grid).'),
  words: z
    .array(CrosswordWordSchema)
    .describe('An array of all the words in the puzzle.'),
});

export async function generateCrossword(
  input: GenerateCrosswordInput
): Promise<CrosswordPuzzle> {
  return generateCrosswordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCrosswordPrompt',
  input: {schema: GenerateCrosswordInputSchema},
  output: {schema: CrosswordPuzzleSchema},
  prompt: `You are an expert crossword puzzle creator for a children's educational app. Your task is to generate a complete, valid, and kid-friendly crossword puzzle based on the requested difficulty.

**CRITICAL INSTRUCTIONS:**
1.  **Create a Valid Layout:** You must design a grid where words intersect correctly. This is the most important step. The \`row\` and \`col\` for each word must correspond to a valid, interlocking grid layout within the specified \`gridSize\`.
2.  **Kid-Friendly Content:** All clues and answers must be appropriate for children aged 6-12.
3.  **Match Difficulty:**
    *   **Easy:** Use a 7x7 grid. Use simple words (3-6 letters) and direct clues.
    *   **Medium:** Use a 10x10 grid. Use slightly longer words (5-8 letters) and clues that may require some thought.
    *   **Hard:** Use a 15x15 grid. Use longer words and more challenging, clever clues.
4.  **No Overlaps:** A new word cannot start in a cell that is already occupied by another word's letter (unless it's the intersecting letter, of course).
5.  **One Letter Per Cell:** The generated grid must be valid. No two letters should occupy the same cell unless they are part of an intersecting 'across' and 'down' word.
6.  **Correct Schema:** Your final output MUST be a single, valid JSON object that strictly follows the provided output schema. Ensure all fields like 'id', 'difficulty', 'gridSize', and the 'words' array are present and correctly formatted. Answers must be uppercase.

**Example Process for an Easy Puzzle:**
1.  Set \`gridSize\` to 7.
2.  Choose a central word, e.g., "NIGHT" (5 letters), place it 'across' at row: 3, col: 1.
3.  Find a word that intersects with "NIGHT". E.g., "GHOST" could go 'down', starting at row: 1, col: 3. The 'G' of "GHOST" would be at (1,3), 'H' at (2,3), and the 'O' of "GHOST" would correctly intersect with the 'I' of "NIGHT" at (3,3). Wait, no 'O' is not the third letter of NIGHT. This is a bad intersection.
4.  Let's try again. "NIGHT" across at row:3, col:1. Intersecting with "BOOK" down at row:3, col:4. The 'O' is the second letter of BOOK and fourth of night. No, that doesn't work.
5.  Let's rethink. "NIGHT" (ACROSS, row 1, col 1). "KENNEL" (DOWN, row 1, col 1). This works! The 'N' is the intersecting letter.
6.  Continue this process, building out the grid, ensuring all words connect.
7.  Fill out the JSON object with the final list of correctly placed words.

**Requested Difficulty:** {{difficulty}}

Generate a new puzzle now.
`,
});

const generateCrosswordFlow = ai.defineFlow(
  {
    name: 'generateCrosswordFlow',
    inputSchema: GenerateCrosswordInputSchema,
    outputSchema: CrosswordPuzzleSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a crossword puzzle.');
    }
    // Basic validation to prevent crashes, though the AI should handle this.
    if (output.words.some(w => w.row >= output.gridSize || w.col >= output.gridSize)) {
        throw new Error("AI generated a word outside the specified grid size.");
    }
    return output;
  }
);
