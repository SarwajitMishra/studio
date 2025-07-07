
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Keyboard, Heart, Trophy, Play, Pause, RotateCw, ArrowLeft, Loader2, Star as StarIcon, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { updateGameStats } from "@/lib/progress";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

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
  color: string;
}

const DIFFICULTY_SETTINGS = {
  easy: { speed: 0.8, spawnRate: 2200, items: "abcdefghijklmnopqrstuvwxyz".split(''), scoreThresholds: { oneStar: 20, twoStar: 40, threeStar: 60 } },
  medium: { speed: 1.2, spawnRate: 1800, items: ["cat", "dog", "sun", "sky", "run", "joy", "fun", "key", "box", "cup"], scoreThresholds: { oneStar: 30, twoStar: 60, threeStar: 90 } },
  hard: { speed: 1.6, spawnRate: 1200, items: ["happy", "apple", "world", "play", "house", "smile", "friend", "water", "earth", "magic"], scoreThresholds: { oneStar: 50, twoStar: 100, threeStar: 150 } },
};

const BUBBLE_COLORS = [
    "bg-blue-400 border-blue-200/50",
    "bg-green-400 border-green-200/50",
    "bg-purple-400 border-purple-200/50",
    "bg-pink-400 border-pink-200/50",
    "bg-orange-400 border-orange-200/50",
    "bg-teal-400 border-teal-200/50",
];

const INITIAL_LIVES = 5;
const GAME_DURATION_S = 60;

export default function TypingRushGame({ onBack, difficulty }: TypingRushGameProps) {
    const [gameState, setGameState] = useState<"playing" | "paused" | "gameOver" | "win">("playing");
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
    const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [gameAreaHeight, setGameAreaHeight] = useState(500);

    const [isCalculatingReward, setIsCalculatingReward] = useState(false);
    const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

    const gameLoopRef = useRef<number | null>(null);
    const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
    useEffect(() => {
        if (gameAreaRef.current) {
            setGameAreaHeight(gameAreaRef.current.offsetHeight);
        }
    }, []);
    
    const StarRating = ({ rating }: { rating: number }) => (
        <div className="flex justify-center">
            {[...Array(3)].map((_, i) => (
                <StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
            ))}
        </div>
    );
    
    const calculateStars = useCallback((score: number): number => {
        const { oneStar, twoStar, threeStar } = DIFFICULTY_SETTINGS[difficulty].scoreThresholds;
        if (score >= threeStar) return 3;
        if (score >= twoStar) return 2;
        if (score >= oneStar) return 1;
        return 0;
    }, [difficulty]);
    
    const handleWin = useCallback(async () => {
        setGameState("win");
        setIsCalculatingReward(true);
        updateGameStats({ gameId: 'easy-english', didWin: true, score });
        
        try {
            const rewards = await calculateRewards({ gameId: 'typingRush', difficulty, performanceMetrics: { score }});
            const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Won Typing Rush (${difficulty})`);
            const stars = calculateStars(score);
            setLastReward({ points: earned.points, coins: earned.coins, stars });
        } catch(e) {
            console.error("Error calculating rewards:", e);
            toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        } finally {
            setIsCalculatingReward(false);
        }
    }, [difficulty, score, toast, calculateStars]);

    const spawnObject = useCallback(() => {
        const settings = DIFFICULTY_SETTINGS[difficulty];
        const text = settings.items[Math.floor(Math.random() * settings.items.length)];
        const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
        const newObject: FallingObject = {
            id: Date.now() + Math.random(),
            text,
            x: Math.random() * 90 + 5,
            y: -30,
            speed: settings.speed + Math.random() * 0.4,
            status: 'falling',
            color: color,
        };
        setFallingObjects(prev => [...prev, newObject]);
    }, [difficulty]);

    const gameLoop = useCallback(() => {
        setFallingObjects(prev => {
            const updatedObjects = prev.map(obj => ({ ...obj, y: obj.y + obj.speed }));
            const missedObjects = updatedObjects.filter(obj => obj.y > gameAreaHeight && obj.status === 'falling');

            if (missedObjects.length > 0) {
                setTimeout(() => {
                    setLives(l => Math.max(0, l - missedObjects.length));
                    missedObjects.forEach(obj => {
                        toast({ variant: 'destructive', title: 'Miss!', description: `You missed "${obj.text}"`, duration: 2000 });
                    });
                }, 0);
            }
            
            return updatedObjects.filter(obj => obj.y <= gameAreaHeight || obj.status !== 'falling');
        });
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [toast, gameAreaHeight]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const typedValue = e.target.value.toLowerCase();
        setInputValue(typedValue);

        const matchedObject = fallingObjects.find(
            (obj) => obj.status === 'falling' && obj.text.toLowerCase() === typedValue
        );

        if (matchedObject) {
            setScore(prev => prev + matchedObject.text.length);
            setInputValue("");
            setFallingObjects(prev => prev.map(obj => obj.id === matchedObject.id ? { ...obj, status: 'bursting' } : obj));
            setTimeout(() => {
                setFallingObjects(prev => prev.filter(obj => obj.id !== matchedObject.id));
            }, 300);
        }
    };
    
    const pauseGame = () => {
        if (gameState === "playing") setGameState("paused");
    };

    const resumeGame = () => {
        if (gameState === "paused") {
            setGameState("playing");
            inputRef.current?.focus();
        }
    };
    
    const restartGame = useCallback(() => {
        setScore(0);
        setLives(INITIAL_LIVES);
        setFallingObjects([]);
        setGameState("playing");
        setTimeLeft(GAME_DURATION_S);
        setLastReward(null);
    }, []);

    useEffect(() => {
        if (lives <= 0 && gameState === 'playing') {
            setGameState("gameOver");
            updateGameStats({ gameId: 'easy-english', didWin: false, score });
        }
    }, [lives, gameState, score]);
    
    useEffect(() => {
        if (timeLeft <= 0 && gameState === 'playing') {
            handleWin();
        }
    }, [timeLeft, gameState, handleWin]);

    useEffect(() => {
        if (gameState === "playing") {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            spawnIntervalRef.current = setInterval(spawnObject, DIFFICULTY_SETTINGS[difficulty].spawnRate);
            timerIntervalRef.current = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
            inputRef.current?.focus();
        } else {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }

        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [gameState, gameLoop, spawnObject, difficulty]);

    const renderOverlay = () => {
        if (gameState === 'paused') {
            return (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                   <h2 className="text-4xl font-bold text-white">Paused</h2>
                   <Button onClick={resumeGame} className="mt-4 bg-accent text-accent-foreground"><Play className="mr-2" /> Resume</Button>
               </div>
           );
        }
        if (gameState === 'gameOver') {
            return (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm text-center p-4">
                   <Trophy size={64} className="mx-auto text-destructive" />
                   <h2 className="text-4xl font-bold mt-4 text-white">Game Over</h2>
                   <p className="text-2xl mt-2 text-slate-200">Final Score: {score}</p>
                   <div className="flex justify-center gap-4 mt-8">
                       <Button onClick={onBack} variant="outline" size="lg">Change Puzzle</Button>
                       <Button onClick={restartGame} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90"><RotateCw className="mr-2" /> Play Again</Button>
                   </div>
               </div>
           );
        }
        return null;
    }

    return (
        <>
        <AlertDialog open={gameState === 'win'}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
                       <Award size={28} /> Round Complete!
                    </AlertDialogTitle>
                </AlertDialogHeader>
                 <div className="py-4 text-center">
                    {isCalculatingReward ? (
                        <div className="flex flex-col items-center justify-center gap-2 pt-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Calculating your awesome rewards...</p>
                        </div>
                    ) : lastReward ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <StarRating rating={lastReward.stars} />
                            <AlertDialogDescription className="text-center text-base pt-2">
                                Congratulations! You survived.
                                <br />
                                <strong className="text-lg">Final Score: {score}</strong>
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
                    <AlertDialogAction onClick={restartGame} disabled={isCalculatingReward}>Play Again</AlertDialogAction>
                    <AlertDialogCancel onClick={onBack} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card className="w-full h-full flex flex-col shadow-lg relative">
            <CardHeader className="bg-primary/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Keyboard size={28} className="text-primary" />
                        <CardTitle className="text-2xl font-bold text-primary">Typing Rush</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={gameState === 'playing' ? pauseGame : resumeGame} variant="outline" size="icon" disabled={gameState === 'gameOver' || gameState === 'win'}>
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
                <Progress value={(timeLeft / GAME_DURATION_S) * 100} className="w-full mt-2" />
            </CardHeader>
            <CardContent className="p-4 flex flex-col flex-grow">
                <div 
                    ref={gameAreaRef} 
                    className="relative bg-primary/5 rounded-lg overflow-hidden border shadow-inner w-full flex-grow min-h-[400px] cursor-text"
                    onClick={() => inputRef.current?.focus()}
                >
                    {renderOverlay()}
                    {fallingObjects.map(obj => (
                        <div
                            key={obj.id}
                            className={cn(
                                "absolute text-lg font-bold text-white flex items-center justify-center rounded-full shadow-lg",
                                "w-16 h-16 border-2",
                                obj.color,
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
                <Input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={gameState !== 'playing'}
                    className="sr-only"
                    autoComplete="off"
                    autoFocus
                />
                 <p className="text-center text-sm text-muted-foreground mt-2">
                    {gameState === 'playing' ? 'Click the area above and start typing!' : 'Game is paused.'}
                </p>
            </CardContent>
        </Card>
        </>
    );
}

