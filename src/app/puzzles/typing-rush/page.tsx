
"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Keyboard, Heart, Trophy, Shield, Star, Gem, Play, Pause, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

type Difficulty = "easy" | "medium" | "hard";
type GameState = "setup" | "playing" | "paused" | "gameOver";

interface DifficultyOption {
  level: Difficulty;
  label: string;
  Icon: React.ElementType;
  description: string;
  color: string;
}

interface FallingObject {
  id: number;
  text: string;
  x: number; // percentage
  y: number; // pixels
  speed: number;
}

const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { level: "easy", label: "Easy", Icon: Shield, description: "Slow-falling single letters.", color: "text-green-500", },
  { level: "medium", label: "Medium", Icon: Star, description: "Faster words (3-5 letters).", color: "text-yellow-500", },
  { level: "hard", label: "Hard", Icon: Gem, description: "Very fast words (5-8 letters).", color: "text-red-500", },
];

const DIFFICULTY_SETTINGS = {
  easy: { speed: 1, spawnRate: 2000, items: "abcdefghijklmnopqrstuvwxyz".split('') },
  medium: { speed: 1.5, spawnRate: 1500, items: ["cat", "dog", "sun", "sky", "run", "joy", "fun", "key", "box", "cup"] },
  hard: { speed: 2, spawnRate: 1000, items: ["happy", "apple", "world", "play", "house", "smile", "friend", "water", "earth", "magic"] },
};

const GAME_HEIGHT = 500; // pixels
const INITIAL_LIVES = 5;

export default function TypingRushPage() {
  const [gameState, setGameState] = useState<GameState>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
  const [inputValue, setInputValue] = useState("");

  const gameLoopRef = useRef<number | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const spawnObject = useCallback(() => {
    if (!difficulty) return;
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const text = settings.items[Math.floor(Math.random() * settings.items.length)];
    const newObject: FallingObject = {
      id: Date.now(),
      text,
      x: Math.random() * 90, // 0-90% to keep it from edge
      y: -30, // Start above the screen
      speed: settings.speed + Math.random() * 0.5, // Add some variance
    };
    setFallingObjects(prev => [...prev, newObject]);
  }, [difficulty]);

  const gameLoop = useCallback(() => {
    setFallingObjects(prev => {
      const newObjects = prev.map(obj => ({ ...obj, y: obj.y + obj.speed }));
      const remainingObjects = newObjects.filter(obj => {
        if (obj.y > GAME_HEIGHT) {
          setLives(l => Math.max(0, l - 1));
          return false;
        }
        return true;
      });
      return remainingObjects;
    });
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setLives(INITIAL_LIVES);
    setFallingObjects([]);
    setGameState("playing");
  };

  const pauseGame = () => {
    if (gameState === "playing") {
      setGameState("paused");
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    }
  };
  
  const resumeGame = () => {
    if (gameState === "paused") {
      setGameState("playing");
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (lives <= 0) {
      setGameState("gameOver");
    }
  }, [lives]);

  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      spawnIntervalRef.current = setInterval(spawnObject, difficulty ? DIFFICULTY_SETTINGS[difficulty].spawnRate : 2000);
      inputRef.current?.focus();
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [gameState, gameLoop, spawnObject, difficulty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || gameState !== "playing") return;

    let found = false;
    let newScore = score;
    const remainingObjects = fallingObjects.filter(obj => {
      if (obj.text.toLowerCase() === inputValue.toLowerCase().trim()) {
        found = true;
        newScore += obj.text.length; // More points for longer words
        return false; // Remove the object
      }
      return true;
    });

    if (found) {
      setFallingObjects(remainingObjects);
      setScore(newScore);
      setInputValue("");
    } else {
      toast({
        variant: "destructive",
        title: "Miss!",
        description: `"${inputValue}" is not on the screen.`,
        duration: 2000,
      });
      setInputValue("");
    }
  };
  
  const handleReset = () => {
      setGameState('setup');
      setDifficulty(null);
      setScore(0);
      setLives(INITIAL_LIVES);
      setFallingObjects([]);
  }

  // Setup View
  if (gameState === "setup") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <Keyboard size={36} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Typing Rush</CardTitle>
            </div>
            <CardDescription className="text-center text-xl text-foreground/80 pt-3">
              Select your difficulty!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {DIFFICULTY_LEVELS.map((diffOpt) => (
              <Button
                key={diffOpt.level}
                variant="outline"
                className="h-auto w-full py-4 text-left flex items-center space-x-4 hover:bg-accent/10 group"
                onClick={() => startGame(diffOpt.level)}
              >
                <diffOpt.Icon size={24} className={cn("transition-colors duration-200", diffOpt.color)} />
                <div className="flex-grow">
                  <p className="text-lg font-semibold">{diffOpt.label}</p>
                  <p className="text-sm text-muted-foreground">{diffOpt.description}</p>
                </div>
              </Button>
            ))}
             <div className="text-center mt-6">
                <Button variant="ghost" asChild>
                    <Link href="/puzzles">Back to All Puzzles</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game Over View
  if (gameState === "gameOver") {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-md shadow-xl text-center p-8">
          <Trophy size={64} className="mx-auto text-yellow-500" />
          <h2 className="text-4xl font-bold mt-4 text-primary">Game Over</h2>
          <p className="text-2xl mt-2 text-foreground">Final Score: {score}</p>
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={handleReset} variant="outline" size="lg">
              Change Difficulty
            </Button>
            <Button onClick={() => startGame(difficulty!)} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCw className="mr-2" /> Play Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Playing and Paused View
  return (
    <div className="flex flex-col items-center p-2 sm:p-4 md:p-6 space-y-4">
      <Card className="w-full max-w-2xl shadow-lg relative">
        <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4">
          <div className="flex gap-4">
            <div className="font-semibold text-lg">Score: <span className="text-accent">{score}</span></div>
            <div className="font-semibold text-lg flex items-center">
              Lives:
              <div className="flex ml-2">
                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                  <Heart key={i} className={cn("h-5 w-5", i < lives ? "text-red-500 fill-current" : "text-muted-foreground/30")} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
             <Button onClick={gameState === 'playing' ? pauseGame : resumeGame} variant="outline" size="icon">
                {gameState === 'playing' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
             </Button>
             <Button onClick={handleReset} variant="destructive" size="icon">
                <RotateCw className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative bg-primary/5 rounded-lg overflow-hidden border shadow-inner" style={{ height: `${GAME_HEIGHT}px` }}>
            {gameState === 'paused' && (
                 <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                    <h2 className="text-4xl font-bold text-white">Paused</h2>
                    <Button onClick={resumeGame} className="mt-4 bg-accent text-accent-foreground">
                        <Play className="mr-2" /> Resume
                    </Button>
                </div>
            )}
            {fallingObjects.map(obj => (
              <span
                key={obj.id}
                className="absolute text-lg font-semibold bg-card px-2 py-1 rounded-md shadow-md text-foreground"
                style={{
                  left: `${obj.x}%`,
                  top: `${obj.y}px`,
                  transform: "translateX(-50%)",
                }}
              >
                {obj.text}
              </span>
            ))}
          </div>
        </CardContent>
        <div className="px-6 pb-6">
            <form onSubmit={handleFormSubmit}>
                 <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Type the word and press Enter..."
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={gameState !== 'playing'}
                    className="w-full text-center text-lg h-12"
                    autoComplete="off"
                />
            </form>
        </div>
      </Card>
    </div>
  );
}
