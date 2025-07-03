
import type { LucideIcon } from 'lucide-react';
import { HomeIcon, LayoutGrid, Puzzle, BookOpen, UserCircle, Settings, BarChart3, Zap, Apple, Banana, Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2, Swords, Bot, Search, Sigma, Brain, ToyBrick, Star as StarIcon, Coins as CoinsIcon, BookMarked, Target, Calculator, ListOrdered, SpellCheck, CaseLower, AlignJustify, Filter, Keyboard, Gamepad2 } from 'lucide-react';

export type GameCategory = 'Strategy' | 'Puzzles' | 'Learning';

export interface Game {
  id: string;
  title: string;
  category: GameCategory;
  Icon: LucideIcon;
  description: string;
  href: string;
  color?: string; // Optional color for the card or icon
  imageUrl?: string; // Optional image URL for the icon
}

export const GAMES: Game[] = [
  {
    id: 'chess',
    title: 'Chess',
    category: 'Strategy',
    Icon: LayoutGrid, // Using a generic board game icon for Chess
    description: 'Classic strategy board game. Sharpen your mind!',
    href: '/chess',
    color: 'text-sky-600',
  },
  {
    id: 'ludo',
    title: 'Ludo',
    category: 'Strategy',
    Icon: Swords, 
    description: 'Classic board game for 2-4 players. Roll the dice and race your tokens home!',
    href: '/ludo',
    color: 'text-emerald-600',
  },
  {
    id: 'jigsaw',
    title: 'Jigsaw Puzzles',
    category: 'Puzzles',
    Icon: Puzzle,
    description: 'Piece together beautiful images. Fun for all ages!',
    href: '/puzzles/jigsaw', 
    color: 'text-purple-600',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    category: 'Puzzles',
    Icon: Zap, // Brain might be better if Zap is too generic
    description: 'Test your memory by matching pairs of cards.',
    href: '/puzzles/memory',
    color: 'text-pink-600',
  },
  {
    id: 'number-puzzles',
    title: 'Number Puzzles',
    category: 'Learning',
    Icon: BookOpen, // Or Calculator icon
    description: 'Fun with numbers! Solve engaging math puzzles.',
    href: '/puzzles/numbers', 
    color: 'text-green-600',
  },
  {
    id: 'easy-english',
    title: 'Easy English Fun',
    category: 'Learning',
    Icon: BookMarked,
    description: 'Learn basic English words through fun, interactive puzzles!',
    href: '/puzzles/easy-english',
    color: 'text-indigo-500',
  },
];

export interface PuzzleType {
  id: string;
  name: string;
  Icon: LucideIcon;
  description: string;
  color?: string;
  href?: string;
  disabled?: boolean;
}

export const PUZZLE_TYPES: PuzzleType[] = [
  {
    id: 'jigsaw',
    name: 'Jigsaw Puzzles',
    Icon: Puzzle,
    description: 'Assemble pieces to form a picture. Drag and drop to solve!',
    color: 'text-purple-600',
    href: '/puzzles/jigsaw',
    disabled: false, 
  },
  {
    id: 'memory',
    name: 'Memory Match',
    Icon: Zap, // Consider Brain icon from lucide-react
    description: 'Find matching pairs of cards. Click to reveal!',
    color: 'text-pink-600',
    href: '/puzzles/memory',
    disabled: false,
  },
  {
    id: 'numbers',
    name: 'Number Puzzles',
    Icon: BookOpen, // Or Calculator
    description: 'Solve math and logic puzzles. Learn while you play!',
    color: 'text-green-600',
    href: '/puzzles/numbers',
    disabled: false,
  },
  {
    id: 'easy-english',
    name: 'Easy English Fun',
    Icon: BookMarked,
    description: 'Learn basic English words and improve typing skills.',
    color: 'text-indigo-500',
    href: '/puzzles/easy-english',
    disabled: false,
  },
];

// Define your avatar image paths here, relative to the /public directory
export const AVATARS: { src: string; alt: string; hint: string }[] = [
  { src: '/images/avatars/african_girl.png', alt: 'African girl avatar', hint: 'african girl' },
  { src: '/images/avatars/african_women.png', alt: 'African women avatar', hint: 'african women' },
  { src: '/images/avatars/indian_boy.png', alt: 'Indian boy avatar', hint: 'indian boy' },
  { src: '/images/avatars/indian_girl.png', alt: 'Indian girl avatar', hint: 'indian girl' },
  { src: '/images/avatars/indian_man.png', alt: 'Indian man avatar', hint: 'indian man' },
  { src: '/images/avatars/modern_girl.png', alt: 'Modern girl avatar', hint: 'modern girl' },
];

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Games', Icon: HomeIcon },
  { href: '/puzzles', label: 'Puzzles', Icon: Puzzle },
  { href: '/profile', label: 'Profile', Icon: UserCircle },
];

// Icons for Memory Match game
export const MEMORY_ICONS: LucideIcon[] = [
  Apple, Banana, Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2, ToyBrick, Gamepad2
];

// For Profile Progress Tab (Placeholder Icons)
export const CATEGORY_ICONS_MAP: Record<GameCategory, LucideIcon> = {
    Strategy: Brain,
    Puzzles: ToyBrick,
    Learning: BookOpen,
};

// Gamification
export const S_POINTS_ICON = StarIcon;
export const S_COINS_ICON = CoinsIcon;
export const LOCAL_STORAGE_S_POINTS_KEY = 'shravyaPlayhouse_sPoints';
export const LOCAL_STORAGE_S_COINS_KEY = 'shravyaPlayhouse_sCoins';

// Type for Number Puzzles
export interface MathPuzzleType {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

export const MATH_PUZZLE_TYPES: MathPuzzleType[] = [
  {
    id: "guessTheNumber",
    name: "Guess the Number",
    description: "I'm thinking of a number. Can you find it with the fewest guesses?",
    Icon: Target,
    color: "text-blue-500",
  },
  {
    id: "arithmeticChallenge",
    name: "Arithmetic Challenge",
    description: "Solve quick math problems. How many can you get right?",
    Icon: Calculator,
    color: "text-green-500",
  },
  {
    id: "numberSequence",
    name: "Number Sequence",
    description: "What comes next? Figure out the pattern in the number sequence.",
    Icon: ListOrdered,
    color: "text-purple-500",
  },
  {
    id: "missingNumber",
    name: "Missing Number",
    description: "Find the missing number in the sequence or equation.",
    Icon: Search,
    color: "text-orange-500",
  },
  {
    id: "countTheObjects",
    name: "Count the Objects",
    description: "How many items can you count on the screen?",
    Icon: Sigma,
    color: "text-pink-500",
  },
];

// Types for English Puzzles
export type EnglishPuzzleSubtype = 'matchWord' | 'missingLetter' | 'sentenceScramble' | 'oddOneOut' | 'typingRush';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface EnglishPuzzleType {
  id: EnglishPuzzleSubtype;
  name: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

export const ENGLISH_PUZZLE_TYPES: EnglishPuzzleType[] = [
    {
        id: "matchWord",
        name: "Match the Word",
        description: "Choose the correct word for the picture shown.",
        Icon: SpellCheck,
        color: "text-blue-500"
    },
    {
        id: "missingLetter",
        name: "Find Missing Letter",
        description: "Figure out which letter is missing to complete the word.",
        Icon: CaseLower,
        color: "text-green-500"
    },
    {
        id: "sentenceScramble",
        name: "Sentence Scramble",
        description: "Arrange the words to form a correct sentence.",
        Icon: AlignJustify,
        color: "text-orange-500"
    },
    {
        id: "oddOneOut",
        name: "Odd One Out",
        description: "Find the word that doesn't belong in the group.",
        Icon: Filter,
        color: "text-teal-500"
    },
    {
        id: "typingRush",
        name: "Typing Rush",
        description: "How fast can you type? Burst the falling bubbles!",
        Icon: Keyboard,
        color: "text-red-500",
    }
];

interface EnglishPuzzleItemBase {
  id: string;
  difficulty: Difficulty;
}

interface WordMatchPuzzle extends EnglishPuzzleItemBase {
  type: "matchWord";
  correctWord: string;
  options: string[];
  imageAlt: string;
  imageSrc: string;
}

interface MissingLetterPuzzle extends EnglishPuzzleItemBase {
  type: "missingLetter";
  wordPattern: string;
  correctLetter: string;
  options: string[];
  fullWord: string;
  hint: string;
}

interface SentenceScramblePuzzle extends EnglishPuzzleItemBase {
  type: "sentenceScramble";
  scrambledWords: string[];
  correctSentence: string;
}

interface OddOneOutPuzzle extends EnglishPuzzleItemBase {
  type: "oddOneOut";
  options: string[];
  correctAnswer: string;
  category: string; // e.g., "The others are all fruits."
}

export type EnglishPuzzleItem = WordMatchPuzzle | MissingLetterPuzzle | SentenceScramblePuzzle | OddOneOutPuzzle;
