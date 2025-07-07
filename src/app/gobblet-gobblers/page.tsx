
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, Award, Users, Cpu, ArrowLeft, ArrowRight, Circle, Brain, Loader2, Star as StarIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { useToast } from '@/hooks/use-toast';

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
type GameState = 'setup' | 'howToPlay' | 'playing';

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

const HowToPlayGobblet = ({ onStartGame }: { onStartGame: () => void }) => {
    const [step, setStep] = useState(0);

    const steps = [
        { text: "1. Place your pieces on the board. Get three in a row to win!" },
        { text: "2. Larger pieces can 'gobble' and cover smaller pieces." },
        { text: "3. You can move your pieces that are already on the board." },
    ];
    
    useEffect(() => {
        const timer = setInterval(() => {
            setStep(prev => (prev + 1) % steps.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [steps.length]);

    const currentStep = steps[step];

    return (
        <Card className="w-full max-w-md text-center shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">How to Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-1 bg-muted p-2 rounded-lg">
                        {Array(9).fill(0).map((_, i) => (
                           <div key={i} className="w-20 h-20 bg-card border rounded-md flex items-center justify-center">
                               {step === 1 && i === 4 && <GobblerPiece piece={{id: 'p2-m', player: 'P2', size: 2}} isSelected={false} />}
                               {step === 1 && i === 5 && <GobblerPiece piece={{id: 'p1-s', player: 'P1', size: 1}} isSelected={false} />}
                               {step === 2 && i === 5 && <GobblerPiece piece={{id: 'p2-l', player: 'P2', size: 3}} isSelected={false} />}
                               {step === 3 && i === 8 && <GobblerPiece piece={{id: 'p1-m', player: 'P1', size: 2}} isSelected={false} />}
                           </div>
                        ))}
                    </div>
                </div>
                <p className="min-h-[40px] font-medium text-foreground/90">{currentStep.text}</p>
                <Button onClick={onStartGame} className="w-full text-lg bg-accent text-accent-foreground">
                    Start Game! <ArrowRight className="ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
};

export default function GobbletGobblersPage() {
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [playerPieces, setPlayerPieces] = useState(createInitialPlayerPieces());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerId>('P1');
  const [selectedPiece, setSelectedPiece] = useState<{ piece: Piece, from?: {r: number, c: number} } | null>(null);
  const [winner, setWinner] = useState<PlayerId | 'draw' | null>(null);

  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);
  const { toast } = useToast();

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const handleWin = useCallback(async (winnerId: PlayerId) => {
    setWinner(winnerId);
    setIsCalculatingReward(true);
    updateGameStats({ gameId: 'gobblet-gobblers', didWin: true });

    try {
        const rewards = await calculateRewards({
            gameId: 'gobblet-gobblers',
            difficulty: 'easy',
            performanceMetrics: { winner: winnerId },
        });
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Won Gobblet Gobblers`);
        const stars = 3; // Always 3 stars for a win in this game
        setLastReward({ points: earned.points, coins: earned.coins, stars });
        
        toast({
            title: `Player ${winnerId === 'P1' ? '1' : '2'} Wins! 🏆`,
            description: (
                <div className="flex flex-col gap-1">
                    <span className="flex items-center font-bold">You earned: {earned.points} S-Points and {earned.coins} S-Coins!</span>
                </div>
            ),
            className: "bg-green-600 border-green-700 text-white",
            duration: 5000,
        });
    } catch (error) {
         console.error("Error calculating rewards:", error);
         toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
    } finally {
        setIsCalculatingReward(false);
    }
  }, [toast]);


  const getStatusMessage = () => {
    if (winner) return winner === 'draw' ? "It's a draw!" : `Player ${winner === 'P1' ? '1 (Blue)' : '2 (Red)'} wins!`;
    return `Player ${currentPlayer === 'P1' ? '1 (Blue)' : '2 (Red)'}'s Turn`;
  };

  const resetGame = useCallback(() => {
    updateGameStats({ gameId: 'gobblet-gobblers', didWin: false });
    setBoard(createInitialBoard());
    setPlayerPieces(createInitialPlayerPieces());
    setCurrentPlayer('P1');
    setSelectedPiece(null);
    setWinner(null);
    setLastReward(null);
  }, []);

  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('howToPlay');
  };

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  const handleSelectPiece = (piece: Piece, from?: {r: number, c: number}) => {
    if (winner || piece.player !== currentPlayer) return;
    setSelectedPiece({ piece, from });
  };

  const handleBoardClick = (r: number, c: number) => {
    if (!selectedPiece || winner) {
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
      return;
    }

    const newBoard = board.map(row => row.map(cell => ({ stack: [...cell.stack] })));

    newBoard[r][c].stack.push(piece);
    
    if (from) {
      newBoard[from.r][from.c].stack.pop();
    } else {
      const newPlayerPieces = { ...playerPieces };
      newPlayerPieces[piece.player] = newPlayerPieces[piece.player].filter(p => p.id !== piece.id);
      setPlayerPieces(newPlayerPieces);
    }
    
    setBoard(newBoard);
    
    const newWinner = checkWin(newBoard);
    if (newWinner) {
        handleWin(newWinner);
    } else {
        setCurrentPlayer(currentPlayer === 'P1' ? 'P2' : 'P1');
    }

    setSelectedPiece(null);
  };
  
  if (gameState === 'setup') {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Gobblet Gobblers</CardTitle>
                    <CardDescription>Select a game mode to start.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => handleModeSelect('player')} className="w-full text-lg"><Users className="mr-2"/> Player vs Player</Button>
                    <Button onClick={() => handleModeSelect('ai')} className="w-full text-lg" disabled><Cpu className="mr-2"/> Player vs AI (Soon)</Button>
                </CardContent>
            </Card>
        </div>
      )
  }

  if (gameState === 'howToPlay') {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
           <HowToPlayGobblet onStartGame={startGame} />
        </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
       <AlertDialog open={!!winner}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
                   <Award size={28} /> {winner ? `Player ${winner === 'P1' ? '1' : '2'} Wins!` : "Game Over"}
                </AlertDialogTitle>
                </AlertDialogHeader>
                 <div className="py-4 text-center">
                    {isCalculatingReward ? (
                        <div className="flex flex-col items-center justify-center gap-2 pt-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
                        </div>
                    ) : lastReward ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <StarRating rating={lastReward.stars} />
                            <AlertDialogDescription className="text-center text-base pt-2">
                                Congratulations! You won the game.
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
                    ) : null}
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={startGame} disabled={isCalculatingReward}>Play Again</AlertDialogAction>
                    <AlertDialogCancel onClick={() => setGameState('setup')} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

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
        <Button onClick={startGame} className="w-full"><RotateCw className="mr-2"/> Reset Game</Button>
        <Button onClick={() => setGameState('setup')} variant="outline" className="w-full"><ArrowLeft className="mr-2"/> Change Mode</Button>
      </div>
    </div>
  );
}
