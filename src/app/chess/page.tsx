
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // For feedback
import { Crown, Shield } from "lucide-react"; // Example icons for player turn
import { Button } from "@/components/ui/button"; // Added this import

interface Piece {
  type: "K" | "Q" | "R" | "B" | "N" | "P"; // King, Queen, Rook, Bishop, Knight, Pawn
  color: "w" | "b"; // White or Black
}

interface SquarePosition {
  row: number;
  col: number;
}

const PIECE_UNICODE: Record<"w" | "b", Record<Piece["type"], string>> = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
};

const initialBoardSetup = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const placePiece = (piece: Piece, r: number, c: number) => { board[r][c] = piece; };

  // Pawns
  for (let i = 0; i < 8; i++) {
    placePiece({ type: "P", color: "b" }, 1, i);
    placePiece({ type: "P", color: "w" }, 6, i);
  }
  // Rooks
  placePiece({ type: "R", color: "b" }, 0, 0); placePiece({ type: "R", color: "b" }, 0, 7);
  placePiece({ type: "R", color: "w" }, 7, 0); placePiece({ type: "R", color: "w" }, 7, 7);
  // Knights
  placePiece({ type: "N", color: "b" }, 0, 1); placePiece({ type: "N", color: "b" }, 0, 6);
  placePiece({ type: "N", color: "w" }, 7, 1); placePiece({ type: "N", color: "w" }, 7, 6);
  // Bishops
  placePiece({ type: "B", color: "b" }, 0, 2); placePiece({ type: "B", color: "b" }, 0, 5);
  placePiece({ type: "B", color: "w" }, 7, 2); placePiece({ type: "B", color: "w" }, 7, 5);
  // Queens
  placePiece({ type: "Q", color: "b" }, 0, 3); placePiece({ type: "Q", color: "w" }, 7, 3);
  // Kings
  placePiece({ type: "K", color: "b" }, 0, 4); placePiece({ type: "K", color: "w" }, 7, 4);

  return board;
};

const ChessSquare = ({
  piece,
  isLight,
  onClick,
  isSelected,
  isPossibleMove,
  isInCheck, // For future king highlighting
}: {
  piece: Piece | null;
  isLight: boolean;
  onClick: () => void;
  isSelected: boolean;
  isPossibleMove: boolean;
  isInCheck?: boolean;
}) => {
  return (
    <button
      className={cn(
        "aspect-square flex items-center justify-center shadow-inner focus:outline-none transition-colors duration-150",
        isLight ? "bg-primary/20" : "bg-primary/60",
        isSelected ? "ring-2 ring-yellow-400 ring-inset" : "",
        isPossibleMove ? "bg-green-500/40 hover:bg-green-500/50" : "",
        isInCheck && piece?.type === 'K' ? "bg-red-500/50" : ""
      )}
      onClick={onClick}
      aria-label={`Square ${isLight ? 'light' : 'dark'}${piece ? `, containing ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
    >
      {piece && (
        <span
          className={cn(
            "text-4xl md:text-5xl transition-transform duration-100 ease-in-out",
            piece.color === "w" ? "text-white" : "text-neutral-800",
            isSelected ? "transform scale-110" : ""
          )}
          style={{ textShadow: piece.color === 'w' ? '0 0 3px black, 0 0 5px black' : '0 0 3px white, 0 0 5px white' }}
        >
          {PIECE_UNICODE[piece.color][piece.type]}
        </span>
      )}
      {isPossibleMove && !piece && (
        <div className="w-3 h-3 md:w-4 md:h-4 bg-green-700/50 rounded-full opacity-70"></div>
      )}
    </button>
  );
};

export default function ChessPage() {
  const [board, setBoard] = useState<(Piece | null)[][]>(initialBoardSetup());
  const [selectedPiece, setSelectedPiece] = useState<SquarePosition | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [possibleMoves, setPossibleMoves] = useState<SquarePosition[]>([]);
  const [gameStatusMessage, setGameStatusMessage] = useState<string>("White's turn to move.");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<'w' | 'b' | 'draw' | null>(null);
  // const [isCheck, setIsCheck] = useState<boolean>(false); // For future check detection

  const { toast } = useToast();

  const isSquareOnBoard = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;

  const getPieceAt = (currentBoard: (Piece | null)[][], row: number, col: number) => {
    if (!isSquareOnBoard(row, col)) return null;
    return currentBoard[row][col];
  };

  const calculatePossibleMoves = useCallback((
    currentBoard: (Piece | null)[][],
    piece: Piece,
    r: number,
    c: number
  ): SquarePosition[] => {
    const moves: SquarePosition[] = [];
    const playerColor = piece.color;
    const opponentColor = playerColor === 'w' ? 'b' : 'w';

    const addMove = (targetRow: number, targetCol: number) => {
      if (!isSquareOnBoard(targetRow, targetCol)) return false;
      const targetPiece = getPieceAt(currentBoard, targetRow, targetCol);
      if (targetPiece === null) {
        moves.push({ row: targetRow, col: targetCol });
        return true; // Can continue sliding
      }
      if (targetPiece.color === opponentColor) {
        moves.push({ row: targetRow, col: targetCol });
        return false; // Can capture, but cannot continue sliding
      }
      return false; // Own piece, cannot move here or slide further
    };

    if (piece.type === 'P') {
      const direction = playerColor === 'w' ? -1 : 1;
      // Single step forward
      if (isSquareOnBoard(r + direction, c) && !getPieceAt(currentBoard, r + direction, c)) {
        addMove(r + direction, c);
        // Double step forward (initial move)
        const initialRow = playerColor === 'w' ? 6 : 1;
        if (r === initialRow && isSquareOnBoard(r + 2 * direction, c) && !getPieceAt(currentBoard, r + 2 * direction, c)) {
          addMove(r + 2 * direction, c);
        }
      }
      // Captures
      [-1, 1].forEach(colOffset => {
        if (isSquareOnBoard(r + direction, c + colOffset)) {
          const targetPiece = getPieceAt(currentBoard, r + direction, c + colOffset);
          if (targetPiece && targetPiece.color === opponentColor) {
            addMove(r + direction, c + colOffset);
          }
        }
      });
      // En Passant & Promotion: TODO
    } else if (piece.type === 'N') {
      const knightMoves = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1],
      ];
      knightMoves.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if (piece.type === 'K') {
      const kingMoves = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];
      kingMoves.forEach(([dr, dc]) => addMove(r + dr, c + dc));
      // Castling: TODO
    } else { // Sliding pieces: R, B, Q
      let directions: number[][] = [];
      if (piece.type === 'R' || piece.type === 'Q') {
        directions.push(...[[0, 1], [0, -1], [1, 0], [-1, 0]]);
      }
      if (piece.type === 'B' || piece.type === 'Q') {
        directions.push(...[[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      }
      directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!addMove(r + i * dr, c + i * dc)) break;
        }
      });
    }
    // Filter out moves that would put own king in check: TODO
    return moves;
  }, []);


  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) {
      toast({ title: "Game Over", description: `Winner: ${winner === 'draw' ? 'Draw' : (winner === 'w' ? 'White' : 'Black')}. Please reset.`});
      return;
    }

    const clickedSquarePiece = getPieceAt(board, row, col);

    if (selectedPiece) {
      const { row: fromRow, col: fromCol } = selectedPiece;
      const pieceToMove = getPieceAt(board, fromRow, fromCol);

      if (!pieceToMove) { // Should not happen if selectedPiece is valid
        setSelectedPiece(null);
        setPossibleMoves([]);
        return;
      }

      // Check if the clicked square is a valid move for the selected piece
      const isMovePossible = possibleMoves.some(m => m.row === row && m.col === col);

      if (isMovePossible) {
        const newBoard = board.map(r => r.map(p => p ? { ...p } : null));
        // const capturedPiece = newBoard[row][col]; // For display, if needed
        newBoard[row][col] = pieceToMove;
        newBoard[fromRow][fromCol] = null;
        setBoard(newBoard);

        // Pawn Promotion Check: TODO
        // if (pieceToMove.type === 'P' && ( (pieceToMove.color === 'w' && row === 0) || (pieceToMove.color === 'b' && row === 7) ) ) {
        // Trigger promotion logic
        // }

        const nextPlayer = currentPlayer === 'w' ? 'b' : 'w';
        setCurrentPlayer(nextPlayer);
        setSelectedPiece(null);
        setPossibleMoves([]);
        setGameStatusMessage(`${nextPlayer === 'w' ? "White" : "Black"}'s turn.`);

        // Check for Check, Checkmate, Stalemate: TODO
        // const { isCheck, isCheckmate, isStalemate } = checkGameStatus(newBoard, nextPlayer);
        // if (isCheckmate) { setGameOver(true); setWinner(currentPlayer); setGameStatusMessage(`Checkmate! ${currentPlayer === 'w' ? 'White' : 'Black'} wins.`); }
        // else if (isStalemate) { setGameOver(true); setWinner('draw'); setGameStatusMessage("Stalemate! It's a draw."); }
        // else if (isCheck) { setGameStatusMessage(`${nextPlayer === 'w' ? "White" : "Black"} is in Check!`); }

      } else {
        // Clicked on another piece of the current player? Then select that.
        if (clickedSquarePiece && clickedSquarePiece.color === currentPlayer) {
          setSelectedPiece({ row, col });
          setPossibleMoves(calculatePossibleMoves(board, clickedSquarePiece, row, col));
        } else {
          // Invalid move or clicked empty square not in possible moves
          setSelectedPiece(null);
          setPossibleMoves([]);
           toast({ variant: "destructive", title: "Invalid Move", description: "That move is not allowed." });
        }
      }
    } else { // No piece selected yet
      if (clickedSquarePiece && clickedSquarePiece.color === currentPlayer) {
        setSelectedPiece({ row, col });
        setPossibleMoves(calculatePossibleMoves(board, clickedSquarePiece, row, col));
      } else if (clickedSquarePiece && clickedSquarePiece.color !== currentPlayer) {
        toast({ variant: "default", title: "Not Your Turn", description: `It's ${currentPlayer === 'w' ? "White" : "Black"}'s turn.` });
      }
    }
  };

  const resetGame = () => {
    setBoard(initialBoardSetup());
    setSelectedPiece(null);
    setCurrentPlayer('w');
    setPossibleMoves([]);
    setGameStatusMessage("White's turn to move.");
    setGameOver(false);
    setWinner(null);
    // setIsCheck(false);
    toast({ title: "Game Reset", description: "The board has been reset." });
  };

  // Client component for metadata
  const ClientMetadata = () => (
    <>
      <title>Play Chess | Shravya Playhouse</title>
      <meta name="description" content="Challenge your mind with the classic game of chess, featuring move validation and turn management." />
    </>
  );

  return (
    <>
      <ClientMetadata />
      <div className="flex flex-col items-center space-y-6">
        <Card className="w-full max-w-3xl shadow-xl">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-3xl font-bold text-center text-primary">Interactive Chess</CardTitle>
             <CardDescription className="text-center text-md text-foreground/80">
                {gameOver ? `Game Over! ${winner === 'draw' ? 'Draw' : (winner === 'w' ? 'White Wins!' : 'Black Wins!')}` : gameStatusMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 flex flex-col items-center">
            <div className="mb-4 flex items-center space-x-2 p-2 rounded-md bg-card border shadow">
                {currentPlayer === 'w' ? <Crown size={24} className="text-yellow-400" /> : <Shield size={24} className="text-neutral-600" />}
                <span className={cn("font-semibold", currentPlayer === 'w' ? 'text-foreground' : 'text-foreground')}>
                   Current Turn: {currentPlayer === 'w' ? "White" : "Black"}
                </span>
            </div>

            <div
              className="grid grid-cols-8 w-full max-w-md aspect-square border-4 border-primary rounded-md overflow-hidden shadow-lg bg-primary/40 mb-6"
              aria-label="Chess board"
            >
              {board.map((rowArr, rowIndex) =>
                rowArr.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isSel = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                  const isPossMove = possibleMoves.some(m => m.row === rowIndex && m.col === colIndex);
                  // const kingInCheck = piece?.type === 'K' && piece.color === currentPlayer && isCheck; // For future check highlighting

                  return (
                    <ChessSquare
                      key={`${rowIndex}-${colIndex}`}
                      piece={piece}
                      isLight={isLight}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      isSelected={isSel}
                      isPossibleMove={isPossMove}
                      // isInCheck={kingInCheck}
                    />
                  );
                })
              )}
            </div>
            <Button
              onClick={resetGame}
              className="px-8 py-3 bg-accent text-accent-foreground rounded-md shadow-md hover:bg-accent/90 transition-colors text-lg"
            >
              Reset Game
            </Button>
            <p className="mt-4 text-xs text-muted-foreground text-center max-w-md">
              Rules implemented: Basic piece movements, captures, turn management.
              (En passant, promotion, castling, check/checkmate detection coming soon!)
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
