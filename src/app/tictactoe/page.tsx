
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Circle, RotateCw, Users, Cpu, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";

type Player = 'X' | 'O';
type CellValue = Player | null;
type Board = CellValue[];
type GameMode = 'player' | 'ai';

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

const checkWinner = (board: Board): { winner: Player; line: number[] } | null => {
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a]!, line: combination };
    }
  }
  return null;
};

const getBestMove = (board: Board, aiPlayer: Player): number => {
    const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';

    const minimax = (newBoard: Board, player: Player): { score: number, index?: number } => {
        const availableSpots = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
        
        const winInfo = checkWinner(newBoard);
        if (winInfo?.winner === humanPlayer) return { score: -10 };
        if (winInfo?.winner === aiPlayer) return { score: 10 };
        if (availableSpots.length === 0) return { score: 0 };

        const moves: { score: number, index: number }[] = [];
        for (let i = 0; i < availableSpots.length; i++) {
            const index = availableSpots[i];
            const move: { score: number, index: number } = { index, score: 0 };
            newBoard[index] = player;

            if (player === aiPlayer) {
                const result = minimax(newBoard, humanPlayer);
                move.score = result.score;
            } else {
                const result = minimax(newBoard, aiPlayer);
                move.score = result.score;
            }

            newBoard[index] = null;
            moves.push(move);
        }

        let bestMove: { score: number, index: number } = { score: 0, index: -1 };
        if (player === aiPlayer) {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = moves[i];
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = moves[i];
                }
            }
        }
        return bestMove;
    };
    
    const bestMove = minimax([...board], aiPlayer);
    return bestMove.index ?? -1;
};

const Square = ({ value, onClick, isWinning }: { value: CellValue; onClick: () => void; isWinning: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center border-2 rounded-lg transition-colors duration-200",
      isWinning ? "bg-green-500/30 border-green-500" : "bg-card hover:bg-muted/50 border-border"
    )}
    aria-label={`Square ${value ? `with ${value}` : 'empty'}${isWinning ? ', part of winning line' : ''}`}
  >
    {value === 'X' && <X className="w-12 h-12 text-blue-500" />}
    {value === 'O' && <Circle className="w-12 h-12 text-red-500" />}
  </button>
);

export default function TicTacToePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Player, line: number[] } | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);

  const humanPlayer: Player = 'X';
  const aiPlayer: Player = 'O';

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinnerInfo(null);
    setIsDraw(false);
  };
  
  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    resetGame();
  }

  useEffect(() => {
    if (winnerInfo || isDraw) return;
    if (gameMode === 'ai' && currentPlayer === aiPlayer) {
      const bestMoveIndex = getBestMove(board, aiPlayer);
      if (bestMoveIndex !== -1) {
          setTimeout(() => handleClick(bestMoveIndex), 500);
      }
    }
  }, [currentPlayer, board, winnerInfo, isDraw, gameMode]);

  const handleClick = (index: number) => {
    if (board[index] || winnerInfo || (gameMode === 'ai' && currentPlayer === aiPlayer)) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const newWinnerInfo = checkWinner(newBoard);
    if (newWinnerInfo) {
      setWinnerInfo(newWinnerInfo);
    } else if (!newBoard.includes(null)) {
      setIsDraw(true);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const getStatusMessage = () => {
    if (winnerInfo) return `Player ${winnerInfo.winner} wins!`;
    if (isDraw) return "It's a draw!";
    return `Player ${currentPlayer}'s turn`;
  };

  if (!gameMode) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Tic-Tac-Toe</CardTitle>
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Tic-Tac-Toe</CardTitle>
          <CardDescription className="text-xl pt-2">{getStatusMessage()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 p-4 bg-primary/10 rounded-lg">
            {board.map((cell, index) => (
              <Square key={index} value={cell} onClick={() => handleClick(index)} isWinning={winnerInfo?.line.includes(index) ?? false} />
            ))}
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
