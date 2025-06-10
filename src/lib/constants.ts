
import type { LucideIcon } from 'lucide-react';
import { HomeIcon, LayoutGrid, Puzzle, BookOpen, UserCircle, Settings, BarChart3, Zap, Apple, Banana, Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2, Swords, Bot, Search, Sigma, Brain, ToyBrick, Star as StarIcon, Coins as CoinsIcon } from 'lucide-react';

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
];

export const AVATARS: { src: string; alt: string; hint: string }[] = [
  { src: '/images/avatars/avatar_sun.png', alt: 'Sun avatar', hint: 'sun happy' },
  { src: '/images/avatars/avatar_robot.png', alt: 'Robot avatar', hint: 'robot friendly' },
  { src: '/images/avatars/avatar_star.png', alt: 'Star avatar', hint: 'star cute' },
  { src: '/images/avatars/avatar_cat.png', alt: 'Cat avatar', hint: 'cat playful' },
  { src: '/images/avatars/avatar_dog.png', alt: 'Dog avatar', hint: 'dog loyal' },
  { src: '/images/avatars/avatar_alien.png', alt: 'Alien avatar', hint: 'alien space' },
  // Add more diverse avatars if available, e.g., different characters
  { src: '/images/avatars/modern_boy.png', alt: 'Modern Boy Avatar', hint: 'boy modern' },
  { src: '/images/avatars/modern_girl.png', alt: 'Modern Girl Avatar', hint: 'girl modern' },
];

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Games', Icon: HomeIcon },
  { href: '/puzzles', label: 'Puzzles', Icon: Puzzle },
  // Shravya AI is now a floating button, not a nav item
  { href: '/profile', label: 'Profile', Icon: UserCircle },
];

// Icons for Memory Match game
export const MEMORY_ICONS: LucideIcon[] = [
  Apple, Banana, Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2
];

// For Profile Progress Tab (Placeholder Icons)
export const CATEGORY_ICONS_MAP: Record<GameCategory, LucideIcon> = {
    Strategy: Brain,
    Puzzles: ToyBrick, // Puzzle icon is already used in nav, ToyBrick for variety
    Learning: BookOpen,
};

// Gamification
export const S_POINTS_ICON = StarIcon;
export const S_COINS_ICON = CoinsIcon;
export const LOCAL_STORAGE_S_POINTS_KEY = 'shravyaPlayhouse_sPoints';
export const LOCAL_STORAGE_S_COINS_KEY = 'shravyaPlayhouse_sCoins';
