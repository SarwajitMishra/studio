
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, RotateCw, Lightbulb, CheckCircle, Award, Loader2, Star as StarIcon, Gem, Shield, ArrowLeft, List } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { S_COINS_ICON as SCoinsIcon, S_POINTS_ICON as SPointsIcon } from '@/lib/constants';
import type { Difficulty } from '@/lib/constants';
import { CROSSWORD_PUZZLES, type CrosswordPuzzle, type CrosswordWord } from '@/lib/crossword-puzzles';
import { updateGameStats } from '@/lib/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Cell {
  char: string | null;
  isBlock: boolean;
  number: number | null;
  words: {
    across?: number;
    down?: number;
  };
}

type Grid = Cell[][];

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; Icon: React.ElementType, gridSize: number, timeBonusMinutes: number }> = {
    easy: { label: "Easy", Icon: Shield, gridSize: 7, timeBonusMinutes: 5 },
    medium: { label: "Medium", Icon: StarIcon, gridSize: 10, timeBonusMinutes: 10 },
    hard: { label: "Hard", Icon: Gem, gridSize: 15, timeBonusMinutes: 20 },
};

export default function CrosswordPage() {
    const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameOver'>('setup');
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
    const [grid, setGrid] = useState<Grid>([]);
    const [userGrid, setUserGrid] = useState<string[][]>([]);
    const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
    const [activeDirection, setActiveDirection] = useState<'across' | 'down'>('across');
    const [hintsUsed, setHintsUsed] = useState(0);
    const [mistakesMade, setMistakesMade] = useState(false);
    const [isCalculatingReward, setIsCalculatingReward] = useState(false);
    const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);
    const { toast } = useToast();
    const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

    const createGridFromPuzzle = (p: CrosswordPuzzle): Grid => {
        const newGrid: Grid = Array(p.gridSize).fill(null).map(() => 
            Array(p.gridSize).fill(null).map(() => ({
                char: null,
                isBlock: true,
                number: null,
                words: {},
            }))
        );

        p.words.forEach((word, index) => {
            newGrid[word.row][word.col].number = index + 1;
            for (let i = 0; i < word.answer.length; i++) {
                const r = word.row + (word.direction === 'down' ? i : 0);
                const c = word.col + (word.direction === 'across' ? i : 0);
                if (newGrid[r] && newGrid[r][c]) {
                    newGrid[r][c].isBlock = false;
                    newGrid[r][c].words[word.direction] = index;
                }
            }
        });
        return newGrid;
    };

    const startGame = useCallback((diff: Difficulty) => {
        const puzzlesForDiff = CROSSWORD_PUZZLES.filter(p => p.difficulty === diff);
        const selectedPuzzle = puzzlesForDiff[Math.floor(Math.random() * puzzlesForDiff.length)];
        const newGrid = createGridFromPuzzle(selectedPuzzle);
        
        setDifficulty(diff);
        setPuzzle(selectedPuzzle);
        setGrid(newGrid);
        setUserGrid(Array(selectedPuzzle.gridSize).fill(null).map(() => Array(selectedPuzzle.gridSize).fill('')));
        inputRefs.current = Array(selectedPuzzle.gridSize).fill(null).map(() => Array(selectedPuzzle.gridSize).fill(null));
        setGameState('playing');
        setHintsUsed(0);
        setMistakesMade(false);
        setActiveCell(null);
        setLastReward(null);
        setIsCalculatingReward(false);
    }, []);

    const handleCellClick = (row: number, col: number) => {
        if (grid[row][col].isBlock) return;
        
        const currentWords = grid[row][col].words;
        let newDirection = activeDirection;
        if (activeCell?.row === row && activeCell?.col === col) {
            // Toggle direction if the same cell is clicked again and has both directions
            if (currentWords.across !== undefined && currentWords.down !== undefined) {
                newDirection = activeDirection === 'across' ? 'down' : 'across';
            }
        } else if (currentWords.across === undefined) {
             newDirection = 'down';
        } else if (currentWords.down === undefined) {
            newDirection = 'across';
        }

        setActiveCell({ row, col });
        setActiveDirection(newDirection);
        inputRefs.current[row][col]?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
        const val = e.target.value.toUpperCase().slice(0, 1);
        const newUserGrid = userGrid.map(r => [...r]);
        newUserGrid[row][col] = val;
        setUserGrid(newUserGrid);
        
        if(val.length > 0) {
            // Auto-advance
            if (activeDirection === 'across' && col + 1 < grid.length && !grid[row][col + 1].isBlock) {
                inputRefs.current[row][col + 1]?.focus();
                setActiveCell({row, col: col + 1});
            } else if (activeDirection === 'down' && row + 1 < grid.length && !grid[row + 1][col].isBlock) {
                inputRefs.current[row + 1][col]?.focus();
                 setActiveCell({row: row + 1, col});
            }
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
        let newRow = row, newCol = col;
        switch(e.key) {
            case 'ArrowUp': e.preventDefault(); newRow = Math.max(0, row - 1); break;
            case 'ArrowDown': e.preventDefault(); newRow = Math.min(grid.length - 1, row + 1); break;
            case 'ArrowLeft': e.preventDefault(); newCol = Math.max(0, col - 1); break;
            case 'ArrowRight': e.preventDefault(); newCol = Math.min(grid.length - 1, col + 1); break;
            case 'Backspace':
                 if (userGrid[row][col] === '') {
                     e.preventDefault();
                     if (activeDirection === 'across' && col > 0) newCol = col - 1;
                     else if (activeDirection === 'down' && row > 0) newRow = row - 1;
                 }
                break;
        }
        if (newRow !== row || newCol !== col) {
            if(!grid[newRow][newCol].isBlock) {
                 inputRefs.current[newRow][newCol]?.focus();
                 setActiveCell({row: newRow, col: newCol});
            }
        }
    };
    
    const handleHint = () => {
        if (!puzzle || !activeCell) {
            toast({ title: "No cell selected", description: "Click a word to get a hint."});
            return;
        }
        const activeWordIndex = grid[activeCell.row][activeCell.col].words[activeDirection];
        if (activeWordIndex === undefined) return;
        
        const word = puzzle.words[activeWordIndex];
        const newUserGrid = userGrid.map(r => [...r]);
        let hintApplied = false;

        for (let i = 0; i < word.answer.length; i++) {
            const r = word.row + (word.direction === 'down' ? i : 0);
            const c = word.col + (word.direction === 'across' ? i : 0);
            if (newUserGrid[r][c] === '') {
                newUserGrid[r][c] = word.answer[i];
                hintApplied = true;
                break;
            }
        }
        
        if(hintApplied) {
            setUserGrid(newUserGrid);
            setHintsUsed(h => h + 1);
            toast({ title: "Hint Used!", description: "A letter has been revealed."});
        } else {
             toast({ title: "No Hint Needed", description: "This word is already full."});
        }
    };

    const handleCheckPuzzle = async () => {
        if (!puzzle) return;

        let totalWords = puzzle.words.length;
        let correctWords = 0;
        let isPerfect = true;
        let allFilled = true;
        
        puzzle.words.forEach(word => {
            let userWord = '';
            for (let i = 0; i < word.answer.length; i++) {
                const r = word.row + (word.direction === 'down' ? i : 0);
                const c = word.col + (word.direction === 'across' ? i : 0);
                userWord += userGrid[r][c] || ' ';
                if(userGrid[r][c] === '') allFilled = false;
            }
            if(userWord.toUpperCase() === word.answer) {
                correctWords++;
            } else {
                isPerfect = false;
            }
        });

        if (!allFilled) {
             toast({ variant: 'destructive', title: "Puzzle Incomplete", description: "Please fill all cells before checking."});
             setMistakesMade(true);
             return;
        }
        
        if (isPerfect) setMistakesMade(false);

        if (correctWords === totalWords) {
            setGameState('gameOver');
            setIsCalculatingReward(true);
            const finalPerfect = isPerfect && hintsUsed === 0;
            updateGameStats({ gameId: 'crossword', didWin: true, score: 100 });
            
            try {
                const rewards = await calculateRewards({ 
                    gameId: 'crossword', 
                    difficulty: difficulty!,
                    performanceMetrics: {
                        isPerfect: finalPerfect,
                        wordsFound: totalWords,
                        puzzleCompleted: true,
                        hintsUsed: hintsUsed,
                    }
                });
                
                let totalPoints = rewards.sPoints;
                if (hintsUsed > 0) {
                    totalPoints -= (hintsUsed * 5);
                }

                const earned = applyRewards(totalPoints, rewards.sCoins, "Completed Crossword Puzzle");
                setLastReward({ points: earned.points, coins: earned.coins, stars: finalPerfect ? 3 : (correctWords/totalWords > 0.8 ? 2 : 1) });
            } catch (e) {
                console.error("Error calculating rewards:", e);
                toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
            } finally {
                setIsCalculatingReward(false);
            }
        } else {
             setMistakesMade(true);
             toast({ variant: 'destructive', title: "Not Quite!", description: `${totalWords - correctWords} word(s) are incorrect. Keep trying!` });
        }
    };
    
    if(gameState === 'setup') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md text-center shadow-xl">
                     <CardHeader className="bg-primary/10 text-center">
                        <CardTitle className="text-3xl font-bold text-primary">Crossword Challenge</CardTitle>
                        <CardDescription>Select a difficulty to start.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 p-6">
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                            const config = DIFFICULTY_CONFIG[d];
                            return (<Button key={d} onClick={() => startGame(d)} className="text-lg py-6 capitalize">
                                <config.Icon className="mr-2" />
                                {d} ({config.gridSize}x{config.gridSize})
                            </Button>)
                        })}
                    </CardContent>
                     <CardFooter>
                        <Button asChild variant="ghost" className="w-full">
                            <Link href="/puzzles"><ArrowLeft className="mr-2"/> Back to All Puzzles</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if(!puzzle) return <Loader2 className="animate-spin" />;

    const activeWordIndex = activeCell ? grid[activeCell.row][activeCell.col].words[activeDirection] : undefined;
    const activeClue = activeWordIndex !== undefined ? `${activeWordIndex+1} ${activeDirection}: ${puzzle.words[activeWordIndex].clue}` : "Click a cell to see a clue.";

    const ClueList = ({ puzzle, inDialog = false }: { puzzle: CrosswordPuzzle, inDialog?: boolean }) => {
        return (
            <Card className={cn("shadow-lg", inDialog && "shadow-none border-none h-full")}>
                <Tabs defaultValue="across" className={cn("w-full", inDialog && "flex flex-col h-full")}>
                    <CardHeader className={cn(inDialog && "p-4 flex-shrink-0")}>
                        {!inDialog && <CardTitle>Clues List</CardTitle>}
                         <TabsList className="grid w-full grid-cols-2 mt-2">
                            <TabsTrigger value="across">Across</TabsTrigger>
                            <TabsTrigger value="down">Down</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent className={cn("p-2 sm:p-4", inDialog && "flex-grow overflow-hidden p-0")}>
                        <TabsContent value="across" className={cn(inDialog && "h-full m-0")}>
                            <ScrollArea className={cn("pr-3", inDialog ? "h-full p-4" : "h-[300px] md:h-[450px]")}>
                                <ul className="space-y-2 text-sm">
                                {puzzle.words.filter(w => w.direction === 'across').sort((a,b) => (puzzle.words.indexOf(a)) - (puzzle.words.indexOf(b))).map((w) => <li key={`across-${puzzle.words.indexOf(w)}`} className="p-1"><strong>{puzzle.words.indexOf(w)+1}.</strong> {w.clue}</li>)}
                                </ul>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="down" className={cn(inDialog && "h-full m-0")}>
                             <ScrollArea className={cn("pr-3", inDialog ? "h-full p-4" : "h-[300px] md:h-[450px]")}>
                                <ul className="space-y-2 text-sm">
                                {puzzle.words.filter(w => w.direction === 'down').sort((a,b) => (puzzle.words.indexOf(a)) - (puzzle.words.indexOf(b))).map((w) => <li key={`down-${puzzle.words.indexOf(w)}`} className="p-1"><strong>{puzzle.words.indexOf(w)+1}.</strong> {w.clue}</li>)}
                                </ul>
                            </ScrollArea>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row items-start justify-center p-2 md:p-4 gap-6">
             <AlertDialog open={gameState === 'gameOver'}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
                       <Award size={28} /> Puzzle Solved!
                    </AlertDialogTitle>
                    </AlertDialogHeader>
                     <div className="py-4 text-center">
                        {isCalculatingReward ? (
                             <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        ) : lastReward ? (
                             <div className="flex flex-col items-center gap-3 text-center">
                                <p className="text-lg text-muted-foreground">You solved the puzzle!</p>
                                <div className="flex items-center gap-6 mt-2">
                                    <span className="flex items-center font-bold text-2xl">
                                        +{lastReward.points} <SPointsIcon className="ml-2 h-7 w-7 text-yellow-400" />
                                    </span>
                                    <span className="flex items-center font-bold text-2xl">
                                        +{lastReward.coins} <SCoinsIcon className="ml-2 h-7 w-7 text-amber-500" />
                                    </span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => startGame(difficulty!)} disabled={isCalculatingReward}>New Puzzle</AlertDialogAction>
                        <AlertDialogCancel onClick={() => setGameState('setup')} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Left Column: Grid and Actions */}
            <div className="w-full lg:w-auto space-y-4">
                 <div className="w-full max-w-md mx-auto p-1 sm:p-2 bg-card rounded-lg shadow-lg">
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${puzzle.gridSize}, minmax(0, 1fr))` }}>
                        {grid.map((row, r) => row.map((cell, c) => {
                            const isActiveWord = activeWordIndex !== undefined && cell.words[activeDirection] === activeWordIndex;
                            const isActiveCell = activeCell?.row === r && activeCell?.col === c;

                            if (cell.isBlock) {
                                return <div key={`${r}-${c}`} className="aspect-square bg-primary/80" />;
                            }
                            
                            return (
                                <div key={`${r}-${c}`} className="relative aspect-square">
                                    {cell.number && <span className="absolute top-0.5 left-0.5 text-muted-foreground select-none text-[8px] sm:text-[10px] md:text-xs">{cell.number}</span>}
                                    <input
                                        ref={el => { if (el) inputRefs.current[r][c] = el; }}
                                        type="text"
                                        maxLength={1}
                                        className={cn(
                                            "w-full h-full p-0 border border-primary/30 text-center uppercase font-bold text-base sm:text-lg md:text-xl text-primary bg-background focus:z-10 focus:ring-2 focus:ring-accent focus:outline-none",
                                            isActiveWord && "bg-accent/20",
                                            isActiveCell && "ring-2 ring-accent"
                                        )}
                                        value={userGrid[r]?.[c] || ''}
                                        onClick={() => handleCellClick(r, c)}
                                        onChange={(e) => handleInputChange(e, r, c)}
                                        onKeyDown={(e) => handleKeyDown(e, r, c)}
                                        disabled={gameState === 'gameOver'}
                                    />
                                </div>
                            );
                        }))}
                    </div>
                </div>

                <Card className="shadow-lg">
                    <CardHeader><CardTitle>Clue</CardTitle></CardHeader>
                    <CardContent><p className="min-h-[40px] text-muted-foreground font-semibold">{activeClue}</p></CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <Button onClick={handleCheckPuzzle}><CheckCircle className="mr-2"/>Check Puzzle</Button>
                        <Button onClick={handleHint} variant="outline"><Lightbulb className="mr-2"/>Use Hint</Button>
                        <Button onClick={() => startGame(difficulty!)} variant="destructive" className="col-span-2"><RotateCw className="mr-2"/>Reset</Button>
                    </CardContent>
                </Card>

                 {/* Mobile-only button to show clues */}
                 <div className="lg:hidden">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full"><List className="mr-2"/> View All Clues</Button>
                        </DialogTrigger>
                        <DialogContent className="h-[80vh] flex flex-col p-0 sm:p-0">
                             <DialogHeader className="p-4 border-b">
                                <DialogTitle>All Clues</DialogTitle>
                                <DialogDescription>
                                    Use the tabs to switch between Across and Down clues.
                                </DialogDescription>
                             </DialogHeader>
                             <div className="flex-grow overflow-hidden">
                                <ClueList puzzle={puzzle} inDialog />
                             </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            {/* Right Column: Clue Lists (Desktop Only) */}
            <div className="w-full lg:max-w-md hidden lg:block">
                 <ClueList puzzle={puzzle} />
            </div>
        </div>
    );
}
