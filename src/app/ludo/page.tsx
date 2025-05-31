
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
      if (token.position >= 0 && token.position < 200) return true;
      return false;
    });

    if (movableTokens.length === 0 && !(roll === 6 && currentPlayer.tokens.some(t => t.position === -1))) {
      setGameMessage(`${currentPlayer.name} rolled a ${roll}. No valid moves. Passing turn.`);
      setTimeout(() => passTurn(roll !== 6), 1500);
      return;
    }
    
    if (currentPlayer.tokens.every(t => t.position === -1) && roll !== 6) {
       setGameMessage(`${currentPlayer.name} rolled a ${roll}. No valid moves (all tokens in base, need 6). Passing turn.`);
       setTimeout(() => passTurn(true), 1500);
       return;
    }


    if (roll === 6) {
      setGameMessage(prev => prev + " Gets another turn!");
      const updatedPlayers = players.map((p, index) => 
        index === currentPlayerIndex ? { ...p, hasRolledSix: true, sixStreak: p.sixStreak + 1 } : p
      );
      setPlayers(updatedPlayers);

      if (updatedPlayers[currentPlayerIndex].sixStreak === 3) {
        setGameMessage(`${currentPlayer.name} rolled three 6s in a row! Turn forfeited.`);
        setTimeout(() => passTurn(true, true), 1500); // Pass turn, forfeit
        return;
      }

      // If AI rolled 6, it should decide to move or roll again (simplified: AI always tries to move if possible after rolling 6)
      if (currentPlayer.isAI) {
        setGameMessage(prev => prev + ` AI deciding...`);
        setTimeout(() => {
          if (movableTokens.length > 0) {
            attemptMoveToken(currentPlayerIndex, movableTokens[0].id, roll); // AI moves first movable token
          } else {
            // This case should be rare if AI rolls 6 and has tokens in base.
            // If AI has no movable tokens even with a 6 (e.g. all tokens are perfectly positioned before home and 6 is too much)
            // it should re-roll (but our AI is simple now), or pass if no other logic.
            // For now, if no movable tokens, AI effectively just re-rolls due to passTurn(false)
            passTurn(false); // AI gets to roll again
          }
        }, 1000);
      }
      // Human player who rolled 6 can choose to roll again or move token. Button state handles this.
    } else { // Roll is not 6
      setPlayers(players.map((p, index) => index === currentPlayerIndex ? { ...p, hasRolledSix: false, sixStreak: 0 } : p));
      if (currentPlayer.isAI) {
        setGameMessage(prev => prev + ` AI thinking...`);
        setTimeout(() => {
          if (movableTokens.length > 0) {
            attemptMoveToken(currentPlayerIndex, movableTokens[0].id, roll);
          } else {
            passTurn(true); // Pass turn if no movable tokens
          }
        }, 1000);
      }
      // For human, they must select a token if diceValue is not 6.
    }
  };
  
  const passTurn = (isTurnOverDueToNotRollingSix = true, turnForfeited = false) => {
    if (players.length === 0) return;

    let nextPlayerIdx = currentPlayerIndex;
    if (isTurnOverDueToNotRollingSix || turnForfeited) {
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
        setPlayers(players.map((p, index) => index === currentPlayerIndex ? { ...p, hasRolledSix: false, sixStreak: 0 } : p));
    }
    // If !isTurnOverDueToNotRollingSix, it means player (usually AI) rolled 6 and gets another turn (or human can choose to roll)
    // So, currentPlayerIndex doesn't change, but diceValue is reset for new roll.

    setCurrentPlayerIndex(nextPlayerIdx);
    setDiceValue(null);
    setSelectedToken(null);
    setGameMessage(`${players[nextPlayerIdx].name}'s turn. Roll the dice!`);

    if (players[nextPlayerIdx]?.isAI && gameState === 'playing') {
      setGameMessage(`${players[nextPlayerIdx].name} (AI) is thinking...`);
      setTimeout(() => {
        const aiRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(aiRoll); 
        setTimeout(() => {
            processDiceRoll(aiRoll);
        }, 1000);
      }, 1500);
    }
  };


  useEffect(() => {
    if (gameState === 'playing' && players.length > 0 && players[currentPlayerIndex]?.isAI && !diceValue && !isRolling) {
        const currentP = players[currentPlayerIndex];
        setGameMessage(`${currentP.name} (AI) is thinking...`);
        setTimeout(() => {
            const aiRoll = Math.floor(Math.random() * 6) + 1;
            setDiceValue(aiRoll);
            setTimeout(() => {
                processDiceRoll(aiRoll);
            }, 1000);
        }, 1500);
    }
  }, [currentPlayerIndex, players, gameState, diceValue, isRolling]);


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
        tokenToMove.position = 0; 
        setGameMessage(`${playerToMove.name} brought a token out!`);
        // Player rolled 6, does not automatically pass turn. They can roll again or move another token if applicable.
        // Logic for AI re-roll or human choice is handled by button state / passTurn(false)
        if (!playerToMove.isAI) {
            setGameMessage(prev => prev + ` Still ${playerToMove.name}'s turn (rolled 6). Roll again or move another token.`);
             // No automatic passTurn here for human. Dice value should persist.
        } else { // AI rolled 6 and moved a token out
            setGameMessage(prev => prev + ` ${playerToMove.name} (AI) gets another turn!`);
            passTurn(false); // AI gets to roll again
        }
        setDiceValue(null); // Reset dice so human can choose to roll again, or AI auto-rolls

      } else if (tokenToMove.position >= 0 && tokenToMove.position < 200) { 
        const newPos = tokenToMove.position + roll;
        // Simplified: no home stretch or exact landing logic yet
        if (newPos < MAIN_PATH_LENGTH) { 
          tokenToMove.position = newPos;
        } else {
          tokenToMove.position = 200; // Reached home (simplified)
          setGameMessage(`${playerToMove.name} token reached home!`);
        }

        if (roll !== 6) {
          setGameMessage(`${playerToMove.name} moved token. Passing turn.`);
          setTimeout(() => passTurn(true), 1000);
        } else { // Rolled 6 and moved
          setGameMessage(`${playerToMove.name} moved token! Still ${playerToMove.name}'s turn (rolled 6).`);
          if (!playerToMove.isAI) {
            // Human can roll again or move another token.
             // No automatic passTurn here. Dice value should persist for next roll or move decision.
          } else { // AI rolled 6 and moved
            passTurn(false); // AI gets to roll again
          }
          setDiceValue(null); // Reset dice for next action (roll or for AI, auto-roll)
        }
      } else {
        toast({ variant: "destructive", title: "Cannot Move", description: "This token cannot make that move." });
        return prevPlayers; // Return original state if move is invalid
      }
      
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
                 const playerBaseStartIndex = PLAYER_COLORS.indexOf(player.color) * 6; 
            }
        }
    }
    return null;
  };

  const getCellBackgroundColor = (cellIndex: number): string => {
    const row = Math.floor(cellIndex / BOARD_GRID_SIZE);
    const col = cellIndex % BOARD_GRID_SIZE;

    // Home stretches
    if (col === 7 && row >= 1 && row <= 5) return PLAYER_CONFIG.red.baseClass + "/30"; 
    if (row === 7 && col >= 9 && col <= 13) return PLAYER_CONFIG.green.baseClass + "/30"; 
    if (col === 7 && row >= 9 && row <= 13) return PLAYER_CONFIG.yellow.baseClass + "/30"; 
    if (row === 7 && col >= 1 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/30"; 

    if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return PLAYER_CONFIG.red.baseClass;
    if (row >= 0 && row <= 5 && col >= 9 && col <= 14) return PLAYER_CONFIG.green.baseClass;
    if (row >= 9 && row <= 14 && col >= 0 && col <= 5) return PLAYER_CONFIG.blue.baseClass;
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return PLAYER_CONFIG.yellow.baseClass;
    
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return "bg-gray-300";

    const isOuterPathRow = row < 6 || row > 8;
    const isOuterPathCol = col < 6 || col > 8;
    const isMiddlePathStripRow = row >= 6 && row <= 8;
    const isMiddlePathStripCol = col >= 6 && col <= 8;

    if (isMiddlePathStripRow && !isMiddlePathStripCol ) return "bg-slate-50"; 
    if (isMiddlePathStripCol && !isMiddlePathStripRow ) return "bg-slate-50"; 
    
    if (row === 6 && col === 1) return PLAYER_CONFIG.red.baseClass + "/70"; 
    if (row === 1 && col === 8) return PLAYER_CONFIG.green.baseClass + "/70"; 
    if (row === 8 && col === 13) return PLAYER_CONFIG.yellow.baseClass + "/70"; 
    if (row === 13 && col === 6) return PLAYER_CONFIG.blue.baseClass + "/70"; 

    return (row + col) % 2 === 0 ? "bg-slate-100" : "bg-slate-200"; 
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
                  {[2, 4].map(num => ( 
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
                setSelectedMode('offline');
                setSelectedNumPlayers(2);
                // Auto-start for dev testing, remove or comment out for production
                // setTimeout(handleStartGame, 100); 
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
      <Card className="w-full max-w-6xl mx-auto shadow-xl"> {/* Increased max-width */}
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-center text-primary">Ludo King</CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80 pt-1">
            {gameState === 'gameOver' ? "Game Over!" : "Roll the dice, move your tokens, and race to home!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 flex flex-col lg:flex-row items-start gap-x-6 gap-y-8"> {/* Added gap-x, gap-y */}
          {/* Board Area */}
          <div className="w-full lg:flex-1 flex flex-col items-center order-1 lg:order-1"> {/* lg:flex-1 to take more space */}
            <div
              className="grid gap-0.5 border-2 border-neutral-700 rounded overflow-hidden shadow-lg bg-neutral-300 w-full max-w-xl aspect-square" // Board itself: max-w-xl, aspect-square
              style={{ gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))` }}
              aria-label="Ludo board"
            >
              {boardCells.map((_, cellIndex) => {
                const tokenOnCell = getTokenForCell(cellIndex); 
                const cellBg = getCellBackgroundColor(cellIndex); 
                
                const tokensOnThisCell: Token[] = [];
                if (players && players.length > 0) {
                    players.forEach(p => {
                        p.tokens.forEach(t => {
                            // TODO: Map t.position to cellIndex here more accurately
                            if (t.position === -1) { // Simplified base token rendering for visibility
                                const playerDetails = PLAYER_CONFIG[t.color];
                                let baseAreaCell = -1;
                                // Very rough visual placement in corners for base tokens
                                if (t.color === 'red' && cellIndex === (1*BOARD_GRID_SIZE + t.id + 1)) baseAreaCell = cellIndex;
                                if (t.color === 'green' && cellIndex === (1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 5) + t.id + 1 )) baseAreaCell = cellIndex;
                                if (t.color === 'blue' && cellIndex === ((BOARD_GRID_SIZE - 5)*BOARD_GRID_SIZE + t.id + 1)) baseAreaCell = cellIndex;
                                if (t.color === 'yellow' && cellIndex === ((BOARD_GRID_SIZE - 5)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 5) + t.id+1)) baseAreaCell = cellIndex;
                                
                                if (baseAreaCell === cellIndex) tokensOnThisCell.push(t);
                            }
                            // Add logic here to map tokens on path to cellIndex
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
                    {tokensOnThisCell.map((token, idx) => (
                         <button
                            key={token.color + token.id}
                            onClick={() => handleTokenClick(PLAYER_COLORS.indexOf(token.color), token.id)}
                            disabled={!currentPlayer || PLAYER_COLORS.indexOf(token.color) !== currentPlayerIndex || isRolling || !diceValue || currentPlayer.isAI || gameState === 'gameOver'}
                            className={cn(
                                "w-3/4 h-3/4 rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1 absolute shadow-md",
                                PLAYER_CONFIG[token.color].baseClass,
                                (currentPlayer && PLAYER_COLORS.indexOf(token.color) === currentPlayerIndex && diceValue && !currentPlayer.isAI) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default",
                                selectedToken?.playerIndex === PLAYER_COLORS.indexOf(token.color) && selectedToken.tokenId === token.id ? "ring-4 ring-purple-500" : "",
                                "text-white font-bold text-base z-10",
                                `token-pos-${idx}` 
                            )}
                            style={{ 
                                transform: tokensOnThisCell.length > 1 ? (idx === 0 ? 'translateX(-15%) translateY(-15%)' : 'translateX(15%) translateY(15%)') : 'none',
                                width: tokensOnThisCell.length > 1 ? '60%' : '75%',
                                height: tokensOnThisCell.length > 1 ? '60%' : '75%',
                            }}
                            aria-label={`Token ${token.color} ${token.id + 1}`}
                            >
                            {/* Display token ID or icon here */}
                        </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Board rendering and token path logic are highly simplified. Accurate Ludo paths and token display coming soon!
            </p>
          </div>

          {/* Controls/Info Area */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6 order-2 lg:order-2"> {/* Fixed width for controls */}
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
                      return <DiceIconComponent size={60} className={cn("text-accent animate-gentle-bounce", currentPlayer ? PLAYER_CONFIG[currentPlayer.color].textClass: "text-accent")} />;
                    })()
                  ) : (
                    <Dice6 size={60} className="text-muted-foreground opacity-50" />
                  )}
                </div>
                <Button
                  onClick={handleDiceRoll}
                  disabled={isRolling || gameState === 'gameOver' || !currentPlayer || currentPlayer.isAI || (!!diceValue && diceValue !== 6 && !currentPlayer.hasRolledSix) || (!!diceValue && currentPlayer.hasRolledSix && currentPlayer.tokens.filter(t => t.position === -1 || t.position < 200).length === 0 ) }
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 shadow-lg"
                >
                  {isRolling ? "Rolling..." :
                    (diceValue && (diceValue !== 6 || currentPlayer?.hasRolledSix) && !currentPlayer?.isAI ? `Rolled ${diceValue}! Select Token` :
                      (diceValue && diceValue === 6 && !currentPlayer?.hasRolledSix && !currentPlayer?.isAI ? `Rolled ${diceValue}! Roll Again / Move` :
                        (currentPlayer?.isAI ? `${currentPlayer.name} (AI) is rolling...` : "Roll Dice")))}
                </Button>
                <p className="text-sm text-foreground/90 min-h-[40px]">{gameMessage}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-center">Player Tokens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {players.map((p) => (
                  <div key={p.color} className={cn("p-2 rounded-lg border-2", currentPlayer?.color === p.color ? "border-accent bg-accent/10" : "border-muted")}>
                    <div className="flex items-center justify-between mb-1">
                        <span className={cn("font-semibold text-base", PLAYER_CONFIG[p.color].textClass)}>{p.name}</span>
                        {p.isAI && <Cpu size={18} className="text-muted-foreground" />}
                    </div>
                    <div className="flex gap-1.5 justify-center">
                      {p.tokens.map(token => (
                        <div key={token.id}
                          title={`Token ${token.id + 1}: ${token.position === -1 ? 'Base' : (token.position === 200 ? 'Home' : `Pos ${token.position}`)}`}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 text-xs flex items-center justify-center text-white font-bold shadow",
                            PLAYER_CONFIG[token.color].baseClass,
                            token.position === 200 ? 'opacity-60 line-through decoration-2 decoration-black' : '',
                            selectedToken?.playerIndex === PLAYER_COLORS.indexOf(p.color) && selectedToken.tokenId === token.id ? 'ring-2 ring-offset-1 ring-purple-500' : ''
                          )}>
                          {token.position === -1 ? 'B' : (token.position === 200 ? <Home size={14} /> : '')}
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
