
/**
 * This file acts as the "Admin Logic Page".
 * A game admin can modify the rules in this object, and the AI reward
 * calculation flow will use the updated logic for its calculations.
 */
export const REWARD_LOGIC = {
  // Strategy Games
  chess: { win: { sPoints: 200, sCoins: 30 }, draw: { sPoints: 100, sCoins: 5 }, bonus: { description: "Win streak of 5", sCoins: 15 } },
  'chess-ai': { win: { sPoints: 200, sCoins: 30 }, draw: { sPoints: 100, sCoins: 5 }, bonus: { description: "Win streak of 5", sCoins: 15 } },
  towerOfHanoi: { complete: { sPoints: 150, sCoins: 15 }, bonus: { description: "Speed solve", sCoins: 5 } },
  'dots-and-boxes': { win: { sPoints: "50-100 based on score difference", sCoins: "5-10" }, bonus: { description: "Winning by a large margin (5+ boxes)", sCoins: 5 } },

  // Puzzle Games
  sudoku: { base: { sPoints: "50–200", sCoins: "5–20" }, bonus: { description: "No hint", sCoins: 5 } },
  patternBuilder: {
    base: { description: "Points are based on accuracy. S-Coins only for 100% accuracy.", sPoints: "50–100", sCoins: "0–10" },
    bonus: { description: "Perfect accuracy (100%)", sCoins: 10 },
    penalty: { description: "Using a peek results in 0 points and 0 coins.", peekUsed: true, sPoints: 0, sCoins: 0 },
  },
  jigsaw: { base: { sPoints: "50–100", sCoins: "0–15" }, bonus: { description: "Speed solve", sCoins: 5 } },
  memory: { base: { sPoints: "50–100", sCoins: "0–10" }, bonus: { description: "Full match", sCoins: 10 } },
  crossword: {
    base: { description: "10 S-Points per correctly filled word at the end.", sPoints: "10 per word" },
    completionBonus: { description: "Bonus for finishing the full puzzle.", sPoints: 100, sCoins: 2 },
    perfectBonus: { description: "Bonus for finishing with no mistakes or hints.", sPoints: 50, sCoins: 2 },
    timeBonus: { description: "Bonus for finishing under the time limit (if applicable).", sPoints: 20, sCoins: 1 },
    hintPenalty: { description: "Penalty for using a hint.", sPoints: -5 }
  },

  // Number Puzzles (sub-games, but treated as distinct for reward logic)
  guessTheNumber: { base: { sPoints: "50–100", sCoins: "0–10" }, bonus: { description: "First try guess", sCoins: 5 } },
  arithmeticChallenge: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins: 5 } },
  numberSequence: { base: { sPoints: "50–100", sCoins: "0–10" } },
  whatComesNext: { base: { sPoints: "50-150 based on difficulty and number of correct answers.", sCoins: "5-20" }, bonus: { description: "Perfect score (all correct)", sCoins: 10 } },
  countTheObjects: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins: 5 } },
  magicSquare: { base: { sPoints: "100-300 based on time remaining and difficulty.", sCoins: "10-30" }, bonus: { description: "Solving with more than 75% time left", sCoins: 15 } },
  fastMath: { base: { sPoints: "Speed based XP" }, bonus: { description: "Scoring high in <10s", sCoins: 5 } },
  
  // English Puzzles (sub-games)
  matchWord: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins: 5 } },
  missingLetter: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins: 5 } },
  sentenceScramble: { base: { sPoints: "50–100", sCoins: "0–10" } },
  oddOneOut: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins:5 } },
  typingRush: { base: { sPoints: "Award 1 S-Point for every 2 points scored.", sCoins: "Award 1 S-Coin for every 15 points scored." }, bonus: { description: "Scoring over 150 points", sCoins: 10 } },
  wordGrid: { base: { sPoints: "Words found" }, bonus: { description: "Max words", sCoins: 5 } },
};
