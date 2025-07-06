
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { RotateCw, ArrowRight, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight as ArrowRightIcon, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRID_SIZE = 4;
type Board = number[][];
type Theme = 'default' | 'forest' | 'ocean';
type Point = { x: number; y: number };

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

const BoardCell = ({ children }: { children: React.ReactNode }) => (
    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black/10 rounded-md flex items-center justify-center">
        {children}
    </div>
);

const Tile = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const colorClass = TILE_COLORS[value] || TILE_COLORS[2048];
    return (
        <div className={cn("w-full h-full rounded-md flex items-center justify-center font-bold text-3xl sm:text-4xl", "animate-drop", colorClass)}>
            {value}
        </div>
    );
};

const HowToPlayContent = () => (
    <>
        <CardHeader>
            <CardTitle className="text-2xl font-bold">How to Play 2048</CardTitle>
            <CardDescription>A game of sliding and merging numbers!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="text-left space-y-2">
                <p>1. Use your <span className="font-bold">arrow keys</span> (<ArrowUp className="inline-block h-4 w-4"/> <ArrowDown className="inline-block h-4 w-4"/> <ArrowLeft className="inline-block h-4 w-4"/> <ArrowRightIcon className="inline-block h-4 w-4"/>) to slide all tiles.</p>
                <p>2. Alternatively, you can <span className="font-bold">click and drag</span> or <span className="font-bold">swipe</span> (<MousePointerClick className="inline-block h-4 w-4"/>) on the board in any direction.</p>
                <p>3. Tiles with the <span className="font-bold text-accent">same number</span> will merge into one when they collide!</p>
                <p>4. A new tile (either a 2 or a 4) will appear in an empty spot after each move.</p>
                <p>5. The goal is to create a tile with the number <span className="font-bold text-primary">2048!</span></p>
                <p>6. The game is over when the board is full and there are no more possible moves.</p>
            </div>
        </CardContent>
    </>
);

export default function Game2048Page() {
    const [board, setBoard] = useState<Board>([]);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [theme, setTheme] = useState<Theme>('default');
    const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
    
    const [touchStart, setTouchStart] = useState<Point | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);

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

    const slideAndMergeRow = useCallback((row: number[]) => {
        let filteredRow = row.filter(tile => tile !== 0);
        let newScore = 0;
        for (let i = 0; i < filteredRow.length - 1; i++) {
            if (filteredRow[i] === filteredRow[i + 1]) {
                filteredRow[i] *= 2;
                newScore += filteredRow[i];
                filteredRow[i + 1] = 0;
            }
        }
        let newRow = filteredRow.filter(tile => tile !== 0);
        while (newRow.length < GRID_SIZE) {
            newRow.push(0);
        }
        return { newRow, mergedScore: newScore };
    }, []);
    
    const transpose = (matrix: Board): Board => {
        const newMatrix = createEmptyBoard();
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                newMatrix[c][r] = matrix[r][c];
            }
        }
        return newMatrix;
    };

    const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (isGameOver) return;
    
        let newBoard = board.map(row => [...row]);
        let tempBoard = board.map(row => [...row]);
        let moved = false;
        let totalMergedScore = 0;

        if (direction === 'up' || direction === 'down') {
            tempBoard = transpose(tempBoard);
        }

        for (let r = 0; r < GRID_SIZE; r++) {
            const rowToProcess = (direction === 'right' || direction === 'down') ? tempBoard[r].slice().reverse() : tempBoard[r];
            const { newRow: processedRow, mergedScore } = slideAndMergeRow(rowToProcess);
            totalMergedScore += mergedScore;
            
            const finalRow = (direction === 'right' || direction === 'down') ? processedRow.reverse() : processedRow;
            if (JSON.stringify(tempBoard[r]) !== JSON.stringify(finalRow)) moved = true;
            tempBoard[r] = finalRow;
        }

        if (direction === 'up' || direction === 'down') {
            tempBoard = transpose(tempBoard);
        }
        newBoard = tempBoard;
    
        if (moved) {
            const boardWithNewTile = addRandomTile(newBoard);
            setBoard(boardWithNewTile);
            setScore(s => s + totalMergedScore);
            if (isGameOverCheck(boardWithNewTile)) {
                setIsGameOver(true);
            }
        }
    }, [board, isGameOver, slideAndMergeRow, addRandomTile]);

    const isGameOverCheck = (currentBoard: Board): boolean => {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (currentBoard[r][c] === 0) return false; // has empty cell
                if (c < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c + 1]) return false; // can merge horizontally
                if (r < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r + 1][c]) return false; // can merge vertically
            }
        }
        return true;
    };
    
    const startGame = useCallback(() => {
        let newBoard = createEmptyBoard();
        newBoard = addRandomTile(newBoard);
        newBoard = addRandomTile(newBoard);
        setBoard(newBoard);
        setScore(0);
        setIsGameOver(false);
        setGameState('playing');
    }, [addRandomTile]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;
            e.preventDefault();
            switch (e.key) {
                case 'ArrowUp': move('up'); break;
                case 'ArrowDown': move('down'); break;
                case 'ArrowLeft': move('left'); break;
                case 'ArrowRight': move('right'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [move, gameState]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (gameState !== 'playing') return;
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStart || gameState !== 'playing') return;

        const touchEnd = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        const dx = touchEnd.x - touchStart.x;
        const dy = touchEnd.y - touchStart.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        const minSwipeDistance = 50;

        if (Math.max(absDx, absDy) > minSwipeDistance) {
            if (absDx > absDy) {
                move(dx > 0 ? 'right' : 'left');
            } else {
                move(dy > 0 ? 'down' : 'up');
            }
            setTouchStart(null); // Reset after a successful swipe
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
         if (gameState !== 'playing') return;
         setTouchStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!touchStart || gameState !== 'playing') return;

        const touchEnd = { x: e.clientX, y: e.clientY };
        const dx = touchEnd.x - touchStart.x;
        const dy = touchEnd.y - touchStart.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const minSwipeDistance = 50;

        if (Math.max(absDx, absDy) > minSwipeDistance) {
            if (absDx > absDy) {
                move(dx > 0 ? 'right' : 'left');
            } else {
                move(dy > 0 ? 'down' : 'up');
            }
        }
        setTouchStart(null);
    };

    if (gameState === 'setup') {
      return (
         <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
           <Card className="w-full max-w-md text-center shadow-xl">
                <HowToPlayContent />
                <CardFooter className="flex flex-col sm:flex-row gap-2 p-6 pt-0">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Menu</Link>
                    </Button>
                    <Button onClick={startGame} className="w-full text-lg bg-accent text-accent-foreground">
                        Let's Go! <ArrowRight className="ml-2" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
      )
    }

    return (
        <div className="flex flex-col items-center p-4 space-y-4">
            <Card className="w-full max-w-2xl text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">2048</CardTitle>
                    <div className="flex justify-between items-center pt-2 gap-2">
                        <div className="p-2 bg-muted rounded-md">Score: <span className="font-bold">{score}</span></div>
                        <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="forest">Forest</SelectItem>
                                <SelectItem value="ocean">Ocean</SelectItem>
                            </SelectContent>
                        </Select>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline"><HelpCircle className="mr-2"/> Help</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <HowToPlayContent />
                            </DialogContent>
                        </Dialog>
                        <Button onClick={startGame}><RotateCw className="mr-2"/>New Game</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div
                        ref={boardRef}
                        className={cn("relative p-4 rounded-lg cursor-pointer", THEME_BACKGROUNDS[theme])}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                    >
                        {isGameOver && (
                           <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm rounded-lg">
                                <h2 className="text-4xl font-bold text-white">Game Over</h2>
                                <Button onClick={startGame} className="mt-4"><RotateCw className="mr-2"/>Try Again</Button>
                            </div>
                        )}
                        <div className="grid grid-cols-4 gap-4">
                            {board.map((row, r_idx) => row.map((cellValue, c_idx) => (
                                <BoardCell key={`${r_idx}-${c_idx}`}>
                                    <Tile value={cellValue} />
                                </BoardCell>
                            )))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
