
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Crown, AlertTriangle, Timer, ListChecks, ArrowLeft, Brain, Gamepad2, Users, Edit, Cpu, Award, Loader2, Coins, User as UserIcon, Expand, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { useFullscreen } from '@/hooks/use-fullscreen';


interface Piece {
  type: "K" | "Q" | "R" | "B" | "N" | "P";
  color: "w" | "b";
}

interface SquarePosition {
  row: number;
  col: number;
}

interface Move {
    from: SquarePosition;
    to: SquarePosition;
}

type PlayerColor = "w" | "b";
type GameState = 'setup' | 'playing' | 'gameOver' | 'aiConfig';
type GameMode = 'pvp' | 'ai' | null;
type AIDifficulty = 'easy' | 'medium' | 'hard';


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
          {PIECE_UNICODE[piece.color][p.type]}
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
  const [humanPlayerColor, setHumanPlayerColor] = useState<PlayerColor>('w');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
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
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameContainerRef);
  
  const handleGameEnd = useCallback(async (winnerColor: PlayerColor | 'draw' | null, reason: string) => {
    setGameState('gameOver');
    setWinner(winnerColor);
    setGameStatusMessage(reason);
    
    if (gameMode === 'ai' && winnerColor !== null) {
        const didWin = winnerColor === humanPlayerColor; 
        updateGameStats({ gameId: 'chess', didWin });
        
        setIsCalculatingReward(true);
        try {
            const rewards = await calculateRewards({
                gameId: 'chess-ai',
                difficulty: aiDifficulty,
                performanceMetrics: { result: winnerColor === humanPlayerColor ? 'win' : (winnerColor === 'draw' ? 'draw' : 'loss') }
            });

            const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Chess Game vs AI: ${reason}`);
            setLastReward(earned);

        } catch(e) {
            console.error("Error calculating rewards:", e);
            toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        } finally {
            setIsCalculatingReward(false);
        }
    }
  }, [gameMode, humanPlayerColor, toast, aiDifficulty]);


  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setPlayerTimers(prevTimers => {
        const newTimers = { ...prevTimers, [currentPlayer]: prevTimers[currentPlayer] - 1 };
        if (newTimers[currentPlayer] <= 0) {
          clearInterval(timer);
          const winnerColor = currentPlayer === 'w' ? 'b' : 'w';
          handleGameEnd(winnerColor, `Time's up! ${winnerColor === 'w' ? playerNames.w : playerNames.b} wins!`);
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
    currentKingPositions: Record<PlayerColor, SquarePosition>
  ): SquarePosition[] => {
    const rawMoves = _calculateRawPossibleMoves(currentBoard, piece, r, c);
    const legalMoves: SquarePosition[] = [];
    const playerColor = piece.color;
    const opponentColor = playerColor === 'w' ? 'b' : 'w';
  
    for (const move of rawMoves) {
      const tempBoard = currentBoard.map(rowArr => rowArr.map(p => p ? { ...p } : null));
      const pieceToMove = tempBoard[r][c];
      
      if (pieceToMove) {
          tempBoard[move.row][move.col] = pieceToMove;
          tempBoard[r][c] = null;
  
          let kingPos = currentKingPositions[playerColor];
          if (pieceToMove.type === 'K') {
            kingPos = { row: move.row, col: move.col };
          }
          
          if (kingPos.row !== -1 && !isSquareAttacked(tempBoard, kingPos.row, kingPos.col, opponentColor)) {
            legalMoves.push(move);
          }
      }
    }
    return legalMoves;
  }, [_calculateRawPossibleMoves, isSquareAttacked]);
  
  const getAllLegalMovesForPlayer = useCallback((
    currentBoard: (Piece | null)[][],
    playerColor: PlayerColor,
    currentKingPositions: Record<PlayerColor, SquarePosition>
  ): Move[] => {
    const allMoves: Move[] = [];
    for (let r_idx = 0; r_idx < 8; r_idx++) {
      for (let c_idx = 0; c_idx < 8; c_idx++) {
        const piece = getPieceAt(currentBoard, r_idx, c_idx);
        if (piece && piece.color === playerColor) {
          const legalMoves = calculateLegalMoves(currentBoard, piece, r_idx, c_idx, currentKingPositions);
          for(const move of legalMoves) {
              allMoves.push({ from: {row: r_idx, col: c_idx}, to: move });
          }
        }
      }
    }
    return allMoves;
  }, [calculateLegalMoves, getPieceAt]);
  
  const performMove = useCallback((from: SquarePosition, to: SquarePosition) => {
    const pieceToMove = getPieceAt(board, from.row, from.col);
    if (!pieceToMove) return;

    const newBoard = board.map(r_arr => r_arr.map(p => p ? { ...p } : null));
    let nextEnPassantTarget: SquarePosition | null = null;
    const newCastlingRights = JSON.parse(JSON.stringify(castlingRights));
    
    const opponentColor = currentPlayer === 'w' ? 'b' : 'w';
    const capturedPiece = getPieceAt(newBoard, to.row, to.col);
    if (capturedPiece) {
      setCapturedPieces(prev => ({...prev, [currentPlayer]: [...prev[currentPlayer], capturedPiece]}));
    }

    let moveNotation = '';
    if (pieceToMove.type === 'K' && Math.abs(from.col - to.col) === 2) {
        moveNotation = (to.col > from.col) ? '0-0' : '0-0-0'; // Castle
        if (to.col > from.col) { const rook = newBoard[to.row][7]; newBoard[to.row][5] = rook; newBoard[to.row][7] = null; } 
        else { const rook = newBoard[to.row][0]; newBoard[to.row][3] = rook; newBoard[to.row][0] = null; }
    } else {
        const isCapture = !!capturedPiece;
        moveNotation = `${PIECE_UNICODE[pieceToMove.color][pieceToMove.type]} ${getAlgebraicNotation(from)} ${isCapture ? 'x' : '→'} ${getAlgebraicNotation(to)}`;
    }
    
    if (pieceToMove.type === 'P' && enPassantTarget && to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
        newBoard[from.row][to.col] = null;
        const capturedPawn: Piece = { type: 'P', color: opponentColor };
        setCapturedPieces(prev => ({ ...prev, [currentPlayer]: [...prev[currentPlayer], capturedPawn]}));
    }

    newBoard[to.row][to.col] = pieceToMove;
    newBoard[from.row][from.col] = null;
    
    if (pieceToMove.type === 'P' && Math.abs(from.row - to.row) === 2) {
        nextEnPassantTarget = { row: (from.row + to.row) / 2, col: to.col };
    }
    
    if (pieceToMove.type === 'K') { newCastlingRights[currentPlayer].K = false; newCastlingRights[currentPlayer].Q = false; }
    if (pieceToMove.type === 'R') {
        if (from.col === 0 && from.row === (currentPlayer === 'w' ? 7 : 0)) newCastlingRights[currentPlayer].Q = false;
        if (from.col === 7 && from.row === (currentPlayer === 'w' ? 7 : 0)) newCastlingRights[currentPlayer].K = false;
    }
    if (capturedPiece?.type === 'R') {
        if (to.row === (opponentColor === 'w' ? 7 : 0)) {
            if (to.col === 0) newCastlingRights[opponentColor].Q = false;
            if (to.col === 7) newCastlingRights[opponentColor].K = false;
        }
    }
    
    const isPromotion = pieceToMove.type === 'P' && ((pieceToMove.color === 'w' && to.row === 0) || (pieceToMove.color === 'b' && to.row === 7));
    if (isPromotion) {
        setBoard(newBoard);
        setPromotionSquare(to);
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
      newKingPositions[pieceToMove.color] = to;
    }
    setKingPositions(newKingPositions);

    const opponentKingPos = newKingPositions[opponentColor];
    const isOpponentInCheck = opponentKingPos.row !== -1 && isSquareAttacked(newBoard, opponentKingPos.row, opponentKingPos.col, currentPlayer);
    
    setKingUnderAttack(isOpponentInCheck ? opponentColor : null);
    const opponentHasLegalMoves = getAllLegalMovesForPlayer(newBoard, opponentColor, newKingPositions).length > 0;
    
    let finalMoveNotation = moveNotation;

    if (isOpponentInCheck && !opponentHasLegalMoves) {
      finalMoveNotation += '#'; // Checkmate
      handleGameEnd(currentPlayer, `Checkmate! ${playerNames[currentPlayer]} wins!`);
    } else if (!isOpponentInCheck && !opponentHasLegalMoves) {
      handleGameEnd('draw', "Stalemate! It's a draw.");
    } else {
      if (isOpponentInCheck) finalMoveNotation += '+'; // Check
      setCurrentPlayer(opponentColor);
      setGameStatusMessage(`${isOpponentInCheck ? "Check! " : ""}${playerNames[opponentColor]}'s turn.`);
    }
    setMoveHistory(prev => [...prev, finalMoveNotation]);
    setSelectedPiece(null);
    setPossibleMoves([]);
  }, [board, castlingRights, currentPlayer, enPassantTarget, getAllLegalMovesForPlayer, getPieceAt, handleGameEnd, isSquareAttacked, kingPositions, playerNames]);

  const makeAIMove = useCallback(() => {
    const aiColor = humanPlayerColor === 'w' ? 'b' : 'w';
    if(currentPlayer !== aiColor || gameState !== 'playing' || gameMode !== 'ai') return;
    
    const allMoves = getAllLegalMovesForPlayer(board, aiColor, kingPositions);
    if(allMoves.length === 0) return;

    // 1. Prioritize checkmating moves
    for(const move of allMoves) {
        const tempBoard = board.map(r => [...r]);
        const piece = tempBoard[move.from.row][move.from.col];
        tempBoard[move.to.row][move.to.col] = piece;
        tempBoard[move.from.row][move.from.col] = null;
        
        const tempKingPositions = {...kingPositions};
        if(piece?.type === 'K') tempKingPositions[aiColor] = move.to;

        const opponentColor = aiColor === 'w' ? 'b' : 'w';
        if(getAllLegalMovesForPlayer(tempBoard, opponentColor, tempKingPositions).length === 0 && isSquareAttacked(tempBoard, kingPositions[opponentColor].row, kingPositions[opponentColor].col, aiColor)) {
            performMove(move.from, move.to);
            return;
        }
    }

    // 2. Prioritize captures
    const captureMoves = allMoves.filter(move => getPieceAt(board, move.to.row, move.to.col) !== null);
    if(captureMoves.length > 0) {
        const randomCapture = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        performMove(randomCapture.from, randomCapture.to);
        return;
    }

    // 3. Simple random move
    const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    performMove(randomMove.from, randomMove.to);

  }, [board, currentPlayer, gameState, getAllLegalMovesForPlayer, kingPositions, getPieceAt, isSquareAttacked, performMove, gameMode, humanPlayerColor]);

  useEffect(() => {
    if(gameMode === 'ai' && currentPlayer !== humanPlayerColor && gameState === 'playing' && winner === null) {
      const aiMoveTimeout = setTimeout(makeAIMove, 1000);
      return () => clearTimeout(aiMoveTimeout);
    }
  }, [gameMode, currentPlayer, gameState, winner, makeAIMove, humanPlayerColor]);
  
  const handleSquareClick = (row: number, col: number) => {
    if (promotionSquare || gameState !== 'playing' || winner) return;
    if (gameMode === 'ai' && currentPlayer !== humanPlayerColor) return;

    const clickedSquarePiece = getPieceAt(board, row, col);

    if (selectedPiece) {
      const isMovePossible = possibleMoves.some(m => m.row === row && m.col === col);
      if (isMovePossible) {
        performMove(selectedPiece, {row, col});
      } else {
        if (clickedSquarePiece && clickedSquarePiece.color === currentPlayer) {
          setSelectedPiece({ row, col });
          setPossibleMoves(calculateLegalMoves(board, clickedSquarePiece, row, col, kingPositions));
        } else {
          setSelectedPiece(null);
          setPossibleMoves([]);
        }
      }
    } else {
      if (clickedSquarePiece && clickedSquarePiece.color === currentPlayer) {
        setSelectedPiece({ row, col });
        setPossibleMoves(calculateLegalMoves(board, clickedSquarePiece, row, col, kingPositions));
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
        handleGameEnd(currentPlayer, `Checkmate! ${playerNames[currentPlayer]} wins!`);
    } else if (!isOpponentInCheck && !opponentHasLegalMoves) {
        handleGameEnd('draw', "Stalemate! It's a draw.");
    } else {
        setCurrentPlayer(opponentColor);
        setGameStatusMessage(`${isOpponentInCheck ? "Check! " : ""}${playerNames[opponentColor]}'s turn.`);
    }

    setPromotionSquare(null);
    setSelectedPiece(null); 
    setPossibleMoves([]);
  };

  const resetGame = (newMode?: GameMode) => {
    const modeToUse = newMode || gameMode;
    if (gameState === 'playing' && gameMode === 'ai') {
        updateGameStats({ gameId: 'chess', didWin: false });
    }
    const newInitialSetup = initialBoardSetup();
    setBoard(newInitialSetup.board);
    setKingPositions(newInitialSetup.kings);
    setSelectedPiece(null);
    setCurrentPlayer('w');
    setPossibleMoves([]);
    setWinner(null);
    setKingUnderAttack(null);
    setPromotionSquare(null);
    setCastlingRights({ w: { K: true, Q: true }, b: { K: true, Q: true }});
    setEnPassantTarget(null);
    setMoveHistory([]);
    setCapturedPieces({ w: [], b: [] });
    setPlayerTimers({ w: 600, b: 600 });
    setLastReward(null);
    
    if (modeToUse === 'ai') {
        setGameState('aiConfig');
    } else if (modeToUse === 'pvp') {
        setIsSetupDialogOpen(true);
    } else if(modeToUse){
        setGameMode(modeToUse);
        setGameState('playing');
        setGameStatusMessage(`${playerNames.w}'s turn to move.`);
    }
    exitFullscreen();
  };
  
  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push(moveHistory.slice(i, i + 2));
  }
  
  const startGame = (mode: GameMode, names: { w: string, b: string }, startingPlayer: PlayerColor, difficulty?: AIDifficulty) => {
    const newInitialSetup = initialBoardSetup();
    setBoard(newInitialSetup.board);
    setKingPositions(newInitialSetup.kings);
    setSelectedPiece(null);
    setPossibleMoves([]);
    setWinner(null);
    setKingUnderAttack(null);
    setPromotionSquare(null);
    setCastlingRights({ w: { K: true, Q: true }, b: { K: true, Q: true }});
    setEnPassantTarget(null);
    setMoveHistory([]);
    setCapturedPieces({ w: [], b: [] });
    setPlayerTimers({ w: 600, b: 600 });
    setLastReward(null);
    
    setPlayerNames(names);
    setGameMode(mode);
    setCurrentPlayer(startingPlayer);
    setGameStatusMessage(`${names[startingPlayer]}'s turn to move.`);

    if(mode === 'ai' && difficulty) {
        setHumanPlayerColor(Object.keys(names).find(k => names[k as PlayerColor] !== 'Shravya AI') as PlayerColor);
        setAiDifficulty(difficulty);
    }
    setGameState('playing');
    enterFullscreen();
  }

  if (gameState === 'setup' || gameState === 'aiConfig') {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            { gameState === 'setup' && (
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
                            <SetupDialogPVP onStart={(names) => {
                               startGame('pvp', names, 'w');
                            }} />
                        </Dialog>
                         <Button className="w-full text-lg py-6" onClick={() => setGameState('aiConfig')}>
                            <Cpu className="mr-2"/> Player vs AI
                        </Button>
                    </CardContent>
                     <CardFooter>
                        <Button asChild variant="ghost" className="w-full">
                            <Link href="/dashboard"><ArrowLeft className="mr-2"/> Back to Homepage</Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}
             { gameState === 'aiConfig' && <SetupDialogAI onStart={startGame} onBack={() => setGameState('setup')} />}
        </div>
    );
  }

  return (
    <div ref={gameContainerRef} className={cn("flex flex-col lg:flex-row gap-4 lg:gap-8 items-start justify-center p-2 md:p-4 transition-all duration-300", isFullscreen && "bg-background")}>
      <AlertDialog open={gameState === 'gameOver'}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                {winner === 'draw' ? <Gamepad2 size={28} /> : <Award size={28} />} {gameStatusMessage}
            </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="py-4 text-center">
                 {gameMode === 'ai' ? (
                    (isCalculatingReward) ? (
                        <div className="flex flex-col items-center justify-center gap-2 pt-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
                        </div>
                    ) : (lastReward) ? (
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
                    ) : <p className="text-lg">Well played!</p>
                ) : <p className="text-lg">Well played!</p>}
            </div>
            <AlertDialogFooter>
             <Button onClick={() => resetGame()} disabled={isCalculatingReward}>Play Again</Button>
             <Button onClick={() => { setGameState('setup'); exitFullscreen(); }} variant="outline" disabled={isCalculatingReward}>Back to Menu</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full lg:max-w-2xl flex-shrink-0">
        <Card className={cn("shadow-xl bg-card/80 backdrop-blur-sm", isFullscreen && "bg-transparent shadow-none border-none")}>
          <PlayerInfoPanel name={playerNames.b} timer={playerTimers.b} capturedPieces={capturedPieces.w} isCurrentTurn={currentPlayer === 'b' && gameState === 'playing'} />
          <CardContent className={cn("p-1 sm:p-2", isFullscreen && "p-0")}>
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
                    <ChessSquare key={`${rowIndex}-${colIndex}`} piece={piece} isLight={isLight} onClick={() => handleSquareClick(rowIndex, colIndex)} isSelected={isSel} isPossibleMove={isPossMove} isInCheck={isKingSquareInCheck} isDisabled={!!promotionSquare || gameState !== 'playing' || (gameMode === 'ai' && currentPlayer !== humanPlayerColor)} />
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
                 <Button onClick={() => resetGame()} className="w-full bg-accent text-accent-foreground rounded-md shadow-md hover:bg-accent/90 transition-colors text-lg">
                    Reset Game
                </Button>
            </CardContent>
        </Card>

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
function SetupDialogPVP({ onStart }: { onStart: (names: { w: string; b: string }) => void; }) {
  const { toast } = useToast();
  const [p1Name, setP1Name] = useState('Player 1 (White)');
  const [p2Name, setP2Name] = useState('Player 2 (Black)');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Name.trim() || !p2Name.trim()) {
      toast({variant: 'destructive', title: "Player names cannot be empty."});
      return;
    }
    onStart({ w: p1Name, b: p2Name });
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

// Setup Dialog for Player vs AI
function SetupDialogAI({ onStart, onBack }: { onStart: (mode: 'ai', names: { w: string; b: string }, startingPlayer: PlayerColor, difficulty: AIDifficulty) => void, onBack: () => void }) {
    const { toast } = useToast();
    const [playerName, setPlayerName] = useState('Player');
    const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
    const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
    const [isTossing, setIsTossing] = useState(false);
    
    const handleTossAndStart = () => {
        setIsTossing(true);
        const result = Math.random() < 0.5 ? 'You win the toss!' : 'Shravya AI wins the toss!';
        const startingPlayer = result.startsWith('You') ? playerColor : (playerColor === 'w' ? 'b' : 'w');
        const names = playerColor === 'w' ? { w: playerName, b: 'Shravya AI' } : { w: 'Shravya AI', b: playerName };

        toast({
            title: "Toss Complete!",
            description: `${result} You will play as ${playerColor === 'w' ? 'White' : 'Black'}. The game is starting!`,
        });

        setTimeout(() => {
            onStart('ai', names, startingPlayer, difficulty);
        }, 1200); 
    };

    return (
        <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Cpu className="text-primary" /> Setup vs Shravya AI
                </CardTitle>
                <CardDescription>Configure your match against the AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="playerName">Your Name</Label>
                    <Input id="playerName" value={playerName} onChange={(e) => setPlayerName(e.target.value)} disabled={isTossing}/>
                </div>
                <div className="space-y-2">
                    <Label>Choose Your Pieces</Label>
                    <RadioGroup value={playerColor} onValueChange={(v) => setPlayerColor(v as PlayerColor)} className="grid grid-cols-2 gap-4">
                        <Label className={cn("flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent", playerColor === 'w' && 'bg-accent border-primary')}>
                            <RadioGroupItem value="w" id="color-w" disabled={isTossing} />
                            <UserIcon /><span>White</span>
                        </Label>
                        <Label className={cn("flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent", playerColor === 'b' && 'bg-accent border-primary')}>
                            <RadioGroupItem value="b" id="color-b" disabled={isTossing} />
                            <UserIcon className="text-neutral-800" /><span>Black</span>
                        </Label>
                    </RadioGroup>
                </div>
                 <div className="space-y-2">
                    <Label>AI Difficulty</Label>
                    <RadioGroup value={difficulty} onValueChange={(v) => setDifficulty(v as AIDifficulty)} className="grid grid-cols-3 gap-2">
                        <Label className={cn("p-2 text-center rounded-md border cursor-pointer hover:bg-accent", difficulty === 'easy' && 'bg-accent border-primary')}>
                            <RadioGroupItem value="easy" id="diff-easy" className="sr-only" disabled={isTossing}/>Easy</Label>
                        <Label className={cn("p-2 text-center rounded-md border cursor-pointer hover:bg-accent", difficulty === 'medium' && 'bg-accent border-primary')}>
                           <RadioGroupItem value="medium" id="diff-medium" className="sr-only" disabled={isTossing}/>Medium</Label>
                        <Label className={cn("p-2 text-center rounded-md border cursor-pointer hover:bg-accent", difficulty === 'hard' && 'bg-accent border-primary')}>
                           <RadioGroupItem value="hard" id="diff-hard" className="sr-only" disabled={isTossing}/>Hard</Label>
                    </RadioGroup>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={onBack} disabled={isTossing}><ArrowLeft className="mr-2"/>Back</Button>
                <Button onClick={handleTossAndStart} disabled={isTossing}>
                    {isTossing ? <Loader2 className="mr-2 animate-spin"/> : <Coins className="mr-2"/>}
                    {isTossing ? 'Tossing...' : 'Toss to Start'}
                </Button>
            </CardFooter>
        </Card>
    );
}

    
