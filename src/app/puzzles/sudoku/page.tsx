
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3x3, RotateCw, Lightbulb, ArrowLeft, Shield, Star, Gem } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Difficulty = 'easy' | 'medium' | 'hard';
type SudokuGrid = (number | null)[][];

const generatePuzzle = (difficulty: Difficulty): { puzzle: SudokuGrid, solution: SudokuGrid } => {
    const baseGrid = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ];
    
    // Simple transformation for variety
    const solution = baseGrid.map(row => [...row].map(n => (n + difficulty.length) % 9 + 1));
    const puzzle = solution.map(row => [...row]);

    const cellsToRemove = { easy: 35, medium: 45, hard: 55 };
    let removed = 0;
    while (removed < cellsToRemove[difficulty]) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        if (puzzle[row][col] !== null) {
            puzzle[row][col] = null;
            removed++;
        }
    }
    return { puzzle, solution };
};

export default function SudokuPage() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [grid, setGrid] = useState<SudokuGrid>([]);
    const [initialGrid, setInitialGrid] = useState<SudokuGrid>([]);
    const [solution, setSolution] = useState<SudokuGrid>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [incorrectCells, setIncorrectCells] = useState<{ r: number, c: number }[]>([]);
    const { toast } = useToast();

    const startGame = (diff: Difficulty) => {
        setDifficulty(diff);
        const { puzzle, solution: sol } = generatePuzzle(diff);
        setGrid(puzzle.map(row => [...row]));
        setInitialGrid(puzzle.map(row => [...row]));
        setSolution(sol);
        setIsComplete(false);
        setIncorrectCells([]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
        if (isComplete) return;
    
        const value = e.target.value.replace(/[^1-9]/g, ''); // Only allow numbers 1-9
        const newGrid = grid.map(r => [...r]);
    
        if (value === '' || (value.length === 1)) {
            newGrid[row][col] = value === '' ? null : parseInt(value, 10);
            setGrid(newGrid);
    
            // Check for win condition if the board is full
            const isBoardFull = newGrid.every(r => r.every(cell => cell !== null));
            if (isBoardFull) {
                const isSolved = newGrid.every((r, r_idx) => r.every((cell, c_idx) => cell === solution[r_idx][c_idx]));
                if (isSolved) {
                    setIsComplete(true);
                    toast({ title: "Congratulations!", description: "You solved the Sudoku puzzle!", className: "bg-green-500 text-white" });
                }
            }
        }
    };
    
    const validateEntries = () => {
        if (isComplete) return;
    
        const errors: {r: number, c: number}[] = [];
        let userEntries = 0;
    
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                // Check only user-editable cells that have a value
                if (initialGrid[r][c] === null && grid[r][c] !== null) {
                    userEntries++;
                    if (grid[r][c] !== solution[r][c]) {
                        errors.push({ r, c });
                    }
                }
            }
        }
    
        if (userEntries === 0) {
            toast({ title: "No entries to validate", description: "Please enter some numbers first." });
            return;
        }
    
        if (errors.length > 0) {
            setIncorrectCells(errors);
            toast({ variant: "destructive", title: "Found Mistakes!", description: `${errors.length} incorrect number(s) marked in red.` });
            setTimeout(() => setIncorrectCells([]), 2000); // Clear highlighting after 2 seconds
        } else {
            toast({ title: "All Good!", description: "All your entries so far are correct. Keep going!", className: "bg-green-500 text-white" });
        }
    };

    if (!difficulty) {
        return (
             <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md text-center shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Sudoku Challenge</CardTitle>
                        <CardDescription>Select a difficulty to start.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4">
                        <Button onClick={() => startGame('easy')} className="text-lg py-6"><Shield className="mr-2"/> Easy</Button>
                        <Button onClick={() => startGame('medium')} className="text-lg py-6"><Star className="mr-2"/> Medium</Button>
                        <Button onClick={() => startGame('hard')} className="text-lg py-6"><Gem className="mr-2"/> Hard</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center p-4 gap-6">
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Sudoku</CardTitle>
                    <CardDescription className="text-center">Fill the grid with numbers from 1 to 9.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-9 bg-muted/30 p-1 rounded-md">
                        {grid.map((row, r_idx) => row.map((cell, c_idx) => {
                            const isInitial = initialGrid[r_idx][c_idx] !== null;
                            const borderRight = (c_idx + 1) % 3 === 0 && c_idx < 8;
                            const borderBottom = (r_idx + 1) % 3 === 0 && r_idx < 8;
                            const isIncorrect = incorrectCells.some(cell => cell.r === r_idx && cell.c === c_idx);

                            return (
                                <div 
                                    key={`${r_idx}-${c_idx}`} 
                                    className={cn(
                                        "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center",
                                        "border border-border/50",
                                        borderRight && "border-r-2 border-r-primary/70",
                                        borderBottom && "border-b-2 border-b-primary/70",
                                        (r_idx === 0) && "border-t-2 border-t-primary/70",
                                        (c_idx === 0) && "border-l-2 border-l-primary/70"
                                    )}
                                >
                                    {isInitial ? (
                                        <span className="font-bold text-foreground text-lg sm:text-xl">{cell}</span>
                                    ) : (
                                        <input
                                            type="text"
                                            value={cell || ''}
                                            onChange={(e) => handleInputChange(e, r_idx, c_idx)}
                                            className={cn(
                                                "w-full h-full bg-transparent text-center text-primary text-lg sm:text-xl font-semibold",
                                                "focus:outline-none focus:ring-2 focus:ring-primary z-10 rounded-sm",
                                                isIncorrect && "bg-red-500/30 text-red-700 animate-pulse"
                                            )}
                                            maxLength={1}
                                            pattern="[1-9]"
                                            disabled={isComplete}
                                        />
                                    )}
                                </div>
                            );
                        }))}
                    </div>
                </CardContent>
            </Card>
            
            <div className="w-full lg:w-64 space-y-4">
                 {isComplete && (
                    <Card className="bg-green-100 dark:bg-green-900/50 text-center p-4">
                        <h3 className="text-xl font-bold text-green-700 dark:text-green-300">You Win!</h3>
                    </Card>
                 )}
                 <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full" onClick={validateEntries} disabled={isComplete}><Lightbulb className="mr-2"/> Validate Answers</Button>
                        <Button variant="outline" className="w-full" onClick={() => startGame(difficulty)}><RotateCw className="mr-2"/> New Game</Button>
                        <Button variant="ghost" className="w-full" onClick={() => setDifficulty(null)}><ArrowLeft className="mr-2"/> Change Difficulty</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
