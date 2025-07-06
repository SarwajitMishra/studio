
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, Award, ArrowLeft, ArrowRight, Shield, Star, Gem, Brain } from 'lucide-react';
import { cn } from "@/lib/utils";

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

const HowToPlayHanoi = ({ onStartGame }: { onStartGame: () => void }) => {
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
                <Button onClick={onStartGame} className="w-full text-lg bg-accent text-accent-foreground">
                    Start Game! <ArrowRight className="ml-2" />
                </Button>
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

    const minMoves = useMemo(() => difficulty ? MINIMUM_MOVES[difficulty] : 0, [difficulty]);
    
    const handleDifficultySelect = (numDisks: Difficulty) => {
        setDifficulty(numDisks);
        setGameState('howToPlay');
    };
    
    const startGame = useCallback(() => {
        if (!difficulty) return;
        const initialTowers: Towers = [[], [], []];
        for (let i = difficulty; i > 0; i--) {
            initialTowers[0].push(i);
        }
        setTowers(initialTowers);
        setSelectedRod(null);
        setMoves(0);
        setIsWon(false);
        setGameState('playing');
    }, [difficulty]);


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
            setMoves(m => m + 1);

            if ((newTowers[1].length === difficulty) || (newTowers[2].length === difficulty)) {
                setIsWon(true);
            }
        }
    }, [towers, isWon, difficulty]);

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
                        <Button onClick={() => handleDifficultySelect(4)} className="text-lg py-6"><Star className="mr-2"/> 4 Disks</Button>
                        <Button onClick={() => handleDifficultySelect(5)} className="text-lg py-6"><Gem className="mr-2"/> 5 Disks</Button>
                        <Button onClick={() => handleDifficultySelect(6)} className="text-lg py-6"><Award className="mr-2"/> 6 Disks</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

     if (gameState === 'howToPlay') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
               <HowToPlayHanoi onStartGame={startGame} />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Tower of Hanoi</CardTitle>
                    <CardDescription className="text-lg pt-2">
                        Moves: {moves} | Minimum: {minMoves}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isWon && (
                        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                             <Award className="mx-auto h-12 w-12 text-yellow-500 mb-2"/>
                            <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">You Win!</h3>
                            <p className="text-green-600 dark:text-green-400">
                                {moves === minMoves ? "Perfect score! Well done." : `You did it in ${moves} moves.`}
                            </p>
                        </div>
                    )}
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
                        <Button onClick={() => difficulty && startGame()} className="w-full"><RotateCw className="mr-2"/> Reset</Button>
                        <Button onClick={() => setGameState('setup')} variant="outline" className="w-full"><ArrowLeft className="mr-2"/> Change Difficulty</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
