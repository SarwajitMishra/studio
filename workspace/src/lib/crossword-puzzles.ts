
// src/lib/crossword-puzzles.ts
import type { Difficulty } from './constants';

export interface CrosswordWord {
  clue: string;
  answer: string;
  direction: 'across' | 'down';
  row: number;
  col: number;
}

export interface CrosswordPuzzle {
  id: string;
  difficulty: Difficulty;
  gridSize: number;
  words: CrosswordWord[];
}

export const CROSSWORD_PUZZLES: CrosswordPuzzle[] = [
  // Easy Puzzle (7x7)
  {
    id: 'easy-1',
    difficulty: 'easy',
    gridSize: 7,
    words: [
      { clue: "Opposite of 'day'", answer: "NIGHT", direction: 'across', row: 1, col: 1 },
      { clue: "Not difficult", answer: "EASY", direction: 'across', row: 3, col: 3 },
      { clue: "Sound a cat makes", answer: "MEOW", direction: 'across', row: 5, col: 0 },
      { clue: "A friendly ghost", answer: "BOO", direction: 'down', row: 0, col: 6 },
      { clue: "A house for a dog", answer: "KENNEL", direction: 'down', row: 1, col: 1 },
      { clue: "Something you read", answer: "BOOK", direction: 'down', row: 3, col: 4 },
    ]
  },
  // Medium Puzzle (10x10)
  {
    id: 'medium-1',
    difficulty: 'medium',
    gridSize: 10,
    words: [
      { clue: "A place with books", answer: "LIBRARY", direction: 'across', row: 0, col: 2 },
      { clue: "What bees make", answer: "HONEY", direction: 'across', row: 2, col: 0 },
      { clue: "A big, yellow school vehicle", answer: "BUS", direction: 'across', row: 2, col: 6 },
      { clue: "Shines in the sky at night", answer: "MOON", direction: 'across', row: 4, col: 3 },
      { clue: "A type of fruit that is red or green", answer: "APPLE", direction: 'across', row: 6, col: 5 },
      { clue: "A doctor for animals", answer: "VET", direction: 'across', row: 8, col: 0 },
      { clue: "A yellow, long fruit", answer: "BANANA", direction: 'down', row: 0, col: 8 },
      { clue: "Opposite of cold", answer: "HOT", direction: 'down', row: 1, col: 2 },
      { clue: "Not fast", answer: "SLOW", direction: 'down', row: 2, col: 0 },
      { clue: "A small, biting insect", answer: "ANT", direction: 'down', row: 5, col: 5 },
      { clue: "You wear it on your foot", answer: "SHOE", direction: 'down', row: 6, col: 3 },
    ]
  },
  // Hard Puzzle (15x15)
  {
    id: 'hard-1',
    difficulty: 'hard',
    gridSize: 15,
    words: [
      { clue: "A large, intelligent marine mammal", answer: "DOLPHIN", direction: 'across', row: 0, col: 1 },
      { clue: "The study of stars and planets", answer: "ASTRONOMY", direction: 'across', row: 2, col: 5 },
      { clue: "A long, yellow vegetable", answer: "CORN", direction: 'across', row: 4, col: 0 },
      { clue: "A group of lions", answer: "PRIDE", direction: 'across', row: 4, col: 8 },
      { clue: "The planet we live on", answer: "EARTH", direction: 'across', row: 6, col: 4 },
      { clue: "A winter sport on snow", answer: "SKIING", direction: 'across', row: 8, col: 1 },
      { clue: "A sweet, sticky substance from trees", answer: "SAP", direction: 'across', row: 8, col: 10 },
      { clue: "A place where movies are made", answer: "STUDIO", direction: 'across', row: 10, col: 7 },
      { clue: "To travel in a spacecraft", answer: "ORBIT", direction: 'across', row: 12, col: 0 },
      { clue: "Not difficult", answer: "EASY", direction: 'across', row: 14, col: 5 },
      { clue: "A farm bird", answer: "ROOSTER", direction: 'down', row: 0, col: 7 },
      { clue: "A very large, grey animal with a trunk", answer: "ELEPHANT", direction: 'down', row: 1, col: 1 },
      { clue: "A person who flies a plane", answer: "PILOT", direction: 'down', row: 3, col: 13 },
      { clue: "To cook in an oven", answer: "BAKE", direction: 'down', row: 5, col: 3 },
      { clue: "A baby cat", answer: "KITTEN", direction: 'down', row: 7, col: 9 },
      { clue: "A bright, hot star", answer: "SUN", direction: 'down', row: 10, col: 0 },
      { clue: "To make a choice", answer: "DECIDE", direction: 'down', row: 9, col: 14 },
    ]
  },
];
