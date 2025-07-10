"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FunctionSquare, RotateCw, ArrowLeft, Loader2, Award, Star as StarIcon, Lightbulb, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { updateGameStats } from "@/lib/progress";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from "@/lib/constants";

interface MagicSquareGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

const DIFFICULTY_CONFIG = {
  easy: { size: 3, time: 180 }, // 3 minutes
  medium: { size: 4, time: 480 }, // 8 minutes
  hard: { size: 5, time: 900 }, // 15 minutes
};

const generateInitialGrid = (size: number): (number | null)[][] => {
    return Array(size).fill(null).map(() => Array(size).fill(null));
};

const getMagicSum = (size: number): number => {
    return size * (size * size + 1) / 2;
};

// This will be used to generate a valid, solved solution for the hint system.
const generateSolution = (n: number): number[][] => {
    const magicSquare: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    let i = Math.floor(n / 2);
    let j = n - 1;

    for (let num = 1; num <= n * n;) {
        if (i === -1 && j === n) {
            j = n - 2;
            i = 0;
        } else {
            if (j === n) j = 0;
            if (i < 0) i = n - 1;
        }
        if (magicSquare[i][j] !== 0) {
            j -= 2;
            i++;
            continue;
        } else {
            magicSquare[i][j] = num++;
        }
        j++;
        i--;
    }
    return magicSquare;
};


export default function MagicSquareGame({ onBack, difficulty }: MagicSquareGameProps) {
  const [config, setConfig] = useState(DIFFICULTY_CONFIG[difficulty]);
  const [grid, setGrid] = useState<(number | null)[][]>(generateInitialGrid(config.size));
  const [solution, setSolution] = useState<number[][]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.time);
  
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);
  const { toast } = useToast();

  const magicSum = getMagicSum(config.size);

  const resetGame = useCallback(() => {
    const newConfig = DIFFICULTY_CONFIG[difficulty];
    const newSize = newConfig.size;
    setConfig(newConfig);
    setGrid(generateInitialGrid(newSize));
    setSolution(generateSolution(newSize));
    setAvailableNumbers(Array.from({ length: newSize * newSize }, (_, i) => i + 1));
    setSelectedNumber(null);
    setIsGameOver(false);
    setIsWin(false);
    setTimeLeft(newConfig.time);
    setLastReward(null);
    setIsCalculatingReward(false);
  }, [difficulty]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const calculateStars = (timeRemaining: number): number => {
      const percentage = (timeRemaining / config.time) * 100;
      if (percentage >= 66) return 3;
      if (percentage >= 33) return 2;
      return 1;
  };

  const handleGameOver = useCallback(async (win: boolean) => {
    setIsGameOver(true);
    setIsWin(win);
    
    if (win) {
      setIsCalculatingReward(true);
      updateGameStats({ gameId: 'magicSquare', didWin: true, score: timeLeft });
      try {
        const rewards = await calculateRewards({
          gameId: 'magicSquare',
          difficulty,
          performanceMetrics: { timeRemaining: timeLeft, totalTime: config.time }
        });
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Solved Magic Square (${difficulty})`);
        const stars = calculateStars(timeLeft);
        setLastReward({ points: earned.points, coins: earned.coins, stars });
      } catch (e) {
        console.error("Reward calculation failed:", e);
        toast({ variant: 'destructive', title: 'Reward Error' });
      } finally {
        setIsCalculatingReward(false);
      }
    } else {
       updateGameStats({ gameId: 'magicSquare', didWin: false, score: 0 });
    }
  }, [timeLeft, config, difficulty, toast, calculateStars]);

  useEffect(() => {
    if (!isGameOver && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft <= 0 && !isGameOver) {
      handleGameOver(false);
    }
  }, [timeLeft, isGameOver, handleGameOver]);

  const checkWinCondition = useCallback((currentGrid: (number | null)[][]) => {
    const isFull = !currentGrid.flat().includes(null);
    if (!isFull) {
        toast({ variant: "destructive", title: "Incomplete", description: "Please fill all cells before submitting." });
        return false;
    }

    const sum = getMagicSum(config.size);
    let isCorrect = true;

    // Check rows and columns
    for (let i = 0; i < config.size; i++) {
      let rowSum = 0;
      let colSum = 0;
      for (let j = 0; j < config.size; j++) {
        rowSum += currentGrid[i][j]!;
        colSum += currentGrid[j][i]!;
      }
      if (rowSum !== sum || colSum !== sum) isCorrect = false;
    }

    // Check diagonals
    let diag1Sum = 0;
    let diag2Sum = 0;
    for (let i = 0; i < config.size; i++) {
      diag1Sum += currentGrid[i][i]!;
      diag2Sum += currentGrid[i][config.size - 1 - i]!;
    }
    if (diag1Sum !== sum || diag2Sum !== sum) isCorrect = false;
    
    return isCorrect;
  }, [config.size, toast]);

  const handleSubmit = () => {
    const isCorrect = checkWinCondition(grid);
    if (isCorrect) {
        handleGameOver(true);
    } else {
        toast({ variant: "destructive", title: "Not Quite", description: "The sums are not correct. Keep trying!" });
    }
  };


  const handleCellClick = (row: number, col: number) => {
    if (isGameOver) return;
    
    const newGrid = grid.map(r => [...r]);
    const numberInCell = newGrid[row][col];

    if (numberInCell !== null) {
        // Return the number to available numbers and clear the cell
        newGrid[row][col] = null;
        setGrid(newGrid);
        setAvailableNumbers(prev => [...prev, numberInCell].sort((a,b) => a-b));
    } else if (selectedNumber !== null) {
        // Place the selected number in the empty cell
        newGrid[row][col] = selectedNumber;
        setGrid(newGrid);
        setAvailableNumbers(prev => prev.filter(n => n !== selectedNumber));
        setSelectedNumber(null);
    }
  };

  const handleNumberSelect = (num: number) => {
    setSelectedNumber(num === selectedNumber ? null : num);
  };
  
  const handleHint = () => {
    if (isGameOver) return;
    
    const emptyCells: {r: number, c: number}[] = [];
    grid.forEach((row, r_idx) => {
        row.forEach((cell, c_idx) => {
            if (cell === null) {
                emptyCells.push({r: r_idx, c: c_idx});
            }
        });
    });

    if (emptyCells.length === 0) {
        toast({ title: "No hints needed", description: "The grid is full!"});
        return;
    }

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const correctNumber = solution[randomCell.r][randomCell.c];

    const newGrid = grid.map(r => [...r]);
    newGrid[randomCell.r][randomCell.c] = correctNumber;
    setGrid(newGrid);

    setAvailableNumbers(prev => prev.filter(n => n !== correctNumber));
    if (selectedNumber === correctNumber) {
        setSelectedNumber(null);
    }

    toast({ title: "Hint Used!", description: `The number ${correctNumber} has been placed for you.`});
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
        <AlertDialog open={isGameOver}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className={cn("text-2xl flex items-center justify-center gap-2", isWin ? 'text-green-600' : 'text-destructive')}>
                       <Award size={28} /> {isWin ? "You Solved It!" : "Time's Up!"}
                    </AlertDialogTitle>
                </AlertDialogHeader>
                 <div className="py-4 text-center">
                    {isWin ? (
                        isCalculatingReward ? (
                             <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        ) : lastReward ? (
                            <div className="flex flex-col items-center gap-3 text-center">
                                <StarRating rating={lastReward.stars} />
                                <AlertDialogDescription className="text-center text-base pt-2">
                                    Congratulations! You completed the Magic Square.
                                </AlertDialogDescription>
                                <div className="flex items-center gap-6 mt-2">
                                    <span className="flex items-center font-bold text-2xl">
                                        +{lastReward.points} <SPointsIcon className="ml-2 h-7 w-7 text-yellow-400" />
                                    </span>
                                    <span className="flex items-center font-bold text-2xl">
                                        +{lastReward.coins} <SCoinsIcon className="ml-2 h-7 w-7 text-amber-500" />
                                    </span>
                                </div>
                            </div>
                        ) : null
                    ) : (
                        <p className="text-lg">Better luck next time!</p>
                    )}
                 </div>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={resetGame} disabled={isCalculatingReward}>Play Again</AlertDialogAction>
                    <AlertDialogCancel onClick={onBack} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <FunctionSquare size={28} className="text-primary" />
                    <CardTitle className="text-2xl font-bold text-primary">Magic Square</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
            </div>
            <CardDescription className="text-center text-md text-foreground/80 pt-2 flex justify-between items-center px-2">
                 <span>Magic Sum: <strong className="text-accent">{magicSum}</strong></span>
                 <span className="capitalize">Difficulty: {difficulty}</span>
            </CardDescription>
             <Progress value={(timeLeft / config.time) * 100} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid gap-1 mx-auto" style={{ gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))` }}>
                {grid.map((row, r) => row.map((cell, c) => (
                    <button
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        disabled={isGameOver}
                        className={cn(
                          "w-14 h-14 sm:w-16 sm:h-16 text-2xl font-bold border-2 rounded-lg flex items-center justify-center transition-colors",
                          cell === null && selectedNumber !== null ? "bg-blue-100 hover:bg-blue-200 border-blue-400" : "bg-muted border-transparent",
                          cell !== null && "bg-background text-primary"
                        )}
                    >
                        {cell}
                    </button>
                )))}
            </div>

            <div className="space-y-2 pt-4 border-t">
                <p className="text-center font-medium text-muted-foreground">Available Numbers</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {availableNumbers.map(num => (
                        <Button
                            key={num}
                            variant={selectedNumber === num ? "default" : "outline"}
                            onClick={() => handleNumberSelect(num)}
                            disabled={isGameOver}
                            className="w-12 h-12 text-lg"
                        >
                            {num}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
                <Button onClick={handleSubmit} disabled={isGameOver} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2"/>Check Answer
                </Button>
                <Button onClick={handleHint} disabled={isGameOver} variant="outline">
                    <Lightbulb className="mr-2"/>Hint
                </Button>
                <Button onClick={resetGame} variant="destructive" className="col-span-2">
                    <RotateCw className="mr-2"/>Reset Game
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}