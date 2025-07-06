
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRID_SIZE = 4;
type Board = number[][];
type Theme = 'default' | 'forest' | 'ocean';

const TILE_COLORS: Record<number, string> = {
    2: 'bg-slate-200 text-slate-800', 4: 'bg-amber-200 text-amber-800', 8: 'bg-orange-400 text-white',
    16: 'bg-rose-500 text-white', 32: 'bg-red-600 text-white', 64: 'bg-fuchsia-600 text-white',
    128: 'bg-yellow-400 text-slate-800 shadow-lg shadow-yellow-400/50',
    256: 'bg-yellow-500 text-slate-800 shadow-lg shadow-yellow-500/50',
    512: 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/50',
    1024: 'bg-teal-500 text-white shadow-lg shadow-teal-500/50',
    2048: 'bg-teal-600 text-white shadow-lg shadow-teal-600/50',
};

const THEME_BACKGROUNDS: Record<Theme, string> = {
    default: 'bg-gradient-to-br from-sky-100 to-blue-200',
    forest: 'bg-gradient-to-br from-green-200 to-lime-300',
    ocean: 'bg-gradient-to-br from-cyan-200 to-indigo-300',
};

// A single cell on the board that can be a drop target
const BoardCell = ({ children, onDrop, onDragOver }: {
    children: React.ReactNode;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}) => (
    <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="w-20 h-20 sm:w-24 sm:h-24 bg-black/10 rounded-md flex items-center justify-center"
    >
        {children}
    </div>
);

// A draggable tile with a number
const Tile = ({ value, onDragStart }: { value: number; onDragStart: (e: React.DragEvent<HTMLDivElement>) => void; }) => {
    if (value === 0) return null;

    const colorClass = TILE_COLORS[value] || TILE_COLORS[2048];

    return (
        <div
            draggable
            onDragStart={onDragStart}
            className={cn(
                "w-full h-full rounded-md flex items-center justify-center font-bold text-3xl sm:text-4xl cursor-grab active:cursor-grabbing",
                "animate-drop",
                colorClass
            )}
        >
            {value}
        </div>
    );
};


const HowToPlay2048 = ({ onStartGame }: { onStartGame: () => void }) => (
    <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-bold">How to Play 2048</CardTitle>
            <CardDescription>A game of merging numbers!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="text-left space-y-2">
                <p>1. <span className="font-bold">Drag and drop</span> a tile onto an adjacent tile (not diagonal).</p>
                <p>2. If the tiles have the <span className="font-bold text-accent">same number</span>, they will merge into one!</p>
                <p>3. A new tile (either a 2 or a 4) will appear in an empty spot after each successful merge.</p>
                <p>4. The goal is to create a tile with the number <span className="font-bold text-primary">2048!</span></p>
                <p>5. The game is over when there are no more possible merges.</p>
            </div>
            <Button onClick={onStartGame} className="w-full text-lg bg-accent text-accent-foreground">
                Let's Go! <ArrowRight className="ml-2" />
            </Button>
        </CardContent>
    </Card>
);

export default function Game2048Page() {
    const [board, setBoard] = useState<Board>([]);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [theme, setTheme] = useState<Theme>('default');
    const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
    
    const createEmptyBoard = (): Board => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

    const addRandomTile = useCallback((currentBoard: Board): Board => {
        const newBoard = currentBoard.map(row => [...row]);
        const emptyTiles: { r: number, c: number }[] = [];
        newBoard.forEach((row, r) => row.forEach((cell, c) => {
            if (cell === 0) emptyTiles.push({ r, c });
        }));

        if (emptyTiles.length === 0) return newBoard;

        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
        return newBoard;
    }, []);
    
    const startGame = useCallback(() => {
        let newBoard = createEmptyBoard();
        newBoard = addRandomTile(newBoard);
        newBoard = addRandomTile(newBoard);
        setBoard(newBoard);
        setScore(0);
        setIsGameOver(false);
        setGameState('playing');
    }, [addRandomTile]);

    const isGameOverCheck = (currentBoard: Board): boolean => {
        let hasEmptyCell = false;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (currentBoard[r][c] === 0) {
                    hasEmptyCell = true;
                    break;
                }
            }
            if (hasEmptyCell) break;
        }
        if (hasEmptyCell) return false;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const current = currentBoard[r][c];
                if (c < GRID_SIZE - 1 && current === currentBoard[r][c + 1]) return false;
                if (r < GRID_SIZE - 1 && current === currentBoard[r + 1][c]) return false;
            }
        }
        return true;
    };


    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, r: number, c: number, value: number) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ r, c, value }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetR: number, targetC: number) => {
        e.preventDefault();
        if (isGameOver) return;
        
        try {
            const data = e.dataTransfer.getData('text/plain');
            if (!data) return;
            const sourceData = JSON.parse(data);
            const { r: sourceR, c: sourceC, value: sourceValue } = sourceData;
            
            if (sourceR === targetR && sourceC === targetC) return;
            
            const targetValue = board[targetR][targetC];
            
            const isAdjacent = (Math.abs(sourceR - targetR) === 1 && sourceC === targetC) ||
                               (Math.abs(sourceC - targetC) === 1 && sourceR === targetR);
            
            if (!isAdjacent || sourceValue !== targetValue || sourceValue === 0) {
                return;
            }
            
            let newBoard = board.map(row => [...row]);
            const mergedValue = sourceValue * 2;
            newBoard[targetR][targetC] = mergedValue;
            newBoard[sourceR][sourceC] = 0;

            const boardWithNewTile = addRandomTile(newBoard);
            setBoard(boardWithNewTile);
            setScore(s => s + mergedValue);

            if (isGameOverCheck(boardWithNewTile)) {
                setIsGameOver(true);
            }

        } catch (error) {
            console.error("Drag and drop failed", error);
        }
    };
    
    useEffect(() => {
        if (gameState === 'playing' && board.length > 0 && isGameOverCheck(board)) {
            setIsGameOver(true);
        }
    }, [board, gameState]);
    
    if (gameState === 'setup') {
      return (
         <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
           <HowToPlay2048 onStartGame={startGame} />
        </div>
      )
    }

    return (
        <div className="flex flex-col items-center p-4 space-y-4">
            <Card className="w-full max-w-2xl text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">2048</CardTitle>
                    <div className="flex justify-between items-center pt-2">
                        <div className="p-2 bg-muted rounded-md">Score: <span className="font-bold">{score}</span></div>
                        <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="forest">Forest</SelectItem>
                                <SelectItem value="ocean">Ocean</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={startGame}><RotateCw className="mr-2"/>New Game</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={cn("relative p-4 rounded-lg", THEME_BACKGROUNDS[theme])}>
                        {isGameOver && (
                           <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm rounded-lg">
                                <h2 className="text-4xl font-bold text-white">Game Over</h2>
                                <Button onClick={startGame} className="mt-4"><RotateCw className="mr-2"/>Try Again</Button>
                            </div>
                        )}
                        <div className="grid grid-cols-4 gap-4">
                            {board.map((row, r_idx) => row.map((cellValue, c_idx) => (
                                <BoardCell key={`${r_idx}-${c_idx}`} onDrop={(e) => handleDrop(e, r_idx, c_idx)} onDragOver={handleDragOver}>
                                    {cellValue !== 0 && (
                                    <Tile value={cellValue} onDragStart={(e) => handleDragStart(e, r_idx, c_idx, cellValue)} />
                                    )}
                                </BoardCell>
                            )))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
