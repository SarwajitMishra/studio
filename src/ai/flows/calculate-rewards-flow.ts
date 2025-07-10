
'use server';
/**
 * @fileOverview An AI flow for dynamically calculating game rewards.
 *
 * - calculateRewards - A server action that determines S-Points and S-Coins
 *   based on game performance.
 * - RewardCalculationInput - The input type for the reward calculation.
 * - RewardCalculationOutput - The return type for the reward calculation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { REWARD_LOGIC } from '@/lib/reward-logic';

// Define Zod schemas for structured input and output.
const RewardCalculationInputSchema = z.object({
  gameId: z.string().describe('The unique identifier for the game played (e.g., "guessTheNumber", "chess").'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'beginner', 'expert', 'pro']).describe('The difficulty level of the game played.'),
  performanceMetrics: z
    .record(z.any())
    .optional()
    .describe('An optional object with game-specific performance data (e.g., { "attempts": 5, "time": 60, "peeksUsed": 2 }).'),
});
export type RewardCalculationInput = z.infer<typeof RewardCalculationInputSchema>;

const RewardCalculationOutputSchema = z.object({
  sPoints: z.number().describe('The number of S-Points awarded.'),
  sCoins: z.number().describe('The number of S-Coins awarded.'),
});
export type RewardCalculationOutput = z.infer<typeof RewardCalculationOutputSchema>;


// This is the main server action function that the client will call.
export async function calculateRewards(input: RewardCalculationInput): Promise<RewardCalculationOutput> {
  return calculateRewardsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'rewardCalculationPrompt',
  input: { schema: RewardCalculationInputSchema.extend({ rewardLogic: z.any() }) },
  output: { schema: RewardCalculationOutputSchema },
  prompt: `You are a fair and balanced game designer for a kids' educational app. Your task is to calculate the S-Points and S-Coins rewards for a player based on their performance in a specific game.

**Use the following Reward Logic table as your guide for calculations. Be consistent with these rules.**

Reward Logic Table (in JSON format):
\`\`\`json
{{{json rewardLogic}}}
\`\`\`

**CRITICAL RULES:**
1.  **NO COINS FOR IMPERFECT PLAY:** If a player's performance is not perfect (e.g., 'accuracy' is less than 100, they did not get a "perfectBonus"), you MUST award 0 S-Coins. S-Coins are for excellence only.
2.  **REDUCED REWARD FOR HINTS/PEEKS:**
    - If 'peeksUsed' is 1, reduce final calculated S-Points and S-Coins by 30%.
    - If 'peeksUsed' is 2, reduce final calculated S-Points and S-Coins by 60%.
    - If 'peeksUsed' is 3 or more (or 'peekUsed' is a boolean true), award 0 S-Points AND 0 S-Coins.
3.  **NO COINS FOR POOR PERFORMANCE:** If the player lost the game, or their score/performance is very poor (e.g., 'result' is 'loss', 'score' is 0, 'accuracy' is very low, or they found 0 words), you MUST award 0 S-Coins. You can still award a small number of S-Points for participation if appropriate, unless Rule 2 applies.

**Player's Performance Data:**
- Game ID: {{gameId}}
- Difficulty: {{difficulty}}
- Performance Metrics: {{#if performanceMetrics}} {{{json performanceMetrics}}} {{else}} None provided. {{/if}}

**Your Task:**
1.  Find the rules for the specified 'gameId' in the Reward Logic table.
2.  Calculate the base S-Points and S-Coins based on the 'difficulty' and the rules in the table.
3.  Apply any 'performanceMetrics' bonuses (like for low attempts, fast time, perfect score).
4.  Apply the **CRITICAL RULES** to the calculated total. If Rule 1 applies, set S-Coins to 0. Then, apply the percentage reduction from Rule 2 to the final amounts.
5.  Return the final calculated 'sPoints' and 'sCoins' in the specified JSON format. If a game is not in the table, award 0 points and 0 coins.

**Example Calculation for 'patternBuilder':**
- A user gets 100% accuracy with 0 peeks: Award S-Points and S-Coins based on the table (e.g., 100 S-Points, 10 S-Coins).
- A user gets 100% accuracy but used 1 peek: Award S-Points and S-Coins based on the table, then reduce both by 30% (e.g., 70 S-Points, 7 S-Coins).
- A user gets 90% accuracy with 1 peek: Award S-Points from the table, reduce by 30%. Award 0 S-Coins due to imperfect play (Rule 1).
- A user gets 100% accuracy but used 3 peeks: Award 0 S-Points and 0 S-Coins (Rule 2).

Now, calculate the rewards for the provided performance data.
`,
});

// Define the Genkit flow that uses the prompt.
const calculateRewardsFlow = ai.defineFlow(
  {
    name: 'calculateRewardsFlow',
    inputSchema: RewardCalculationInputSchema,
    outputSchema: RewardCalculationOutputSchema,
  },
  async (input) => {
    // Pass the reward logic table directly into the prompt context.
    const { output } = await prompt({
      ...input,
      rewardLogic: REWARD_LOGIC,
    });

    if (!output) {
      console.error('AI failed to generate a reward. Returning zero.');
      return { sPoints: 0, sCoins: 0 };
    }
    
    console.log(`[AI Rewards] Game: ${input.gameId}, Difficulty: ${input.difficulty}, Metrics: ${JSON.stringify(input.performanceMetrics)}, Rewards: sPoints=${output.sPoints}, sCoins=${output.sCoins}`);

    return output;
  }
);
