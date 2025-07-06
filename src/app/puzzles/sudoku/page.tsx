
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3x3, RotateCw, Lightbulb, Check, ArrowLeft, Shield, Star, Gem } from 'lucide-react';
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
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const { toast } = useToast();

    const startGame = (diff: Difficulty) => {
        setDifficulty(diff);
        const { puzzle, solution: sol } = generatePuzzle(diff);
        setGrid(puzzle.map(row => [...row]));
        setInitialGrid(puzzle.map(row => [...row]));
        setSolution(sol);
        setSelectedCell(null);
        setIsComplete(false);
    };

    const handleCellClick = (row: number, col: number) => {
        if (initialGrid[row][col] === null) {
            setSelectedCell({ row, col });
        }
    };
    
    const handleNumberInput = (num: number) => {
        if (!selectedCell || isComplete) return;

        const { row, col } = selectedCell;
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = num;
        setGrid(newGrid);

        // Check for win condition
        const isSolved = newGrid.every((r, r_idx) => r.every((cell, c_idx) => cell === solution[r_idx][c_idx]));
        if (isSolved) {
            setIsComplete(true);
            toast({ title: "Congratulations!", description: "You solved the Sudoku puzzle!", className: "bg-green-500 text-white" });
        }
    };
    
    const handleErase = () => {
        if (!selectedCell || isComplete) return;
        const { row, col } = selectedCell;
        if (initialGrid[row][col] !== null) return;
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = null;
        setGrid(newGrid);
    };
    
    const solveOneCell = () => {
        if (isComplete) return;
        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === null) {
                    emptyCells.push({r, c});
                }
            }
        }
        if (emptyCells.length > 0) {
            const cellToSolve = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            handleNumberInput(solution[cellToSolve.r][cellToSolve.c]);
            if (selectedCell && selectedCell.row === cellToSolve.r && selectedCell.col === cellToSolve.c) {
                setSelectedCell(null);
            }
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
                            const isSelected = selectedCell?.row === r_idx && selectedCell?.col === c_idx;
                            const borderRight = (c_idx + 1) % 3 === 0 && c_idx < 8;
                            const borderBottom = (r_idx + 1) % 3 === 0 && r_idx < 8;

                            return (
                                <button 
                                    key={`${r_idx}-${c_idx}`} 
                                    onClick={() => handleCellClick(r_idx, c_idx)}
                                    className={cn(
                                        "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl",
                                        "border border-border/50",
                                        isInitial ? "font-bold text-foreground" : "text-primary cursor-pointer",
                                        isSelected && "bg-primary/20 ring-2 ring-primary z-10",
                                        borderRight && "border-r-2 border-r-primary/70",
                                        borderBottom && "border-b-2 border-b-primary/70",
                                        (r_idx === 0) && "border-t-2 border-t-primary/70",
                                        (c_idx === 0) && "border-l-2 border-l-primary/70"
                                    )}
                                >
                                    {cell}
                                </button>
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
                    <CardHeader><CardTitle>Controls</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({length: 9}, (_, i) => i + 1).map(num => (
                                <Button key={num} onClick={() => handleNumberInput(num)} disabled={isComplete}>{num}</Button>
                            ))}
                        </div>
                         <Button variant="destructive" className="w-full" onClick={handleErase} disabled={isComplete || !selectedCell}>Erase</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full" onClick={solveOneCell} disabled={isComplete}><Lightbulb className="mr-2"/> Hint</Button>
                        <Button variant="outline" className="w-full" onClick={() => startGame(difficulty)}><RotateCw className="mr-2"/> New Game</Button>
                        <Button variant="ghost" className="w-full" onClick={() => setDifficulty(null)}><ArrowLeft className="mr-2"/> Change Difficulty</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

