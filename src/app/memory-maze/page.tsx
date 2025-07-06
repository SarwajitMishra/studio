
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Award, ArrowLeft, Shield, Star, Gem, Heart, Route, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'setup' | 'memorize' | 'recall' | 'levelComplete' | 'gameOver';

interface LevelConfig {
  gridSize: number;
  memorizeTime: number; // in ms
}

const DIFFICULTY_LEVELS: Record<Difficulty, LevelConfig> = {
  easy: { gridSize: 5, memorizeTime: 4000 },
  medium: { gridSize: 7, memorizeTime: 5000 },
  hard: { gridSize: 11, memorizeTime: 7000 },
};

interface GridCell {
    row: number;
    col: number;
    isWall: boolean;
    visitedByGenerator: boolean; // For maze generation
    visitedByPlayer: boolean;   // For player path
    isStart: boolean;
    isEnd: boolean;
    isPlayer: boolean;
    isIncorrectGuess: boolean; // To flash red on wrong move
}

const generateMaze = (gridSize: number): { grid: GridCell[][], startPos: {row: number, col: number}, endPos: {row: number, col: number} } => {
    // Ensure grid size is odd for this algorithm
    if (gridSize % 2 === 0) gridSize++;

    const grid: GridCell[][] = Array.from({ length: gridSize }, (_, row) =>
        Array.from({ length: gridSize }, (_, col) => ({
            row,
            col,
            isWall: true,
            visitedByGenerator: false,
            visitedByPlayer: false,
            isStart: false,
            isEnd: false,
            isPlayer: false,
            isIncorrectGuess: false,
        }))
    );

    const stack: { row: number; col: number }[] = [];
    const startRow = 1;
    const startCol = 1;

    grid[startRow][startCol].isWall = false;
    grid[startRow][startCol].visitedByGenerator = true;
    stack.push({ row: startRow, col: startCol });

    while (stack.length > 0) {
        const current = stack.pop()!;
        const neighbors = [];
        const directions = [[0, 2], [0, -2], [2, 0], [-2, 0]]; // Move 2 cells at a time
        directions.sort(() => Math.random() - 0.5);

        for (const [dr, dc] of directions) {
            const newRow = current.row + dr;
            const newCol = current.col + dc;
            if (newRow > 0 && newRow < gridSize -1 && newCol > 0 && newCol < gridSize -1 && !grid[newRow][newCol].visitedByGenerator) {
                neighbors.push({ row: newRow, col: newCol, wallRow: current.row + dr / 2, wallCol: current.col + dc / 2 });
            }
        }

        if (neighbors.length > 0) {
            stack.push(current);
            const chosen = neighbors[0];
            grid[chosen.wallRow][chosen.wallCol].isWall = false; // Carve path
            grid[chosen.row][chosen.col].isWall = false;
            grid[chosen.row][chosen.col].visitedByGenerator = true;
            stack.push({ row: chosen.row, col: chosen.col });
        }
    }
    
    // Set start and end points
    const startPos = { row: 1, col: 1 };
    grid[startPos.row][startPos.col].isStart = true;
    
    const endPos = { row: gridSize - 2, col: gridSize - 2 };
    grid[endPos.row][endPos.col].isEnd = true;

    return { grid, startPos, endPos };
};


export default function MemoryMazePage() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [gameState, setGameState] = useState<GameState>('setup');
    
    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
    const [startPos, setStartPos] = useState({ row: 0, col: 0 });
    const [endPos, setEndPos] = useState({ row: 0, col: 0 });
    
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);

    const { toast } = useToast();
    
    const config = difficulty ? DIFFICULTY_LEVELS[difficulty] : null;

    const startNewLevel = useCallback(() => {
        if (!config) return;
        
        const { grid: newGrid, startPos: newStartPos, endPos: newEndPos } = generateMaze(config.gridSize);
        newGrid[newStartPos.row][newStartPos.col].isPlayer = true;
        newGrid[newStartPos.row][newStartPos.col].visitedByPlayer = true;
        
        setGrid(newGrid);
        setStartPos(newStartPos);
        setEndPos(newEndPos);
        setPlayerPos(newStartPos);
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
        const { grid: newGrid, startPos: newStartPos, endPos: newEndPos } = generateMaze(newConfig.gridSize);

        newGrid[newStartPos.row][newStartPos.col].isPlayer = true;
        newGrid[newStartPos.row][newStartPos.col].visitedByPlayer = true;
        
        setGrid(newGrid);
        setStartPos(newStartPos);
        setEndPos(newEndPos);
        setPlayerPos(newStartPos);
        setGameState('memorize');

        setTimeout(() => {
            setGameState('recall');
        }, newConfig.memorizeTime);
    }, []);

    const handleCellClick = (row: number, col: number) => {
        if (gameState !== 'recall' || !config) return;
        
        const isAdjacent = Math.abs(row - playerPos.row) + Math.abs(col - playerPos.col) === 1;
        if (!isAdjacent) return;

        const newGrid = grid.map(r => r.map(c => ({...c, isIncorrectGuess: false})));
        const targetCell = newGrid[row][col];
        
        if (targetCell.isWall) {
            const newLives = lives - 1;
            setLives(newLives);
            
            newGrid[row][col].isIncorrectGuess = true;
            setGrid(newGrid);
            
            toast({ variant: 'destructive', title: 'You hit a wall!', description: `You have ${newLives} ${newLives === 1 ? 'life' : 'lives'} left.` });
            if (newLives <= 0) {
                setGameState('gameOver');
            }
            return;
        }

        // Move player
        newGrid[playerPos.row][playerPos.col].isPlayer = false;
        targetCell.isPlayer = true;
        targetCell.visitedByPlayer = true;
        setGrid(newGrid);
        setPlayerPos({ row, col });

        if (targetCell.isEnd) {
            setGameState('levelComplete');
            toast({ title: 'Maze Complete!', description: 'Great memory! Get ready for the next level.', className: 'bg-green-500 text-white' });
            setTimeout(() => {
                setLevel(l => l + 1);
                startNewLevel();
            }, 2000);
        }
    };

    const renderGrid = () => {
        if (!config || grid.length === 0) return null;
        
        return (
            <div className="flex justify-center">
                 <div
                    className="grid gap-1 bg-muted p-2 rounded-lg"
                    style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}
                >
                    {grid.flat().map((cell, index) => {
                        const { row, col, isWall, isStart, isEnd, isPlayer, visitedByPlayer, isIncorrectGuess } = cell;
                        
                        let cellContent = null;
                        if (isStart) cellContent = <User className="w-4/6 h-4/6 text-white"/>;
                        if (isEnd) cellContent = <Star className="w-4/6 h-4/6 text-white"/>;
                        if (isPlayer && !isStart && !isEnd) cellContent = <div className="w-1/2 h-1/2 rounded-full bg-yellow-300"></div>;

                        return (
                            <button
                                key={`${row}-${col}`}
                                onClick={() => handleCellClick(row, col)}
                                disabled={gameState !== 'recall'}
                                className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-sm transition-colors duration-200 flex items-center justify-center",
                                    gameState !== 'recall' ? 'cursor-not-allowed' : 'cursor-pointer',
                                    // Base color
                                    isWall && (gameState === 'memorize' || gameState === 'gameOver') ? 'bg-primary/50' : 'bg-card',
                                    // Player path & special tiles
                                    !isWall && visitedByPlayer && 'bg-yellow-300/30',
                                    isStart && 'bg-green-500',
                                    isEnd && 'bg-red-500',
                                    isPlayer && 'ring-2 ring-yellow-300 z-10',
                                    isIncorrectGuess && 'bg-destructive/70 animate-pulse',
                                    // Hover effect only for adjacent cells
                                    gameState === 'recall' && Math.abs(row - playerPos.row) + Math.abs(col - playerPos.col) === 1 && 'hover:bg-primary/20'
                                )}
                                aria-label={`Cell at row ${row}, column ${col}`}
                            >
                                {cellContent}
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
                    <CardDescription>Memorize the maze path, then navigate it from memory!</CardDescription>
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
        <Card className="w-full max-w-2xl shadow-xl">
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
                        <p className="font-bold text-green-800">Your turn! Navigate from <User className="inline-block h-4 w-4"/> to <Star className="inline-block h-4 w-4"/>.</p>
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
