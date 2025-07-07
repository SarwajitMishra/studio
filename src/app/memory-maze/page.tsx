
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Award, ArrowLeft, Shield, Star, Gem, Heart, Route, User, Eye, Pointer, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { S_COINS_ICON as SCoinsIcon, S_POINTS_ICON as SPointsIcon } from '@/lib/constants';

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
    if (gridSize % 2 === 0) gridSize++;
    const grid: GridCell[][] = Array.from({ length: gridSize }, (_, row) =>
        Array.from({ length: gridSize }, (_, col) => ({
            row, col, isWall: true, visitedByGenerator: false, visitedByPlayer: false,
            isStart: false, isEnd: false, isPlayer: false, isIncorrectGuess: false,
        }))
    );
    const stack: { row: number; col: number }[] = [];
    const startRow = 1, startCol = 1;
    grid[startRow][startCol].isWall = false;
    grid[startRow][startCol].visitedByGenerator = true;
    stack.push({ row: startRow, col: startCol });
    while (stack.length > 0) {
        const current = stack.pop()!;
        const neighbors = [];
        const directions = [[0, 2], [0, -2], [2, 0], [-2, 0]];
        directions.sort(() => Math.random() - 0.5);
        for (const [dr, dc] of directions) {
            const newRow = current.row + dr, newCol = current.col + dc;
            if (newRow > 0 && newRow < gridSize -1 && newCol > 0 && newCol < gridSize -1 && !grid[newRow][newCol].visitedByGenerator) {
                neighbors.push({ row: newRow, col: newCol, wallRow: current.row + dr / 2, wallCol: current.col + dc / 2 });
            }
        }
        if (neighbors.length > 0) {
            stack.push(current);
            const chosen = neighbors[0];
            grid[chosen.wallRow][chosen.wallCol].isWall = false;
            grid[chosen.row][chosen.col].isWall = false;
            grid[chosen.row][chosen.col].visitedByGenerator = true;
            stack.push({ row: chosen.row, col: chosen.col });
        }
    }
    const startPos = { row: 1, col: 1 };
    grid[startPos.row][startPos.col].isStart = true;
    let endPos = { row: gridSize - 2, col: gridSize - 2 };
    if(grid[endPos.row][endPos.col].isWall) grid[endPos.row][endPos.col].isWall = false;
    grid[endPos.row][endPos.col].isEnd = true;
    return { grid, startPos, endPos };
};

const HowToPlayAnimation = () => {
    // ... How to play animation content (unchanged)
};

export default function MemoryMazePage() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [gameState, setGameState] = useState<GameState>('setup');
    
    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
    const [endPos, setEndPos] = useState({ row: 0, col: 0 });
    
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [isCalculatingReward, setIsCalculatingReward] = useState(false);
    const { toast } = useToast();
    
    const config = difficulty ? DIFFICULTY_LEVELS[difficulty] : null;

    const handleGameOver = useCallback(async (isWin: boolean) => {
        setGameState('gameOver');
        setIsCalculatingReward(true);
        updateGameStats({ gameId: 'memoryMaze', didWin: isWin, score: level });

        try {
            const rewards = await calculateRewards({ gameId: 'memoryMaze', difficulty: difficulty!, performanceMetrics: { levelReached: level, livesLeft: lives } });
            applyRewards(rewards.sPoints, rewards.sCoins, `Memory Maze (${difficulty})`);
            toast({
                title: isWin ? "You Win!" : "Game Over",
                description: `You earned ${rewards.sPoints} S-Points and ${rewards.sCoins} S-Coins!`,
            });
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        } finally {
            setIsCalculatingReward(false);
        }
    }, [difficulty, level, lives, toast]);

    const startNewLevel = useCallback(() => {
        if (!config) return;
        
        const { grid: newGrid, startPos: newStartPos, endPos: newEndPos } = generateMaze(config.gridSize);
        newGrid[newStartPos.row][newStartPos.col].isPlayer = true;
        newGrid[newStartPos.row][newStartPos.col].visitedByPlayer = true;
        
        setGrid(newGrid);
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
        startNewLevel();
    }, [difficulty, startNewLevel]);

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
                handleGameOver(false);
            }
            return;
        }

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
    
    if (gameState === 'setup') {
        // ... setup view (unchanged)
    }
    
    if (gameState === 'howToPlay') {
       // ... how to play view (unchanged)
    }

    // Main game view
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
                {gameState === 'gameOver' ? (
                    <div className="text-center p-4 bg-muted rounded-lg space-y-3">
                        {isCalculatingReward ? (
                             <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary"/>
                        ) : (
                            <>
                            <h3 className="text-2xl font-bold text-destructive">Game Over</h3>
                            <p className="text-lg">You reached level <span className="font-bold text-accent">{level}</span>.</p>
                            <Button onClick={() => difficulty && startGame()} className="bg-accent text-accent-foreground">
                                <Brain className="mr-2" /> Try Again
                            </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
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
                    {/* Grid rendering logic here (unchanged) */}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// Ensure all other functions (HowToPlayAnimation, renderGrid) are included here or are already present. The provided snippet only shows the main component logic. I have omitted the unchanged functions for brevity but they should be in the final file.
