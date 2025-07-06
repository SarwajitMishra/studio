
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KeyRound, ArrowLeft, RotateCw, Lightbulb, Check, Award, Shield, Star, Gem } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";

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
  easy: { codeLength: 4, numColors: 4, maxGuesses: 10 },
  medium: { codeLength: 4, numColors: 5, maxGuesses: 8 },
  hard: { codeLength: 5, numColors: 6, maxGuesses: 8 },
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

  const generateSecretCode = useCallback(() => {
    const availableColors = COLORS.slice(0, config.numColors);
    const newSecret: Color[] = [];
    for (let i = 0; i < config.codeLength; i++) {
      newSecret.push(availableColors[Math.floor(Math.random() * availableColors.length)]);
    }
    setSecretCode(newSecret);
  }, [config]);

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
    const newGuess = [...currentGuess];
    newGuess[index] = null;
    setCurrentGuess(newGuess);
  };
  
  const submitGuess = () => {
    if (currentGuess.some(c => c === null)) return;

    let tempSecret = [...secretCode];
    let tempGuess = [...(currentGuess as Color[])];
    let correctPosition = 0;
    let correctColor = 0;

    // First pass: check for correct color and position
    for (let i = 0; i < tempGuess.length; i++) {
      if (tempGuess[i] === tempSecret[i]) {
        correctPosition++;
        tempSecret[i] = 'used-secret';
        tempGuess[i] = 'used-guess';
      }
    }

    // Second pass: check for correct color in wrong position
    for (let i = 0; i < tempGuess.length; i++) {
      if (tempGuess[i] !== 'used-guess') {
        const colorIndexInSecret = tempSecret.indexOf(tempGuess[i]);
        if (colorIndexInSecret !== -1) {
          correctColor++;
          tempSecret[colorIndexInSecret] = 'used-secret';
        }
      }
    }

    const newGuesses = [...guesses, { code: currentGuess, feedback: { correctPosition, correctColor } }];
    setGuesses(newGuesses);
    setCurrentGuess(Array(config.codeLength).fill(null));

    if (correctPosition === config.codeLength) {
      setIsGameOver(true);
      setIsWin(true);
    } else if (newGuesses.length >= config.maxGuesses) {
      setIsGameOver(true);
      setIsWin(false);
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
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
            </div>
            <CardDescription className="text-center text-md text-foreground/80 pt-2">
                Guess the secret code! Guesses: {guesses.length}/{config.maxGuesses} | Difficulty: <span className="capitalize">{difficulty}</span>
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
            <ScrollArea className="h-64 w-full border rounded-md p-2 bg-muted/50">
                <div className="space-y-2">
                    {guesses.map((guess, index) => (
                        <div key={index} className="flex items-center justify-between p-1 bg-background rounded">
                            <div className="flex gap-2">
                                {guess.code.map((color, i) => <div key={i} className={cn("w-6 h-6 rounded-full border", color ? COLOR_MAP[color] : 'bg-muted')} />)}
                            </div>
                             <div className="flex gap-1">
                                {Array(guess.feedback.correctPosition).fill(0).map((_, i) => <div key={`cp-${i}`} className="w-4 h-4 rounded-full bg-black border border-white" />)}
                                {Array(guess.feedback.correctColor).fill(0).map((_, i) => <div key={`cc-${i}`} className="w-4 h-4 rounded-full bg-white border border-black" />)}
                            </div>
                        </div>
                    ))}
                    {guesses.length === 0 && <p className="text-center text-muted-foreground pt-24">Guess history will appear here.</p>}
                </div>
            </ScrollArea>
            
            {isGameOver ? (
                 <div className="text-center p-4 bg-muted rounded-lg space-y-3">
                    <Award size={48} className={cn("mx-auto", isWin ? "text-yellow-500" : "text-gray-500")} />
                    <h3 className={cn("text-2xl font-bold", isWin ? "text-green-700" : "text-red-700")}>{isWin ? "You cracked the code!" : "Game Over"}</h3>
                    <div className="flex items-center justify-center gap-2">
                      <p>The code was:</p>
                      <div className="flex gap-2">{secretCode.map((c, i) => <div key={i} className={cn("w-6 h-6 rounded-full", COLOR_MAP[c])} />)}</div>
                    </div>
                    <Button onClick={resetGame} className="mt-4"><RotateCw className="mr-2" /> Play Again</Button>
                </div>
            ): (
                 <>
                {/* Current Guess */}
                <div className="p-2 border-2 border-dashed rounded-lg">
                    <div className="flex items-center justify-center gap-2">
                        {currentGuess.map((color, index) => (
                            <button key={index} onClick={() => handleGuessPegClick(index)} className={cn("w-8 h-8 rounded-full border-2", color ? COLOR_MAP[color] : 'bg-background')}>
                                {!color && <span className="text-xs text-muted-foreground">{index + 1}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                 {/* Color Palette */}
                <div className="flex justify-center flex-wrap gap-2 pt-2">
                    {COLORS.slice(0, config.numColors).map(color => (
                        <button key={color} onClick={() => handleColorSelect(color)} className={cn("w-10 h-10 rounded-full border-2 hover:border-foreground transition", COLOR_MAP[color])} />
                    ))}
                </div>

                <Button onClick={submitGuess} disabled={currentGuess.some(c => c === null)} className="w-full bg-accent text-accent-foreground"><Check className="mr-2"/>Submit Guess</Button>
                </>
            )}
        </CardContent>
    </Card>
  );
}

