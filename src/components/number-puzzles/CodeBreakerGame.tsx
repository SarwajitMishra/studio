
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { KeyRound, ArrowLeft, RotateCw, Check, Award, XCircle, HelpCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { updateGameStats } from "@/lib/progress";

type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const COLOR_MAP: Record<Color, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

const DIFFICULTY_CONFIG = {
  easy: { codeLength: 4, numColors: 4, maxGuesses: 10, allowDuplicates: false },
  medium: { codeLength: 4, numColors: 6, maxGuesses: 8, allowDuplicates: true },
  hard: { codeLength: 5, numColors: 6, maxGuesses: 8, allowDuplicates: true },
};

interface Guess {
  code: (Color | null)[];
  feedback: { correctPosition: number; correctColor: number };
}

interface CodeBreakerGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

export default function CodeBreakerGame({ onBack, difficulty }: CodeBreakerGameProps) {
  const [config, setConfig] = useState(DIFFICULTY_CONFIG[difficulty]);
  const [secretCode, setSecretCode] = useState<Color[]>([]);
  const [currentGuess, setCurrentGuess] = useState<(Color | null)[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const { toast } = useToast();

  const generateSecretCode = useCallback(() => {
    const localConfig = DIFFICULTY_CONFIG[difficulty]; // Use fresh config
    const availableColors = COLORS.slice(0, localConfig.numColors);
    let newSecret: Color[] = [];
    if (localConfig.allowDuplicates) {
        for (let i = 0; i < localConfig.codeLength; i++) {
            newSecret.push(availableColors[Math.floor(Math.random() * availableColors.length)]);
        }
    } else {
        newSecret = [...availableColors].sort(() => 0.5 - Math.random()).slice(0, localConfig.codeLength);
    }
    setSecretCode(newSecret);
  }, [difficulty]);

  const resetGame = useCallback(() => {
    const newConfig = DIFFICULTY_CONFIG[difficulty];
    setConfig(newConfig);
    setCurrentGuess(Array(newConfig.codeLength).fill(null));
    setGuesses([]);
    setIsGameOver(false);
    setIsWin(false);
    generateSecretCode();
  }, [difficulty, generateSecretCode]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleBackClick = () => {
    if (guesses.length > 0 && !isGameOver) {
      updateGameStats({ gameId: 'codeBreaker', didWin: false, score: 0 });
    }
    onBack();
  };

  const handleColorSelect = (color: Color) => {
    if (isGameOver) return;
    const firstEmptyIndex = currentGuess.findIndex(c => c === null);
    if (firstEmptyIndex !== -1) {
      const newGuess = [...currentGuess];
      newGuess[firstEmptyIndex] = color;
      setCurrentGuess(newGuess);
    }
  };

  const handleGuessPegClick = (index: number) => {
    if (isGameOver || currentGuess[index] === null) return;
    const newGuess = [...currentGuess];
    newGuess[index] = null;
    setCurrentGuess(newGuess);
  };
  
  const submitGuess = () => {
    if (currentGuess.some(c => c === null)) {
        toast({ variant: 'destructive', title: "Incomplete Guess", description: "Please fill all slots before submitting."});
        return;
    }

    let tempSecret = [...secretCode];
    let tempGuess = [...(currentGuess as Color[])];
    let correctPosition = 0;
    let correctColor = 0;

    // First pass: check for correct color and position (black pegs)
    for (let i = 0; i < tempGuess.length; i++) {
      if (tempGuess[i] === tempSecret[i]) {
        correctPosition++;
        // Mark as used so they are not checked again
        tempSecret[i] = 'used-secret' as any;
        tempGuess[i] = 'used-guess' as any;
      }
    }

    // Second pass: check for correct color in wrong position (white pegs)
    for (let i = 0; i < tempGuess.length; i++) {
      if (tempGuess[i] !== 'used-guess') {
        const colorIndexInSecret = tempSecret.indexOf(tempGuess[i]);
        if (colorIndexInSecret !== -1) {
          correctColor++;
          tempSecret[colorIndexInSecret] = 'used-secret' as any; // Mark as used
        }
      }
    }

    const newGuesses = [...guesses, { code: currentGuess, feedback: { correctPosition, correctColor } }];
    setGuesses(newGuesses);
    setCurrentGuess(Array(config.codeLength).fill(null));

    if (correctPosition === config.codeLength) {
      setIsGameOver(true);
      setIsWin(true);
      updateGameStats({ gameId: 'codeBreaker', didWin: true, score: config.maxGuesses - newGuesses.length });
      toast({ title: "You Won!", description: `You cracked the code in ${newGuesses.length} guesses!`, className: "bg-green-500 text-white" });
    } else if (newGuesses.length >= config.maxGuesses) {
      setIsGameOver(true);
      setIsWin(false);
      updateGameStats({ gameId: 'codeBreaker', didWin: false, score: 0 });
      toast({ variant: 'destructive', title: "Game Over", description: "You've run out of guesses." });
    }
  };


  return (
    <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <KeyRound size={28} className="text-primary" />
                    <CardTitle className="text-2xl font-bold text-primary">Code Breaker</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                    <Dialog>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><HelpCircle size={20} /></Button>
                                    </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>How to Play</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>How to Play Code Breaker</DialogTitle>
                                <DialogDescription>
                                    Your goal is to guess the secret code of colors.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4 text-sm">
                                <p>1. Select colors from the palette to fill your guess row.</p>
                                <p>2. Once the row is full, press "Submit Guess".</p>
                                <p>3. You will get feedback pegs for each guess:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-black border-2 border-white/50" /> = Correct Color & Correct Position</strong></li>
                                    <li><strong className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-white border-2 border-black/50" /> = Correct Color, Wrong Position</strong></li>
                                </ul>
                                <p>4. Use the feedback to deduce the secret code before you run out of guesses!</p>
                                <p>Note: On Medium/Hard, colors can be repeated in the secret code.</p>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={handleBackClick}>
                        <ArrowLeft size={16} className="mr-1" /> Back
                    </Button>
                </div>
            </div>
            <CardDescription className="text-center text-md text-foreground/80 pt-2">
               {isGameOver ? (isWin ? "You cracked it!" : "Better luck next time!") : `Guess ${guesses.length + 1} of ${config.maxGuesses}`} | Difficulty: <span className="capitalize">{difficulty}</span>
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
            {/* Guess History Board */}
            <div className="p-2 border rounded-lg bg-muted/50 space-y-1 h-72">
                 <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground px-1 border-b pb-1">
                    <span>Guess</span>
                    <span>Feedback</span>
                </div>
                 <ScrollArea className="h-64 pr-2">
                    <div className="space-y-2 py-1">
                        <TooltipProvider>
                            {guesses.map((guess, index) => (
                                <div key={index} className="flex items-center justify-between p-1 bg-background rounded shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-mono text-muted-foreground w-4">{index + 1}.</span>
                                        {guess.code.map((color, i) => <div key={i} className={cn("w-5 h-5 rounded-full border", color ? COLOR_MAP[color] : 'bg-muted')} />)}
                                    </div>
                                    <div className="grid grid-cols-3 gap-0.5 w-12">
                                        {Array(guess.feedback.correctPosition).fill(0).map((_, i) => (
                                            <Tooltip key={`cp-${i}`}>
                                                <TooltipTrigger><div className="w-3 h-3 rounded-full bg-black border border-white/50" /></TooltipTrigger>
                                                <TooltipContent><p>Correct Color & Position</p></TooltipContent>
                                            </Tooltip>
                                        ))}
                                        {Array(guess.feedback.correctColor).fill(0).map((_, i) => (
                                            <Tooltip key={`cc-${i}`}>
                                                <TooltipTrigger><div className="w-3 h-3 rounded-full bg-white border border-black/50" /></TooltipTrigger>
                                                <TooltipContent><p>Correct Color, Wrong Position</p></TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </TooltipProvider>
                        {guesses.length === 0 && <p className="text-center text-muted-foreground pt-24">Guess history appears here.</p>}
                    </div>
                </ScrollArea>
            </div>
            
            {isGameOver ? (
                 <div className="text-center p-4 bg-muted rounded-lg space-y-3">
                    {isWin ? <Award size={48} className="mx-auto text-yellow-500" /> : <XCircle size={48} className="mx-auto text-destructive" />}
                    <h3 className={cn("text-2xl font-bold", isWin ? "text-green-700" : "text-destructive")}>{isWin ? "You cracked the code!" : "Game Over"}</h3>
                    <div className="flex items-center justify-center gap-2">
                      <p>The code was:</p>
                      <div className="flex gap-2">{secretCode.map((c, i) => <div key={i} className={cn("w-6 h-6 rounded-full shadow-inner", COLOR_MAP[c])} />)}</div>
                    </div>
                    <Button onClick={resetGame} className="mt-4"><RotateCw className="mr-2" /> Play Again</Button>
                </div>
            ): (
                 <>
                {/* Current Guess Input */}
                <div className="p-2 border-2 border-primary/20 border-dashed rounded-lg space-y-2">
                     <p className="text-xs text-center text-muted-foreground">Your Guess (Click a slot to remove a color)</p>
                    <div className="flex items-center justify-center gap-2">
                        {currentGuess.map((color, index) => (
                            <button key={index} onClick={() => handleGuessPegClick(index)} className={cn("w-8 h-8 rounded-full border-2 transition-transform hover:scale-105", color ? COLOR_MAP[color] : 'bg-background')}>
                                {!color && <span className="text-xs text-muted-foreground">{index + 1}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                 {/* Color Palette */}
                <div className="p-2 bg-muted rounded-lg">
                    <p className="text-xs text-center text-muted-foreground mb-2">
                        Click to add a color to your guess. {config.allowDuplicates && "(Duplicates allowed)"}
                    </p>
                    <div className="flex justify-center flex-wrap gap-2">
                        {COLORS.slice(0, config.numColors).map(color => (
                            <button key={color} onClick={() => handleColorSelect(color)} className={cn("w-10 h-10 rounded-full border-2 hover:border-foreground transition-transform hover:scale-105", COLOR_MAP[color])} />
                        ))}
                    </div>
                </div>

                <Button onClick={submitGuess} disabled={currentGuess.some(c => c === null)} className="w-full bg-accent text-accent-foreground"><Check className="mr-2"/>Submit Guess</Button>
                </>
            )}
        </CardContent>
    </Card>
  );
}
