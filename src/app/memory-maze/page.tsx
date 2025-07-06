
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Award, ArrowLeft, Shield, Star, Gem, Heart, Route, User, Eye, Pointer } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'setup' | 'howToPlay' | 'memorize' | 'recall' | 'levelComplete' | 'gameOver';

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
    
    let endPos = { row: gridSize - 2, col: gridSize - 2 };
    // Ensure end is not a wall (it shouldn't be with this algo, but as a safeguard)
    if(grid[endPos.row][endPos.col].isWall) {
       grid[endPos.row][endPos.col].isWall = false;
    }
    grid[endPos.row][endPos.col].isEnd = true;

    return { grid, startPos, endPos };
};

const HowToPlayAnimation = () => {
    const [step, setStep] = useState(0);
    const steps = [
        { text: "1. Memorize the path from the player to the star.", wallsVisible: true, playerPos: {r:0, c:0}, pointer: false, hitWall: false },
        { text: "2. The walls will disappear!", wallsVisible: false, playerPos: {r:0, c:0}, pointer: false, hitWall: false },
        { text: "3. Click on adjacent squares to move along the path you remember.", wallsVisible: false, playerPos: {r:0, c:1}, pointer: true, hitWall: false },
        { text: "4. Reach the star to win the level!", wallsVisible: false, playerPos: {r:1, c:1}, pointer: false, hitWall: false },
        { text: "5. But be careful! Hitting a hidden wall costs a life.", wallsVisible: false, playerPos: {r:0, c:0}, pointer: false, hitWall: true },
    ];
    
    useEffect(() => {
        const timer = setInterval(() => {
            setStep(prev => (prev + 1) % steps.length);
        }, 2500);
        return () => clearInterval(timer);
    }, [steps.length]);

    const currentStep = steps[step];
    
    const animationGrid = [
        [{ isStart: true }, { isPath: true, isWall: false }, { isWall: true }],
        [{ isWall: true }, { isPath: true, isWall: false }, { isEnd: true }],
        [{ isWall: true }, { isWall: true }, { isWall: true }],
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-1 bg-muted p-2 rounded-lg">
                    {animationGrid.flat().map((cell, index) => {
                        const r = Math.floor(index / 3);
                        const c = index % 3;
                        const isPlayerHere = currentStep.playerPos.r === r && currentStep.playerPos.c === c;
                        const isPointerHere = currentStep.pointer && r === 0 && c === 1;
                        const isHitWall = currentStep.hitWall && r === 0 && c === 2;

                        return (
                            <div key={index} className={cn("w-16 h-16 rounded-md flex items-center justify-center transition-colors duration-300", 
                                (cell.isWall && currentStep.wallsVisible) ? 'bg-gradient-to-br from-amber-700 to-red-900' : 'bg-card',
                                (cell.isStart) && 'bg-green-500',
                                (cell.isEnd) && 'bg-red-500',
                                isHitWall && 'bg-destructive/70 animate-pulse',
                            )}>
                                {cell.isStart && !isPlayerHere && <User className="w-2/3 h-2/3 text-white"/>}
                                {cell.isEnd && <Star className="w-2/3 h-2/3 text-white"/>}
                                {isPlayerHere && <div className="w-1/2 h-1/2 rounded-full bg-yellow-300 ring-2 ring-white"></div>}
                                {isPointerHere && <Pointer className="w-2/3 h-2/3 text-white animate-bounce" />}
                            </div>
                        );
                    })}
                </div>
            </div>
            <p className="text-center font-medium text-foreground/90 min-h-[40px]">{currentStep.text}</p>
             <div className="flex justify-center items-center">
                <span className="font-semibold text-lg flex items-center">
                    Lives:
                    <div className="flex ml-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Heart key={i} className={cn("h-5 w-5 transition-all", (currentStep.hitWall && i === 2) ? "text-muted-foreground/30 scale-90" : "text-red-500 fill-current")} />
                        ))}
                    </div>
                </span>
            </div>
        </div>
    );
}


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

    const handleDifficultySelect = (diff: Difficulty) => {
        setDifficulty(diff);
        setGameState('howToPlay');
    };

    const startGame = useCallback(() => {
        if (!difficulty) return;
        setLevel(1);
        setLives(3);
        const newConfig = DIFFICULTY_LEVELS[difficulty];
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
    }, [difficulty]);

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
                                    isWall && (gameState === 'memorize' || gameState === 'gameOver') ? 'bg-gradient-to-br from-amber-700 to-red-900' : 'bg-card',
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
                        <Button key={d} onClick={() => handleDifficultySelect(d)} className="text-lg py-6 capitalize">
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
    
    if (gameState === 'howToPlay') {
        return (
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="bg-primary/10 text-center">
                    <CardTitle className="text-2xl font-bold text-primary">How to Play</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <HowToPlayAnimation />
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={() => setGameState('setup')} variant="outline" className="w-full">
                            <ArrowLeft className="mr-2" /> Back
                        </Button>
                        <Button onClick={startGame} className="w-full bg-accent text-accent-foreground">
                            Start Game!
                        </Button>
                    </div>
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
                        <p className="font-bold text-yellow-800 animate-pulse flex items-center justify-center gap-2">
                            <Eye size={20} />
                            Memorize the path!
                        </p>
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
                        <Button onClick={() => difficulty && startGame()} className="bg-accent text-accent-foreground">
                            <Brain className="mr-2" /> Try Again
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
