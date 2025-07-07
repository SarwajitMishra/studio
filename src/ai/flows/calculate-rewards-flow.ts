
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
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the game played.'),
  performanceMetrics: z
    .record(z.any())
    .optional()
    .describe('An optional object with game-specific performance data (e.g., { "attempts": 5, "time": 60 }).'),
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

**Player's Performance Data:**
- Game ID: {{gameId}}
- Difficulty: {{difficulty}}
- Performance Metrics: {{#if performanceMetrics}} {{{json performanceMetrics}}} {{else}} None provided. {{/if}}

**Your Task:**
1.  Find the rules for the specified \`gameId\` in the Reward Logic table.
2.  Calculate the base S-Points and S-Coins based on the \`difficulty\` and the rules.
3.  If any \`performanceMetrics\` are provided (like low attempts, fast time, perfect score), apply the bonus rewards as specified in the rules.
4.  Return the final calculated \`sPoints\` and \`sCoins\` in the specified JSON format. If a game is not in the table, award 0 points and 0 coins.

**Example Calculation for 'guessTheNumber':**
- If a user wins on 'easy' in 1 attempt, the rule is "50–100 S-Points" and a bonus of "+5 S-Coins" for a first-try guess.
- A good reward would be 100 S-Points (for excellent performance) and 5 S-Coins.
- If they win on 'hard' in 10 attempts, a fair reward might be 60 S-Points and 0 S-Coins (no bonus).

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
