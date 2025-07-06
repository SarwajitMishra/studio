
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Route, Brain, Award, ArrowLeft, Shield, Star, Gem, Heart } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'setup' | 'memorize' | 'recall' | 'levelComplete' | 'gameOver';

interface GridCell {
  row: number;
  col: number;
}

interface LevelConfig {
  gridSize: number;
  pathLength: number;
  memorizeTime: number; // in ms
}

const DIFFICULTY_LEVELS: Record<Difficulty, LevelConfig> = {
  easy: { gridSize: 3, pathLength: 4, memorizeTime: 3000 },
  medium: { gridSize: 4, pathLength: 6, memorizeTime: 4000 },
  hard: { gridSize: 5, pathLength: 8, memorizeTime: 5000 },
};

const generatePath = (gridSize: number, pathLength: number): GridCell[] => {
    const path: GridCell[] = [];
    const visited = new Set<string>();

    let startRow = Math.floor(Math.random() * gridSize);
    let startCol = Math.floor(Math.random() * gridSize);
    let currentCell = { row: startRow, col: startCol };

    path.push(currentCell);
    visited.add(`${currentCell.row}-${currentCell.col}`);

    while (path.length < pathLength) {
        const { row, col } = path[path.length - 1];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const shuffledDirections = directions.sort(() => Math.random() - 0.5);

        let moved = false;
        for (const [dr, dc] of shuffledDirections) {
            const nextRow = row + dr;
            const nextCol = col + dc;
            const nextKey = `${nextRow}-${nextCol}`;

            if (nextRow >= 0 && nextRow < gridSize && nextCol >= 0 && nextCol < gridSize && !visited.has(nextKey)) {
                path.push({ row: nextRow, col: nextCol });
                visited.add(nextKey);
                moved = true;
                break;
            }
        }
        if (!moved) {
            // Path generation stuck, restart
            return generatePath(gridSize, pathLength);
        }
    }
    return path;
};

export default function MemoryMazePage() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [gameState, setGameState] = useState<GameState>('setup');
    
    const [path, setPath] = useState<GridCell[]>([]);
    const [userPath, setUserPath] = useState<GridCell[]>([]);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);

    const { toast } = useToast();
    
    const config = difficulty ? DIFFICULTY_LEVELS[difficulty] : null;

    const startNewLevel = useCallback(() => {
        if (!config) return;
        
        const newPath = generatePath(config.gridSize, config.pathLength);
        setPath(newPath);
        setUserPath([]);
        setGameState('memorize');

        setTimeout(() => {
            setGameState('recall');
        }, config.memorizeTime);
    }, [config]);

    const startGame = useCallback((diff: Difficulty) => {
        setDifficulty(diff);
        setLevel(1);
        setLives(3);
        const newConfig = DIFFICULTY_LEVELS[diff];
        const newPath = generatePath(newConfig.gridSize, newConfig.pathLength);
        setPath(newPath);
        setUserPath([]);
        setGameState('memorize');

        setTimeout(() => {
            setGameState('recall');
        }, newConfig.memorizeTime);
    }, []);

    const handleCellClick = (row: number, col: number) => {
        if (gameState !== 'recall' || !config) return;

        const isAlreadyClicked = userPath.some(p => p.row === row && p.col === col);
        if (isAlreadyClicked) return;

        const newUserPath = [...userPath, { row, col }];
        setUserPath(newUserPath);
        
        const currentPathIndex = newUserPath.length - 1;
        const correctCell = path[currentPathIndex];
        
        if (newUserPath.length > path.length || row !== correctCell.row || col !== correctCell.col) {
            // Incorrect move
            setLives(l => l - 1);
            setGameState('gameOver');
            toast({ variant: 'destructive', title: 'Wrong Path!', description: "That's not the correct path. Try to remember it next time."});
            return;
        }

        if (newUserPath.length === path.length) {
            // Level complete
            setGameState('levelComplete');
            toast({ title: 'Path Correct!', description: 'Great memory! Get ready for the next level.', className: 'bg-green-500 text-white' });
            setTimeout(() => {
                setLevel(l => l + 1);
                startNewLevel();
            }, 2000);
        }
    };

    useEffect(() => {
        if (lives <= 0) {
            setGameState('gameOver');
        }
    }, [lives]);

    const isCellInPath = (row: number, col: number, pathToCheck: GridCell[]) => pathToCheck.some(p => p.row === row && p.col === col);

    const renderGrid = () => {
        if (!config) return null;
        
        return (
            <div className="flex justify-center">
                 <div
                    className="grid gap-2 bg-muted p-2 rounded-lg"
                    style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: config.gridSize * config.gridSize }).map((_, index) => {
                        const row = Math.floor(index / config.gridSize);
                        const col = index % config.gridSize;
                        
                        const isPathStart = path[0]?.row === row && path[0]?.col === col;
                        const inCorrectPath = isCellInPath(row, col, path);
                        const inUserPath = isCellInPath(row, col, userPath);
                        
                        let cellState: 'default' | 'path' | 'start' | 'correct' | 'incorrect' = 'default';

                        if (gameState === 'memorize' && inCorrectPath) {
                            cellState = 'path';
                            if (isPathStart) cellState = 'start';
                        } else if (gameState === 'recall' || gameState === 'levelComplete') {
                            if (isPathStart) cellState = 'start';
                            if (inUserPath) cellState = 'correct';
                        } else if (gameState === 'gameOver') {
                            if (isPathStart) cellState = 'start';
                            if(inCorrectPath && !inUserPath) cellState = 'path'; // show missed correct path
                            if(inUserPath && inCorrectPath) cellState = 'correct'; // show correct user path
                            if(inUserPath && !inCorrectPath) cellState = 'incorrect'; // show wrong user moves
                        }

                        return (
                            <button
                                key={`${row}-${col}`}
                                onClick={() => handleCellClick(row, col)}
                                disabled={gameState !== 'recall'}
                                className={cn(
                                    "w-16 h-16 sm:w-20 sm:h-20 rounded-md transition-colors duration-200 border-2",
                                    gameState !== 'recall' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-primary/20',
                                    cellState === 'default' && 'bg-card border-border',
                                    cellState === 'path' && 'bg-yellow-400/50 border-yellow-500 animate-pulse',
                                    cellState === 'start' && 'bg-green-500 border-green-700',
                                    cellState === 'correct' && 'bg-green-400 border-green-600',
                                    cellState === 'incorrect' && 'bg-red-400 border-red-600',
                                )}
                            >
                                {cellState === 'start' && <span className="text-white font-bold">Start</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    if (gameState === 'setup') {
        return (
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="bg-primary/10 text-center">
                    <CardTitle className="text-3xl font-bold text-primary">Memory Maze</CardTitle>
                    <CardDescription>Select a difficulty to start.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 p-6">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                        <Button key={d} onClick={() => startGame(d)} className="text-lg py-6 capitalize">
                            {d === 'easy' && <Shield className="mr-2" />}
                            {d === 'medium' && <Star className="mr-2" />}
                            {d === 'hard' && <Gem className="mr-2" />}
                            {d} ({DIFFICULTY_LEVELS[d].gridSize}x{DIFFICULTY_LEVELS[d].gridSize})
                        </Button>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-xl shadow-xl">
             <CardHeader className="bg-primary/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Route size={28} className="text-primary" />
                        <CardTitle className="text-2xl font-bold text-primary">Memory Maze</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setGameState('setup')}>
                        <ArrowLeft size={16} className="mr-1" /> Change Difficulty
                    </Button>
                </div>
                <CardDescription className="text-center text-md text-foreground/80 pt-2 flex justify-between items-center px-2">
                    <span className="font-semibold text-lg">Level: <span className="text-accent">{level}</span></span>
                    <span className="font-semibold text-lg flex items-center">
                        Lives:
                        <div className="flex ml-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Heart key={i} className={cn("h-5 w-5 transition-colors", i < lives ? "text-red-500 fill-current" : "text-muted-foreground/30")} />
                            ))}
                        </div>
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {gameState === 'memorize' && (
                    <div className="text-center p-3 bg-yellow-100/70 border border-yellow-400/50 rounded-lg">
                        <p className="font-bold text-yellow-800 animate-pulse">Memorize the path!</p>
                    </div>
                )}
                {gameState === 'recall' && (
                     <div className="text-center p-3 bg-green-100/70 border border-green-400/50 rounded-lg">
                        <p className="font-bold text-green-800">Your turn! Trace the path from the start.</p>
                    </div>
                )}
                 {gameState === 'gameOver' && lives > 0 && (
                     <div className="text-center p-3 bg-red-100/70 border border-red-400/50 rounded-lg">
                        <p className="font-bold text-red-800">Wrong path! You lost a life.</p>
                    </div>
                )}
                {renderGrid()}
                 {gameState === 'gameOver' && (
                    <div className="text-center p-4 bg-muted rounded-lg space-y-3">
                        <h3 className="text-2xl font-bold text-destructive">Game Over</h3>
                        <p className="text-lg">You reached level <span className="font-bold text-accent">{level}</span>.</p>
                        <Button onClick={() => difficulty && startGame(difficulty)} className="bg-accent text-accent-foreground">
                            <Brain className="mr-2" /> Try Again
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
