"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GAMES, BADGES, MATH_PUZZLE_TYPES, ENGLISH_PUZZLE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Info } from 'lucide-react';

const allGames = [...GAMES, ...MATH_PUZZLE_TYPES, ...ENGLISH_PUZZLE_TYPES];

const gameInstructions: Record<string, { title: string; instructions: string[] }> = {
  chess: { title: 'Chess', instructions: ['Objective: Checkmate the opponent\'s king.', 'Each piece has a unique movement pattern.', 'Capture opponent pieces by landing on their square.'] },
  'gobblet-gobblers': { title: 'Gobblet Gobblers', instructions: ['A tic-tac-toe style game.', 'Larger pieces can "gobble" and cover smaller ones.', 'Get three of your pieces in a row to win.'] },
  'tower-of-hanoi': { title: 'Tower of Hanoi', instructions: ['Move the entire stack of disks to another rod.', 'Rule 1: Only move one disk at a time.', 'Rule 2: A larger disk cannot be placed on a smaller one.'] },
  jigsaw: { title: 'Jigsaw Puzzles', instructions: ['Assemble the scattered pieces to reveal a complete picture.', 'Drag and drop pieces to connect them.', 'Solve puzzles of varying difficulty (9, 16, or 25 pieces).'] },
  memory: { title: 'Memory Matching', instructions: ['Find all the matching pairs of cards.', 'Click a card to flip it over.', 'Try to remember where each icon is located.'] },
  sudoku: { title: 'Sudoku Challenge', instructions: ['Fill the 9x9 grid with numbers from 1 to 9.', 'Each row, column, and 3x3 subgrid must contain each number exactly once.', 'Use logic to deduce the correct placement of numbers.'] },
  patternBuilder: { title: 'Pattern Builder', instructions: ['First, a pattern of icons will be shown for a few seconds. Memorize it.', 'Next, recreate the exact pattern on the empty grid.', 'Accuracy is key!'] },
  guessTheNumber: { title: 'Guess the Number', instructions: ['The computer thinks of a secret number within a given range.', 'Guess the number in as few attempts as possible.', 'You will receive "higher" or "lower" clues after each guess.'] },
  arithmeticChallenge: { title: 'Arithmetic Challenge', instructions: ['Solve a series of quick math problems.', 'Enter the correct answer for addition, subtraction, or multiplication.', 'Test your speed and accuracy!'] },
  typingRush: { title: 'Typing Rush', instructions: ['Words or letters will fall from the top of the screen.', 'Type them correctly on your keyboard before they reach the bottom.', 'Don\'t let too many get past you!'] },
  crossword: { title: 'Crossword Challenge', instructions: ['Solve clues to fill in words into a grid.', 'Words intersect, so correct answers help you solve other clues.', 'A classic test of vocabulary and knowledge.'] },
  wordGrid: { title: 'Word Grid', instructions: ['Find the hidden word in the grid of letters.', 'Click and drag over adjacent letters to form the word.', 'Use the hint to know what you\'re looking for.'] },
  codeBreaker: { title: 'Code Breaker', instructions: ['Deduce the secret code of colors using logic.', 'After each guess, feedback pegs will tell you how close you are.', 'A black peg means correct color and position. A white peg means correct color, wrong position.'] },
};


export default function InfoPage() {
    const appVersion = "0.1.0"; // Hardcoded version

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center py-6 bg-primary/10 rounded-lg shadow">
                <h1 className="text-4xl font-bold text-primary tracking-tight flex items-center justify-center gap-3">
                    <Info size={36} /> Shravya Playhouse Info Center
                </h1>
                <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
                    Everything you need to know about our games, mission, and achievements.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Our Mission & Vision</CardTitle>
                </CardHeader>
                <CardContent className="text-foreground/90 space-y-2">
                    <p>Our mission is to create a safe, vibrant, and engaging digital playground where kids can learn and grow through the power of play. We believe that games are a fantastic tool for fostering creativity, critical thinking, and a lifelong love for learning.</p>
                    <p>We are committed to providing high-quality, ad-free, and educational content that is as fun as it is beneficial.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Game Rules & Instructions</CardTitle>
                    <CardDescription>Click on any game to learn how to play.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allGames.map(game => (
                        <Dialog key={game.id}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-auto py-3 justify-start" disabled={game.disabled}>
                                    <game.Icon className={cn("mr-3 h-5 w-5", game.color)} />
                                    <span className="font-semibold">{game.title || game.name}</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <game.Icon className={cn("h-6 w-6", game.color)} /> {gameInstructions[game.id]?.title || game.title || game.name}
                                    </DialogTitle>
                                    <DialogDescription>{game.description}</DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <h3 className="font-semibold mb-2">How to Play:</h3>
                                    {gameInstructions[game.id] ? (
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                            {gameInstructions[game.id].instructions.map((inst, index) => (
                                                <li key={index}>{inst}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Detailed instructions for this game are coming soon!</p>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Badges & Achievements</CardTitle>
                    <CardDescription>Unlock these titles and badges by reaching milestones in the Playhouse!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ScrollArea className="h-72 w-full pr-4">
                        <div className="space-y-4">
                        {BADGES.map(badge => (
                             <div key={badge.id} className="flex items-start gap-4 p-3 border rounded-lg">
                                <badge.Icon size={40} className={cn("flex-shrink-0 mt-1", badge.color)} />
                                <div>
                                    <h4 className="font-bold text-foreground">{badge.title}</h4>
                                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            
            <div className="text-center text-sm text-muted-foreground">
                <p>Shravya Playhouse Version: {appVersion}</p>
            </div>
        </div>
    );
}
