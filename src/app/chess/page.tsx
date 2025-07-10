
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Crown, AlertTriangle, Timer, ListChecks, ArrowRight, ArrowLeft, Brain, Gamepad2, Award, Loader2, Users, Cpu, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface Piece {
  type: "K" | "Q" | "R" | "B" | "N" | "P";
  color: "w" | "b";
}

interface SquarePosition {
  row: number;
  col: number;
}

type PlayerColor = "w" | "b";
type GameState = 'setup' | 'playing' | 'gameOver';
type GameMode = 'player' | 'ai' | null;

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

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getAlgebraicNotation = ({ row, col }: SquarePosition): string => `${'abcdefgh'[col]}${'87654321'[row]}`;

const PlayerInfoPanel = ({
    name,
    timer,
    capturedPieces,
    isCurrentTurn
}: {
    name: string;
    timer: number;
    capturedPieces: Piece[];
    isCurrentTurn: boolean;
}) => (
    <div className={cn("p-2 sm:p-4 flex justify-between items-center transition-colors", isCurrentTurn ? "bg-primary/20" : "")}>
        <div className="flex items-center gap-3">
            <span className="font-semibold text-lg truncate" title={name}>{name}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex gap-1 flex-wrap-reverse items-center min-h-[24px]">
                {capturedPieces.map((p, i) => <span key={i} title={p.type} className={cn("text-sm", p.color === 'w' ? 'text-neutral-600' : 'text-white/90')}>{PIECE_UNICODE[p.color][p.type]}</span>)}
            </div>
            <div className="font-mono text-xl p-1 px-2 rounded-md bg-background/50 border shadow-inner">
                {formatTime(timer)}
            </div>
        </div>
    </div>
);


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
  const [gameState, setGameState] = useState<GameState>('setup');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [playerNames, setPlayerNames] = useState({ w: 'White', b: 'Black' });
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const router = useRouter();

  const initialSetup = initialBoardSetup();
  const [board, setBoard] = useState<(Piece | null)[][]>(initialSetup.board);
  const [kingPositions, setKingPositions] = useState<Record<PlayerColor, SquarePosition>>(initialSetup.kings);
  const [selectedPiece, setSelectedPiece] = useState<SquarePosition | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('w');
  const [possibleMoves, setPossibleMoves] = useState<SquarePosition[]>([]);
  const [gameStatusMessage, setGameStatusMessage] = useState<string>("White's turn to move.");
  const [winner, setWinner] = useState<PlayerColor | 'draw' | null>(null);
  const [kingUnderAttack, setKingUnderAttack] = useState<PlayerColor | null>(null);
  const [promotionSquare, setPromotionSquare] = useState<SquarePosition | null>(null);
  const [castlingRights, setCastlingRights] = useState({ w: { K: true, Q: true }, b: { K: true, Q: true }});
  const [enPassantTarget, setEnPassantTarget] = useState<SquarePosition | null>(null);
  
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{w: Piece[], b: Piece[]}>({w: [], b: []});
  const [playerTimers, setPlayerTimers] = useState({w: 600, b: 600});

  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number} | null>(null);

  const { toast } = useToast();
  
  const handleGameEnd = useCallback(async (winnerColor: PlayerColor | 'draw' | null, reason: string) => {
    setGameState('gameOver');
    setWinner(winnerColor);
    setGameStatusMessage(reason);
    
    if (gameMode !== 'ai') return; // No rewards for PvP

    setIsCalculatingReward(true);

    const didWin = winnerColor === 'w'; // Assuming player is always white vs AI
    updateGameStats({ gameId: 'chess', didWin });

    try {
        const rewards = await calculateRewards({
            gameId: 'chess',
            difficulty: winnerColor === 'w' ? 'hard' : (winnerColor === 'b' ? 'easy' : 'medium'),
            performanceMetrics: { result: winnerColor === 'w' ? 'win' : 'loss' }
        });

        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Chess Game vs AI: ${reason}`);
        setLastReward(earned);

        toast({
            title: `Game Over: ${reason}`,
            description: `You earned ${earned.points} S-Points and ${earned.coins} S-Coins!`,
            className: "bg-primary/20",
            duration: 5000,
        });

    } catch(e) {
        console.error("Error calculating rewards:", e);
        toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
    } finally {
        setIsCalculatingReward(false);
    }
  }, [toast, gameMode]);


  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setPlayerTimers(prevTimers => {
        if (prevTimers[currentPlayer] <= 0) {
          clearInterval(timer);
          return prevTimers;
        }
        const newTimers = { ...prevTimers, [currentPlayer]: prevTimers[currentPlayer] - 1 };
        if (newTimers[currentPlayer] === 0) {
          const winnerColor = currentPlayer === 'w' ? 'b' : 'w';
          handleGameEnd(winnerColor, `Time's up! ${winnerColor === 'w' ? playerNames.w : playerNames.b} wins!`);
          clearInterval(timer);
        }
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPlayer, gameState, handleGameEnd, playerNames]);

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
    const pawnDirection = attackerColor === 'w' ? 1 : -1;
    let piece = getPieceAt(currentBoard, targetRow + pawnDirection, targetCol - 1);
    if (piece?.type === 'P' && piece.color === attackerColor) return true;
    piece = getPieceAt(currentBoard, targetRow + pawnDirection, targetCol + 1);
    if (piece?.type === 'P' && piece.color === attackerColor) return true;
    
    const knightMoves = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
    for (const [dr, dc] of knightMoves) {
        piece = getPieceAt(currentBoard, targetRow + dr, targetCol + dc);
        if (piece?.type === 'N' && piece.color === attackerColor) return true;
    }

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
                break;
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

    const addMove = (targetRow: number, targetCol: number): boolean => {
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
      if (isSquareOnBoard(r + direction, c) && !getPieceAt(currentBoard, r + direction, c)) {
        addMove(r + direction, c);
        const initialRow = playerColor === 'w' ? 6 : 1;
        if (r === initialRow && isSquareOnBoard(r + 2 * direction, c) && !getPieceAt(currentBoard, r + 2 * direction, c)) {
          addMove(r + 2 * direction, c);
        }
      }
      [-1, 1].forEach(colOffset => {
        if (isSquareOnBoard(r + direction, c + colOffset)) {
          const targetPiece = getPieceAt(currentBoard, r + direction, c + colOffset);
          if (targetPiece && targetPiece.color === opponentColor) {
            addMove(r + direction, c + colOffset);
          }
        }
      });
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
      if (!isSquareAttacked(currentBoard, r, c, opponentColor)) {
          if (castlingRights[playerColor].K && !getPieceAt(currentBoard, r, c + 1) && !getPieceAt(currentBoard, r, c + 2)) {
              if (!isSquareAttacked(currentBoard, r, c + 1, opponentColor) && !isSquareAttacked(currentBoard, r, c + 2, opponentColor)) {
                  addMove(r, c + 2);
              }
          }
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
          if (!addMove(r + i * dr, c + i * dc)) break;
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
          for(const move of legalMoves) {
              allMoves.push({ from: {row: r_idx, col: c_idx}, to: move });
          }
        }
      }
    }
    return allMoves;
  }, [calculateLegalMoves, getPieceAt]);


  const makeAIMove = useCallback(() => {
    const aiColor = 'b';
    if(currentPlayer !== aiColor || gameState !== 'playing') return;
    
    const allMoves = getAllLegalMovesForPlayer(board, aiColor, kingPositions);
    if(allMoves.length === 0) return;

    // 1. Prioritize checkmating moves
    for(const move of allMoves) {
        const tempBoard = board.map(r => [...r]);
        const piece = tempBoard[move.from.row][move.from.col];
        tempBoard[move.to.row][move.to.col] = piece;
        tempBoard[move.from.row][move.from.col] = null;
        const opponentColor = aiColor === 'w' ? 'b' : 'w';
        if(getAllLegalMovesForPlayer(tempBoard, opponentColor, kingPositions).length === 0 && isSquareAttacked(tempBoard, kingPositions[opponentColor].row, kingPositions[opponentColor].col, aiColor)) {
            handleSquareClick(move.from.row, move.from.col);
            setTimeout(() => handleSquareClick(move.to.row, move.to.col), 100);
            return;
        }
    }

    // 2. Prioritize captures
    const captureMoves = allMoves.filter(move => getPieceAt(board, move.to.row, move.to.col) !== null);
    if(captureMoves.length > 0) {
        const randomCapture = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        handleSquareClick(randomCapture.from.row, randomCapture.from.col);
        setTimeout(() => handleSquareClick(randomCapture.to.row, randomCapture.to.col), 100);
        return;
    }

    // 3. Simple random move
    const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    handleSquareClick(randomMove.from.row, randomMove.from.col);
    setTimeout(() => handleSquareClick(randomMove.to.row, randomMove.to.col), 100);

  }, [board, currentPlayer, gameState, getAllLegalMovesForPlayer, kingPositions, getPieceAt]);

  useEffect(() => {
    if(gameMode === 'ai' && currentPlayer === 'b' && gameState === 'playing' && winner === null) {
      const aiMoveTimeout = setTimeout(makeAIMove, 1000);
      return () => clearTimeout(aiMoveTimeout);
    }
  }, [currentPlayer, gameState, winner, gameMode, makeAIMove]);

  const handleSquareClick = (row: number, col: number) => {
    if (promotionSquare || gameState !== 'playing' || winner) return;
    if (gameMode === 'ai' && currentPlayer === 'b') return; // Prevent user from moving AI pieces

    const clickedSquarePiece = getPieceAt(board, row, col);

    if (selectedPiece) {
      const { row: fromRow, col: fromCol } = selectedPiece;
      const pieceToMove = getPieceAt(board, fromRow, fromCol);
      if (!pieceToMove) {
        setSelectedPiece(null); setPossibleMoves([]); return;
      }
      
      const isMovePossible = possibleMoves.some(m => m.row === row && m.col === col);
      if (isMovePossible) {
        const newBoard = board.map(r_arr => r_arr.map(p => p ? { ...p } : null));
        let nextEnPassantTarget: SquarePosition | null = null;
        const newCastlingRights = JSON.parse(JSON.stringify(castlingRights));
        
        const opponentColor = currentPlayer === 'w' ? 'b' : 'w';
        const capturedPiece = getPieceAt(newBoard, row, col);
        if (capturedPiece) {
          setCapturedPieces(prev => ({...prev, [currentPlayer]: [...prev[currentPlayer], capturedPiece]}));
        }

        let moveNotation = '';
        if (pieceToMove.type === 'K' && Math.abs(fromCol - col) === 2) {
            moveNotation = (col > fromCol) ? '0-0' : '0-0-0'; // Castle
            if (col > fromCol) { const rook = newBoard[row][7]; newBoard[row][5] = rook; newBoard[row][7] = null; } 
            else { const rook = newBoard[row][0]; newBoard[row][3] = rook; newBoard[row][0] = null; }
        } else {
            const isCapture = !!capturedPiece;
            moveNotation = `${PIECE_UNICODE[pieceToMove.color][pieceToMove.type]} ${getAlgebraicNotation({row: fromRow, col: fromCol})} ${isCapture ? 'x' : '→'} ${getAlgebraicNotation({row, col})}`;
        }
        
        if (pieceToMove.type === 'P' && enPassantTarget && row === enPassantTarget.row && col === enPassantTarget.col) {
            newBoard[fromRow][col] = null;
            const capturedPawn: Piece = { type: 'P', color: opponentColor };
            setCapturedPieces(prev => ({ ...prev, [currentPlayer]: [...prev[currentPlayer], capturedPawn]}));
        }

        newBoard[row][col] = pieceToMove;
        newBoard[fromRow][fromCol] = null;
        
        if (pieceToMove.type === 'P' && Math.abs(fromRow - row) === 2) {
            nextEnPassantTarget = { row: (fromRow + row) / 2, col: col };
        }
        
        if (pieceToMove.type === 'K') { newCastlingRights[currentPlayer].K = false; newCastlingRights[currentPlayer].Q = false; }
        if (pieceToMove.type === 'R') {
            if (fromCol === 0 && fromRow === (currentPlayer === 'w' ? 7 : 0)) newCastlingRights[currentPlayer].Q = false;
            if (fromCol === 7 && fromRow === (currentPlayer === 'w' ? 7 : 0)) newCastlingRights[currentPlayer].K = false;
        }
        if (capturedPiece?.type === 'R') {
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
            setGameStatusMessage(`Pawn promotion! Select a piece.`);
            setMoveHistory(prev => [...prev, moveNotation]);
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

        const opponentKingPos = newKingPositions[opponentColor];
        const isOpponentInCheck = opponentKingPos.row !== -1 && isSquareAttacked(newBoard, opponentKingPos.row, opponentKingPos.col, currentPlayer);
        
        setKingUnderAttack(isOpponentInCheck ? opponentColor : null);
        const opponentHasLegalMoves = getAllLegalMovesForPlayer(newBoard, opponentColor, newKingPositions).length > 0;
        
        let finalMoveNotation = moveNotation;

        if (isOpponentInCheck && !opponentHasLegalMoves) {
          finalMoveNotation += '#'; // Checkmate
          handleGameEnd(currentPlayer, `Checkmate! ${currentPlayer === 'w' ? playerNames.w : playerNames.b} wins!`);
        } else if (!isOpponentInCheck && !opponentHasLegalMoves) {
          handleGameEnd('draw', "Stalemate! It's a draw.");
        } else {
          if (isOpponentInCheck) finalMoveNotation += '+'; // Check
          setCurrentPlayer(opponentColor);
          setGameStatusMessage(`${isOpponentInCheck ? "Check! " : ""}${opponentColor === 'w' ? playerNames.w : playerNames.b}'s turn.`);
        }
        setMoveHistory(prev => [...prev, finalMoveNotation]);
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

    setMoveHistory(prev => {
        const lastMove = prev[prev.length - 1];
        const newHistory = [...prev.slice(0, -1), `${lastMove}=${PIECE_UNICODE[currentPlayer][promotedPieceType]}`];
        return newHistory;
    });

    const opponentColor = currentPlayer === 'w' ? 'b' : 'w';
    const opponentKingPos = kingPositions[opponentColor];
    
    const isOpponentInCheck = opponentKingPos.row !== -1 && isSquareAttacked(finalBoard, opponentKingPos.row, opponentKingPos.col, currentPlayer);
    setKingUnderAttack(isOpponentInCheck ? opponentColor : null);

    const opponentHasLegalMoves = getAllLegalMovesForPlayer(finalBoard, opponentColor, kingPositions).length > 0;

    if (isOpponentInCheck && !opponentHasLegalMoves) {
        handleGameEnd(currentPlayer, `Checkmate! ${currentPlayer === 'w' ? playerNames.w : playerNames.b} wins!`);
    } else if (!isOpponentInCheck && !opponentHasLegalMoves) {
        handleGameEnd('draw', "Stalemate! It's a draw.");
    } else {
        setCurrentPlayer(opponentColor);
        setGameStatusMessage(`${isOpponentInCheck ? "Check! " : ""}${opponentColor === 'w' ? playerNames.w : playerNames.b}'s turn.`);
    }

    setPromotionSquare(null);
    setSelectedPiece(null); 
    setPossibleMoves([]);
  };

  const resetGame = () => {
    updateGameStats({ gameId: 'chess', didWin: false });
    const newInitialSetup = initialBoardSetup();
    setBoard(newInitialSetup.board);
    setKingPositions(newInitialSetup.kings);
    setSelectedPiece(null);
    setCurrentPlayer('w');
    setPossibleMoves([]);
    setGameStatusMessage(`${playerNames.w}'s turn to move.`);
    setWinner(null);
    setKingUnderAttack(null);
    setPromotionSquare(null);
    setCastlingRights({ w: { K: true, Q: true }, b: { K: true, Q: true }});
    setEnPassantTarget(null);
    setMoveHistory([]);
    setCapturedPieces({ w: [], b: [] });
    setPlayerTimers({ w: 600, b: 600 });
    toast({ title: "Game Reset", description: "The board has been reset." });
    setGameState('playing');
    setLastReward(null);
  };
  
  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push(moveHistory.slice(i, i + 2));
  }
  
  const startGame = (mode: GameMode, names: { w: string, b: string }) => {
    setGameMode(mode);
    setPlayerNames(names);
    setGameState('playing');
    setGameStatusMessage(`${names.w}'s turn to move.`);
    resetGame();
  }

  if (gameState === 'setup') {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Chess</CardTitle>
                    <CardDescription>Select a game mode.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full text-lg py-6"><Users className="mr-2"/> Player vs Player</Button>
                        </DialogTrigger>
                        <SetupDialog mode="player" onStart={startGame} />
                    </Dialog>
                    <DialogTrigger asChild>
                       <Button onClick={() => startGame('ai', { w: 'You', b: 'Shravya AI' })} className="w-full text-lg py-6"><Cpu className="mr-2"/> Player vs AI</Button>
                    </DialogTrigger>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start justify-center p-2 md:p-4">
      <AlertDialog open={gameState === 'gameOver'}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                <Award size={28} /> {gameStatusMessage}
            </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="py-4 text-center">
                {(isCalculatingReward && gameMode === 'ai') ? (
                    <div className="flex flex-col items-center justify-center gap-2 pt-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
                    </div>
                ) : (lastReward && gameMode === 'ai') ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                        <AlertDialogDescription className="text-center text-base pt-2">
                           Congratulations on finishing the game!
                        </AlertDialogDescription>
                        <div className="flex items-center gap-6 mt-2">
                            <span className="flex items-center font-bold text-2xl">
                                +{lastReward.points} <SPointsIcon className="ml-2 h-7 w-7 text-yellow-400" />
                            </span>
                            <span className="flex items-center font-bold text-2xl">
                                +{lastReward.coins} <SCoinsIcon className="ml-2 h-7 w-7 text-amber-500" />
                            </span>
                        </div>
                    </div>
                ) : <p className="text-lg">Well played!</p>}
            </div>
            <AlertDialogFooter>
             <Button onClick={resetGame} disabled={isCalculatingReward}>Play Again</Button>
             <Button onClick={() => setGameState('setup')} variant="outline" disabled={isCalculatingReward}>Back to Menu</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full lg:max-w-2xl flex-shrink-0">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
          <PlayerInfoPanel name={playerNames.b} timer={playerTimers.b} capturedPieces={capturedPieces.w} isCurrentTurn={currentPlayer === 'b' && gameState === 'playing'} />
          <CardContent className="p-1 sm:p-2">
            <div
              className="grid grid-cols-8 w-full max-w-2xl aspect-square border-4 border-primary/50 rounded-md overflow-hidden shadow-lg bg-primary/40 relative"
              aria-label="Chess board"
            >
              {board.map((rowArr, rowIndex) =>
                rowArr.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isSel = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                  const isPossMove = possibleMoves.some(m => m.row === rowIndex && m.col === colIndex);
                  const isKingSquareInCheck = piece?.type === 'K' && piece.color === kingUnderAttack;
                  return (
                    <ChessSquare key={`${rowIndex}-${colIndex}`} piece={piece} isLight={isLight} onClick={() => handleSquareClick(rowIndex, colIndex)} isSelected={isSel} isPossibleMove={isPossMove} isInCheck={isKingSquareInCheck} isDisabled={!!promotionSquare || gameState !== 'playing'} />
                  );
                })
              )}
               {promotionSquare && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 backdrop-blur-sm">
                    <Card className="p-4 bg-background shadow-2xl border-2 border-accent">
                        <CardHeader className="p-2">
                            <CardTitle className="text-center text-xl text-primary">Promote Pawn</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-around space-x-2 pt-2">
                            {(['Q', 'R', 'B', 'N'] as const).map((type) => (
                                <Button key={type} variant="outline" className="p-2 h-16 w-16 hover:bg-accent/20 border-2 border-primary/50" onClick={() => handlePromotionChoice(type)}>
                                    <span className={cn("text-4xl", currentPlayer === "w" ? "text-white" : "text-neutral-800")} style={{ textShadow: currentPlayer === 'w' ? '0 0 4px black' : '0 0 4px white' }}>
                                       {PIECE_UNICODE[currentPlayer][type]}
                                    </span>
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
              )}
            </div>
          </CardContent>
          <PlayerInfoPanel name={playerNames.w} timer={playerTimers.w} capturedPieces={capturedPieces.b} isCurrentTurn={currentPlayer === 'w' && gameState === 'playing'} />
        </Card>
      </div>

      <div className="w-full lg:w-80 space-y-4 flex-shrink-0">
        <Card className="shadow-lg">
           <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Timer /> Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center justify-center space-x-2 p-2 rounded-md bg-card border shadow text-center">
                    {kingUnderAttack && kingUnderAttack !== currentPlayer && <AlertTriangle size={24} className="text-red-500" />}
                    <span className="font-semibold text-lg">
                      {gameStatusMessage}
                    </span>
                </div>
                 <Button onClick={resetGame} className="w-full bg-accent text-accent-foreground rounded-md shadow-md hover:bg-accent/90 transition-colors text-lg">
                    Reset Game
                </Button>
            </CardContent>
        </Card>

        {/* Desktop History */}
        <Card className="shadow-lg hidden lg:block">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><ListChecks /> Move History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full pr-2">
              <ol className="list-decimal list-inside space-y-1 text-sm font-mono">
                {movePairs.map((pair, index) => (
                  <li key={index} className="grid grid-cols-2 gap-x-2 items-center border-b border-dashed">
                      <span className="p-1.5 truncate">{pair[0]}</span>
                      {pair[1] && <span className="p-1.5 truncate">{pair[1]}</span>}
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Mobile History Button */}
        <div className="lg:hidden">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <ListChecks className="mr-2 h-4 w-4" /> View Move History
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move History</DialogTitle>
                    </DialogHeader>
                     <ScrollArea className="h-96 w-full pr-4 mt-4">
                        <ol className="list-decimal list-inside space-y-1 text-sm font-mono">
                            {movePairs.map((pair, index) => (
                            <li key={index} className="grid grid-cols-2 gap-x-2 items-center border-b border-dashed">
                                <span className="p-1.5 truncate">{pair[0]}</span>
                                {pair[1] && <span className="p-1.5 truncate">{pair[1]}</span>}
                            </li>
                            ))}
                        </ol>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
      </div>
    </div>
  );
}

// Setup Dialog Component for PvP
interface SetupDialogProps {
  mode: 'player';
  onStart: (mode: GameMode, names: { w: string; b: string }) => void;
}

function SetupDialog({ mode, onStart }: SetupDialogProps) {
  const [p1Name, setP1Name] = useState('Player 1 (White)');
  const [p2Name, setP2Name] = useState('Player 2 (Black)');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Name.trim() || !p2Name.trim()) {
      alert("Player names cannot be empty.");
      return;
    }
    onStart(mode, { w: p1Name, b: p2Name });
  };
  
  return (
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Setup: Player vs Player</DialogTitle>
            <DialogDescription>Enter player names to begin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="p1Name">Player 1 (White)</Label>
                <Input id="p1Name" value={p1Name} onChange={(e) => setP1Name(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="p2Name">Player 2 (Black)</Label>
                <Input id="p2Name" value={p2Name} onChange={(e) => setP2Name(e.target.value)} />
            </div>
            <DialogFooter>
                <Button type="submit">Start Game</Button>
            </DialogFooter>
        </form>
    </DialogContent>
  );
}
