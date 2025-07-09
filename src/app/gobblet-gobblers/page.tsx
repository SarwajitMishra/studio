
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RotateCw, Award, Users, Cpu, ArrowLeft, Star as StarIcon, Edit, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { useToast } from '@/hooks/use-toast';

type PlayerId = 'P1' | 'P2';
type GameState = 'setup' | 'playing' | 'gameOver';
type GameMode = 'player' | 'ai' | null;
type Difficulty = 'easy' | 'medium' | 'hard';
type LineType = 'horizontal' | 'vertical';

interface Line {
  row: number;
  col: number;
  type: LineType;
  owner: PlayerId | null;
}

interface Box {
  row: number;
  col: number;
  owner: PlayerId | null;
}

const getInitialBoard = (size: number): { lines: Line[], boxes: Box[] } => {
  const horizontalLines: Line[] = [];
  for (let r = 0; r <= size; r++) {
    for (let c = 0; c < size; c++) {
      horizontalLines.push({ row: r, col: c, type: 'horizontal', owner: null });
    }
  }
  const verticalLines: Line[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size; c++) {
      verticalLines.push({ row: r, col: c, type: 'vertical', owner: null });
    }
  }
  const boxes: Box[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      boxes.push({ row: r, col: c, owner: null });
    }
  }
  return { lines: [...horizontalLines, ...verticalLines], boxes };
};

const DIFFICULTY_CONFIG: Record<Difficulty, { boardSize: number; label: string; }> = {
  easy: { boardSize: 2, label: "Easy (3x3 Dots)" },
  medium: { boardSize: 3, label: "Medium (4x4 Dots)" },
  hard: { boardSize: 4, label: "Hard (5x5 Dots)" },
};

export default function DotsAndBoxesPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [boardSize, setBoardSize] = useState(3);
  
  const [lines, setLines] = useState<Line[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [scores, setScores] = useState({ P1: 0, P2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<PlayerId>('P1');
  const [hasExtraTurn, setHasExtraTurn] = useState(false);
  const [winner, setWinner] = useState<PlayerId | 'draw' | null>(null);

  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{ points: number; coins: number; stars: number } | null>(null);
  const { toast } = useToast();

  const startGame = useCallback((mode: GameMode, diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    const { lines: newLines, boxes: newBoxes } = getInitialBoard(config.boardSize);
    setBoardSize(config.boardSize);
    setLines(newLines);
    setBoxes(newBoxes);
    setScores({ P1: 0, P2: 0 });
    setCurrentPlayer('P1');
    setWinner(null);
    setLastReward(null);
    setGameMode(mode);
    setDifficulty(diff);
    setGameState('playing');
  }, []);

  const handleLineClick = useCallback((clickedLine: Line) => {
    if (clickedLine.owner || gameState !== 'playing') return;

    const newLines = lines.map(l => l === clickedLine ? { ...l, owner: currentPlayer } : l);
    
    let boxesCompleted = 0;
    const newBoxes = [...boxes];
    // Check for completed boxes
    for(let r=0; r<boardSize; r++){
        for(let c=0; c<boardSize; c++){
            if(newBoxes.find(b => b.row === r && b.col === c)?.owner) continue;

            const top = newLines.find(l => l.type === 'horizontal' && l.row === r && l.col === c)?.owner;
            const bottom = newLines.find(l => l.type === 'horizontal' && l.row === r+1 && l.col === c)?.owner;
            const left = newLines.find(l => l.type === 'vertical' && l.row === r && l.col === c)?.owner;
            const right = newLines.find(l => l.type === 'vertical' && l.row === r && l.col === c+1)?.owner;

            if(top && bottom && left && right){
                const boxIndex = newBoxes.findIndex(b => b.row === r && b.col === c);
                newBoxes[boxIndex] = { ...newBoxes[boxIndex], owner: currentPlayer };
                boxesCompleted++;
            }
        }
    }
    
    setLines(newLines);
    setBoxes(newBoxes);

    if (boxesCompleted > 0) {
      setScores(s => ({ ...s, [currentPlayer]: s[currentPlayer] + boxesCompleted }));
      setHasExtraTurn(true);
    } else {
      setHasExtraTurn(false);
      setCurrentPlayer(p => (p === 'P1' ? 'P2' : 'P1'));
    }
  }, [gameState, lines, boxes, currentPlayer, boardSize]);
  
  // Pure function for AI to check potential moves
  const checkBoxCompletion = (currentLines: Line[], currentBoxes: Box[], testLine: Line, player: PlayerId, size: number) => {
      const tempLines = currentLines.map(l => l === testLine ? {...l, owner: player} : l);
      let boxesCompleted = 0;
      for(let r=0; r<size; r++){
          for(let c=0; c<size; c++){
              if(currentBoxes.find(b => b.row === r && b.col === c)?.owner) continue;

              const top = tempLines.find(l => l.type === 'horizontal' && l.row === r && l.col === c)?.owner;
              const bottom = tempLines.find(l => l.type === 'horizontal' && l.row === r+1 && l.col === c)?.owner;
              const left = tempLines.find(l => l.type === 'vertical' && l.row === r && l.col === c)?.owner;
              const right = tempLines.find(l => l.type === 'vertical' && l.row === r && l.col === c+1)?.owner;

              if(top && bottom && left && right){
                  boxesCompleted++;
              }
          }
      }
      return { boxesCompleted };
  };
  
  const makeAIMove = useCallback(() => {
    const availableLines = lines.filter(l => !l.owner);
    if(availableLines.length === 0) return;

    // AI Logic
    // 1. Find a winning move (completes a box)
    for(const line of availableLines) {
      const { boxesCompleted } = checkBoxCompletion(lines, boxes, line, 'P2', boardSize);
      if(boxesCompleted > 0){
        handleLineClick(line);
        return;
      }
    }

    // 2. Medium/Hard: Avoid giving away a box by not creating a 3-sided box.
    if(difficulty !== 'easy') {
        const getSidesForBox = (r: number, c: number, currentLines: Line[]) => {
            return [
              currentLines.find(l => l.type === 'horizontal' && l.row === r && l.col === c),
              currentLines.find(l => l.type === 'horizontal' && l.row === r + 1 && l.col === c),
              currentLines.find(l => l.type === 'vertical' && l.row === r && l.col === c),
              currentLines.find(l => l.type === 'vertical' && l.row === r && l.col === c + 1),
            ].filter(Boolean) as Line[];
        };
        const getAdjacentBoxesForLine = (line: Line) => {
            const adjacent = [];
            if (line.type === 'horizontal') {
                if (line.row < boardSize) adjacent.push({r: line.row, c: line.col});
                if (line.row > 0) adjacent.push({r: line.row - 1, c: line.col});
            } else {
                if (line.col < boardSize) adjacent.push({r: line.row, c: line.col});
                if (line.col > 0) adjacent.push({r: line.row, c: line.col - 1});
            }
            return adjacent;
        };

        const safeMoves = availableLines.filter(line => {
            const adjacentBoxes = getAdjacentBoxesForLine(line);
            for (const box of adjacentBoxes) {
                const boxLines = getSidesForBox(box.r, box.c, lines);
                const sidesTaken = boxLines.filter(l => l.owner).length;
                if (sidesTaken === 2) {
                    return false; // This move is dangerous, it creates a 3-sided box.
                }
            }
            return true;
        });

      if(safeMoves.length > 0){
         handleLineClick(safeMoves[Math.floor(Math.random() * safeMoves.length)]);
         return;
      }
    }
    
    // 3. Fallback: Easy AI or no safe moves found
    handleLineClick(availableLines[Math.floor(Math.random() * availableLines.length)]);
  }, [lines, boxes, boardSize, difficulty, handleLineClick]);


  // AI Turn Effect
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'P2' && gameState === 'playing' && !hasExtraTurn) {
        const aiMoveTimeout = setTimeout(() => {
            makeAIMove();
        }, 800);
        return () => clearTimeout(aiMoveTimeout);
    }
  }, [currentPlayer, gameState, gameMode, hasExtraTurn, makeAIMove]);

  // Check for game end
  useEffect(() => {
    if (lines.length > 0 && lines.every(l => l.owner) && gameState === 'playing') {
      let finalWinner: PlayerId | 'draw' | null = null;
      if (scores.P1 > scores.P2) finalWinner = 'P1';
      else if (scores.P2 > scores.P1) finalWinner = 'P2';
      else finalWinner = 'draw';
      setWinner(finalWinner);
      
      const didWin = gameMode === 'ai' ? finalWinner === 'P1' : true;
      updateGameStats({gameId: 'dots-and-boxes', didWin, score: scores.P1 - scores.P2 });

      setIsCalculatingReward(true);
      calculateRewards({
        gameId: 'dots-and-boxes',
        difficulty: difficulty,
        performanceMetrics: { winner: finalWinner, score: scores },
      }).then(rewards => {
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, "Dots and Boxes Game");
        const stars = finalWinner === 'draw' ? 1 : (Math.abs(scores.P1 - scores.P2) > boardSize ? 3 : 2);
        setLastReward({points: earned.points, coins: earned.coins, stars });
      }).catch(err => {
        console.error("Reward calculation failed:", err);
        toast({variant: 'destructive', title: 'Reward Error'});
      }).finally(() => {
        setIsCalculatingReward(false);
        setGameState('gameOver');
      });
    }
  }, [lines, scores, gameState, boardSize, difficulty, gameMode, toast]);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">{[...Array(3)].map((_, i) => (<StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />))}</div>
  );

  const getWinnerMessage = () => {
    if(winner === 'draw') return "It's a draw!";
    if(gameMode === 'ai') return winner === 'P1' ? 'You Win!' : 'Shravya AI Wins!';
    return `Player ${winner === 'P1' ? '1' : '2'} Wins!`;
  }

  const renderSetupScreen = () => (
      <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader><CardTitle className="text-3xl font-bold">Dots & Boxes</CardTitle><CardDescription>Select a game mode and difficulty.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <div className="flex justify-center gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                    <Button key={d} variant={difficulty === d ? 'default' : 'outline'} onClick={() => setDifficulty(d)}>{DIFFICULTY_CONFIG[d].label}</Button>
                  ))}
                </div>
              </div>
              <Button onClick={() => startGame('player', difficulty)} className="w-full text-lg"><Users className="mr-2"/> Player vs Player</Button>
              <Button onClick={() => startGame('ai', difficulty)} className="w-full text-lg"><Cpu className="mr-2"/> Player vs AI</Button>
          </CardContent>
      </Card>
  );

  const renderGameScreen = () => (
      <div className="flex flex-col items-center gap-4">
          <AlertDialog open={gameState === 'gameOver'}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl text-primary flex items-center justify-center gap-2"><Award size={28} /> Game Over!</AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-lg">{getWinnerMessage()}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 text-center">
                  {isCalculatingReward ? <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /> : lastReward && (
                    <div className="flex flex-col items-center gap-3 text-center">
                        <StarRating rating={lastReward.stars} />
                        <div className="flex items-center gap-6 mt-2">
                          <span className="flex items-center font-bold text-xl">+{lastReward.points} <SPointsIcon className="ml-2 h-6 w-6 text-yellow-400" /></span>
                          <span className="flex items-center font-bold text-xl">+{lastReward.coins} <SCoinsIcon className="ml-2 h-6 w-6 text-amber-500" /></span>
                        </div>
                    </div>
                  )}
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => startGame(gameMode!, difficulty)} disabled={isCalculatingReward}>Play Again</AlertDialogAction>
                    <AlertDialogCancel onClick={() => setGameState('setup')} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <Card className={cn("text-center p-3", currentPlayer === 'P1' && 'ring-2 ring-blue-500')}>
              <CardTitle className="text-blue-500">Player 1</CardTitle>
              <CardDescription className="text-2xl font-bold">{scores.P1}</CardDescription>
            </Card>
            <Card className={cn("text-center p-3", currentPlayer === 'P2' && 'ring-2 ring-red-500')}>
              <CardTitle className="text-red-500">{gameMode === 'ai' ? 'Shravya AI' : 'Player 2'}</CardTitle>
              <CardDescription className="text-2xl font-bold">{scores.P2}</CardDescription>
            </Card>
          </div>

          <div className="relative p-2 bg-muted rounded-lg" style={{ width: "clamp(300px, 90vw, 400px)", height: "clamp(300px, 90vw, 400px)" }}>
            <div className="grid w-full h-full" style={{gridTemplateColumns: `repeat(${boardSize}, 1fr)`, gridTemplateRows: `repeat(${boardSize}, 1fr)`}}>
               {boxes.map((box, i) => (
                    <div key={i} className={cn("w-full h-full flex items-center justify-center", box.owner === 'P1' && 'bg-blue-500/30', box.owner === 'P2' && 'bg-red-500/30')}>
                      {box.owner && <span className={cn("text-4xl font-bold", box.owner === 'P1' ? 'text-blue-600' : 'text-red-600')}>{box.owner}</span>}
                    </div>
                ))}
            </div>
            <div className="absolute inset-0 p-2 grid" style={{gridTemplateColumns: `repeat(${boardSize}, 1fr)`, gridTemplateRows: `repeat(${boardSize}, 1fr)`}}>
              {/* Dots */}
              {Array.from({length: (boardSize+1)*(boardSize+1)}).map((_, i) => {
                const row = Math.floor(i / (boardSize + 1));
                const col = i % (boardSize + 1);
                return <div key={`dot-${row}-${col}`} className="absolute w-3 h-3 bg-neutral-700 rounded-full -translate-x-1/2 -translate-y-1/2" style={{top: `${row * 100/boardSize}%`, left: `${col * 100/boardSize}%`}}></div>
              })}
              {/* Lines */}
              {lines.map((line, i) => (
                  <button key={i}
                    onClick={() => handleLineClick(line)}
                    disabled={gameState !== 'playing' || (gameMode === 'ai' && currentPlayer === 'P2')}
                    className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 z-10",
                        line.type === 'horizontal' ? 'w-[calc(100%/var(--size)-8px)] h-2' : 'w-2 h-[calc(100%/var(--size)-8px)]',
                        line.owner ? (line.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500') : 'bg-transparent hover:bg-neutral-400/50'
                    )}
                    style={{'--size': boardSize, top: `${(line.row + (line.type === 'vertical' ? 0.5 : 0)) * 100/boardSize}%`, left: `${(line.col + (line.type === 'horizontal' ? 0.5 : 0)) * 100/boardSize}%` } as React.CSSProperties}
                  />
              ))}
            </div>
          </div>
          <Button onClick={() => setGameState('setup')} variant="outline"><ArrowLeft className="mr-2"/> Back to Setup</Button>
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      {gameState === 'setup' ? renderSetupScreen() : renderGameScreen()}
    </div>
  );
}
