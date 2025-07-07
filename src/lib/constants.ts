
import type { LucideIcon } from 'lucide-react';
import { 
    Crown, Puzzle, BookOpen, UserCircle, Settings, BarChart3, Zap, Apple, Banana, 
    Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2, Swords, Bot, Search, 
    Sigma, Brain, ToyBrick, Star as StarIcon, Coins as CoinsIcon, BookMarked, 
    Target, Calculator, ListOrdered, SpellCheck, CaseLower, AlignJustify, Filter, 
    Keyboard, Gamepad2, Languages, Lightbulb, Mail, Calendar, Heart, Hash, CircleDot,
    Grid3x3, Route, Blocks, KeyRound, LayoutGrid, XCircle
} from 'lucide-react';

export type GameCategory = 'Strategy' | 'Puzzles' | 'Learning';

export interface Game {
  id: string;
  title: string;
  category: GameCategory;
  Icon: LucideIcon;
  description: string;
  href: string;
  color?: string;
  disabled?: boolean;
}

export const GAMES: Game[] = [
  {
    id: 'chess',
    title: 'Chess',
    category: 'Strategy',
    Icon: Crown,
    description: 'Classic strategy board game. Sharpen your mind!',
    href: '/chess',
    color: 'text-sky-600',
  },
  {
    id: 'tower-of-hanoi',
    title: 'Tower of Hanoi',
    category: 'Strategy',
    Icon: ToyBrick,
    description: 'Solve the ancient puzzle by moving disks between towers.',
    href: '/tower-of-hanoi',
    color: 'text-teal-600',
  },
  {
    id: 'memory-maze',
    title: 'Memory Maze',
    category: 'Strategy',
    Icon: Route,
    description: 'Use short-term memory and path planning to navigate the maze.',
    href: '/memory-maze',
    color: 'text-cyan-600',
  },
   {
    id: '2048',
    title: '2048',
    category: 'Strategy',
    Icon: Hash,
    description: "Slide and merge matching numbers to form the 2048 tile.",
    href: '/2048',
    color: 'text-rose-500',
  },
  {
    id: 'jigsaw',
    title: 'Jigsaw Puzzles',
    category: 'Puzzles',
    Icon: Puzzle,
    description: 'Assemble pieces to form a picture. Drag and drop to solve!',
    color: 'text-purple-600',
    href: '/puzzles/jigsaw',
    disabled: false,
  },
  {
    id: 'memory',
    title: 'Memory Matching',
    category: 'Puzzles',
    Icon: Brain,
    description: 'Find matching pairs of cards. Click to reveal!',
    color: 'text-pink-600',
    href: '/puzzles/memory',
    disabled: false,
  },
  {
    id: 'sudoku',
    title: 'Sudoku Challenge',
    category: 'Puzzles',
    Icon: Grid3x3,
    description: 'A classic logic puzzle with numbers.',
    color: 'text-lime-600',
    href: '/puzzles/sudoku',
    disabled: false,
  },
  {
    id: 'pattern-builder',
    title: 'Pattern Builder',
    category: 'Puzzles',
    Icon: Blocks,
    description: 'Recreate complex patterns from memory.',
    color: 'text-rose-500',
    href: '/puzzles/pattern-builder',
    disabled: false,
  },
  {
    id: 'number-puzzles',
    title: 'Number Puzzles',
    category: 'Learning',
    Icon: Calculator,
    description: 'Solve math and logic puzzles. Learn while you play!',
    href: '/puzzles/numbers', 
    color: 'text-green-600',
  },
  {
    id: 'easy-english',
    title: 'Easy English Fun',
    category: 'Learning',
    Icon: Languages,
    description: 'Learn basic English words and improve typing skills!',
    href: '/puzzles/easy-english',
    color: 'text-indigo-500',
  },
];

export interface SettingsMenuItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { href: '#', label: 'Language', Icon: Languages },
  { href: '#', label: 'New Feature Requests', Icon: Lightbulb },
  { href: '#', label: 'Contact Us', Icon: Mail },
  { href: '#', label: 'Upcoming Features', Icon: Zap },
  { href: '#', label: 'Live Events', Icon: Calendar },
  { href: '#', label: 'Donation', Icon: Heart },
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
  {
    id: "codeBreaker",
    name: "Code Breaker",
    description: "Deduce the secret code using logic and clues.",
    Icon: KeyRound,
    color: "text-gray-500",
  },
  {
    id: "mathDuel",
    name: "Fast Math",
    description: "Find the answer to the problem in a grid of numbers!",
    Icon: Swords,
    color: "text-red-500",
  },
];

// Types for English Puzzles
export type EnglishPuzzleSubtype = 'matchWord' | 'missingLetter' | 'sentenceScramble' | 'oddOneOut' | 'typingRush' | 'wordGrid';
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
    },
    {
        id: "wordGrid",
        name: "Word Grid",
        description: "Find as many words as you can in a grid of letters.",
        Icon: LayoutGrid,
        color: "text-purple-500"
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

// Define your avatar image paths here, relative to the /public directory
export const AVATARS: { src: string; alt: string; hint: string }[] = [
  { src: '/images/avatars/african_girl.png', alt: 'African girl avatar', hint: 'african girl' },
  { src: '/images/avatars/african_women.png', alt: 'African women avatar', hint: 'african women' },
  { src: '/images/avatars/indian_boy.png', alt: 'Indian boy avatar', hint: 'indian boy' },
  { src: '/images/avatars/indian_girl.png', alt: 'Indian girl avatar', hint: 'indian girl' },
  { src: '/images/avatars/indian_man.png', alt: 'Indian man avatar', hint: 'indian man' },
  { src: '/images/avatars/modern_girl.png', alt: 'Modern girl avatar', hint: 'modern girl' },
];
