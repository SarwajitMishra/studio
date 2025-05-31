
"use client";

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, User, Shield, Home, Zap, Users, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const PLAYER_COLORS = ['red', 'green', 'blue', 'yellow'] as const;
type PlayerColor = typeof PLAYER_COLORS[number];

const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number }> = {
  red: { name: "Red", baseClass: "bg-red-500", textClass: "text-red-700", pathStartIndex: 0, homeEntryPathIndex: 50 },
  green: { name: "Green", baseClass: "bg-green-500", textClass: "text-green-700", pathStartIndex: 13, homeEntryPathIndex: 11 },
  blue: { name: "Blue", baseClass: "bg-blue-500", textClass: "text-blue-700", pathStartIndex: 39, homeEntryPathIndex: 37 },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24 },
};

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
const NUM_TOKENS_PER_PLAYER = 4;
const MAIN_PATH_LENGTH = 52;
const HOME_STRETCH_LENGTH = 6;

interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1: base, 0-51: main path, 100s for home stretch, 200: finished
}

interface Player {
  color: PlayerColor;
  name: string; // e.g., "Red", "Green (AI)"
  tokens: Token[];
  hasRolledSix: boolean;
  sixStreak: number;
  isAI?: boolean;
}

type GameState = 'setup' | 'playing' | 'gameOver';
type GameMode = 'offline' | 'ai' | null;

const initialPlayerState = (numPlayersToCreate: number, mode: GameMode): Player[] => {
  const activePlayerColors = PLAYER_COLORS.slice(0, numPlayersToCreate);
  return activePlayerColors.map((color, index) => {
    const isAIPlayer = mode === 'ai' && index > 0; // Player 0 (Red) is Human in AI mode
    return {
      color,
      name: `${PLAYER_CONFIG[color].name}${isAIPlayer ? " (AI)" : ""}`,
      tokens: Array(NUM_TOKENS_PER_PLAYER).fill(null).map((_, i) => ({
        id: i,
        color,
        position: -1,
      })),
      hasRolledSix: false,
      sixStreak: 0,
      isAI: isAIPlayer,
    };
  });
};

const BOARD_GRID_SIZE = 15;
const boardCells = Array(BOARD_GRID_SIZE * BOARD_GRID_SIZE).fill(null).map((_, i) => i);

export default function LudoPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const [selectedNumPlayers, setSelectedNumPlayers] = useState<number | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedToken, setSelectedToken] = useState<{ playerIndex: number; tokenId: number } | null>(null);
  const [gameMessage, setGameMessage] = useState("Welcome to Ludo! Set up your game.");
  const { toast } = useToast();

  const currentPlayer = players[currentPlayerIndex];
  // const currentPlayerConfig = currentPlayer ? PLAYER_CONFIG[currentPlayer.color] : PLAYER_CONFIG.red; // Default to red if no current player

  const resetGame = useCallback(() => {
    setGameState('setup');
    setSelectedMode(null);
    setSelectedNumPlayers(null);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setIsRolling(false);
    setSelectedToken(null);
    setGameMessage("Game Reset. Set up your new game!");
    toast({ title: "Game Reset", description: "Ludo game has been reset to setup." });
  }, [toast]);

  const handleStartGame = () => {
    if (!selectedMode || !selectedNumPlayers) {
      toast({ variant: "destructive", title: "Setup Incomplete", description: "Please select game mode and number of players." });
      return;
    }
    const newPlayers = initialPlayerState(selectedNumPlayers, selectedMode);
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setSelectedToken(null);
    setGameState('playing');
    setGameMessage(`${newPlayers[0].name}'s turn. Roll the dice!`);
  };


  const handleDiceRoll = () => {
    if (isRolling || !currentPlayer || (currentPlayer.isAI && gameState === 'playing')) return;

    setSelectedToken(null);
    // Set initial dice value for animation start
    const initialAnimatingRoll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(initialAnimatingRoll);
    setIsRolling(true);

    let rollAttempts = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollAttempts++;
      if (rollAttempts > 10) {
        clearInterval(rollInterval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        processDiceRoll(finalRoll);
      }
    }, 100);
  };

  const processDiceRoll = (roll: number) => {
    if (!currentPlayer) return;
    setGameMessage(`${currentPlayer.name} rolled a ${roll}.`);

    const movableTokens = currentPlayer.tokens.filter(token => {
      if (token.position === -1 && roll === 6) return true;
      if (token.position >= 0 && token.position < 200) return true; // Simplified: allow move if not home
      return false;
    });

    if (movableTokens.length === 0 && roll !== 6) {
      setGameMessage(`${currentPlayer.name} rolled a ${roll}. No valid moves. Passing turn.`);
      setTimeout(() => passTurn(), 1500);
      return;
    }
    if (movableTokens.length === 1 && movableTokens[0].position === -1 && roll !== 6) {
      setGameMessage(`${currentPlayer.name} rolled a ${roll}. No valid moves (token in base, need 6). Passing turn.`);
      setTimeout(() => passTurn(), 1500);
      return;
    }

    if (roll === 6) {
      setGameMessage(prev => prev + " Gets another turn!");
      // AI Turn simulation would go here if it's AI and rolled 6, or allow human to roll again
    } else if (currentPlayer.isAI) {
      // Placeholder for AI choosing a token and moving
      setGameMessage(prev => prev + ` AI thinking...`);
      setTimeout(() => {
        // AI: Simplistic: move first movable token
        if (movableTokens.length > 0) {
          attemptMoveToken(currentPlayerIndex, movableTokens[0].id, roll);
        } else {
          passTurn(); // Should not happen if logic above is correct
        }
      }, 1000);
    }
  };

  const passTurn = () => {
    if (players.length === 0) return;
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextPlayerIndex);
    setDiceValue(null);
    setSelectedToken(null);
    setGameMessage(`${players[nextPlayerIndex].name}'s turn. Roll the dice!`);

    // If next player is AI, simulate their turn
    if (players[nextPlayerIndex]?.isAI) {
      setGameMessage(`${players[nextPlayerIndex].name} (AI) is thinking...`);
      setTimeout(() => {
        // AI Dice Roll
        const aiRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(aiRoll); // Show AI roll
        // Brief pause to see dice, then process
        setTimeout(() => {
            processDiceRoll(aiRoll);
        }, 1000);
      }, 1500);
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && players.length > 0) {
        const currentP = players[currentPlayerIndex];
        if (currentP) {
            setGameMessage(`${currentP.name}'s turn. Roll the dice!`);
            if (currentP.isAI && !diceValue && !isRolling) { // Trigger AI's first turn or subsequent turns if no dice value is set
                 setGameMessage(`${currentP.name} (AI) is thinking...`);
                 setTimeout(() => {
                    const aiRoll = Math.floor(Math.random() * 6) + 1;
                    setDiceValue(aiRoll);
                    setTimeout(() => {
                        processDiceRoll(aiRoll);
                    }, 1000);
                 }, 1500);
            }
        }
    }
  }, [currentPlayerIndex, players, gameState]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !currentPlayer || currentPlayer.isAI) return;

    const token = players[playerIndex].tokens[tokenId];

    if (token.position === -1 && diceValue !== 6) {
      toast({ variant: "destructive", title: "Invalid Move", description: "You need a 6 to bring a token out of base." });
      return;
    }
    if (token.position === 200) {
      toast({ variant: "destructive", title: "Invalid Move", description: "This token is already home." });
      return;
    }
    attemptMoveToken(playerIndex, tokenId, diceValue);
  };

  const attemptMoveToken = (playerIdx: number, tokenId: number, roll: number) => {
    setPlayers(prevPlayers => {
      const newPlayers = prevPlayers.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) }));
      const playerToMove = newPlayers[playerIdx];
      if (!playerToMove) return prevPlayers;
      const tokenToMove = playerToMove.tokens[tokenId];

      if (tokenToMove.position === -1 && roll === 6) {
        tokenToMove.position = 0; // Simplified: place at start
        setGameMessage(`${playerToMove.name} brought a token out!`);
        // If not AI and rolled 6, human can roll again. AI handles its own re-roll in processDiceRoll/passTurn
        if (!playerToMove.isAI) {
             setGameMessage(prev => prev + ` Still ${playerToMove.name}'s turn (rolled 6).`);
        } else if (playerToMove.isAI && roll === 6){
            // AI gets another turn logic is handled in passTurn/processDiceRoll
            setGameMessage(prev => prev + ` ${playerToMove.name} gets another turn!`);
             setTimeout(() => { // AI rolls again
                const aiRoll = Math.floor(Math.random() * 6) + 1;
                setDiceValue(aiRoll);
                setTimeout(() => processDiceRoll(aiRoll), 1000);
            }, 1500);
        }

      } else if (tokenToMove.position >= 0 && tokenToMove.position < 200) { // Simplified, no home stretch logic yet
        const newPos = tokenToMove.position + roll;
        if (newPos < MAIN_PATH_LENGTH) {
          tokenToMove.position = newPos;
        } else {
          tokenToMove.position = 200; // Reached home (simplified)
          setGameMessage(`${playerToMove.name} token reached home!`);
           // Check for win condition here
        }

        if (roll !== 6) {
          setGameMessage(`${playerToMove.name} moved token. Passing turn.`);
          setTimeout(() => passTurn(), 1000);
        } else {
          setGameMessage(`${playerToMove.name} moved token! Still ${playerToMove.name}'s turn (rolled 6).`);
           if (playerToMove.isAI) { // AI rolls again
             setTimeout(() => {
                const aiRoll = Math.floor(Math.random() * 6) + 1;
                setDiceValue(aiRoll);
                setTimeout(() => processDiceRoll(aiRoll), 1000);
            }, 1500);
           }
        }
      } else {
        toast({ variant: "destructive", title: "Cannot Move", description: "This token cannot make that move." });
        return prevPlayers;
      }
      // Check win condition
      const winner = newPlayers.find(p => p.tokens.every(t => t.position === 200));
      if (winner) {
        setGameMessage(`${winner.name} has won the game! Congratulations!`);
        setGameState('gameOver');
        toast({ title: "Game Over!", description: `${winner.name} wins!` });
      }
      return newPlayers;
    });
  };

  const getTokenForCell = (cellIndex: number): Token | null => {
    // This function needs a full rewrite to map Ludo paths to grid cells accurately.
    // For now, it's highly simplified and mostly for base representation.
    for (const player of players) {
        for (const token of player.tokens) {
            // Simplified base rendering
            if (token.position === -1) {
                 const playerBaseStartIndex = PLAYER_COLORS.indexOf(player.color) * 6; // Example for base squares
                 // This is a very rough placeholder for base rendering
                 // Needs to map to specific base cells for each color
                 if (cellIndex >= playerBaseStartIndex && cellIndex < playerBaseStartIndex + NUM_TOKENS_PER_PLAYER && token.id === (cellIndex % NUM_TOKENS_PER_PLAYER)) {
                    // This needs to be actual cell indices for bases
                 }
            }
            // Placeholder for tokens on path - needs real mapping
            // if (token.position !== -1 && token.position !== 200 && token.position === cellIndex) return token;
        }
    }
    return null;
  };

  const getCellBackgroundColor = (cellIndex: number): string => {
    const row = Math.floor(cellIndex / BOARD_GRID_SIZE);
    const col = cellIndex % BOARD_GRID_SIZE;

    // Home stretches
    if (col === 7 && row >= 1 && row <= 5) return PLAYER_CONFIG.red.baseClass + "/30"; // Red home stretch (path to center)
    if (row === 7 && col >= 9 && col <= 13) return PLAYER_CONFIG.green.baseClass + "/30"; // Green home stretch
    if (col === 7 && row >= 9 && row <= 13) return PLAYER_CONFIG.yellow.baseClass + "/30"; // Yellow home stretch
    if (row === 7 && col >= 1 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/30"; // Blue home stretch

    // Player base areas (more accurate squares using 6x6 corners)
    // Red Base (Top-Left)
    if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return PLAYER_CONFIG.red.baseClass;
    // Green Base (Top-Right)
    if (row >= 0 && row <= 5 && col >= 9 && col <= 14) return PLAYER_CONFIG.green.baseClass;
    // Blue Base (Bottom-Left)
    if (row >= 9 && row <= 14 && col >= 0 && col <= 5) return PLAYER_CONFIG.blue.baseClass;
    // Yellow Base (Bottom-Right)
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return PLAYER_CONFIG.yellow.baseClass;
    
    // Center Home Area
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return "bg-gray-300";

    // Main Path cells (outer 3 rows/cols)
    const isOuterPathRow = row < 6 || row > 8;
    const isOuterPathCol = col < 6 || col > 8;
    const isMiddlePathStripRow = row >= 6 && row <= 8;
    const isMiddlePathStripCol = col >= 6 && col <= 8;

    if (isMiddlePathStripRow && !isMiddlePathStripCol ) return "bg-slate-50"; // Vertical strips of path
    if (isMiddlePathStripCol && !isMiddlePathStripRow ) return "bg-slate-50"; // Horizontal strips of path
    
    // Start cells
    if (row === 6 && col === 1) return PLAYER_CONFIG.red.baseClass + "/70"; // Red start
    if (row === 1 && col === 8) return PLAYER_CONFIG.green.baseClass + "/70"; // Green start
    if (row === 8 && col === 13) return PLAYER_CONFIG.yellow.baseClass + "/70"; // Yellow start
    if (row === 13 && col === 6) return PLAYER_CONFIG.blue.baseClass + "/70"; // Blue start

    // Safe spots (example, needs accurate positions)
    // These are typically marked with a star or different color
    const safeSpotsIndices = [8, 21, 34, 47]; // Example path indices for safe spots
    // This needs to be mapped to cellIndex if we render path on grid
    // if (safeSpotsIndices.includes(some_mapping_from_cellIndex_to_pathIndex)) return "bg-pink-300";


    return (row + col) % 2 === 0 ? "bg-slate-100" : "bg-slate-200"; // Default path cell color
  };


  if (gameState === 'setup') {
    return (
      <>
        <title>Setup Ludo Game | Shravya Playhouse</title>
        <meta name="description" content="Set up your Ludo game: choose mode and number of players." />
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-2xl font-bold text-center text-primary">Setup Ludo Game</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label className="text-lg font-medium">Game Mode</Label>
              <RadioGroup value={selectedMode || ""} onValueChange={(value) => setSelectedMode(value as GameMode)} className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="offline" id="offline" className="peer sr-only" />
                  <Label htmlFor="offline" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <Users className="mb-2 h-8 w-8" />
                    Offline
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="ai" id="ai" className="peer sr-only" />
                  <Label htmlFor="ai" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <Cpu className="mb-2 h-8 w-8" />
                    Play with AI
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {selectedMode === 'offline' && (
              <div>
                <Label className="text-lg font-medium">Number of Players</Label>
                <RadioGroup value={selectedNumPlayers?.toString() || ""} onValueChange={(value) => setSelectedNumPlayers(parseInt(value))} className="mt-2 grid grid-cols-3 gap-4">
                  {[2, 3, 4].map(num => (
                    <div key={num}>
                      <RadioGroupItem value={num.toString()} id={`offline-${num}`} className="peer sr-only" />
                      <Label htmlFor={`offline-${num}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-lg">
                        {num}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {selectedMode === 'ai' && (
              <div>
                <Label className="text-lg font-medium">Number of Players (includes you)</Label>
                <RadioGroup value={selectedNumPlayers?.toString() || ""} onValueChange={(value) => setSelectedNumPlayers(parseInt(value))} className="mt-2 grid grid-cols-2 gap-4">
                  {[2, 4].map(num => ( // 1 Human + 1 AI, or 1 Human + 3 AI
                    <div key={num}>
                      <RadioGroupItem value={num.toString()} id={`ai-${num}`} className="peer sr-only" />
                      <Label htmlFor={`ai-${num}`} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <span className="text-lg">{num}</span>
                        <span className="text-xs">{num === 2 ? "(You vs AI)" : "(You vs 3 AI)"}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <Button onClick={handleStartGame} disabled={!selectedMode || !selectedNumPlayers} className="w-full text-lg py-3">
              Start Game
            </Button>
             <Button onClick={() => {
                // For quick testing during development
                setSelectedMode('offline');
                setSelectedNumPlayers(2);
                // handleStartGame(); // Call separately if needed or auto-call via useEffect on these changes
            }} variant="outline" className="w-full">Quick Test: Offline 2P</Button>
          </CardContent>
        </Card>
      </>
    );
  }


  return (
    <>
      <title>Ludo Game | Shravya Playhouse</title>
      <meta name="description" content="Play the classic game of Ludo online." />
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-center text-primary">Ludo King</CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80 pt-1">
            {gameState === 'gameOver' ? "Game Over!" : "Roll the dice, move your tokens, and race to home!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 flex flex-col lg:flex-row items-start gap-6">
          <div className="w-full lg:w-2/3 flex flex-col items-center">
            <div
              className="grid gap-0.5 border-2 border-neutral-700 rounded overflow-hidden shadow-lg bg-neutral-300"
              style={{ gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))` }}
              aria-label="Ludo board"
            >
              {boardCells.map((_, cellIndex) => {
                const tokenOnCell = getTokenForCell(cellIndex); // Needs full implementation
                const cellBg = getCellBackgroundColor(cellIndex); // Needs full path logic
                
                // For rendering tokens based on their actual positions (this is a very big TODO)
                // This requires mapping each player's token.position (0-51 for main path, 100s for home stretch)
                // to a specific cellIndex on this 15x15 grid.
                // And handling multiple tokens on the same cell.
                const tokensOnThisCell: Token[] = [];
                if (players && players.length > 0) {
                    players.forEach(p => {
                        p.tokens.forEach(t => {
                            // TODO: Map t.position to cellIndex here
                            // e.g. if (mapLudoPositionToCellIndex(t.position, t.color) === cellIndex) {
                            // tokensOnThisCell.push(t);
                            // }
                            // Temporary: show tokens in their base for now visually (highly simplified)
                            if (t.position === -1) {
                                const playerDetails = PLAYER_CONFIG[t.color];
                                let baseAreaCell = -1;
                                // Super simplified base token rendering
                                if (t.color === 'red' && cellIndex === (0*15 + t.id + 1)) baseAreaCell = cellIndex;
                                if (t.color === 'green' && cellIndex === (0*15 + 10 + t.id +1 )) baseAreaCell = cellIndex;
                                if (t.color === 'blue' && cellIndex === (14*15 + t.id + 1)) baseAreaCell = cellIndex;
                                if (t.color === 'yellow' && cellIndex === (14*15 + 10 + t.id+1)) baseAreaCell = cellIndex;
                                if (baseAreaCell === cellIndex) tokensOnThisCell.push(t);
                            }
                        })
                    })
                }


                return (
                  <div
                    key={cellIndex}
                    className={cn(
                      "aspect-square flex items-center justify-center text-xs sm:text-sm relative",
                      cellBg,
                      "border border-neutral-400/50"
                    )}
                  >
                    {/* Render tokens. This is simplified and needs overlap handling. */}
                    {tokensOnThisCell.map((token, idx) => (
                         <button
                            key={token.color + token.id}
                            onClick={() => handleTokenClick(PLAYER_COLORS.indexOf(token.color), token.id)}
                            disabled={!currentPlayer || PLAYER_COLORS.indexOf(token.color) !== currentPlayerIndex || isRolling || !diceValue || currentPlayer.isAI}
                            className={cn(
                                "w-3/4 h-3/4 rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1 absolute",
                                PLAYER_CONFIG[token.color].baseClass,
                                (currentPlayer && PLAYER_COLORS.indexOf(token.color) === currentPlayerIndex && diceValue && !currentPlayer.isAI) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default",
                                selectedToken?.playerIndex === PLAYER_COLORS.indexOf(token.color) && selectedToken.tokenId === token.id ? "ring-4 ring-purple-500" : "",
                                "text-white font-bold text-base z-10",
                                `token-pos-${idx}` // For potential stacking CSS if needed
                            )}
                            style={{ // Simple stacking for up to 2 tokens
                                transform: tokensOnThisCell.length > 1 ? (idx === 0 ? 'translateX(-15%)' : 'translateX(15%)') : 'none',
                                width: tokensOnThisCell.length > 1 ? '60%' : '75%',
                                height: tokensOnThisCell.length > 1 ? '60%' : '75%',
                            }}
                            aria-label={`Token ${token.color} ${token.id + 1}`}
                            >
                            {token.id + 1}
                        </button>
                    ))}
                    {/* {cellIndex} // For debugging cell indices */}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Board rendering and token path logic are highly simplified. Accurate Ludo paths and token display coming soon!
            </p>
          </div>

          <div className="w-full lg:w-1/3 space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className={cn("text-xl text-center", currentPlayer ? PLAYER_CONFIG[currentPlayer.color].textClass : "")}>
                  { gameState === 'gameOver' ? "Game Over!" : (currentPlayer ? `Turn: ${currentPlayer.name}` : "Loading...") }
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-center items-center h-20 w-20 mx-auto border-4 border-dashed border-accent rounded-lg bg-background shadow-inner">
                  {isRolling && diceValue ? (
                    (() => {
                      const DiceIconComponent = DICE_ICONS[diceValue - 1];
                      if (!DiceIconComponent) return <Dice6 size={60} className="text-muted-foreground opacity-50" />;
                      return <DiceIconComponent size={60} className="text-muted-foreground animate-spin" />;
                    })()
                  ) : !isRolling && diceValue ? (
                    (() => {
                      const DiceIconComponent = DICE_ICONS[diceValue - 1];
                      if (!DiceIconComponent) return <Dice6 size={60} className="text-muted-foreground opacity-50" />;
                      return <DiceIconComponent size={60} className="text-accent animate-gentle-bounce" />;
                    })()
                  ) : (
                    <Dice6 size={60} className="text-muted-foreground opacity-50" />
                  )}
                </div>
                <Button
                  onClick={handleDiceRoll}
                  disabled={isRolling || !currentPlayer || (!!diceValue && diceValue !== 6 && !currentPlayer.isAI) || (currentPlayer?.isAI) || gameState === 'gameOver'}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 shadow-lg"
                >
                  {isRolling ? "Rolling..." :
                    (diceValue && diceValue !== 6 && !currentPlayer?.isAI ? `Rolled ${diceValue}! Select Token` :
                      (diceValue && diceValue === 6 && !currentPlayer?.isAI ? `Rolled ${diceValue}! Roll/Move` :
                        (currentPlayer?.isAI ? `${currentPlayer.name} is rolling...` : "Roll Dice")))}
                </Button>
                <p className="text-sm text-foreground/90 min-h-[40px]">{gameMessage}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-center">Player Tokens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {players.map((p) => (
                  <div key={p.color} className="flex items-center justify-between p-2 rounded border">
                    <span className={cn("font-semibold", PLAYER_CONFIG[p.color].textClass)}>{p.name}:</span>
                    <div className="flex gap-1">
                      {p.tokens.map(token => (
                        <div key={token.id}
                          title={`Token ${token.id + 1}: ${token.position === -1 ? 'Base' : (token.position === 200 ? 'Home' : `Pos ${token.position}`)}`}
                          className={cn(
                            "w-5 h-5 rounded-full border text-xs flex items-center justify-center text-white",
                            PLAYER_CONFIG[token.color].baseClass,
                            token.position === 200 ? 'opacity-50 line-through' : ''
                          )}>
                          {token.position === -1 ? 'B' : (token.position === 200 ? <Home size={12} /> : token.id + 1)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button onClick={resetGame} variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Game / New Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

