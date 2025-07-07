
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LayoutGrid, ArrowLeft, RotateCw, SkipForward, Loader2, Award, Star as StarIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { updateGameStats } from "@/lib/progress";
import { getWordDefinition } from '@/ai/flows/get-word-definition-flow';
import { calculateRewards, applyRewards } from '@/lib/rewards';
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


interface WordGridGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

const DICTIONARY_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  easy: ["cat", "dog", "sun", "sky", "run", "joy", "fun", "key", "box", "cup", "car", "map", "pen", "hat", "bed"],
  medium: ["happy", "apple", "world", "play", "house", "smile", "friend", "water", "earth", "magic", "light", "dream", "voice", "space"],
  hard: ["journey", "adventure", "beautiful", "wonderful", "knowledge", "creative", "challenge", "strength", "believe", "explore", "imagine"],
};

const GRID_SIZE = 5;
const GAME_DURATION_S = 120; // 2 minutes

// This function tries to place a word on the grid.
const placeWordInGrid = (word: string): { grid: string[][], success: boolean } => {
    const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    const path: {r: number, c: number}[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]].sort(() => 0.5 - Math.random());

    function tryPlace(r: number, c: number, index: number): boolean {
        if (index === word.length) return true; // Word placed successfully
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || path.some(p => p.r === r && p.c === c)) return false;

        path.push({r, c});
        grid[r][c] = word[index].toUpperCase();

        for (const [dr, dc] of directions) {
            if (tryPlace(r + dr, c + dc, index + 1)) {
                return true;
            }
        }
        
        path.pop(); // Backtrack
        grid[r][c] = '';
        return false;
    }
    
    // Try placing the word starting from a random position
    const startPositions = Array(GRID_SIZE * GRID_SIZE).fill(0).map((_, i) => ({ r: Math.floor(i / GRID_SIZE), c: i % GRID_SIZE })).sort(() => 0.5 - Math.random());
    for(const {r,c} of startPositions){
        if(tryPlace(r, c, 0)){
             // Fill the rest of the grid with random letters
            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    if (grid[row][col] === '') {
                        grid[row][col] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
                    }
                }
            }
            return { grid, success: true };
        }
    }
    
    return { grid, success: false }; // Failed to place the word
};


export default function WordGridGame({ onBack, difficulty }: WordGridGameProps) {
  const [gameState, setGameState] = useState<"loading" | "playing" | "gameOver">("loading");
  const [grid, setGrid] = useState<string[][]>([]);
  const [currentPath, setCurrentPath] = useState<{r: number, c: number}[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [hint, setHint] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

  const { toast } = useToast();
  const usedWords = useRef(new Set<string>());

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const calculateStars = useCallback((finalScore: number): number => {
    const thresholds: Record<Difficulty, {oneStar: number, twoStars: number, threeStars: number}> = {
      easy: { oneStar: 3, twoStars: 6, threeStars: 10 },
      medium: { oneStar: 2, twoStars: 5, threeStars: 8 },
      hard: { oneStar: 1, twoStars: 3, threeStars: 5 },
    };
    const { oneStar, twoStars, threeStars } = thresholds[difficulty];
    if (finalScore >= threeStars) return 3;
    if (finalScore >= twoStars) return 2;
    if (finalScore >= oneStar) return 1;
    return 0;
  }, [difficulty]);

  const handleGameOver = useCallback(async (finalScore: number) => {
    setGameState("gameOver");
    setIsCalculatingReward(true);
    updateGameStats({ gameId: 'easy-english', didWin: finalScore > 0, score: finalScore });

    try {
        const rewards = await calculateRewards({ gameId: 'wordGrid', difficulty, performanceMetrics: { score: finalScore }});
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Finished Word Grid (${difficulty})`);
        const stars = calculateStars(finalScore);
        setLastReward({ points: earned.points, coins: earned.coins, stars });
    } catch(e) {
        console.error("Error calculating rewards:", e);
        toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
    } finally {
        setIsCalculatingReward(false);
    }
  }, [difficulty, toast, calculateStars]);
  
  const loadNextWord = useCallback(async (isSkip = false) => {
    setGameState("loading");
    setCurrentPath([]);
    setCurrentWord('');
    if (isSkip) {
        toast({ title: "Skipped!", description: `The word was "${secretWord}".`});
    }

    const dictionary = DICTIONARY_BY_DIFFICULTY[difficulty];
    const availableWords = dictionary.filter(w => !usedWords.current.has(w));
    
    if (availableWords.length === 0) {
      toast({ title: "Wow!", description: "You've gone through all the words for this difficulty!"});
      handleGameOver(score);
      return;
    }

    let word = availableWords[Math.floor(Math.random() * availableWords.length)];
    let placementResult = placeWordInGrid(word);
    
    let retries = 0;
    while(!placementResult.success && retries < 10) {
      word = availableWords[Math.floor(Math.random() * availableWords.length)];
      placementResult = placeWordInGrid(word);
      retries++;
    }

    if (!placementResult.success) {
        toast({ variant: "destructive", title: "Grid Error", description: "Couldn't create a new word grid. Please try again."});
        onBack();
        return;
    }

    usedWords.current.add(word);
    setSecretWord(word);
    setGrid(placementResult.grid);

    try {
      const definition = await getWordDefinition({ word });
      setHint(definition.definition);
    } catch (e) {
      console.error("Failed to get hint:", e);
      setHint("Could not load hint for this word.");
    }
    
    setGameState("playing");
  }, [difficulty, score, onBack, handleGameOver, secretWord, toast]);

  const resetGame = useCallback(() => {
    usedWords.current.clear();
    setScore(0);
    setTimeLeft(GAME_DURATION_S);
    setGameState("loading");
    loadNextWord();
  }, [loadNextWord]);

  useEffect(() => {
    if (gameState === "playing") {
        const timer = setTimeout(() => {
            if (timeLeft > 0) {
                setTimeLeft(t => t - 1)
            } else {
                handleGameOver(score);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [timeLeft, gameState, score, handleGameOver]);

  useEffect(() => {
    resetGame();
  }, [resetGame, difficulty]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== 'playing') return;
    
    const lastPos = currentPath[currentPath.length - 1];
    const isAlreadyInPath = currentPath.some(pos => pos.r === r && pos.c === c);

    if (isAlreadyInPath) return;

    if (currentPath.length > 0) {
      const isAdjacent = Math.abs(lastPos.r - r) <= 1 && Math.abs(lastPos.c - c) <= 1;
      if (!isAdjacent) return;
    }

    const newPath = [...currentPath, {r, c}];
    setCurrentPath(newPath);
    setCurrentWord(w => w + grid[r][c]);
  };
  
  const submitWord = () => {
    if (currentWord.toLowerCase() === secretWord) {
      setScore(s => s + 1);
      toast({ title: "Correct!", description: `You found "${secretWord}"!`, className: "bg-green-500 text-white" });
      loadNextWord();
    } else {
      toast({ variant: 'destructive', title: "Not quite!", description: `That's not the word. Keep trying!` });
      setCurrentPath([]);
      setCurrentWord('');
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
        <AlertDialog open={gameState === 'gameOver'}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                       <Award size={28} /> Time's Up!
                    </AlertDialogTitle>
                </AlertDialogHeader>
                 <div className="py-4 text-center">
                    {isCalculatingReward ? (
                        <div className="flex flex-col items-center justify-center gap-2 pt-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
                        </div>
                    ) : lastReward ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <StarRating rating={lastReward.stars} />
                            <AlertDialogDescription className="text-center text-base pt-2">
                                You found <strong className="text-lg text-accent">{score}</strong> words!
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
                    ) : null}
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
                    <LayoutGrid size={28} className="text-primary" />
                    <CardTitle className="text-2xl font-bold text-primary">Find the Word</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
            </div>
            <CardDescription className="text-center text-md text-foreground/80 pt-2 flex justify-between items-center px-2">
                <span>Score: {score}</span>
                <span>Time: {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
            </CardDescription>
            <Progress value={(timeLeft / GAME_DURATION_S) * 100} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
            {gameState === 'loading' ? (
                <div className='flex flex-col items-center justify-center h-[420px]'>
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading next word...</p>
                </div>
            ) : (
                <>
                    <div className="p-3 bg-yellow-100/70 border border-yellow-400/50 rounded-lg text-yellow-800 text-sm text-center min-h-[4rem]">
                        <strong>Hint:</strong> {hint}
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {grid.flat().map((letter, index) => {
                            const r = Math.floor(index / GRID_SIZE);
                            const c = index % GRID_SIZE;
                            const inPath = currentPath.some(pos => pos.r === r && pos.c === c);
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleCellClick(r, c)}
                                    className={cn("w-12 h-12 sm:w-14 sm:h-14 text-2xl font-bold border-2 rounded-lg flex items-center justify-center transition-colors",
                                    inPath ? "bg-yellow-400 border-yellow-600 text-white" : "bg-card hover:bg-muted"
                                    )}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>

                    <div className='text-center h-12 border rounded-lg flex items-center justify-center text-2xl font-mono tracking-widest bg-muted'>
                        {currentWord || "..."}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="destructive" className="w-full" onClick={() => { setCurrentPath([]); setCurrentWord(''); }}>Clear</Button>
                        <Button className="w-full bg-accent text-accent-foreground" onClick={submitWord} disabled={currentWord.length < secretWord.length}>Submit Word</Button>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => loadNextWord(true)}>
                        <SkipForward className="mr-2"/> Skip Word (New Grid)
                    </Button>
                </>
            )}
        </CardContent>
    </Card>
  );
}
