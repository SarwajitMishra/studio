
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Metadata can be in a parent server component or here for client components if using a Head component.
// For simplicity with "use client", we'll rely on a potential parent for dynamic metadata.
// export const metadata: Metadata = {
// title: 'Play Chess',
// description: 'Challenge your mind with the classic game of chess.',
// };

interface Piece {
  type: string; // e.g., 'K', 'Q', 'R', 'B', 'N', 'P'
  color: "w" | "b"; // White or Black
}

interface SquarePosition {
  row: number;
  col: number;
}

const PIECE_UNICODE: Record<"w" | "b", Record<string, string>> = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
};

const initialBoardSetup = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: "P", color: "b" };
    board[6][i] = { type: "P", color: "w" };
  }

  // Rooks
  board[0][0] = { type: "R", color: "b" };
  board[0][7] = { type: "R", color: "b" };
  board[7][0] = { type: "R", color: "w" };
  board[7][7] = { type: "R", color: "w" };

  // Knights
  board[0][1] = { type: "N", color: "b" };
  board[0][6] = { type: "N", color: "b" };
  board[7][1] = { type: "N", color: "w" };
  board[7][6] = { type: "N", color: "w" };

  // Bishops
  board[0][2] = { type: "B", color: "b" };
  board[0][5] = { type: "B", color: "b" };
  board[7][2] = { type: "B", color: "w" };
  board[7][5] = { type: "B", color: "w" };

  // Queens
  board[0][3] = { type: "Q", color: "b" };
  board[7][3] = { type: "Q", color: "w" };

  // Kings
  board[0][4] = { type: "K", color: "b" };
  board[7][4] = { type: "K", color: "w" };

  return board;
};

const ChessSquare = ({
  piece,
  isLight,
  onClick,
  isSelected,
  isPossibleMove, // For future use
}: {
  piece: Piece | null;
  isLight: boolean;
  onClick: () => void;
  isSelected: boolean;
  isPossibleMove: boolean;
}) => {
  return (
    <button
      className={cn(
        "aspect-square flex items-center justify-center shadow-inner focus:outline-none",
        isLight ? "bg-primary/20" : "bg-primary/60",
        isSelected ? "ring-2 ring-accent ring-inset" : "",
        isPossibleMove ? "bg-accent/30" : "" // Basic styling for possible moves
      )}
      onClick={onClick}
      aria-label={`Square ${isLight ? 'light' : 'dark'}${piece ? `, containing ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
    >
      {piece && (
        <span
          className={cn(
            "text-4xl md:text-5xl transition-transform duration-100 ease-in-out",
            piece.color === "w" ? "text-white" : "text-neutral-800", // Adjust colors for visibility
             isSelected ? "transform scale-110" : ""
          )}
          style={{ textShadow: piece.color === 'w' ? '0 0 2px black' : '0 0 2px white' }} // Improve piece visibility
        >
          {PIECE_UNICODE[piece.color][piece.type]}
        </span>
      )}
    </button>
  );
};

export default function ChessPage() {
  const [board, setBoard] = useState<(Piece | null)[][]>(initialBoardSetup());
  const [selectedPiece, setSelectedPiece] = useState<SquarePosition | null>(null);
  // const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w'); // For future turn management

  // Add Head metadata component for client pages
  const ClientMetadata = () => (
    <>
      <title>Play Chess | Shravya Playhouse</title>
      <meta name="description" content="Challenge your mind with the classic game of chess on an interactive board." />
    </>
  );


  const handleSquareClick = (row: number, col: number) => {
    const clickedPiece = board[row][col];

    if (selectedPiece) {
      // A piece is already selected
      if (selectedPiece.row === row && selectedPiece.col === col) {
        // Clicked the same selected piece again, so deselect it
        setSelectedPiece(null);
        return;
      }

      // Attempt to move the piece
      // Basic move: allow moving to any empty square. No rule validation yet.
      // No capturing logic yet, just moving to empty squares or replacing opponent.
      // Also, no turn checking yet.

      const pieceToMove = board[selectedPiece.row][selectedPiece.col];
      if (pieceToMove) {
        // For now, allow moving to any square if different from source.
        // In a real game, you'd check if board[row][col] is an enemy or empty, and if the move is legal.
        
        const newBoard = board.map(r => r.map(p => p ? {...p} : null)); // Deep copy
        newBoard[row][col] = pieceToMove;
        newBoard[selectedPiece.row][selectedPiece.col] = null;
        setBoard(newBoard);
        setSelectedPiece(null);
        // setCurrentPlayer(currentPlayer === 'w' ? 'b' : 'w'); // Switch player (for future)
      }
    } else {
      // No piece is selected yet
      if (clickedPiece) {
        // And the clicked square has a piece (could add check for currentPlayer here later)
        setSelectedPiece({ row, col });
      }
    }
  };

  const resetGame = () => {
    setBoard(initialBoardSetup());
    setSelectedPiece(null);
    // setCurrentPlayer('w');
  };

  return (
    <>
      <ClientMetadata />
      <div className="flex flex-col items-center space-y-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-3xl font-bold text-center text-primary">Play Chess!</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 flex flex-col items-center">
            <p className="text-lg text-foreground/80 mb-6 text-center">
              Select a piece and click a destination square to move it.
            </p>
            <div
              className="grid grid-cols-8 w-full max-w-md aspect-square border-4 border-primary rounded-md overflow-hidden shadow-lg bg-primary/40"
              aria-label="Chess board"
            >
              {board.map((rowArr, rowIndex) =>
                rowArr.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  return (
                    <ChessSquare
                      key={`${rowIndex}-${colIndex}`}
                      piece={piece}
                      isLight={isLight}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      isSelected={
                        selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
                      }
                      isPossibleMove={false} // Placeholder for future UI hints
                    />
                  );
                })
              )}
            </div>
            <button
              onClick={resetGame}
              className="mt-6 px-6 py-2 bg-accent text-accent-foreground rounded-md shadow-md hover:bg-accent/90 transition-colors"
            >
              Reset Game
            </button>
            <p className="mt-4 text-xs text-muted-foreground text-center">
              (Full chess rules, move validation, and turn management coming soon!)
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
