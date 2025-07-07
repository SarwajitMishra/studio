
/**
 * This file acts as the "Admin Logic Page".
 * A game admin can modify the rules in this object, and the AI reward
 * calculation flow will use the updated logic for its calculations.
 */
export const REWARD_LOGIC = {
  // Strategy Games
  chess: { win: { sPoints: 200, sCoins: 30 }, draw: { sPoints: 100, sCoins: 5 }, bonus: { description: "Win streak of 5", sCoins: 15 } },
  towerOfHanoi: { complete: { sPoints: 150, sCoins: 15 }, bonus: { description: "Speed solve", sCoins: 5 } },
  'gobblet-gobblers': { win: { sPoints: 50, sCoins: 5 }, bonus: { description: "Winning without losing a piece", sCoins: 5 } },

  // Puzzle Games
  sudoku: { base: { sPoints: "50–200", sCoins: "5–20" }, bonus: { description: "No hint", sCoins: 5 } },
  patternBuilder: { base: { sPoints: "50–100", sCoins: "0–10" }, bonus: { description: "Perfect accuracy", sCoins: 10 } },
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
  missingNumber: { base: { sPoints: "50–100", sCoins: "0–10" } },
  countTheObjects: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins: 5 } },
  codeBreaker: { base: { sPoints: 100, sCoins: 10 } },
  fastMath: { base: { sPoints: "Speed based XP" }, bonus: { description: "Scoring high in <10s", sCoins: 5 } },
  
  // English Puzzles (sub-games)
  matchWord: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins: 5 } },
  missingLetter: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins: 5 } },
  sentenceScramble: { base: { sPoints: "50–100", sCoins: "0–10" } },
  oddOneOut: { base: { sPoints: "10 per correct" }, bonus: { description: "Getting all answers correct", sCoins:5 } },
  typingRush: { base: { sPoints: "Award 1 S-Point for every 2 points scored.", sCoins: "Award 1 S-Coin for every 15 points scored." }, bonus: { description: "Scoring over 150 points", sCoins: 10 } },
  wordGrid: { base: { sPoints: "Words found" }, bonus: { description: "Max words", sCoins: 5 } },
};
