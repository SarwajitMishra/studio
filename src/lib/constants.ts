
import type { LucideIcon } from 'lucide-react';
import { HomeIcon, LayoutGrid, Puzzle, BookOpen, UserCircle, Settings, BarChart3, Zap, Apple, Banana, Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2 } from 'lucide-react';

export type GameCategory = 'Strategy' | 'Puzzles' | 'Learning';

export interface Game {
  id: string;
  title: string;
  category: GameCategory;
  Icon: LucideIcon;
  description: string;
  href: string;
  color?: string; // Optional color for the card or icon
}

export const GAMES: Game[] = [
  {
    id: 'chess',
    title: 'Chess',
    category: 'Strategy',
    Icon: LayoutGrid,
    description: 'Classic strategy board game. Sharpen your mind!',
    href: '/chess',
    color: 'text-sky-600', // Example color
  },
  {
    id: 'jigsaw',
    title: 'Jigsaw Puzzles',
    category: 'Puzzles',
    Icon: Puzzle,
    description: 'Piece together beautiful images. Fun for all ages!',
    href: '/puzzles#jigsaw', // Link to section within puzzles page
    color: 'text-purple-600',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    category: 'Puzzles',
    Icon: Zap, // Using Zap for quick thinking / memory
    description: 'Test your memory by matching pairs of cards.',
    href: '/puzzles/memory', // Updated link
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
  href?: string; // Make href optional or ensure all puzzles have one if linked
  disabled?: boolean;
}

export const PUZZLE_TYPES: PuzzleType[] = [
  { 
    id: 'jigsaw', 
    name: 'Jigsaw Puzzles', 
    Icon: Puzzle, 
    description: 'Assemble pieces to form a picture. Drag and drop to solve!',
    color: 'text-purple-600',
    href: '/puzzles/jigsaw', // Assuming a future page
    disabled: true,
  },
  { 
    id: 'memory', 
    name: 'Memory Match', 
    Icon: Zap, 
    description: 'Find matching pairs of cards. Click to reveal!',
    color: 'text-pink-600',
    href: '/puzzles/memory',
    disabled: false, // Enable this puzzle
  },
  { 
    id: 'numbers', 
    name: 'Number Puzzles', 
    Icon: BookOpen, 
    description: 'Solve math and logic puzzles. Learn while you play!',
    color: 'text-green-600',
    href: '/puzzles/numbers', // Assuming a future page
    disabled: true,
  },
];

export const AVATARS: { src: string; alt: string; hint: string }[] = [
  { src: 'https://placehold.co/100x100/FFD700/4A4A4A.png', alt: 'Avatar 1 - Cheerful Sun', hint: 'sun character' },
  { src: 'https://placehold.co/100x100/87CEEB/4A4A4A.png', alt: 'Avatar 2 - Friendly Cloud', hint: 'cloud character' },
  { src: 'https://placehold.co/100x100/90EE90/4A4A4A.png', alt: 'Avatar 3 - Smart Sprout', hint: 'plant character' },
  { src: 'https://placehold.co/100x100/FFB6C1/4A4A4A.png', alt: 'Avatar 4 - Playful Star', hint: 'star character' },
  { src: 'https://placehold.co/100x100/FFA07A/4A4A4A.png', alt: 'Avatar 5 - Brave Fox', hint: 'fox character' },
  { src: 'https://placehold.co/100x100/ADD8E6/4A4A4A.png', alt: 'Avatar 6 - Curious Owl', hint: 'owl character' },
];

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Games', Icon: HomeIcon },
  { href: '/chess', label: 'Chess', Icon: LayoutGrid },
  { href: '/puzzles', label: 'Puzzles', Icon: Puzzle },
  { href: '/profile', label: 'Profile', Icon: UserCircle },
];

// Icons for Memory Match game
export const MEMORY_ICONS: LucideIcon[] = [
  Apple, Banana, Cherry, Grape, Carrot, Pizza, CakeSlice, IceCream2
];
