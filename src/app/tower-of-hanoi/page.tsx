
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, Award, ArrowLeft, ArrowRight, Shield, Star as StarIcon, Gem, Brain, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { useToast } from '@/hooks/use-toast';

type Towers = number[][];
type Difficulty = 3 | 4 | 5 | 6;
type GameState = 'setup' | 'howToPlay' | 'playing';

const DISK_COLORS = [
    "bg-red-500", "bg-orange-500", "bg-yellow-400",
    "bg-lime-500", "bg-cyan-500", "bg-indigo-500", "bg-fuchsia-500"
];

const MINIMUM_MOVES: Record<Difficulty, number> = {
    3: 7, 4: 15, 5: 31, 6: 63
};

const HowToPlayDisk = ({ size, color }: { size: number; color: string; }) => (
    <div
        className={cn("h-5 rounded-md shadow-md mx-auto", color)}
        style={{ width: `${30 + size * 10}%` }}
    />
);

const HowToPlayHanoi = ({ onStartGame, onBack }: { onStartGame: () => void; onBack: () => void; }) => {
    const [step, setStep] = useState(0);

    const steps = [
        { text: "1. Goal: Move the entire stack of disks to another rod." },
        { text: "2. Rule 1: Only move one disk at a time (the top-most one)." },
        { text: "3. Rule 2: A larger disk cannot be placed on a smaller disk." },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setStep(prev => (prev + 1) % steps.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [steps.length]);

    const currentStep = steps[step];

    const getRodContent = (rodIndex: number) => {
        let disks: JSX.Element[] = [];
        if (rodIndex === 0) {
            if (step === 0) disks = [<HowToPlayDisk key={1} size={1} color={DISK_COLORS[0]} />, <HowToPlayDisk key={2} size={2} color={DISK_COLORS[1]} />, <HowToPlayDisk key={3} size={3} color={DISK_COLORS[2]} />];
            if (step === 1) disks = [<HowToPlayDisk key={2} size={2} color={DISK_COLORS[1]} />, <HowToPlayDisk key={3} size={3} color={DISK_COLORS[2]} />];
            if (step === 2) disks = [<HowToPlayDisk key={3} size={3} color={DISK_COLORS[2]} />];
        } else if (rodIndex === 1) {
            if (step === 2) disks = [<HowToPlayDisk key={1} size={1} color={DISK_COLORS[0]} />];
        } else if (rodIndex === 2) {
            if (step === 1) disks = [<HowToPlayDisk key={1} size={1} color={DISK_COLORS[0]} />];
            if (step === 2) disks = [<div key="anim" className="animate-pulse"><HowToPlayDisk size={2} color={DISK_COLORS[1]} /></div>];
        }
        
        return (
             <div className="w-1/3 flex flex-col-reverse items-center space-y-1 h-full justify-end">
                {disks}
                <div className="w-2 h-24 bg-neutral-600 rounded-t-sm"></div>
                <div className="w-full h-2 bg-neutral-700 rounded-sm"></div>
            </div>
        )
    }

    return (
        <Card className="w-full max-w-md text-center shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">How to Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-around items-end h-32 bg-muted p-2 rounded-lg">
                    {getRodContent(0)}
                    {getRodContent(1)}
                    {getRodContent(2)}
                </div>
                <p className="min-h-[40px] font-medium text-foreground/90">{currentStep.text}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={onBack} variant="outline" className="w-full">
                        <ArrowLeft className="mr-2"/> Back
                    </Button>
                    <Button onClick={onStartGame} className="w-full text-lg bg-accent text-accent-foreground">
                        Start Game! <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


const Rod = ({ disks, rodIndex, onClick, onDragOver, onDrop, onDiskDragStart, isSelected, isWon }: { 
    disks: number[], 
    rodIndex: number,
    onClick: () => void, 
    onDragOver: (e: React.DragEvent) => void,
    onDrop: (e: React.DragEvent) => void,
    onDiskDragStart: (e: React.DragEvent, fromRodIndex: number) => void,
    isSelected: boolean,
    isWon: boolean,
}) => (
    <div 
        onClick={onClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
            "flex flex-col justify-end h-56 w-full border-2 p-2 rounded-lg cursor-pointer transition-colors",
            "bg-muted/30 hover:border-primary/50",
            isSelected ? "border-primary bg-primary/10" : "border-transparent",
        )}
    >
        <div className="relative flex-grow flex flex-col-reverse items-center justify-start pt-4">
            <div className="w-2 h-full bg-neutral-600 absolute bottom-0 rounded-t-sm"></div>
            {disks.map((diskSize, index) => (
                <div
                    key={diskSize} 
                    draggable={index === disks.length - 1 && !isWon}
                    onDragStart={(e) => {
                         if (index === disks.length - 1 && !isWon) {
                            e.stopPropagation();
                            onDiskDragStart(e, rodIndex);
                        }
                    }}
                    className={cn(
                        "h-6 rounded-md shadow-md transition-all duration-200", 
                        DISK_COLORS[diskSize - 1],
                        (index === disks.length - 1 && !isWon) ? "cursor-grab active:cursor-grabbing" : "",
                        "mb-1"
                    )}
                    style={{ width: `${30 + diskSize * 10}%` }}
                />
            ))}
        </div>
        <div className="w-full h-2 bg-neutral-700 rounded-sm"></div>
    </div>
);


export default function TowerOfHanoiPage() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [gameState, setGameState] = useState<GameState>('setup');
    const [towers, setTowers] = useState<Towers>([[], [], []]);
    const [selectedRod, setSelectedRod] = useState<number | null>(null);
    const [moves, setMoves] = useState(0);
    const [isWon, setIsWon] = useState(false);

    const [isCalculatingReward, setIsCalculatingReward] = useState(false);
    const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);
    const { toast } = useToast();
    
    const minMoves = useMemo(() => difficulty ? MINIMUM_MOVES[difficulty] : 0, [difficulty]);

    const StarRating = ({ rating }: { rating: number }) => (
        <div className="flex justify-center">
            {[...Array(3)].map((_, i) => (
                <StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
            ))}
        </div>
    );
    
    const calculateStars = (moves: number, minMoves: number): number => {
        if (moves === minMoves) return 3;
        if (moves <= minMoves * 1.5) return 2;
        return 1;
    };

    const handleWin = useCallback(async () => {
        if (!difficulty) return;
        setIsWon(true);
        setIsCalculatingReward(true);
        updateGameStats({ gameId: 'towerOfHanoi', didWin: true, score: minMoves * 100 - moves });

        try {
            const rewards = await calculateRewards({
                gameId: 'towerOfHanoi',
                difficulty: 'hard', // Maps to a single reward type
                performanceMetrics: { moves: moves, minMoves: minMoves },
            });
            const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Solved Tower of Hanoi (${difficulty} disks)`);
            const stars = calculateStars(moves, minMoves);
            setLastReward({ points: earned.points, coins: earned.coins, stars });
            
            toast({
                title: "You Solved It! 🏆",
                description: `You earned ${earned.points} S-Points and ${earned.coins} S-Coins!`,
                className: "bg-green-600 border-green-700 text-white",
                duration: 5000,
            });
        } catch (error) {
             console.error("Error calculating rewards:", error);
             toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        } finally {
            setIsCalculatingReward(false);
        }
    }, [difficulty, moves, minMoves, toast]);
    
    const handleDifficultySelect = (numDisks: Difficulty) => {
        setDifficulty(numDisks);
        setGameState('howToPlay');
    };
    
    const startGame = useCallback(() => {
        if (!difficulty) return;
        if (moves > 0 && !isWon) {
            updateGameStats({ gameId: 'towerOfHanoi', didWin: false });
        }
        const initialTowers: Towers = [[], [], []];
        for (let i = difficulty; i > 0; i--) {
            initialTowers[0].push(i);
        }
        setTowers(initialTowers);
        setSelectedRod(null);
        setMoves(0);
        setIsWon(false);
        setLastReward(null);
        setGameState('playing');
    }, [difficulty, moves, isWon]);


    const moveDisk = useCallback((fromIndex: number, toIndex: number) => {
        if (isWon || fromIndex === toIndex) return;

        const newTowers = towers.map(t => [...t]);
        const fromRod = newTowers[fromIndex];
        const toRod = newTowers[toIndex];
        
        if (fromRod.length === 0) return;

        const diskToMove = fromRod[fromRod.length - 1];

        if (toRod.length === 0 || diskToMove < toRod[toRod.length - 1]) {
            fromRod.pop();
            toRod.push(diskToMove);
            setTowers(newTowers);
            const newMoves = moves + 1;
            setMoves(newMoves);

            if ((newTowers[1].length === difficulty) || (newTowers[2].length === difficulty)) {
                handleWin();
            }
        }
    }, [towers, isWon, difficulty, moves, handleWin]);

    const handleRodClick = (rodIndex: number) => {
        if (isWon) return;

        if (selectedRod === null) {
            if (towers[rodIndex].length > 0) {
                setSelectedRod(rodIndex);
            }
        } else {
            moveDisk(selectedRod, rodIndex);
            setSelectedRod(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, fromRodIndex: number) => {
        if (isWon) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("fromRodIndex", fromRodIndex.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, toRodIndex: number) => {
        e.preventDefault();
        const fromRodIndex = parseInt(e.dataTransfer.getData("fromRodIndex"), 10);
        if (!isNaN(fromRodIndex)) {
            moveDisk(fromRodIndex, toRodIndex);
        }
    };
    
    if (gameState === 'setup') {
        return (
             <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md text-center shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Tower of Hanoi</CardTitle>
                        <CardDescription>Select a difficulty to start.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button onClick={() => handleDifficultySelect(3)} className="text-lg py-6"><Shield className="mr-2"/> 3 Disks</Button>
                        <Button onClick={() => handleDifficultySelect(4)} className="text-lg py-6"><StarIcon className="mr-2"/> 4 Disks</Button>
                        <Button onClick={() => handleDifficultySelect(5)} className="text-lg py-6"><Gem className="mr-2"/> 5 Disks</Button>
                        <Button onClick={() => handleDifficultySelect(6)} className="text-lg py-6"><Award className="mr-2"/> 6 Disks</Button>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="ghost" className="w-full">
                            <Link href="/"><ArrowLeft className="mr-2"/> Back to Menu</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

     if (gameState === 'howToPlay') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
               <HowToPlayHanoi onStartGame={startGame} onBack={() => setGameState('setup')} />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-4">
            <AlertDialog open={isWon}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
                       <Award size={28} /> Puzzle Solved!
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
                                    Congratulations! You solved the puzzle.
                                    <br />
                                    <strong className="text-lg">Moves: {moves}</strong> | <strong className="text-lg">Minimum: {minMoves}</strong>
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
                        <AlertDialogAction onClick={startGame} disabled={isCalculatingReward}>Play Again</AlertDialogAction>
                        <AlertDialogCancel onClick={() => setGameState('setup')} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Tower of Hanoi</CardTitle>
                    <CardDescription className="text-lg pt-2">
                        Moves: {moves} | Minimum: {minMoves}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {towers.map((disks, index) => (
                            <Rod 
                                key={index}
                                rodIndex={index}
                                disks={disks} 
                                onClick={() => handleRodClick(index)} 
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                                onDiskDragStart={handleDragStart}
                                isSelected={selectedRod === index} 
                                isWon={isWon}
                            />
                        ))}
                    </div>
                     <div className="mt-6 flex gap-4">
                        <Button onClick={startGame} className="w-full"><RotateCw className="mr-2"/> Reset</Button>
                        <Button onClick={() => setGameState('setup')} variant="outline" className="w-full"><ArrowLeft className="mr-2"/> Change Difficulty</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
