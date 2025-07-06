
"use client";

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, Award, Users, Cpu, ArrowLeft, Circle } from 'lucide-react';
import { cn } from "@/lib/utils";

type PlayerId = 'P1' | 'P2';
type PieceSize = 1 | 2 | 3; // Small, Medium, Large

interface Piece {
  id: string;
  size: PieceSize;
  player: PlayerId;
}

interface BoardCell {
  stack: Piece[];
}

type BoardState = BoardCell[][];
type GameMode = 'player' | 'ai' | null;

const createInitialBoard = (): BoardState => Array(3).fill(null).map(() => Array(3).fill(null).map(() => ({ stack: [] })));

const createInitialPlayerPieces = (): Record<PlayerId, Piece[]> => {
  const createPieces = (player: PlayerId): Piece[] => [
    { id: `${player}-L1`, player, size: 3 }, { id: `${player}-L2`, player, size: 3 },
    { id: `${player}-M1`, player, size: 2 }, { id: `${player}-M2`, player, size: 2 },
    { id: `${player}-S1`, player, size: 1 }, { id: `${player}-S2`, player, size: 1 },
  ];
  return {
    P1: createPieces('P1'),
    P2: createPieces('P2'),
  };
};

const checkWin = (board: BoardState): PlayerId | null => {
  const getTopPlayer = (r: number, c: number) => board[r][c].stack.length > 0 ? board[r][c].stack[board[r][c].stack.length - 1].player : null;

  // Rows, Columns, Diagonals
  const lines = [
    // Rows
    [[0,0], [0,1], [0,2]], [[1,0], [1,1], [1,2]], [[2,0], [2,1], [2,2]],
    // Cols
    [[0,0], [1,0], [2,0]], [[0,1], [1,1], [2,1]], [[0,2], [1,2], [2,2]],
    // Diagonals
    [[0,0], [1,1], [2,2]], [[0,2], [1,1], [2,0]]
  ];

  for (const line of lines) {
    const p1 = getTopPlayer(line[0][0], line[0][1]);
    const p2 = getTopPlayer(line[1][0], line[1][1]);
    const p3 = getTopPlayer(line[2][0], line[2][1]);
    if (p1 && p1 === p2 && p1 === p3) {
      return p1;
    }
  }

  return null;
};

const GobblerPiece = ({ piece, isSelected }: { piece: Piece; isSelected: boolean }) => {
  const sizeClasses = { 1: 'w-8 h-8', 2: 'w-12 h-12', 3: 'w-16 h-16' };
  const playerClasses = piece.player === 'P1' ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div className={cn("rounded-full flex items-center justify-center transition-all", sizeClasses[piece.size], playerClasses, isSelected ? "ring-4 ring-yellow-400" : "")}>
      <Circle className="w-1/2 h-1/2 text-white/50" />
    </div>
  );
};

const BoardSquare = ({ cell, onSelect, canDrop }: { cell: BoardCell; onSelect: () => void; canDrop: boolean }) => {
  const topPiece = cell.stack.length > 0 ? cell.stack[cell.stack.length - 1] : null;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center border-2 rounded-lg transition-colors duration-200",
        "bg-card hover:bg-muted/50 border-border",
        canDrop && "bg-green-500/30"
      )}
    >
      {topPiece && <GobblerPiece piece={topPiece} isSelected={false} />}
    </button>
  );
};

export default function GobbletGobblersPage() {
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [playerPieces, setPlayerPieces] = useState(createInitialPlayerPieces());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerId>('P1');
  const [selectedPiece, setSelectedPiece] = useState<{ piece: Piece, from?: {r: number, c: number} } | null>(null);
  const [winner, setWinner] = useState<PlayerId | 'draw' | null>(null);

  const getStatusMessage = () => {
    if (winner) return winner === 'draw' ? "It's a draw!" : `Player ${winner === 'P1' ? '1 (Blue)' : '2 (Red)'} wins!`;
    return `Player ${currentPlayer === 'P1' ? '1 (Blue)' : '2 (Red)'}'s Turn`;
  };

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setPlayerPieces(createInitialPlayerPieces());
    setCurrentPlayer('P1');
    setSelectedPiece(null);
    setWinner(null);
  }, []);

  const handleSelectPiece = (piece: Piece, from?: {r: number, c: number}) => {
    if (winner || piece.player !== currentPlayer) return;
    setSelectedPiece({ piece, from });
  };

  const handleBoardClick = (r: number, c: number) => {
    if (!selectedPiece || winner) {
      // If a piece on the board is clicked without a piece being selected, select it
      const topPiece = board[r][c].stack[board[r][c].stack.length - 1];
      if (topPiece) {
        handleSelectPiece(topPiece, {r, c});
      }
      return;
    }

    const { piece, from } = selectedPiece;
    const targetCell = board[r][c];
    const topPieceOnTarget = targetCell.stack[targetCell.stack.length - 1];

    if (topPieceOnTarget && piece.size <= topPieceOnTarget.size) {
      // Cannot place on a piece of same or larger size
      return;
    }

    const newBoard = board.map(row => row.map(cell => ({ stack: [...cell.stack] })));

    // Place the new piece
    newBoard[r][c].stack.push(piece);
    
    // Remove the piece from its origin
    if (from) {
      // Moved from another square
      newBoard[from.r][from.c].stack.pop();
    } else {
      // Moved from player's hand
      const newPlayerPieces = { ...playerPieces };
      newPlayerPieces[piece.player] = newPlayerPieces[piece.player].filter(p => p.id !== piece.id);
      setPlayerPieces(newPlayerPieces);
    }
    
    setBoard(newBoard);
    
    const newWinner = checkWin(newBoard);
    if (newWinner) {
        setWinner(newWinner);
    } else {
        setCurrentPlayer(currentPlayer === 'P1' ? 'P2' : 'P1');
    }

    setSelectedPiece(null);
  };
  
  if (!gameMode) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Gobblet Gobblers</CardTitle>
                    <CardDescription>Select a game mode to start.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setGameMode('player')} className="w-full text-lg"><Users className="mr-2"/> Player vs Player</Button>
                    <Button onClick={() => setGameMode('ai')} className="w-full text-lg" disabled><Cpu className="mr-2"/> Player vs AI (Soon)</Button>
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <Card className="w-full max-w-xl text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Gobblet Gobblers</CardTitle>
          <CardDescription className="text-xl pt-2">{getStatusMessage()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 p-4 bg-primary/10 rounded-lg">
            {board.map((row, r_idx) => row.map((cell, c_idx) => (
              <BoardSquare 
                key={`${r_idx}-${c_idx}`} 
                cell={cell} 
                onSelect={() => handleBoardClick(r_idx, c_idx)}
                canDrop={!!selectedPiece && (cell.stack.length === 0 || selectedPiece.piece.size > cell.stack[cell.stack.length - 1].size)}
              />
            )))}
          </div>
        </CardContent>
      </Card>

      {/* Player Piece Trays */}
      <div className="w-full max-w-xl grid grid-cols-2 gap-4">
        {(['P1', 'P2'] as PlayerId[]).map(pId => (
            <Card key={pId} className={cn("p-4", currentPlayer === pId && !winner && "border-yellow-400 border-2")}>
                <CardTitle className="text-lg mb-4 text-center">Player {pId === 'P1' ? '1 (Blue)' : '2 (Red)'}'s Pieces</CardTitle>
                <div className="flex justify-center items-end gap-2 flex-wrap min-h-[70px]">
                    {playerPieces[pId].sort((a,b) => a.size - b.size).map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPiece(p)}
                          className={cn(
                            "rounded-full transition-all",
                            selectedPiece?.piece.id !== p.id && "hover:ring-2 ring-white/50"
                          )}
                          disabled={!!winner || p.player !== currentPlayer}
                        >
                            <GobblerPiece 
                                piece={p} 
                                isSelected={selectedPiece?.piece.id === p.id}
                            />
                        </button>
                    ))}
                </div>
            </Card>
        ))}
      </div>
      
      <div className="w-full max-w-xl flex gap-4 mt-4">
        <Button onClick={resetGame} className="w-full"><RotateCw className="mr-2"/> Reset Game</Button>
        <Button onClick={() => setGameMode(null)} variant="outline" className="w-full"><ArrowLeft className="mr-2"/> Change Mode</Button>
      </div>
    </div>
  );
}
