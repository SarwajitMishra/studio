
'use server';
/**
 * @fileOverview An AI flow for generating English puzzles for kids.
 *
 * - generateEnglishPuzzle - A function that creates a new puzzle on demand.
 * - GenerateEnglishPuzzleInput - The input type for the puzzle generation.
 *   - puzzleType: 'matchWord', 'missingLetter', 'sentenceScramble', or 'oddOneOut'.
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
  puzzleType: z.enum(['matchWord', 'missingLetter', 'sentenceScramble', 'oddOneOut']),
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

const SentenceScramblePuzzleSchema = z.object({
  type: z.enum(['sentenceScramble']).describe("The type of puzzle, which must be 'sentenceScramble' for this schema."),
  scrambledWords: z.array(z.string()).describe("An array of words in a scrambled order."),
  correctSentence: z.string().describe("The grammatically correct sentence formed by the words."),
});

const OddOneOutPuzzleSchema = z.object({
  type: z.enum(['oddOneOut']).describe("The type of puzzle, which must be 'oddOneOut' for this schema."),
  options: z.array(z.string()).length(4).describe("An array of 4 words."),
  oddWordOut: z.string().describe("The one word from the options that does not belong with the others."),
  category: z.string().describe("The category that the other three words belong to."),
});

const EnglishPuzzleOutputSchema = z.union([WordMatchPuzzleSchema, MissingLetterPuzzleSchema, SentenceScramblePuzzleSchema, OddOneOutPuzzleSchema]);

// This is the main function that the client will call.
export async function generateEnglishPuzzle(input: GenerateEnglishPuzzleInput): Promise<EnglishPuzzleItem> {
  const llmResponse = await generateEnglishPuzzleFlow(input);
  const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

  if (llmResponse.type === 'matchWord') {
    let imageUrl = `https://placehold.co/400x300.png`; // Fallback
    if (apiKey) {
      // Add 'cartoon' to get more kid-friendly images
      const images = await searchImages(`cartoon ${llmResponse.correctWord}`, apiKey, { perPage: 1 });
      if (images.length > 0 && images[0].webformatURL) {
        imageUrl = images[0].webformatURL;
      }
    }
    return {
      id: `ai-${Date.now()}`,
      difficulty: input.difficulty,
      imageSrc: imageUrl,
      imageAlt: llmResponse.correctWord,
      type: 'matchWord',
      correctWord: llmResponse.correctWord,
      options: llmResponse.options,
    };
  } else if (llmResponse.type === 'missingLetter') {
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
  } else if (llmResponse.type === 'sentenceScramble') {
    return {
      id: `ai-${Date.now()}`,
      difficulty: input.difficulty,
      type: 'sentenceScramble',
      scrambledWords: llmResponse.scrambledWords,
      correctSentence: llmResponse.correctSentence,
    };
  } else { // oddOneOut
    return {
      id: `ai-${Date.now()}`,
      difficulty: input.difficulty,
      type: 'oddOneOut',
      options: llmResponse.options,
      correctAnswer: llmResponse.oddWordOut,
      category: llmResponse.category,
    };
  }
}

// Define the prompt for the AI model.
const puzzleGenerationPrompt = ai.definePrompt({
  name: 'englishPuzzleGeneratorPrompt',
  input: { schema: GenerateEnglishPuzzleInputSchema },
  output: { schema: EnglishPuzzleOutputSchema },
  prompt: `You are an expert puzzle creator for a kids' English learning app. Your task is to generate a single new puzzle based on the requested type and difficulty.

**Crucially, for 'matchWord' puzzles, all words you generate must be simple, common, concrete nouns that can be easily represented by a picture (e.g., 'apple', 'house', 'dog', 'car'). Avoid abstract concepts, verbs, or adjectives (e.g., 'bright', 'happy', 'run'). For all other puzzles, words can be more varied but should still be age-appropriate.**

- **Difficulty levels:**
  - **easy:** Simple, common words (3-4 letters). Short sentences (3-4 words).
  - **medium:** Slightly more complex words (5-7 letters). Medium sentences (5-6 words).
  - **hard:** Longer or less common words (8+ letters). Longer sentences (7-8 words).

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
    - **IMPORTANT:** You MUST also provide a short, simple hint or an alternative meaning for the word in the 'hint' field. For example, if the word is "ELEPHANT", a good hint would be "A very large gray animal with a trunk."
    - **Your output JSON 'type' field must be 'missingLetter'.**
  - If the puzzle type is 'sentenceScramble':
    - **Task:** Generate a simple, grammatically correct sentence appropriate for the difficulty. Then provide the words of that sentence in a scrambled array. The sentence should NOT end with punctuation.
    - **Your output JSON 'type' field must be 'sentenceScramble'.**
  - If the puzzle type is 'oddOneOut':
    - **Task:** Generate a set of 4 words where 3 belong to a common, simple category and one is the "odd one out". Provide the category of the other three words. All words should be appropriate for the difficulty level.
    - **Example:** Options: ["Apple", "Car", "Banana", "Orange"], Odd Word Out: "Car", Category: "The others are fruits".
    - **Your output JSON 'type' field must be 'oddOneOut'.**

- **Final Output:** Your response must be a single JSON object matching the requested output schema.

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
