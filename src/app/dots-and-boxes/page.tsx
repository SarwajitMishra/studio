
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCw, Award, Users, Cpu, ArrowLeft, Star as StarIcon, Edit, Loader2, Expand, Shrink } from 'lucide-react';
import { cn } from "@/lib/utils";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { useToast } from '@/hooks/use-toast';
import { useFullscreen } from '@/hooks/use-fullscreen';

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
  easy: { boardSize: 4, label: "Easy (5x5 Dots)" },
  medium: { boardSize: 5, label: "Medium (6x6 Dots)" },
  hard: { boardSize: 7, label: "Hard (8x8 Dots)" },
};

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
];

export default function DotsAndBoxesPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [boardSize, setBoardSize] = useState(5);
  
  const [lines, setLines] = useState<Line[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [scores, setScores] = useState({ P1: 0, P2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<PlayerId>('P1');
  const [winner, setWinner] = useState<PlayerId | 'draw' | null>(null);
  const [turn, setTurn] = useState(0);

  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [tempSetup, setTempSetup] = useState<{ mode: GameMode; diff: Difficulty } | null>(null);
  const [playerNames, setPlayerNames] = useState({ P1: 'Player 1', P2: 'Player 2' });
  const [playerColors, setPlayerColors] = useState({ P1: COLOR_OPTIONS[0].value, P2: COLOR_OPTIONS[1].value });

  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{ points: number; coins: number; stars: number } | null>(null);
  const { toast } = useToast();
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameContainerRef);

  const startGame = useCallback((mode: GameMode, diff: Difficulty, names: {P1: string, P2: string}, colors: {P1: string, P2: string}) => {
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
    setPlayerNames(names);
    setPlayerColors(colors);
    setGameState('playing');
    setTurn(0);
    setTimeout(() => enterFullscreen(), 100);
  }, [enterFullscreen]);

  const openSetupDialog = (mode: GameMode, diff: Difficulty) => {
    setTempSetup({ mode, diff });
    setIsSetupDialogOpen(true);
  };
  
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
                if (boxIndex !== -1) {
                  newBoxes[boxIndex] = { ...newBoxes[boxIndex], owner: currentPlayer };
                  boxesCompleted++;
                }
            }
        }
    }
    
    setLines(newLines);
    setBoxes(newBoxes);

    if (boxesCompleted > 0) {
      setScores(s => ({ ...s, [currentPlayer]: s[currentPlayer] + boxesCompleted }));
      // Extra turn is handled by NOT changing the player
    } else {
      setCurrentPlayer(p => (p === 'P1' ? 'P2' : 'P1'));
    }
    setTurn(t => t + 1);
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
    if (gameMode === 'ai' && currentPlayer === 'P2' && gameState === 'playing') {
        const aiMoveTimeout = setTimeout(() => {
            makeAIMove();
        }, 800);
        return () => clearTimeout(aiMoveTimeout);
    }
  }, [turn, gameMode, currentPlayer, gameState, makeAIMove]);

  // Check for game end
  useEffect(() => {
    if (lines.length > 0 && lines.every(l => l.owner) && gameState === 'playing') {
      let finalWinner: PlayerId | 'draw' | null = null;
      if (scores.P1 > scores.P2) finalWinner = 'P1';
      else if (scores.P2 > scores.P1) finalWinner = 'P2';
      else finalWinner = 'draw';
      
      setWinner(finalWinner);
      setGameState('gameOver');

      if (gameMode === 'ai') {
        // Player lost to AI
        if (finalWinner === 'P2') {
          setLastReward({ points: 0, coins: 0, stars: 0 });
          updateGameStats({ gameId: 'dots-and-boxes', didWin: false, score: scores.P1 - scores.P2 });
          setIsCalculatingReward(false);
          return;
        }

        // Player won or drew against AI
        const didWin = finalWinner === 'P1';
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
        });
      }
    }
  }, [lines, scores, gameState, boardSize, difficulty, gameMode, toast]);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">{[...Array(3)].map((_, i) => (<StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />))}</div>
  );

  const getWinnerMessage = () => {
    if(winner === 'draw') return "It's a draw!";
    if(winner === 'P1') return `${playerNames.P1} Wins!`;
    return `${playerNames.P2} Wins!`;
  }
  
  const renderSetupScreen = () => (
      <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader><CardTitle className="text-3xl font-bold">Dots & Boxes</CardTitle><CardDescription>Select a game mode and difficulty.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <div className="flex justify-center gap-2 flex-wrap">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                    <Button key={d} variant={difficulty === d ? 'default' : 'outline'} onClick={() => setDifficulty(d)}>{DIFFICULTY_CONFIG[d].label}</Button>
                  ))}
                </div>
              </div>
              <Button onClick={() => openSetupDialog('player', difficulty)} className="w-full text-md sm:text-lg"><Users className="mr-2"/> Player vs Player</Button>
              <Button onClick={() => openSetupDialog('ai', difficulty)} className="w-full text-md sm:text-lg"><Cpu className="mr-2"/> Player vs AI</Button>
          </CardContent>
      </Card>
  );

  const renderGameScreen = () => (
      <div ref={gameContainerRef} className={cn("flex flex-col items-center gap-4 transition-all duration-300", isFullscreen && "bg-background justify-center h-full w-full")}>
          <AlertDialog open={gameState === 'gameOver'}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl text-primary flex items-center justify-center gap-2"><Award size={28} /> Game Over!</AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-lg">{getWinnerMessage()}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 text-center">
                  {gameMode === 'player' ? (
                     <div className="flex flex-col items-center gap-2 text-center">
                        <p className="font-semibold text-lg">Final Score</p>
                        <p>{playerNames.P1}: <span className="font-bold">{scores.P1}</span> boxes</p>
                        <p>{playerNames.P2}: <span className="font-bold">{scores.P2}</span> boxes</p>
                    </div>
                  ) : (
                    isCalculatingReward ? <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /> : lastReward ? (
                      lastReward.stars === 0 ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-xl text-destructive font-semibold">You Lost!</p>
                            <p className="text-muted-foreground">Keep practicing to beat the AI!</p>
                        </div>
                      ) : (
                          <div className="flex flex-col items-center gap-3 text-center">
                              <StarRating rating={lastReward.stars} />
                              <div className="flex items-center gap-6 mt-2">
                                <span className="flex items-center font-bold text-xl">+{lastReward.points} <SPointsIcon className="ml-2 h-6 w-6 text-yellow-400" /></span>
                                <span className="flex items-center font-bold text-xl">+{lastReward.coins} <SCoinsIcon className="ml-2 h-6 w-6 text-amber-500" /></span>
                              </div>
                          </div>
                      )
                    ) : null
                  )}
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => tempSetup && openSetupDialog(tempSetup.mode, tempSetup.diff)} disabled={isCalculatingReward}>Play Again</AlertDialogAction>
                    <AlertDialogCancel onClick={() => { setGameState('setup'); exitFullscreen(); }} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <Card className={cn("text-center p-3 transition-shadow", currentPlayer === 'P1' && gameState === 'playing' && 'ring-2 ring-blue-500 shadow-lg')}>
              <CardTitle className="font-bold truncate" style={{color: playerColors.P1}}>{playerNames.P1}</CardTitle>
              <CardDescription className="text-2xl font-bold">{scores.P1}</CardDescription>
            </Card>
            <Card className={cn("text-center p-3 transition-shadow", currentPlayer === 'P2' && gameState === 'playing' && 'ring-2 ring-red-500 shadow-lg')}>
              <CardTitle className="font-bold truncate" style={{color: playerColors.P2}}>{playerNames.P2}</CardTitle>
              <CardDescription className="text-2xl font-bold">{scores.P2}</CardDescription>
            </Card>
          </div>

          <div className="relative p-2 bg-muted rounded-lg" style={{ width: "clamp(300px, 90vw, 500px)", height: "clamp(300px, 90vw, 500px)" }}>
            <div className="grid w-full h-full" style={{gridTemplateColumns: `repeat(${boardSize}, 1fr)`, gridTemplateRows: `repeat(${boardSize}, 1fr)`}}>
               {boxes.map((box, i) => (
                    <div key={i} className={cn("w-full h-full flex items-center justify-center transition-colors duration-300")}
                    style={{ backgroundColor: box.owner ? `${playerColors[box.owner]}60` : 'transparent'}}>
                      {box.owner && <span className={"text-4xl font-bold"} style={{color: playerColors[box.owner]}}>{box.owner === 'P1' ? 'P1' : (gameMode === 'ai' ? 'AI' : 'P2')}</span>}
                    </div>
                ))}
            </div>
            <div className="absolute inset-0 p-2 grid" style={{gridTemplateColumns: `repeat(${boardSize}, 1fr)`, gridTemplateRows: `repeat(${boardSize}, 1fr)`}}>
              {Array.from({length: (boardSize+1)*(boardSize+1)}).map((_, i) => {
                const row = Math.floor(i / (boardSize + 1));
                const col = i % (boardSize + 1);
                return <div key={`dot-${row}-${col}`} className="absolute w-3 h-3 bg-neutral-700 rounded-full -translate-x-1/2 -translate-y-1/2" style={{top: `${row * 100/boardSize}%`, left: `${col * 100/boardSize}%`}}></div>
              })}
              {lines.map((line, i) => (
                  <button key={i}
                    onClick={() => handleLineClick(line)}
                    disabled={!!line.owner || gameState !== 'playing' || (gameMode === 'ai' && currentPlayer === 'P2')}
                    className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 z-10",
                        line.type === 'horizontal' ? 'w-[calc(100%/var(--size)-8px)] h-2' : 'w-2 h-[calc(100%/var(--size)-8px)]',
                        !line.owner && 'bg-transparent hover:bg-neutral-400/50'
                    )}
                    style={{
                      '--size': boardSize, 
                      top: `${(line.row + (line.type === 'vertical' ? 0.5 : 0)) * 100/boardSize}%`, 
                      left: `${(line.col + (line.type === 'horizontal' ? 0.5 : 0)) * 100/boardSize}%`,
                      backgroundColor: line.owner ? playerColors[line.owner] : undefined,
                     } as React.CSSProperties}
                  />
              ))}
            </div>
          </div>
          <div className="flex gap-4">
              <Button onClick={() => { setGameState('setup'); exitFullscreen(); }} variant="outline"><ArrowLeft className="mr-2"/> Back to Setup</Button>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-4 overflow-hidden h-screen">
      {gameState === 'setup' ? renderSetupScreen() : renderGameScreen()}
       <SetupDialog 
        isOpen={isSetupDialogOpen} 
        onClose={() => setIsSetupDialogOpen(false)} 
        setupDetails={tempSetup} 
        onStartGame={startGame}
      />
    </div>
  );
}

// Setup Dialog Component
interface SetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  setupDetails: { mode: GameMode; diff: Difficulty } | null;
  onStartGame: (mode: GameMode, diff: Difficulty, names: {P1: string, P2: string}, colors: {P1: string, P2: string}) => void;
}

function SetupDialog({ isOpen, onClose, setupDetails, onStartGame }: SetupDialogProps) {
    const [p1Name, setP1Name] = useState('Player 1');
    const [p2Name, setP2Name] = useState('Player 2');
    const [p1Color, setP1Color] = useState(COLOR_OPTIONS[0].value);
    const [p2Color, setP2Color] = useState(COLOR_OPTIONS[1].value);

    useEffect(() => {
        if(setupDetails?.mode === 'ai') {
            setP2Name('Shravya AI');
            setP2Color(COLOR_OPTIONS[1].value); // AI is always Red
            if (p1Color === COLOR_OPTIONS[1].value) {
                setP1Color(COLOR_OPTIONS[0].value);
            }
        } else {
             setP2Name('Player 2');
        }
    }, [setupDetails, p1Color]);


    const handleSubmit = () => {
        if (!setupDetails) return;
        if (p1Name.trim() === '' || (setupDetails.mode === 'player' && p2Name.trim() === '')) {
            alert('Player names cannot be empty.');
            return;
        }
        if (setupDetails.mode === 'player' && p1Color === p2Color) {
            alert('Players must choose different colors.');
            return;
        }
        onStartGame(setupDetails.mode, setupDetails.diff, { P1: p1Name, P2: p2Name }, { P1: p1Color, P2: p2Color });
        onClose();
    }
    if (!setupDetails) return null;

    const availableP1Colors = setupDetails.mode === 'ai' ? COLOR_OPTIONS.filter(c => c.value !== p2Color) : COLOR_OPTIONS;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Game Setup: {setupDetails.mode === 'ai' ? 'Player vs AI' : 'Player vs Player'}</DialogTitle>
                    <DialogDescription>Customize your game session.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="p1Name">Player 1 Name</Label>
                        <Input id="p1Name" value={p1Name} onChange={(e) => setP1Name(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Player 1 Color</Label>
                        <div className="flex gap-2 flex-wrap">
                            {availableP1Colors.map(color => (
                                <button key={color.value} onClick={() => setP1Color(color.value)} className={cn("w-8 h-8 rounded-full border-2", p1Color === color.value && 'ring-4 ring-offset-2 ring-primary')} style={{backgroundColor: color.value}}/>
                            ))}
                        </div>
                    </div>

                    {setupDetails.mode === 'player' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="p2Name">Player 2 Name</Label>
                                <Input id="p2Name" value={p2Name} onChange={(e) => setP2Name(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Player 2 Color</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLOR_OPTIONS.map(color => (
                                        <button key={color.value} onClick={() => setP2Color(color.value)} className={cn("w-8 h-8 rounded-full border-2", p2Color === color.value && 'ring-4 ring-offset-2 ring-primary')} style={{backgroundColor: color.value}}/>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <Button onClick={handleSubmit}>Start Game</Button>
            </DialogContent>
        </Dialog>
    )
}
