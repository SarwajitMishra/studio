
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Crown, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Piece {
  type: "K" | "Q" | "R" | "B" | "N" | "P";
  color: "w" | "b";
}

interface SquarePosition {
  row: number;
  col: number;
}

type PlayerColor = "w" | "b";

const PIECE_UNICODE: Record<PlayerColor, Record<Piece["type"], string>> = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
};

const initialBoardSetup = (): { board: (Piece | null)[][], kings: Record<PlayerColor, SquarePosition> } => {
  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const kings: Record<PlayerColor, SquarePosition> = { w: {row: -1, col: -1}, b: {row: -1, col: -1}};

  const placePiece = (piece: Piece, r: number, c: number) => {
    board[r][c] = piece;
    if (piece.type === "K") {
      kings[piece.color] = { row: r, col: c };
    }
  };

  for (let i = 0; i < 8; i++) {
    placePiece({ type: "P", color: "b" }, 1, i);
    placePiece({ type: "P", color: "w" }, 6, i);
  }
  placePiece({ type: "R", color: "b" }, 0, 0); placePiece({ type: "R", color: "b" }, 0, 7);
  placePiece({ type: "R", color: "w" }, 7, 0); placePiece({ type: "R", color: "w" }, 7, 7);
  placePiece({ type: "N", color: "b" }, 0, 1); placePiece({ type: "N", color: "b" }, 0, 6);
  placePiece({ type: "N", color: "w" }, 7, 1); placePiece({ type: "N", color: "w" }, 7, 6);
  placePiece({ type: "B", color: "b" }, 0, 2); placePiece({ type: "B", color: "b" }, 0, 5);
  placePiece({ type: "B", color: "w" }, 7, 2); placePiece({ type: "B", color: "w" }, 7, 5);
  placePiece({ type: "Q", color: "b" }, 0, 3); placePiece({ type: "Q", color: "w" }, 7, 3);
  placePiece({ type: "K", color: "b" }, 0, 4); placePiece({ type: "K", color: "w" }, 7, 4);

  return { board, kings };
};

const ChessSquare = ({
  piece,
  isLight,
  onClick,
  isSelected,
  isPossibleMove,
  isInCheck,
  isDisabled,
}: {
  piece: Piece | null;
  isLight: boolean;
  onClick: () => void;
  isSelected: boolean;
  isPossibleMove: boolean;
  isInCheck?: boolean;
  isDisabled?: boolean;
}) => {
  return (
    <button
      className={cn(
        "aspect-square flex items-center justify-center shadow-inner focus:outline-none transition-colors duration-150",
        isLight ? "bg-primary/20" : "bg-primary/60",
        isSelected ? "ring-2 ring-yellow-400 ring-inset" : "",
        isPossibleMove ? "bg-green-500/40 hover:bg-green-500/50" : "",
        isInCheck && piece?.type === 'K' ? "bg-red-500/60 animate-pulse" : "",
        isDisabled ? "cursor-not-allowed" : ""
      )}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`Square ${isLight ? 'light' : 'dark'}${piece ? `, containing ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}${isInCheck ? ', King in Check' : ''}${isDisabled ? ', disabled' : ''}`}
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
  const initialSetup = initialBoardSetup();
  const [board, setBoard] = useState<(Piece | null)[][]>(initialSetup.board);
  const [kingPositions, setKingPositions] = useState<Record<PlayerColor, SquarePosition>>(initialSetup.kings);
  const [selectedPiece, setSelectedPiece] = useState<SquarePosition | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('w');
  const [possibleMoves, setPossibleMoves] = useState<SquarePosition[]>([]);
  const [gameStatusMessage, setGameStatusMessage] = useState<string>("White's turn to move.");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerColor | 'draw' | null>(null);
  const [kingUnderAttack, setKingUnderAttack] = useState<PlayerColor | null>(null);
  const [promotionSquare, setPromotionSquare] = useState<SquarePosition | null>(null);
  const [castlingRights, setCastlingRights] = useState({ w: { K: true, Q: true }, b: { K: true, Q: true }});
  const [enPassantTarget, setEnPassantTarget] = useState<SquarePosition | null>(null);


  const { toast } = useToast();

  const isSquareOnBoard = (row: number, col: number): boolean => row >= 0 && row < 8 && col >= 0 && col < 8;

  const getPieceAt = useCallback((currentBoard: (Piece | null)[][], row: number, col: number): Piece | null => {
    if (!isSquareOnBoard(row, col)) return null;
    return currentBoard[row][col];
  }, []);

  const isSquareAttacked = useCallback((
    currentBoard: (Piece | null)[][],
    targetRow: number,
    targetCol: number,
    attackerColor: PlayerColor
  ): boolean => {
    // Check for pawn attacks
    const pawnDirection = attackerColor === 'w' ? 1 : -1;
    let piece = getPieceAt(currentBoard, targetRow + pawnDirection, targetCol - 1);
    if (piece?.type === 'P' && piece.color === attackerColor) return true;
    piece = getPieceAt(currentBoard, targetRow + pawnDirection, targetCol + 1);
    if (piece?.type === 'P' && piece.color === attackerColor) return true;
    
    // Check for knight attacks
    const knightMoves = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
    for (const [dr, dc] of knightMoves) {
        piece = getPieceAt(currentBoard, targetRow + dr, targetCol + dc);
        if (piece?.type === 'N' && piece.color === attackerColor) return true;
    }

    // Check for sliding attacks (Rook, Bishop, Queen) and King attacks
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
            const r = targetRow + i * dr;
            const c = targetCol + i * dc;
            if (!isSquareOnBoard(r, c)) break;
            const pieceOnPath = getPieceAt(currentBoard, r, c);
            if (pieceOnPath) {
                if (pieceOnPath.color === attackerColor) {
                    const isRookMove = dr === 0 || dc === 0;
                    const isBishopMove = Math.abs(dr) === Math.abs(dc);
                    if (pieceOnPath.type === 'Q') return true;
                    if (pieceOnPath.type === 'R' && isRookMove) return true;
                    if (pieceOnPath.type === 'B' && isBishopMove) return true;
                    if (pieceOnPath.type === 'K' && i === 1) return true;
                }
                break; // Path is blocked
            }
        }
    }
    
    return false;
  }, [getPieceAt]);

  const _calculateRawPossibleMoves = useCallback((
    currentBoard: (Piece | null)[][],
    piece: Piece,
    r: number,
    c: number
  ): SquarePosition[] => {
    const moves: SquarePosition[] = [];
    const playerColor = piece.color;
    const opponentColor = playerColor === 'w' ? 'b' : 'w';

    const addMove = (targetRow: number, targetCol: number, isSlide: boolean = false): boolean => {
      if (!isSquareOnBoard(targetRow, targetCol)) return false;
      const targetPiece = getPieceAt(currentBoard, targetRow, targetCol);
      if (targetPiece === null) {
        moves.push({ row: targetRow, col: targetCol });
        return true; 
      }
      if (targetPiece.color === opponentColor) {
        moves.push({ row: targetRow, col: targetCol });
        return false; 
      }
      return false; 
    };

    if (piece.type === 'P') {
      const direction = playerColor === 'w' ? -1 : 1;
      // Standard 1-step move
      if (isSquareOnBoard(r + direction, c) && !getPieceAt(currentBoard, r + direction, c)) {
        addMove(r + direction, c);
        // Initial 2-step move
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
      // En Passant
      if (enPassantTarget) {
          if (enPassantTarget.row === r + direction && Math.abs(enPassantTarget.col - c) === 1) {
              addMove(enPassantTarget.row, enPassantTarget.col);
          }
      }

    } else if (piece.type === 'N') {
      const knightMoves = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
      knightMoves.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if (piece.type === 'K') {
      const kingMoves = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      kingMoves.forEach(([dr, dc]) => addMove(r + dr, c + dc));
      // Castling
      if (!isSquareAttacked(currentBoard, r, c, opponentColor)) {
          // Kingside
          if (castlingRights[playerColor].K && !getPieceAt(currentBoard, r, c + 1) && !getPieceAt(currentBoard, r, c + 2)) {
              if (!isSquareAttacked(currentBoard, r, c + 1, opponentColor) && !isSquareAttacked(currentBoard, r, c + 2, opponentColor)) {
                  addMove(r, c + 2);
              }
          }
          // Queenside
          if (castlingRights[playerColor].Q && !getPieceAt(currentBoard, r, c - 1) && !getPieceAt(currentBoard, r, c - 2) && !getPieceAt(currentBoard, r, c - 3)) {
              if (!isSquareAttacked(currentBoard, r, c - 1, opponentColor) && !isSquareAttacked(currentBoard, r, c - 2, opponentColor)) {
                  addMove(r, c - 2);
              }
          }
      }
    } else { 
      let directions: number[][] = [];
      if (piece.type === 'R' || piece.type === 'Q') directions.push(...[[0, 1], [0, -1], [1, 0], [-1, 0]]);
      if (piece.type === 'B' || piece.type === 'Q') directions.push(...[[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!addMove(r + i * dr, c + i * dc, true)) break;
        }
      });
    }
    return moves;
  }, [enPassantTarget, castlingRights, isSquareAttacked, getPieceAt]);

  const calculateLegalMoves = useCallback((
    currentBoard: (Piece | null)[][],
    piece: Piece,
    r: number,
    c: number,
    playerColor: PlayerColor,
    currentKingPositions: Record<PlayerColor, SquarePosition>
  ): SquarePosition[] => {
    const rawMoves = _calculateRawPossibleMoves(currentBoard, piece, r, c);
    const legalMoves: SquarePosition[] = [];

    for (const move of rawMoves) {
      const tempBoard = currentBoard.map(rowArr => rowArr.map(p => p ? { ...p } : null));
      tempBoard[move.row][move.col] = piece;
      tempBoard[r][c] = null;

      let kingPos = currentKingPositions[playerColor];
      if (piece.type === 'K') {
        kingPos = { row: move.row, col: move.col };
      }

      if (kingPos.row === -1) continue; 

      if (!isSquareAttacked(tempBoard, kingPos.row, kingPos.col, playerColor === 'w' ? 'b' : 'w')) {
        legalMoves.push(move);
      }
    }
    return legalMoves;
  }, [_calculateRawPossibleMoves, isSquareAttacked]);
  
  const getAllLegalMovesForPlayer = useCallback((
    currentBoard: (Piece | null)[][],
    playerColor: PlayerColor,
    currentKingPositions: Record<PlayerColor, SquarePosition>
  ): SquarePosition[] => {
    let allMoves: SquarePosition[] = [];
    for (let r_idx = 0; r_idx < 8; r_idx++) {
      for (let c_idx = 0; c_idx < 8; c_idx++) {
        const piece = getPieceAt(currentBoard, r_idx, c_idx);
        if (piece && piece.color === playerColor) {
          const legalMoves = calculateLegalMoves(currentBoard, piece, r_idx, c_idx, playerColor, currentKingPositions);
          allMoves.push(...legalMoves.map(move => ({ fromRow: r_idx, fromCol: c_idx, ...move })));
        }
      }
    }
    return allMoves;
  }, [calculateLegalMoves, getPieceAt]);


  const handleSquareClick = (row: number, col: number) => {
    if (promotionSquare) return; // Don't allow board clicks during promotion
    if (gameOver) {
      toast({ title: "Game Over", description: `${winner === 'draw' ? 'Draw by Stalemate' : (winner === 'w' ? 'White Wins by Checkmate!' : 'Black Wins by Checkmate!')} Please reset.` });
      return;
    }

    const clickedSquarePiece = getPieceAt(board, row, col);

    if (selectedPiece) {
      const { row: fromRow, col: fromCol } = selectedPiece;
      const pieceToMove = getPieceAt(board, fromRow, fromCol);

      if (!pieceToMove) {
        setSelectedPiece(null);
        setPossibleMoves([]);
        return;
      }

      const isMovePossible = possibleMoves.some(m => m.row === row && m.col === col);

      if (isMovePossible) {
        const newBoard = board.map(r_arr => r_arr.map(p => p ? { ...p } : null));
        let nextEnPassantTarget: SquarePosition | null = null;
        const newCastlingRights = JSON.parse(JSON.stringify(castlingRights));

        // Handle En Passant capture
        if (pieceToMove.type === 'P' && enPassantTarget && row === enPassantTarget.row && col === enPassantTarget.col) {
            newBoard[fromRow][col] = null; // Remove the captured pawn
        }
        // Handle Castling move
        if (pieceToMove.type === 'K' && Math.abs(fromCol - col) === 2) {
            if (col > fromCol) { // Kingside castle
                const rook = newBoard[row][7]; newBoard[row][5] = rook; newBoard[row][7] = null;
            } else { // Queenside castle
                const rook = newBoard[row][0]; newBoard[row][3] = rook; newBoard[row][0] = null;
            }
        }

        newBoard[row][col] = pieceToMove;
        newBoard[fromRow][fromCol] = null;
        
        // Update En Passant target square for next turn
        if (pieceToMove.type === 'P' && Math.abs(fromRow - row) === 2) {
            nextEnPassantTarget = { row: (fromRow + row) / 2, col: col };
        }
        
        // Update Castling rights
        if (pieceToMove.type === 'K') { newCastlingRights[currentPlayer].K = false; newCastlingRights[currentPlayer].Q = false; }
        if (pieceToMove.type === 'R') {
            if (fromCol === 0 && fromRow === (currentPlayer === 'w' ? 7 : 0)) newCastlingRights[currentPlayer].Q = false;
            if (fromCol === 7 && fromRow === (currentPlayer === 'w' ? 7 : 0)) newCastlingRights[currentPlayer].K = false;
        }
        // If a rook is captured, its side can no longer castle
        const capturedPiece = getPieceAt(board, row, col);
        if (capturedPiece?.type === 'R') {
            const opponentColor = currentPlayer === 'w' ? 'b' : 'w';
            if (row === (opponentColor === 'w' ? 7 : 0)) {
                if (col === 0) newCastlingRights[opponentColor].Q = false;
                if (col === 7) newCastlingRights[opponentColor].K = false;
            }
        }
        
        const isPromotion = pieceToMove.type === 'P' && ((pieceToMove.color === 'w' && row === 0) || (pieceToMove.color === 'b' && row === 7));
        if (isPromotion) {
            setBoard(newBoard);
            setPromotionSquare({ row, col });
            setEnPassantTarget(nextEnPassantTarget);
            setCastlingRights(newCastlingRights);
            setPossibleMoves([]);
            setGameStatusMessage(`Pawn promotion for ${currentPlayer === 'w' ? 'White' : 'Black'}! Select a piece.`);
            return; 
        }
        
        setBoard(newBoard);
        setEnPassantTarget(nextEnPassantTarget);
        setCastlingRights(newCastlingRights);

        const newKingPositions = { ...kingPositions };
        if (pieceToMove.type === 'K') {
          newKingPositions[pieceToMove.color] = { row, col };
        }
        setKingPositions(newKingPositions);

        const opponentColor = currentPlayer === 'w' ? 'b' : 'w';
        const opponentKingPos = newKingPositions[opponentColor];
        const isOpponentInCheck = opponentKingPos.row !== -1 && isSquareAttacked(newBoard, opponentKingPos.row, opponentKingPos.col, currentPlayer);
        
        setKingUnderAttack(isOpponentInCheck ? opponentColor : null);
        const opponentHasLegalMoves = getAllLegalMovesForPlayer(newBoard, opponentColor, newKingPositions).length > 0;

        if (isOpponentInCheck && !opponentHasLegalMoves) {
          setGameOver(true);
          setWinner(currentPlayer);
          setGameStatusMessage(`Checkmate! ${currentPlayer === 'w' ? 'White' : 'Black'} wins!`);
          toast({ title: "Checkmate!", description: `${currentPlayer === 'w' ? 'White' : 'Black'} wins!` });
        } else if (!isOpponentInCheck && !opponentHasLegalMoves) {
          setGameOver(true);
          setWinner('draw');
          setGameStatusMessage("Stalemate! It's a draw.");
          toast({ title: "Stalemate!", description: "The game is a draw." });
        } else {
          setCurrentPlayer(opponentColor);
          setGameStatusMessage(`${isOpponentInCheck ? "Check! " : ""}${opponentColor === 'w' ? "White" : "Black"}'s turn.`);
        }
        setSelectedPiece(null);
        setPossibleMoves([]);

      } else {
        if (clickedSquarePiece && clickedSquarePiece.color === currentPlayer) {
          setSelectedPiece({ row, col });
          setPossibleMoves(calculateLegalMoves(board, clickedSquarePiece, row, col, currentPlayer, kingPositions));
        } else {
          setSelectedPiece(null);
          setPossibleMoves([]);
        }
      }
    } else {
      if (clickedSquarePiece && clickedSquarePiece.color === currentPlayer) {
        setSelectedPiece({ row, col });
        setPossibleMoves(calculateLegalMoves(board, clickedSquarePiece, row, col, currentPlayer, kingPositions));
      }
    }
  };

  const handlePromotionChoice = (promotedPieceType: 'Q' | 'R' | 'B' | 'N') => {
    if (!promotionSquare) return;

    const finalBoard = board.map(r_arr => r_arr.map(p => p ? { ...p } : null));
    const promotedPiece: Piece = { type: promotedPieceType, color: currentPlayer };
    finalBoard[promotionSquare.row][promotionSquare.col] = promotedPiece;
    setBoard(finalBoard);

    const newKingPositions = { ...kingPositions }; 

    const opponentColor = currentPlayer === 'w' ? 'b' : 'w';
    const opponentKingPos = newKingPositions[opponentColor];
    
    const isOpponentInCheck = opponentKingPos.row !== -1 && isSquareAttacked(finalBoard, opponentKingPos.row, opponentKingPos.col, currentPlayer);
    setKingUnderAttack(isOpponentInCheck ? opponentColor : null);

    const opponentHasLegalMoves = getAllLegalMovesForPlayer(finalBoard, opponentColor, newKingPositions).length > 0;

    if (isOpponentInCheck && !opponentHasLegalMoves) {
        setGameOver(true);
        setWinner(currentPlayer);
        setGameStatusMessage(`Checkmate! ${currentPlayer === 'w' ? 'White' : 'Black'} wins!`);
        toast({ title: "Checkmate!", description: `${currentPlayer === 'w' ? 'White' : 'Black'} wins!` });
    } else if (!isOpponentInCheck && !opponentHasLegalMoves) {
        setGameOver(true);
        setWinner('draw');
        setGameStatusMessage("Stalemate! It's a draw.");
        toast({ title: "Stalemate!", description: "The game is a draw." });
    } else {
        setCurrentPlayer(opponentColor);
        setGameStatusMessage(`${isOpponentInCheck ? "Check! " : ""}${opponentColor === 'w' ? "White" : "Black"}'s turn.`);
    }

    setPromotionSquare(null);
    setSelectedPiece(null); 
    setPossibleMoves([]);
  };


  const resetGame = () => {
    const newInitialSetup = initialBoardSetup();
    setBoard(newInitialSetup.board);
    setKingPositions(newInitialSetup.kings);
    setSelectedPiece(null);
    setCurrentPlayer('w');
    setPossibleMoves([]);
    setGameStatusMessage("White's turn to move.");
    setGameOver(false);
    setWinner(null);
    setKingUnderAttack(null);
    setPromotionSquare(null);
    setCastlingRights({ w: { K: true, Q: true }, b: { K: true, Q: true }});
    setEnPassantTarget(null);
    toast({ title: "Game Reset", description: "The board has been reset." });
  };

  const ClientMetadata = () => (
    <>
      <title>Play Chess | Shravya Playhouse</title>
      <meta name="description" content="Challenge your mind with the classic game of chess, featuring move validation, turn management, check, and checkmate." />
    </>
  );

  return (
    <>
      <ClientMetadata />
      <div className="relative flex flex-col items-center space-y-6"> {/* Added relative positioning for promotion UI */}
        <Card className="w-full max-w-3xl shadow-xl">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-3xl font-bold text-center text-primary">Interactive Chess</CardTitle>
            <CardDescription className="text-center text-md text-foreground/80 min-h-[1.5em]">
              {gameOver
                ? `Game Over! ${winner === 'draw' ? 'Draw by Stalemate' : (winner === 'w' ? 'White Wins!' : 'Black Wins!')}`
                : gameStatusMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 flex flex-col items-center">
            <div className="mb-4 flex items-center space-x-2 p-2 rounded-md bg-card border shadow">
              {kingUnderAttack && kingUnderAttack !== currentPlayer && <AlertTriangle size={24} className="text-red-500" />}
              {currentPlayer === 'w' ? <Crown size={24} className="text-yellow-400" /> : <Shield size={24} className="text-neutral-600" />}
              <span className={cn("font-semibold", currentPlayer === 'w' ? 'text-foreground' : 'text-foreground')}>
                Turn: {currentPlayer === 'w' ? "White" : "Black"}
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
                  const isKingSquareInCheck = piece?.type === 'K' && piece.color === kingUnderAttack;

                  return (
                    <ChessSquare
                      key={`${rowIndex}-${colIndex}`}
                      piece={piece}
                      isLight={isLight}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      isSelected={isSel}
                      isPossibleMove={isPossMove}
                      isInCheck={isKingSquareInCheck}
                      isDisabled={!!promotionSquare} // Disable board clicks during promotion
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
              Rules implemented: Basic piece movements, captures, check, checkmate, stalemate, pawn promotion, en passant, and castling.
            </p>
          </CardContent>
        </Card>
        {promotionSquare && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
                <Card className="p-5 bg-background shadow-2xl border-2 border-accent">
                    <CardHeader className="p-2">
                        <CardTitle className="text-center text-xl text-primary">Promote Pawn</CardTitle>
                        <CardDescription className="text-center text-sm text-foreground/90">Select a piece:</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-around space-x-3 pt-3">
                        {(['Q', 'R', 'B', 'N'] as const).map((type) => (
                            <Button
                                key={type}
                                variant="outline"
                                className="p-2 h-16 w-16 md:h-20 md:w-20 hover:bg-accent/20 border-2 border-primary/50 focus:ring-accent"
                                onClick={() => handlePromotionChoice(type)}
                                aria-label={`Promote to ${type === 'Q' ? 'Queen' : type === 'R' ? 'Rook' : type === 'B' ? 'Bishop' : 'Knight'}`}
                            >
                                <span className={cn(
                                    "text-4xl md:text-5xl",
                                    currentPlayer === "w" ? "text-white" : "text-neutral-800"
                                )}
                                style={{ textShadow: currentPlayer === 'w' ? '0 0 4px black, 0 0 6px black' : '0 0 4px white, 0 0 6px white' }}
                                >
                                   {PIECE_UNICODE[currentPlayer][type]}
                                </span>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </>
  );
}

