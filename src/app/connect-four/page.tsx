
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Circle, RotateCw, Users, Cpu, Award, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";

const ROWS = 6;
const COLS = 7;
const PLAYER_1 = 1;
const PLAYER_2 = 2;
type Player = typeof PLAYER_1 | typeof PLAYER_2;
type CellValue = Player | 0;
type Board = CellValue[][];

const createEmptyBoard = (): Board => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const checkWin = (board: Board, player: Player): boolean => {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] === player && board[r][c+1] === player && board[r][c+2] === player && board[r][c+3] === player) return true;
    }
  }
  // Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === player && board[r+1][c] === player && board[r+2][c] === player && board[r+3][c] === player) return true;
    }
  }
  // Positive Diagonal
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] === player && board[r+1][c+1] === player && board[r+2][c+2] === player && board[r+3][c+3] === player) return true;
    }
  }
  // Negative Diagonal
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] === player && board[r-1][c+1] === player && board[r-2][c+2] === player && board[r-3][c+3] === player) return true;
    }
  }
  return false;
};

const getAIMove = (board: Board, aiPlayer: Player, humanPlayer: Player): number => {
    // Check if AI can win in the next move
    for (let c = 0; c < COLS; c++) {
        const tempBoard = board.map(r => [...r]);
        for (let r = ROWS - 1; r >= 0; r--) {
            if (tempBoard[r][c] === 0) {
                tempBoard[r][c] = aiPlayer;
                if (checkWin(tempBoard, aiPlayer)) return c;
                tempBoard[r][c] = 0; // backtrack
                break;
            }
        }
    }
    // Check if player can win, and block them
    for (let c = 0; c < COLS; c++) {
        const tempBoard = board.map(r => [...r]);
        for (let r = ROWS - 1; r >= 0; r--) {
            if (tempBoard[r][c] === 0) {
                tempBoard[r][c] = humanPlayer;
                if (checkWin(tempBoard, humanPlayer)) return c;
                tempBoard[r][c] = 0; // backtrack
                break;
            }
        }
    }
    // Otherwise, choose a random valid column
    const validColumns = [];
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] === 0) validColumns.push(c);
    }
    return validColumns[Math.floor(Math.random() * validColumns.length)];
}


export default function ConnectFourPage() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(PLAYER_1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameMode, setGameMode] = useState<'player' | 'ai' | null>(null);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER_1);
    setWinner(null);
    setIsDraw(false);
  }, []);
  
  const handleStartGame = (mode: 'player' | 'ai') => {
      setGameMode(mode);
      resetGame();
  }

  useEffect(() => {
    if (winner || isDraw) return;
    if (gameMode === 'ai' && currentPlayer === PLAYER_2) {
      setTimeout(() => {
        const col = getAIMove(board, PLAYER_2, PLAYER_1);
        if (col !== undefined) {
          dropPiece(col);
        }
      }, 500);
    }
  }, [currentPlayer, board, winner, isDraw, gameMode]);

  const dropPiece = (col: number) => {
    if (winner) return;
    let newBoard = board.map(row => [...row]);
    let dropped = false;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === 0) {
        newBoard[r][col] = currentPlayer;
        dropped = true;
        break;
      }
    }
    if (!dropped) return;
    setBoard(newBoard);

    if (checkWin(newBoard, currentPlayer)) {
      setWinner(currentPlayer);
    } else if (newBoard.flat().every(cell => cell !== 0)) {
      setIsDraw(true);
    } else {
      setCurrentPlayer(currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1);
    }
  };
  
  const getStatusMessage = () => {
    if (winner) return gameMode === 'ai' ? (winner === PLAYER_1 ? "You Win!" : "AI Wins!") : `Player ${winner} Wins!`;
    if (isDraw) return "It's a draw!";
    return `Player ${currentPlayer}'s Turn`;
  };
  
  const getPlayerColor = (player: Player | null) => {
    if (player === PLAYER_1) return "bg-red-500";
    if (player === PLAYER_2) return "bg-yellow-400";
    return "";
  }

  if (!gameMode) {
     return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Connect Four</CardTitle>
                    <CardDescription>Select a game mode to start.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => handleStartGame('player')} className="w-full text-lg"><Users className="mr-2"/> Player vs Player</Button>
                    <Button onClick={() => handleStartGame('ai')} className="w-full text-lg"><Cpu className="mr-2"/> Player vs AI</Button>
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

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Connect Four</CardTitle>
            <div className="flex items-center justify-center gap-4 pt-2">
                <p className={cn("text-xl font-semibold p-2 rounded-lg", getPlayerColor(currentPlayer))}>{getStatusMessage()}</p>
                {winner && <Award className="w-8 h-8 text-yellow-500"/>}
            </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
            <div className="p-4 bg-blue-800 rounded-lg shadow-inner inline-block">
                <div className="grid grid-cols-7 gap-1">
                    {board.map((row, r) =>
                        row.map((cell, c) => (
                            <div key={`${r}-${c}`} className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center">
                                {cell !== 0 && (
                                    <div className={cn("w-10 h-10 rounded-full shadow-md animate-drop", cell === PLAYER_1 ? "bg-red-500" : "bg-yellow-400")}></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-1">
                    {Array.from({length: COLS}).map((_, colIndex) => (
                        <Button key={colIndex} variant="ghost" onClick={() => dropPiece(colIndex)} disabled={!!winner || board[0][colIndex] !== 0} className="w-12 h-10 hover:bg-blue-600/50">
                            <ArrowDown className="h-6 w-6 text-white"/>
                        </Button>
                    ))}
                </div>
            </div>
            <div className="mt-6 flex gap-4">
                <Button onClick={resetGame} className="w-full"><RotateCw className="mr-2"/> Reset Game</Button>
                <Button onClick={() => setGameMode(null)} variant="outline" className="w-full">Change Mode</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ArrowDown = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M11 4h2v12l5.5-5.5 1.42 1.42L12 19.84l-7.92-7.92L5.5 10.5 11 16V4Z"/></svg>
)
