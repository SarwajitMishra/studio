
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Keyboard, Heart, Trophy, Play, Pause, RotateCw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface TypingRushGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

interface FallingObject {
  id: number;
  text: string;
  x: number; // percentage
  y: number; // pixels
  speed: number;
  status: 'falling' | 'bursting';
}

const DIFFICULTY_SETTINGS = {
  easy: { speed: 0.8, spawnRate: 2200, items: "abcdefghijklmnopqrstuvwxyz".split('') },
  medium: { speed: 1.2, spawnRate: 1800, items: ["cat", "dog", "sun", "sky", "run", "joy", "fun", "key", "box", "cup"] },
  hard: { speed: 1.6, spawnRate: 1200, items: ["happy", "apple", "world", "play", "house", "smile", "friend", "water", "earth", "magic"] },
};

const GAME_HEIGHT = 500;
const INITIAL_LIVES = 5;

export default function TypingRushGame({ onBack, difficulty }: TypingRushGameProps) {
    const [gameState, setGameState] = useState<"playing" | "paused" | "gameOver">("playing");
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
    const [inputValue, setInputValue] = useState("");

    const gameLoopRef = useRef<number | null>(null);
    const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const spawnObject = useCallback(() => {
        const settings = DIFFICULTY_SETTINGS[difficulty];
        const text = settings.items[Math.floor(Math.random() * settings.items.length)];
        const newObject: FallingObject = {
            id: Date.now() + Math.random(),
            text,
            x: Math.random() * 90 + 5, // 5-95% to keep it from edge
            y: -30,
            speed: settings.speed + Math.random() * 0.4,
            status: 'falling',
        };
        setFallingObjects(prev => [...prev, newObject]);
    }, [difficulty]);

    const gameLoop = useCallback(() => {
        setFallingObjects(prev => {
            const newObjects = prev.map(obj => ({ ...obj, y: obj.y + obj.speed }));
            const remainingObjects = newObjects.filter(obj => {
                if (obj.y > GAME_HEIGHT && obj.status === 'falling') {
                    setLives(l => Math.max(0, l - 1));
                    toast({ variant: 'destructive', title: 'Miss!', description: `You missed "${obj.text}"`, duration: 2000 });
                    return false;
                }
                return true;
            });
            return remainingObjects;
        });
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const typedValue = e.target.value.toLowerCase();
        setInputValue(typedValue);

        const matchedObject = fallingObjects.find(
            (obj) => obj.status === 'falling' && obj.text.toLowerCase() === typedValue
        );

        if (matchedObject) {
            setScore(prev => prev + matchedObject.text.length);
            setInputValue("");

            setFallingObjects(prev =>
                prev.map(obj =>
                    obj.id === matchedObject.id ? { ...obj, status: 'bursting' } : obj
                )
            );

            setTimeout(() => {
                setFallingObjects(prev => prev.filter(obj => obj.id !== matchedObject.id));
            }, 300);
        }
    };
    
    const pauseGame = () => {
        if (gameState === "playing") {
            setGameState("paused");
        }
    };

    const resumeGame = () => {
        if (gameState === "paused") {
            setGameState("playing");
            inputRef.current?.focus();
        }
    };
    
    const restartGame = () => {
        setScore(0);
        setLives(INITIAL_LIVES);
        setFallingObjects([]);
        setGameState("playing");
    };

    useEffect(() => {
        if (lives <= 0 && gameState === 'playing') {
            setGameState("gameOver");
        }
    }, [lives, gameState]);

    useEffect(() => {
        if (gameState === "playing") {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            spawnIntervalRef.current = setInterval(spawnObject, DIFFICULTY_SETTINGS[difficulty].spawnRate);
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

    return (
        <Card className="w-full max-w-2xl shadow-lg relative">
            <CardHeader className="bg-primary/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Keyboard size={28} className="text-primary" />
                        <CardTitle className="text-2xl font-bold text-primary">Typing Rush</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={gameState === 'playing' ? pauseGame : resumeGame} variant="outline" size="icon" disabled={gameState === 'gameOver'}>
                            {gameState === 'playing' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={onBack}>
                            <ArrowLeft size={16} className="mr-1" /> Back
                        </Button>
                    </div>
                </div>
                <CardDescription className="text-center text-md text-foreground/80 pt-2 flex justify-between items-center px-2">
                    <span className="font-semibold text-lg">Score: <span className="text-accent">{score}</span></span>
                    <span className="capitalize">Difficulty: {difficulty}</span>
                    <span className="font-semibold text-lg flex items-center">
                        Lives:
                        <div className="flex ml-2">
                            {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                <Heart key={i} className={cn("h-5 w-5 transition-colors", i < lives ? "text-red-500 fill-current" : "text-muted-foreground/30")} />
                            ))}
                        </div>
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                <div className="relative bg-primary/5 rounded-lg overflow-hidden border shadow-inner" style={{ height: `${GAME_HEIGHT}px` }}>
                    {/* overlays */}
                    {gameState === 'paused' && (
                         <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                            <h2 className="text-4xl font-bold text-white">Paused</h2>
                            <Button onClick={resumeGame} className="mt-4 bg-accent text-accent-foreground">
                                <Play className="mr-2" /> Resume
                            </Button>
                        </div>
                    )}
                     {gameState === "gameOver" && (
                         <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 backdrop-blur-sm text-center p-4">
                            <Trophy size={64} className="mx-auto text-yellow-500" />
                            <h2 className="text-4xl font-bold mt-4 text-white">Game Over</h2>
                            <p className="text-2xl mt-2 text-slate-200">Final Score: {score}</p>
                            <div className="flex justify-center gap-4 mt-8">
                                <Button onClick={onBack} variant="outline" size="lg">
                                    Change Puzzle
                                </Button>
                                <Button onClick={restartGame} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                    <RotateCw className="mr-2" /> Play Again
                                </Button>
                            </div>
                        </div>
                    )}
                    {/* game objects */}
                    {fallingObjects.map(obj => (
                        <div
                            key={obj.id}
                            className={cn(
                                "absolute text-lg font-bold text-white flex items-center justify-center rounded-full shadow-lg",
                                "w-16 h-16 bg-blue-400 border-2 border-blue-200/50",
                                { 'animate-burst': obj.status === 'bursting' }
                            )}
                            style={{
                                left: `${obj.x}%`,
                                top: `${obj.y}px`,
                                transform: "translateX(-50%)",
                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            }}
                        >
                            {obj.status === 'falling' && obj.text}
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={gameState === 'playing' ? "Type here!" : "Paused"}
                        value={inputValue}
                        onChange={handleInputChange}
                        disabled={gameState !== 'playing'}
                        className="w-full text-center text-lg h-12"
                        autoComplete="off"
                        autoFocus
                    />
                </div>
            </CardContent>
        </Card>
    );
}
