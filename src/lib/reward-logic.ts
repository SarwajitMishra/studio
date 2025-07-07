
/**
 * This file acts as the "Admin Logic Page".
 * A game admin can modify the rules in this object, and the AI reward
 * calculation flow will use the updated logic for its calculations.
 */
export const REWARD_LOGIC = {
  strategy: {
    chess: {
      win: { sPoints: 200, sCoins: 30 },
      draw: { sPoints: 100, sCoins: 5 },
      bonus: {
        streak: { description: "Win streak of 5", sCoins: 15 },
      },
    },
    towerOfHanoi: {
      complete: { sPoints: 150, sCoins: 15 },
      bonus: {
        speedSolve: { description: "Solve faster than average time", sCoins: 5 },
      },
    },
  },
  logic: {
    '2048': {
      base: { sPoints: "50–150 based on final score", sCoins: "0–15 based on final score" },
      bonus: {
        '2048tile': { description: "Achieving the 2048 tile", sCoins: 10 },
      },
    },
    sudokuChallenge: {
      base: { sPoints: "50–200 based on difficulty and time", sCoins: "5-20 based on difficulty and time" },
      bonus: {
        noHint: { description: "Completing without using any hints", sCoins: 5 },
      },
    },
    patternBuilder: {
      base: { sPoints: "50-100 based on accuracy", sCoins: "0-10 based on accuracy" },
      bonus: {
        perfectAccuracy: { description: "100% accuracy", sCoins: 10 },
      },
    },
    memoryMaze: {
      base: { sPoints: "50-100 based on level reached", sCoins: "0-15 based on level reached" },
      bonus: {
        allLevelsClear: { description: "Completing all levels in a difficulty", sCoins: 10 },
      },
    },
    jigsaw: {
      base: { sPoints: "50-100 based on difficulty and time", sCoins: "0-15 based on difficulty and time" },
      bonus: {
        speedSolve: { description: "Solving faster than average", sCoins: 5 },
      },
    },
    memoryMatch: {
      base: { sPoints: "50-100 based on moves and time", sCoins: "0-10 based on moves and time" },
      bonus: {
        fullMatch: { description: "Completing the game", sCoins: 10 },
      },
    },
  },
  numberPuzzles: {
    guessTheNumber: {
      base: { sPoints: "50-100 based on attempts", sCoins: "0-10 based on attempts" },
      bonus: {
        firstTry: { description: "Guessing on the first try", sCoins: 5 },
      },
    },
    arithmeticChallenge: {
      base: { sPoints: "10 per correct answer" },
      bonus: {
        perfectScore: { description: "Getting all answers correct", sCoins: 5 },
      },
    },
    numberSequence: {
      base: { sPoints: "50-100 based on difficulty", sCoins: "0-10 based on difficulty" },
    },
    missingNumber: {
      base: { sPoints: "50-100 based on difficulty", sCoins: "0-10 based on difficulty" },
    },
    countTheObjects: {
      base: { sPoints: "10 per correct answer" },
      bonus: {
        perfectScore: { description: "Getting all answers correct", sCoins: 5 },
      },
    },
    codeBreaker: {
      win: { sPoints: 100, sCoins: 10 },
    },
    fastMath: {
      base: { sPoints: "Based on speed and score" },
      bonus: {
        quickWin: { description: "Scoring high in under 10 seconds", sCoins: 5 },
      },
    },
  },
  easyEnglish: {
    matchTheWord: {
      base: { sPoints: "10 per correct answer" },
      bonus: {
        perfectScore: { description: "Getting all answers correct", sCoins: 5 },
      },
    },
    missingLetter: {
      base: { sPoints: "10 per correct answer" },
      bonus: {
        perfectScore: { description: "Getting all answers correct", sCoins: 5 },
      },
    },
    sentenceScramble: {
      base: { sPoints: "50-100 based on difficulty", sCoins: "0-10 based on difficulty" },
    },
    oddOneOut: {
      base: { sPoints: "10 per correct answer" },
      bonus: {
        perfectScore: { description: "Getting all answers correct", sCoins: 5 },
      },
    },
    typingRush: {
      base: { sPoints: "Based on final score (speed)" },
      bonus: {
        fastTyper: { description: "Achieving a high words-per-minute", sCoins: 10 },
      },
    },
    wordGrid: {
      base: { sPoints: "Based on number and length of words found" },
      bonus: {
        maxWords: { description: "Finding all possible words", sCoins: 5 },
      },
    },
  },
};
