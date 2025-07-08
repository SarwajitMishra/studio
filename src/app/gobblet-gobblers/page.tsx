
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCw, Award, Users, Cpu, ArrowLeft, Star as StarIcon, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { useToast } from '@/hooks/use-toast';

type PlayerId = 'P1' | 'P2';
type PieceSize = 1 | 2 | 3;
type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';
type GameMode = 'player' | 'ai' | null;
type GameState = 'setupMode' | 'setupPlayers' | 'playing' | 'gameOver';

interface Piece {
  id: string;
  size: PieceSize;
  player: PlayerId;
}

interface BoardCell {
  stack: Piece[];
}

type BoardState = BoardCell[][];

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];
const COLOR_CLASSES: Record<PlayerColor, string> = {
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
};

const createInitialBoard = (): BoardState => Array(3).fill(null).map(() => Array(3).fill(null).map(() => ({ stack: [] })));

const createInitialPlayerPieces = (): Record<PlayerId, Piece[]> => {
  const createPieces = (player: PlayerId): Piece[] => [
    { id: `${player}-L1`, player, size: 3 }, { id: `${player}-L2`, player, size: 3 },
    { id: `${player}-M1`, player, size: 2 }, { id: `${player}-M2`, player, size: 2 },
    { id: `${player}-S1`, player, size: 1 }, { id: `${player}-S2`, player, size: 1 },
  ];
  return { P1: createPieces('P1'), P2: createPieces('P2') };
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
    if (p1 && p1 === p2 && p1 === p3) return p1;
  }
  return null;
};

// --- New Gobbler Piece SVGs ---
const SmallGobblerSvg = () => ( <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.5" fill="white"/><circle cx="15" cy="10" r="1.5" fill="white"/></svg> );
const MediumGobblerSvg = () => ( <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3.5 8c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm7 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-3.5 5.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/></svg> );
const LargeGobblerSvg = () => ( <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm4 0h-2v-2h2v2zm-4-4H9V8h2v4zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-4-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" /></svg> );

const GobblerPiece = ({ piece, colorClass, isSelected }: { piece: Piece; colorClass: string; isSelected: boolean }) => {
  const sizeClasses = { 1: 'w-8 h-8', 2: 'w-12 h-12', 3: 'w-16 h-16' };
  const SvgComponent = { 1: SmallGobblerSvg, 2: MediumGobblerSvg, 3: LargeGobblerSvg }[piece.size];

  return (
    <div className={cn("transition-all", sizeClasses[piece.size], colorClass, isSelected ? "ring-4 ring-yellow-400 rounded-full" : "")}>
      <SvgComponent />
    </div>
  );
};

const BoardSquare = ({ cell, colorP1, colorP2, onSelect, canDrop }: { cell: BoardCell; colorP1: PlayerColor, colorP2: PlayerColor, onSelect: () => void; canDrop: boolean }) => {
  const topPiece = cell.stack.length > 0 ? cell.stack[cell.stack.length - 1] : null;

  return (
    <button onClick={onSelect} className={cn("w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center border-2 rounded-lg transition-colors duration-200 bg-card hover:bg-muted/50 border-border", canDrop && "bg-green-500/30")}>
      {topPiece && <GobblerPiece piece={topPiece} colorClass={topPiece.player === 'P1' ? COLOR_CLASSES[colorP1] : COLOR_CLASSES[colorP2]} isSelected={false} />}
    </button>
  );
};


export default function GobbletGobblersPage() {
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameState, setGameState] = useState<GameState>('setupMode');
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [playerPieces, setPlayerPieces] = useState(createInitialPlayerPieces());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerId>('P1');
  const [selectedPiece, setSelectedPiece] = useState<{ piece: Piece, from?: {r: number, c: number} } | null>(null);
  const [winner, setWinner] = useState<PlayerId | null>(null);

  const [playerConfig, setPlayerConfig] = useState({
    P1: { name: 'Player 1', color: 'blue' as PlayerColor },
    P2: { name: 'Player 2', color: 'red' as PlayerColor },
  });

  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);
  const { toast } = useToast();
  
  const StarRating = ({ rating }: { rating: number }) => ( <div className="flex justify-center">{[...Array(3)].map((_, i) => (<StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />))}</div> );
  
  const handleWin = useCallback(async (winnerId: PlayerId) => {
    setWinner(winnerId);
    if (gameMode === 'ai') {
      setIsCalculatingReward(true);
      const isHumanWin = winnerId === 'P1';
      updateGameStats({ gameId: 'gobblet-gobblers', didWin: isHumanWin });

      try {
        const rewards = await calculateRewards({ gameId: 'gobblet-gobblers', difficulty: 'easy', performanceMetrics: { winner: winnerId }});
        if (isHumanWin) {
          const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Won Gobblet Gobblers vs AI`);
          setLastReward({ points: earned.points, coins: earned.coins, stars: 3 });
        }
      } catch (error) { console.error("Error calculating rewards:", error); toast({ variant: 'destructive', title: 'Reward Error' }); } finally { setIsCalculatingReward(false); }
    }
  }, [gameMode, toast]);
  
  const getStatusMessage = () => {
    if (winner) return `${playerConfig[winner].name} wins!`;
    return `${playerConfig[currentPlayer].name}'s Turn`;
  };

  const startGame = useCallback((newConfig: typeof playerConfig) => {
    setPlayerConfig(newConfig);
    setBoard(createInitialBoard());
    setPlayerPieces(createInitialPlayerPieces());
    setCurrentPlayer('P1');
    setSelectedPiece(null);
    setWinner(null);
    setLastReward(null);
    setGameState('playing');
  }, []);

  const makeAIMove = useCallback(() => {
    if (winner) return;

    // AI Logic (simplified)
    // 1. Check for winning move
    // 2. Block player's winning move
    // 3. Take center
    // 4. Move a new piece out if possible
    // 5. Random valid move
    
    // For now, a simplified random valid move
    const validMoves: {piece: Piece, from?: {r:number, c:number}, to?: {r:number, c:number}}[] = [];

    // Moves from off-board
    playerPieces.P2.forEach(p => {
        for(let r=0; r<3; r++){
            for(let c=0; c<3; c++){
                const targetCell = board[r][c];
                const topPiece = targetCell.stack.length > 0 ? targetCell.stack[targetCell.stack.length-1] : null;
                if(!topPiece || p.size > topPiece.size) {
                    validMoves.push({piece: p, to: {r,c}});
                }
            }
        }
    });

    // Moves from on-board
    for (let rFrom = 0; rFrom < 3; rFrom++) {
        for (let cFrom = 0; cFrom < 3; cFrom++) {
            const topPiece = board[rFrom][cFrom].stack.length > 0 ? board[rFrom][cFrom].stack[board[rFrom][cFrom].stack.length - 1] : null;
            if (topPiece && topPiece.player === 'P2') {
                for (let rTo = 0; rTo < 3; rTo++) {
                    for (let cTo = 0; cTo < 3; cTo++) {
                        const targetCell = board[rTo][cTo];
                        const targetTopPiece = targetCell.stack.length > 0 ? targetCell.stack[targetCell.stack.length - 1] : null;
                        if (!targetTopPiece || topPiece.size > targetTopPiece.size) {
                            validMoves.push({ piece: topPiece, from: { r: rFrom, c: cFrom }, to: { r: rTo, c: cTo } });
                        }
                    }
                }
            }
        }
    }
    
    if (validMoves.length > 0) {
      const move = validMoves[Math.floor(Math.random() * validMoves.length)];
      handleSelectPiece(move.piece, move.from);
      setTimeout(() => {
        if(move.to) handleBoardClick(move.to.r, move.to.c);
      }, 500);
    }
  }, [playerPieces, board, winner]);

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'P2' && !winner) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, winner, makeAIMove]);

  const handleSelectPiece = (piece: Piece, from?: {r: number, c: number}) => {
    if (winner || piece.player !== currentPlayer || (gameMode === 'ai' && currentPlayer === 'P2')) return;
    setSelectedPiece({ piece, from });
  };
  
  const handleBoardClick = (r: number, c: number) => {
    if (!selectedPiece || winner) {
      const topPiece = board[r][c].stack[board[r][c].stack.length - 1];
      if (topPiece) handleSelectPiece(topPiece, {r, c});
      return;
    }

    const { piece, from } = selectedPiece;
    const targetCell = board[r][c];
    const topPieceOnTarget = targetCell.stack[targetCell.stack.length - 1];

    if (topPieceOnTarget && piece.size <= topPieceOnTarget.size) return;

    const newBoard = board.map(row => row.map(cell => ({ stack: [...cell.stack] })));
    newBoard[r][c].stack.push(piece);
    
    if (from) newBoard[from.r][from.c].stack.pop();
    else setPlayerPieces(prev => ({ ...prev, [piece.player]: prev[piece.player].filter(p => p.id !== piece.id) }));
    
    setBoard(newBoard);
    const newWinner = checkWin(newBoard);
    if (newWinner) handleWin(newWinner);
    else setCurrentPlayer(currentPlayer === 'P1' ? 'P2' : 'P1');
    setSelectedPiece(null);
  };
  
  if (gameState === 'setupMode') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md text-center shadow-xl">
              <CardHeader><CardTitle className="text-3xl font-bold">Gobblet Gobblers</CardTitle><CardDescription>Select a game mode to start.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                  <Button onClick={() => { setGameMode('player'); setGameState('setupPlayers'); }} className="w-full text-lg"><Users className="mr-2"/> Player vs Player</Button>
                  <Button onClick={() => { setGameMode('ai'); startGame({ P1: { name: 'You', color: 'blue' }, P2: { name: 'Shravya AI', color: 'red' } }); }} className="w-full text-lg"><Cpu className="mr-2"/> Player vs AI</Button>
              </CardContent>
          </Card>
      </div>
    );
  }

  if (gameState === 'setupPlayers') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-lg text-center shadow-xl">
              <CardHeader><CardTitle className="text-2xl font-bold">Player Setup</CardTitle><CardDescription>Customize player names and colors.</CardDescription></CardHeader>
              <CardContent className="space-y-6 p-6">
                {(['P1', 'P2'] as PlayerId[]).map(pId => (
                  <div key={pId} className="space-y-2 p-4 border rounded-lg">
                    <Label htmlFor={`${pId}-name`} className="text-lg font-semibold">{pId === 'P1' ? 'Player 1' : 'Player 2'}</Label>
                    <Input id={`${pId}-name`} value={playerConfig[pId].name} onChange={e => setPlayerConfig(prev => ({...prev, [pId]: {...prev[pId], name: e.target.value}}))} />
                    <div className="flex justify-center gap-2 pt-2">
                        {PLAYER_COLORS.map(color => (
                          <button key={color} onClick={() => setPlayerConfig(prev => ({...prev, [pId]: {...prev[pId], color}}))} disabled={color === playerConfig[pId === 'P1' ? 'P2' : 'P1'].color} className={cn("w-8 h-8 rounded-full border-2", `bg-${color}-500`, playerConfig[pId].color === color && 'ring-4 ring-offset-2 ring-primary', `disabled:opacity-25`)} />
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button onClick={() => startGame(playerConfig)} className="w-full text-lg">Start Game</Button>
                <Button onClick={() => setGameState('setupMode')} variant="ghost" className="w-full"><ArrowLeft className="mr-2" /> Back to Mode Select</Button>
              </CardFooter>
          </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <AlertDialog open={!!winner}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-primary flex items-center justify-center gap-2"><Award size={28} /> Game Over!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg">{getStatusMessage()}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 text-center">
            {gameMode === 'ai' && winner === 'P1' ? (
              isCalculatingReward ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              ) : lastReward ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <StarRating rating={lastReward.stars} />
                  <p className="font-semibold text-lg mt-2">You beat the AI!</p>
                  <div className="flex items-center gap-6 mt-2">
                    <span className="flex items-center font-bold text-xl">+{lastReward.points} <SPointsIcon className="ml-2 h-6 w-6 text-yellow-400" /></span>
                    <span className="flex items-center font-bold text-xl">+{lastReward.coins} <SCoinsIcon className="ml-2 h-6 w-6 text-amber-500" /></span>
                  </div>
                </div>
              ) : null
            ) : gameMode === 'ai' && winner === 'P2' ? (
                 <p className="font-semibold text-lg text-destructive">Shravya AI wins this time. Better luck next time!</p>
            ) : null }
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => startGame(playerConfig)}>Play Again</AlertDialogAction>
            <AlertDialogCancel onClick={() => setGameState('setupMode')}>Change Mode</AlertDialogCancel>
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
              <BoardSquare key={`${r_idx}-${c_idx}`} cell={cell} colorP1={playerConfig.P1.color} colorP2={playerConfig.P2.color} onSelect={() => handleBoardClick(r_idx, c_idx)} canDrop={!!selectedPiece && (cell.stack.length === 0 || selectedPiece.piece.size > cell.stack[cell.stack.length - 1].size)} />
            )))}
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-xl grid grid-cols-2 gap-4">
        {(['P1', 'P2'] as PlayerId[]).map(pId => (
            <Card key={pId} className={cn("p-4", currentPlayer === pId && !winner && "border-yellow-400 border-2")}>
                <CardTitle className="text-lg mb-4 text-center">{playerConfig[pId].name}</CardTitle>
                <div className="flex justify-center items-end gap-2 flex-wrap min-h-[70px]">
                    {playerPieces[pId].sort((a,b) => a.size - b.size).map(p => (
                        <button key={p.id} onClick={() => handleSelectPiece(p)} className={cn("rounded-full transition-all", selectedPiece?.piece.id !== p.id && "hover:ring-2 ring-primary/50")} disabled={!!winner || p.player !== currentPlayer}>
                            <GobblerPiece piece={p} colorClass={COLOR_CLASSES[playerConfig[pId].color]} isSelected={selectedPiece?.piece.id === p.id}/>
                        </button>
                    ))}
                </div>
            </Card>
        ))}
      </div>
      
      <div className="w-full max-w-xl flex gap-4 mt-4">
        <Button onClick={() => startGame(playerConfig)} className="w-full"><RotateCw className="mr-2"/> Reset Game</Button>
        <Button onClick={() => setGameState('setupMode')} variant="outline" className="w-full"><ArrowLeft className="mr-2"/> Change Mode</Button>
      </div>
    </div>
  );
}
