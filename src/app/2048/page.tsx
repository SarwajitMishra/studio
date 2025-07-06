
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCw, Award, Hash, ToyBrick, Puzzle, Crown, Brain, BookOpen, Sun, Moon, Palette, ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const GRID_SIZE = 4;
type Theme = 'colors' | 'animals' | 'shravya';
type Board = number[][];

const TILE_THEMES: Record<Theme, Record<number, string | LucideIcon>> = {
  colors: {
    2: 'bg-slate-200 text-slate-800', 4: 'bg-amber-200 text-amber-800', 8: 'bg-orange-400 text-white',
    16: 'bg-rose-500 text-white', 32: 'bg-red-600 text-white', 64: 'bg-fuchsia-600 text-white',
    128: 'bg-yellow-400 text-slate-800 shadow-lg shadow-yellow-400/50',
    256: 'bg-yellow-500 text-slate-800 shadow-lg shadow-yellow-500/50',
    512: 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/50',
    1024: 'bg-teal-500 text-white shadow-lg shadow-teal-500/50',
    2048: 'bg-teal-600 text-white shadow-lg shadow-teal-600/50',
  },
  animals: {
    2: '🐭', 4: '🐱', 8: '🐶', 16: '🦊', 32: '🦁', 64: '🐯', 128: '🐴', 256: '🦄', 512: '🐲', 1024: '🐳', 2048: '🦖'
  },
  shravya: {
    2: ToyBrick, 4: Puzzle, 8: Crown, 16: Brain, 32: BookOpen, 64: Sun, 128: Moon, 256: Palette, 512: Award, 1024: Hash, 2048: X
  }
};

const Tile = ({ value, theme }: { value: number; theme: Theme }) => {
  if (value === 0) return <div className="w-full h-full bg-muted/50 rounded-md" />;
  const themeValue = TILE_THEMES[theme][value] || TILE_THEMES.colors[2048];
  const isIcon = typeof themeValue !== 'string' && theme === 'shravya';
  const IconComponent = isIcon ? (themeValue as LucideIcon) : null;
  const isAnimal = theme === 'animals';

  return (
    <div className={cn(
        "w-full h-full rounded-md flex items-center justify-center font-bold text-2xl sm:text-3xl transition-all duration-200 animate-drop",
        !isIcon && !isAnimal && themeValue
      )}
    >
      {IconComponent && <IconComponent className="w-1/2 h-1/2 text-white" />}
      {isAnimal && <span className="text-4xl">{themeValue}</span>}
      {!IconComponent && !isAnimal && value}
    </div>
  );
};

const HowToPlay2048 = ({ onStartGame }: { onStartGame: () => void }) => (
    <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-bold">How to Play 2048</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="text-left space-y-2">
                <p>1. Use your <span className="font-bold">arrow keys</span> (or swipe on touch devices) to move all tiles.</p>
                <p>2. When two tiles with the same number touch, they <span className="font-bold text-accent">merge into one!</span></p>
                <p>3. A new tile (either a 2 or a 4) will appear in an empty spot after each move.</p>
                <p>4. The goal is to create a tile with the number <span className="font-bold text-primary">2048!</span></p>
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
    const [theme, setTheme] = useState<Theme>('colors');
    const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
    const { toast } = useToast();
    
    const createEmptyBoard = (): Board => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

    const addRandomTile = (currentBoard: Board): Board => {
        const newBoard = currentBoard.map(row => [...row]);
        const emptyTiles: { r: number, c: number }[] = [];
        newBoard.forEach((row, r) => row.forEach((cell, c) => {
            if (cell === 0) emptyTiles.push({ r, c });
        }));

        if (emptyTiles.length === 0) return newBoard;

        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
        return newBoard;
    };
    
    const startGame = () => {
        let newBoard = createEmptyBoard();
        newBoard = addRandomTile(newBoard);
        newBoard = addRandomTile(newBoard);
        setBoard(newBoard);
        setScore(0);
        setIsGameOver(false);
        setGameState('playing');
    };

    const slideAndCombine = (row: number[]): { newRow: number[], points: number } => {
        const filteredRow = row.filter(cell => cell !== 0);
        let newRow: number[] = [];
        let points = 0;
        for (let i = 0; i < filteredRow.length; i++) {
            if (i + 1 < filteredRow.length && filteredRow[i] === filteredRow[i + 1]) {
                const newValue = filteredRow[i] * 2;
                newRow.push(newValue);
                points += newValue;
                i++;
            } else {
                newRow.push(filteredRow[i]);
            }
        }
        while (newRow.length < GRID_SIZE) newRow.push(0);
        return { newRow, points };
    };
    
    const move = (currentBoard: Board, direction: 'up' | 'down' | 'left' | 'right'): { newBoard: Board, scoreToAdd: number, moved: boolean } | null => {
      let newBoard = currentBoard.map(row => [...row]);
      let rotatedBoard = newBoard.map(row => [...row]);
      let scoreToAdd = 0;

      // Rotate board to always slide left
      if (direction === 'right') rotatedBoard.forEach(row => row.reverse());
      if (direction === 'up') rotatedBoard = rotateBoard(rotatedBoard);
      if (direction === 'down') rotatedBoard = rotateBoard(rotateBoard(rotateBoard(rotatedBoard)));

      rotatedBoard.forEach((row, index) => {
          const { newRow, points } = slideAndCombine(row);
          rotatedBoard[index] = newRow;
          scoreToAdd += points;
      });
      
      // Rotate back
      if (direction === 'right') rotatedBoard.forEach(row => row.reverse());
      if (direction === 'up') rotatedBoard = rotateBoard(rotateBoard(rotateBoard(rotatedBoard)));
      if (direction === 'down') rotatedBoard = rotateBoard(rotatedBoard);

      const moved = JSON.stringify(currentBoard) !== JSON.stringify(rotatedBoard);
      if (!moved) return null;

      return { newBoard: rotatedBoard, scoreToAdd, moved };
    };

    const rotateBoard = (currentBoard: Board): Board => {
        const newBoard = createEmptyBoard();
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                newBoard[r][c] = currentBoard[GRID_SIZE - 1 - c][r];
            }
        }
        return newBoard;
    };

    const checkGameOver = (currentBoard: Board): boolean => {
        for(let r = 0; r < GRID_SIZE; r++){
            for(let c = 0; c < GRID_SIZE; c++){
                if(currentBoard[r][c] === 0) return false;
                if(r < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r+1][c]) return false;
                if(c < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c+1]) return false;
            }
        }
        return true;
    }

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (isGameOver || gameState !== 'playing') return;

        let direction: 'up' | 'down' | 'left' | 'right' | null = null;
        switch(e.key) {
            case 'ArrowUp': direction = 'up'; break;
            case 'ArrowDown': direction = 'down'; break;
            case 'ArrowLeft': direction = 'left'; break;
            case 'ArrowRight': direction = 'right'; break;
            default: return;
        }
        e.preventDefault();

        const result = move(board, direction);
        if (result) {
            const boardWithNewTile = addRandomTile(result.newBoard);
            setBoard(boardWithNewTile);
            setScore(s => s + result.scoreToAdd);

            if (checkGameOver(boardWithNewTile)) {
                setIsGameOver(true);
            }
        }
    }, [board, isGameOver, gameState]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    if (gameState === 'setup') {
      return (
         <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
           <HowToPlay2048 onStartGame={startGame} />
        </div>
      )
    }

    return (
        <div className="flex flex-col items-center p-4 space-y-4">
            <Card className="w-full max-w-lg text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">2048 Themed</CardTitle>
                    <div className="flex justify-between items-center pt-2">
                        <div className="p-2 bg-muted rounded-md">Score: <span className="font-bold">{score}</span></div>
                        <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="colors">Colors</SelectItem>
                                <SelectItem value="animals">Animals</SelectItem>
                                <SelectItem value="shravya">Shravya's World</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={startGame}><RotateCw className="mr-2"/>New Game</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative p-2 sm:p-4 bg-primary/20 rounded-lg">
                        {isGameOver && (
                           <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm rounded-lg">
                                <h2 className="text-4xl font-bold text-white">Game Over</h2>
                                <Button onClick={startGame} className="mt-4"><RotateCw className="mr-2"/>Try Again</Button>
                            </div>
                        )}
                        <div className="grid grid-cols-4 gap-2 sm:gap-4">
                            {board.map((row, r_idx) => row.map((cell, c_idx) => (
                                <div key={`${r_idx}-${c_idx}`} className="w-16 h-16 sm:w-20 sm:h-20">
                                  <Tile value={cell} theme={theme}/>
                                </div>
                            )))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

