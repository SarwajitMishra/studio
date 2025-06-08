
import type { LucideIcon } from 'lucide-react';
import { HomeIcon, LayoutGrid, Puzzle, BookOpen, UserCircle, Settings, BarChart3, Zap, Apple, Banana, Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2, Swords } from 'lucide-react';

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
    Icon: Swords, // Using Swords as a generic game icon, LayoutGrid might be better if more generic board needed
    description: 'Classic board game for 2-4 players. Roll the dice and race your tokens home!',
    href: '/ludo',
    color: 'text-emerald-600',
    // imageUrl: '/icons/ludo-icon.png', // If you have this image, place in public/icons/
  },
  {
    id: 'jigsaw',
    title: 'Jigsaw Puzzles',
    category: 'Puzzles',
    Icon: Puzzle,
    description: 'Piece together beautiful images. Fun for all ages!',
    href: '/puzzles#jigsaw', 
    color: 'text-purple-600',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    category: 'Puzzles',
    Icon: Zap, 
    description: 'Test your memory by matching pairs of cards.',
    href: '/puzzles/memory', 
    color: 'text-pink-600',
  },
  {
    id: 'number-puzzles',
    title: 'Number Puzzles',
    category: 'Learning',
    Icon: BookOpen,
    description: 'Fun with numbers! Solve engaging math puzzles.',
    href: '/puzzles#numbers',
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
    disabled: true,
  },
  { 
    id: 'memory', 
    name: 'Memory Match', 
    Icon: Zap, 
    description: 'Find matching pairs of cards. Click to reveal!',
    color: 'text-pink-600',
    href: '/puzzles/memory',
    disabled: false, 
  },
  { 
    id: 'numbers', 
    name: 'Number Puzzles', 
    Icon: BookOpen, 
    description: 'Solve math and logic puzzles. Learn while you play!',
    color: 'text-green-600',
    href: '/puzzles/numbers',
    disabled: true,
  },
];

// **IMPORTANT**:
// 1. Create a folder structure: public/images/avatars/
// 2. Place your avatar images (e.g., avatar_sun.png, avatar_robot.png) in this folder.
// 3. Update the `src`, `alt`, and `hint` properties below to match your actual image files and desired descriptions.
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
  { href: '/chess', label: 'Chess', Icon: LayoutGrid },
  { href: '/ludo', label: 'Ludo', Icon: Swords }, // Added Ludo to Nav
  { href: '/puzzles', label: 'Puzzles', Icon: Puzzle },
  { href: '/profile', label: 'Profile', Icon: UserCircle },
];

// Icons for Memory Match game
export const MEMORY_ICONS: LucideIcon[] = [
  Apple, Banana, Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2
];
