
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, Award, ArrowLeft, Shield, Star, Gem } from 'lucide-react';
import { cn } from "@/lib/utils";

type Towers = number[][];
type Difficulty = 3 | 4 | 5 | 6;

// New distinct colors
const DISK_COLORS = [
    "bg-red-500", "bg-orange-500", "bg-yellow-400",
    "bg-lime-500", "bg-cyan-500", "bg-indigo-500", "bg-fuchsia-500"
];

const MINIMUM_MOVES: Record<Difficulty, number> = {
    3: 7, 4: 15, 5: 31, 6: 63
};

const Disk = ({ size, color, draggable, onDragStart, isWon }: { size: number; color: string; draggable: boolean; onDragStart: (e: React.DragEvent) => void; isWon: boolean; }) => {
    return (
        <div
            draggable={draggable && !isWon}
            onDragStart={draggable && !isWon ? onDragStart : undefined}
            className={cn(
                "h-6 rounded-md shadow-md mx-auto transition-all duration-200",
                color,
                (draggable && !isWon) ? "cursor-grab active:cursor-grabbing" : ""
            )}
            style={{ width: `${30 + size * 10}%` }}
        />
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
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="flex flex-col-reverse justify-start h-48 w-full border-2 border-transparent p-2 rounded-lg"
    >
        <div className="relative h-full w-full flex flex-col-reverse justify-start items-center">
            {/* Base */}
            <div className="w-full h-2 bg-neutral-700 rounded-t-md"></div>
            {/* Pole */}
            <div className="w-2 h-full bg-neutral-600 absolute bottom-0"></div>
            {/* Disks */}
            <div className="absolute bottom-2 w-full space-y-1">
                {disks.map((diskSize, index) => (
                    <Disk 
                        key={diskSize} 
                        size={diskSize} 
                        color={DISK_COLORS[diskSize - 1]}
                        draggable={index === disks.length - 1} // Only top disk is draggable
                        onDragStart={(e) => onDiskDragStart(e, rodIndex)}
                        isWon={isWon}
                    />
                ))}
            </div>
        </div>
        <Button variant={isSelected ? "default" : "outline"} onClick={onClick} className="mt-2" disabled={isWon}>
            {isSelected ? "Selected" : "Select"}
        </Button>
    </div>
);


export default function TowerOfHanoiPage() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [towers, setTowers] = useState<Towers>([[], [], []]);
    const [selectedRod, setSelectedRod] = useState<number | null>(null);
    const [moves, setMoves] = useState(0);
    const [isWon, setIsWon] = useState(false);

    const minMoves = useMemo(() => difficulty ? MINIMUM_MOVES[difficulty] : 0, [difficulty]);

    const resetGame = (numDisks: Difficulty) => {
        const initialTowers: Towers = [[], [], []];
        for (let i = numDisks; i > 0; i--) {
            initialTowers[0].push(i);
        }
        setTowers(initialTowers);
        setSelectedRod(null);
        setMoves(0);
        setIsWon(false);
        setDifficulty(numDisks);
    };

    const moveDisk = useCallback((fromIndex: number, toIndex: number) => {
        if (isWon || fromIndex === toIndex) return;

        const newTowers = towers.map(t => [...t]);
        const fromRod = newTowers[fromIndex];
        const toRod = newTowers[toIndex];
        
        if (fromRod.length === 0) return; // Cannot move from an empty rod

        const diskToMove = fromRod[fromRod.length - 1];

        if (toRod.length === 0 || diskToMove < toRod[toRod.length - 1]) {
            fromRod.pop();
            toRod.push(diskToMove);
            setTowers(newTowers);
            setMoves(m => m + 1);

            // Check for win condition
            if ((newTowers[1].length === difficulty) || (newTowers[2].length === difficulty)) {
                setIsWon(true);
            }
        }
    }, [towers, isWon, difficulty]);

    const handleRodClick = (rodIndex: number) => {
        if (isWon) return;

        if (selectedRod === null) {
            // Select a disk from a non-empty rod
            if (towers[rodIndex].length > 0) {
                setSelectedRod(rodIndex);
            }
        } else {
            moveDisk(selectedRod, rodIndex);
            setSelectedRod(null);
        }
    };

    // Drag and Drop Handlers
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
    
    if (!difficulty) {
        return (
             <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md text-center shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Tower of Hanoi</CardTitle>
                        <CardDescription>Select a difficulty to start.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button onClick={() => resetGame(3)} className="text-lg py-6"><Shield className="mr-2"/> 3 Disks</Button>
                        <Button onClick={() => resetGame(4)} className="text-lg py-6"><Star className="mr-2"/> 4 Disks</Button>
                        <Button onClick={() => resetGame(5)} className="text-lg py-6"><Gem className="mr-2"/> 5 Disks</Button>
                        <Button onClick={() => resetGame(6)} className="text-lg py-6"><Award className="mr-2"/> 6 Disks</Button>
                    </CardContent>
                </Card>
            </div>
        )
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
                        <Button onClick={() => resetGame(difficulty)} className="w-full"><RotateCw className="mr-2"/> Reset</Button>
                        <Button onClick={() => setDifficulty(null)} variant="outline" className="w-full"><ArrowLeft className="mr-2"/> Change Difficulty</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
