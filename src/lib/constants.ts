
import type { LucideIcon } from 'lucide-react';
import { 
    Crown, Puzzle, BookOpen, UserCircle, Settings, BarChart3, Zap, Apple, Banana, 
    Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2, Swords, Bot, Search, 
    Sigma, Brain, ToyBrick, Star as StarIcon, Coins as CoinsIcon, BookMarked, 
    Target, Calculator, ListOrdered, SpellCheck, CaseLower, AlignJustify, Filter, 
    Keyboard, Gamepad2, Languages, Mail, Heart, Hash, CircleDot,
    Grid3x3, Route, Blocks, KeyRound, LayoutGrid, XCircle, Dice6, Users, FileText,
    Trophy, Award, Compass, BrainCircuit, Shield, Palette, Volume2, PenSquare, 
    CalendarDays, Lightbulb, Ticket, Wand, Eye, FunctionSquare, Rocket, Globe,
    Spade, Flag, Dna, Bell, Info, Cpu, Ear
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
    Icon: Cpu, // Using Cpu icon to signify AI is available
    description: 'Play classic chess against a friend locally or challenge our AI opponent.',
    href: '/chess',
    color: 'text-sky-600',
  },
  {
    id: 'dots-and-boxes',
    title: 'Dots & Boxes',
    category: 'Strategy',
    Icon: PenSquare,
    description: 'Connect dots to form lines and claim boxes. A game of simple rules and deep strategy.',
    href: '/dots-and-boxes',
    color: 'text-orange-500',
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
    id: 'patternBuilder',
    title: 'Pattern Builder',
    category: 'Puzzles',
    Icon: Blocks,
    description: 'Recreate complex patterns from memory using fun icons.',
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
  {
    id: 'english-speaking',
    title: 'English Speaking',
    category: 'Learning',
    Icon: Ear,
    description: 'Practice speaking English with a friendly AI conversational partner.',
    href: '/speaking-practice',
    color: 'text-cyan-500',
  },
];

export interface SettingsMenuItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { href: '/contest', label: 'Monthly Contest', Icon: Ticket },
  { href: '/upcoming-features', label: 'Upcoming Features', Icon: Rocket },
  { href: '/settings/preferences', label: 'Theme & Preferences', Icon: Palette },
  { href: '#', label: 'Parental Controls', Icon: Shield },
];

export const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'JP', label: 'Japan' },
];

export const COUNTRY_CODES = [
  { value: '+91', label: 'IN +91' },
  { value: '+1', label: 'US +1' },
  { value: '+44', label: 'GB +44' },
  { value: '+61', label: 'AU +61' },
  { value: '+49', label: 'DE +49' },
  { value: '+81', label: 'JP +81' },
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
export const LOCAL_STORAGE_REWARD_HISTORY_KEY = 'shravyaPlayhouse_rewardHistory';

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
    id: "whatComesNext",
    name: "What Comes Next?",
    description: "Find the next or missing number by discovering the sequence's pattern.",
    Icon: Wand,
    color: "text-purple-500",
  },
  {
    id: "countTheObjects",
    name: "Count me if you can",
    description: "Find the target object among a field of distractors before time runs out.",
    Icon: Eye,
    color: "text-pink-500",
  },
  {
    id: "magicSquare",
    name: "Magic Square Builder",
    description: "Fill the grid so every row, column, and diagonal adds up to the same number.",
    Icon: FunctionSquare,
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
export type EnglishPuzzleSubtype = 'matchWord' | 'missingLetter' | 'sentenceScramble' | 'oddOneOut' | 'typingRush' | 'wordGrid' | 'crossword';
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
    },
    {
        id: "crossword",
        name: "Crossword Challenge",
        description: "Solve clues to fill in words. A classic test of vocabulary!",
        Icon: FileText,
        color: "text-gray-500"
    }
];

export const ODD_ONE_OUT_THEMES = [
    { id: 'colors', name: 'Colors', Icon: Palette, color: 'text-rose-500' },
    { id: 'cricket', name: 'Cricket', Icon: Trophy, color: 'text-blue-500' },
    { id: 'flowers', name: 'Flowers', Icon: Spade, color: 'text-pink-500' },
    { id: 'countries', name: 'Countries', Icon: Flag, color: 'text-green-500' },
    { id: 'science', name: 'Science', Icon: Dna, color: 'text-purple-500' },
    { id: 'general', name: 'General Knowledge', Icon: Globe, color: 'text-orange-500' },
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

// Profile Badges & Achievements
export interface Badge {
  id: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

export const BADGES: Badge[] = [
  {
    id: 'beginner-explorer',
    title: 'Beginner Explorer',
    description: 'Earn your first 100 S-Points.',
    Icon: Compass,
    color: 'text-green-500',
  },
  {
    id: 'star-starter',
    title: 'Star Starter',
    description: 'Win your very first game.',
    Icon: Award,
    color: 'text-yellow-500',
  },
  {
    id: 'puzzle-master',
    title: 'Puzzle Master',
    description: 'Win at least 3 different puzzle games.',
    Icon: BrainCircuit,
    color: 'text-purple-500',
  },
  {
    id: 'typing-titan',
    title: 'Typing Titan',
    description: 'Score 150 or more in Typing Rush.',
    Icon: Keyboard,
    color: 'text-red-500',
  },
  {
    id: 'strategy-sovereign',
    title: 'Strategy Sovereign',
    description: 'Win 5 games of Chess.',
    Icon: Crown,
    color: 'text-blue-500',
  },
];
