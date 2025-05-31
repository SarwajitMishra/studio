
"use client";

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Shield, Home, Zap, Users, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const PLAYER_COLORS = ['red', 'green', 'blue', 'yellow'] as const;
type PlayerColor = typeof PLAYER_COLORS[number];

const MAIN_PATH_LENGTH = 52;
const HOME_STRETCH_LENGTH = 6;
const NUM_TOKENS_PER_PLAYER = 4;

const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number }> = {
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 0,  homeEntryPathIndex: 50 },
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 13, homeEntryPathIndex: 11 },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24 },
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 39, homeEntryPathIndex: 37 },
};


const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1: base, 0-51: main path, 100-105+ (color specific for home stretch), 200: finished
}

interface Player {
  color: PlayerColor;
  name: string;
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
    const isAIPlayer = mode === 'ai' && index > 0;
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
    setGameState('playing');
    setGameMessage(`${newPlayers[0].name}'s turn. Click your dice to roll!`);
    if (newPlayers[0].isAI) {
        setGameMessage(`${newPlayers[0].name} (AI) is thinking...`);
        setTimeout(() => handleDiceRoll(), 1500);
    }
  };

  const handleDiceRoll = () => {
    if (isRolling || !currentPlayer) return;
    // If it's a human player, they must be eligible to roll (diceValue is null or they haveRolledSix)
    if (!currentPlayer.isAI && diceValue !== null && !currentPlayer.hasRolledSix) return;


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

  const getMovableTokens = (player: Player, roll: number): Token[] => {
    if (!player) return [];
    return player.tokens.filter(token => {
      if (token.position === -1 && roll === 6) return true;
      if (token.position >= 0 && token.position < 200) {
        return true;
      }
      return false;
    });
  };

  const processDiceRoll = (roll: number) => {
    if (!currentPlayer) return;
    setGameMessage(`${currentPlayer.name} rolled a ${roll}.`);

    let currentP = players[currentPlayerIndex];

    if (roll === 6) {
      const updatedPlayer = { ...currentP, hasRolledSix: true, sixStreak: currentP.sixStreak + 1 };
      const updatedPlayers = players.map((p, idx) => idx === currentPlayerIndex ? updatedPlayer : p);
      setPlayers(updatedPlayers);
      currentP = updatedPlayer;

      if (updatedPlayer.sixStreak === 3) {
        setGameMessage(`${currentP.name} rolled three 6s in a row! Turn forfeited.`);
        setTimeout(() => passTurn(true, true), 1500);
        return;
      }
      setGameMessage(prev => prev + " Gets another turn!");
    }

    const movableTokens = getMovableTokens(currentP, roll);

    if (currentP.tokens.every(t => t.position === -1) && roll !== 6) {
      setGameMessage(prev => prev + ` No valid moves (all tokens in base, need 6). Passing turn.`);
      setTimeout(() => passTurn(true), 1500);
      return;
    }

    if (movableTokens.length === 0) {
       setGameMessage(prev => prev + ` No valid moves. Passing turn.`);
       setTimeout(() => passTurn(roll !== 6), 1500);
       return;
    }

    if (currentP.isAI) {
      setGameMessage(prev => prev + ` AI thinking...`);
      setTimeout(() => {
        let tokenToMoveAI: Token | undefined;
        const tokensInBase = movableTokens.filter(t => t.position === -1);
        
        if (roll === 6 && tokensInBase.length > 0) {
          tokenToMoveAI = tokensInBase[0];
        } else {
          tokenToMoveAI = movableTokens[0];
        }

        if (tokenToMoveAI) {
          attemptMoveToken(currentPlayerIndex, tokenToMoveAI.id, roll);
        } else {
          passTurn(roll !== 6);
        }
      }, 1000);
    } else {
      setGameMessage(prev => prev + ` Select a token to move.`);
    }
  };

  const passTurn = (isTurnEnding = true, turnForfeited = false) => {
    if (players.length === 0 || gameState !== 'playing') return;

    let nextPlayerIdx = currentPlayerIndex;
    const currentP = players[currentPlayerIndex];

    if (turnForfeited) {
        setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, sixStreak: 0, hasRolledSix: false } : p));
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
    } else if (isTurnEnding || !currentP?.hasRolledSix) {
        setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, sixStreak: 0, hasRolledSix: false } : p));
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
    }

    setCurrentPlayerIndex(nextPlayerIdx);
    setDiceValue(null);

    const nextPlayer = players[nextPlayerIdx];
    if (nextPlayer) {
        setGameMessage(`${nextPlayer.name}'s turn. ${nextPlayer.isAI ? 'AI is thinking...' : 'Click your dice to roll!'}`);
        if (nextPlayer.isAI && gameState === 'playing') {
            setTimeout(() => handleDiceRoll(), 1500);
        }
    } else {
        resetGame();
    }
  };

 useEffect(() => {
    if (gameState === 'playing' && players.length > 0 && currentPlayer?.isAI && !diceValue && !isRolling) {
        if (currentPlayer.sixStreak < 3) {
            setGameMessage(`${currentPlayer.name} (AI) is thinking...`);
            setTimeout(() => handleDiceRoll(), 1500);
        }
    }
}, [currentPlayerIndex, players, gameState, diceValue, isRolling, currentPlayer, handleDiceRoll]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !currentPlayer || currentPlayer.isAI) return;

    const token = players[playerIndex].tokens[tokenId];
    const hasTokensInBase = currentPlayer.tokens.some(t => t.position === -1);

    if (diceValue === 6 && hasTokensInBase && token.position !== -1) {
      toast({ variant: "default", title: "Move From Base", description: "You rolled a 6! Please select a token from your base to move out." });
      return;
    }

    if (token.position === -1 && diceValue !== 6) {
      toast({ variant: "destructive", title: "Invalid Move", description: "You need to roll a 6 to bring a token out of base." });
      return;
    }
    if (token.position >= 200) {
      toast({ variant: "default", title: "Token Home", description: "This token has already reached home." });
      return;
    }
    attemptMoveToken(playerIndex, tokenId, diceValue);
  };

  const attemptMoveToken = (playerIdx: number, tokenId: number, roll: number) => {
    setPlayers(prevPlayers => {
      const newPlayers = prevPlayers.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) }));
      let playerToMove = newPlayers[playerIdx];
      if (!playerToMove) return prevPlayers;
      const tokenToMove = playerToMove.tokens.find(t => t.id === tokenId);
      if (!tokenToMove) return prevPlayers;

      const playerConfig = PLAYER_CONFIG[playerToMove.color];
      let moveSuccessful = false;
      const originalPosition = tokenToMove.position;

      if (tokenToMove.position === -1 && roll === 6) {
        tokenToMove.position = playerConfig.pathStartIndex;
        setGameMessage(`${playerToMove.name} brought token ${tokenId + 1} out to square ${tokenToMove.position}!`);
        moveSuccessful = true;
      } else if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH) {
        let currentPosOnGlobalTrack = tokenToMove.position;
        let newPosOnGlobalTrack = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;

        const movesTowardsOrPastHomeEntry = () => {
            const homeEntry = playerConfig.homeEntryPathIndex;
            const start = playerConfig.pathStartIndex;
            if (start > homeEntry) {
                return (currentPosOnGlobalTrack + roll >= MAIN_PATH_LENGTH && newPosOnGlobalTrack >= homeEntry) ||
                       (currentPosOnGlobalTrack <= homeEntry && (currentPosOnGlobalTrack + roll) >= homeEntry) ||
                       (currentPosOnGlobalTrack > homeEntry && (currentPosOnGlobalTrack + roll) >= homeEntry && (currentPosOnGlobalTrack + roll) < MAIN_PATH_LENGTH + HOME_STRETCH_LENGTH );
            } else {
                return (currentPosOnGlobalTrack <= homeEntry && (currentPosOnGlobalTrack + roll) >= homeEntry);
            }
        };

        if (movesTowardsOrPastHomeEntry() && (currentPosOnGlobalTrack + roll) >= playerConfig.homeEntryPathIndex && (currentPosOnGlobalTrack + roll) < playerConfig.homeEntryPathIndex + HOME_STRETCH_LENGTH + 5) {
            tokenToMove.position = 200 + tokenToMove.id;
            setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
            if (newPlayers[playerIdx].tokens.every(t => t.position >= 200)) {
                setGameMessage(`${playerToMove.name} has won the game! Congratulations!`);
                setGameState('gameOver');
                toast({ title: "Game Over!", description: `${playerToMove.name} wins!` });
                return newPlayers; 
            }
        } else {
            tokenToMove.position = newPosOnGlobalTrack;
             setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} from ${originalPosition === -1 ? "base" : originalPosition} to square ${newPosOnGlobalTrack}.`);
        }
        moveSuccessful = true;
      } else if (tokenToMove.position >= 100 && tokenToMove.position < 200) {
        setGameMessage(`${playerToMove.name} token ${tokenId + 1} is in home stretch (movement not fully implemented). Move not processed.`);
        moveSuccessful = false;
      }


      if (moveSuccessful) {
        const potentiallyWinningPlayer = newPlayers[playerIdx];
        if (potentiallyWinningPlayer.tokens.every(t => t.position >= 200)) {
            setGameMessage(`${potentiallyWinningPlayer.name} has won the game! Congratulations!`);
            setGameState('gameOver');
            toast({ title: "Game Over!", description: `${potentiallyWinningPlayer.name} wins!` });
            return newPlayers;
        }

        if (roll === 6) {
          newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true };
          setGameMessage(prev => prev + ` ${playerToMove.name} rolled a 6 and gets another turn. Click your dice!`);
          setDiceValue(null); 
           if (newPlayers[playerIdx].isAI) {
            // AI's re-roll is triggered by useEffect
           }
        } else {
          newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: false, sixStreak: 0 };
          passTurn(true);
        }
      } else {
        if (tokenToMove.position !== -1 && !(tokenToMove.position === -1 && roll === 6)) {
           if(tokenToMove.position < 200 ) {
             toast({ variant: "destructive", title: "Cannot Move Token", description: "This token cannot make the attempted move or its logic is pending." });
           }
        }
        if (roll !== 6) {
            passTurn(true);
        } else {
            newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true };
            setDiceValue(null);
            setGameMessage(prev => prev + ` No move made with 6. ${playerToMove.name} gets to roll again. Click your dice!`);
        }
      }
      return newPlayers;
    });
  };

  const getTokenDisplayInfo = (token: Token): string => {
    if (token.position === -1) return 'B';
    if (token.position >= 200) return 'H';
    if (token.position >= 100 && token.position < 200) return `S${token.position % 100}`;
    return `${token.position}`;
  };

 const getTokenForCell = (cellIndex: number): Token[] => {
    const tokensOnCell: Token[] = [];
    if (!players || players.length === 0) return tokensOnCell;

    players.forEach(player => {
      player.tokens.forEach(token => {
        const playerStartConfig = PLAYER_CONFIG[token.color];

        if (token.position === -1) {
            const baseGridPositions: Record<PlayerColor, number[]> = {
                red:    [1*BOARD_GRID_SIZE + 1, 1*BOARD_GRID_SIZE + 2, 2*BOARD_GRID_SIZE + 1, 2*BOARD_GRID_SIZE + 2],
                green:  [1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), 1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2), 2*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), 2*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2)],
                blue:   [(BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + 1, (BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + 2, (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + 1, (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + 2],
                yellow: [(BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), (BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2), (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2)],
            };
            if (baseGridPositions[token.color] && token.id < baseGridPositions[token.color].length && baseGridPositions[token.color][token.id] === cellIndex) {
                tokensOnCell.push(token);
            }
        } else if (token.position === playerStartConfig.pathStartIndex) {
            let expectedStartCellGridIndex = -1;
            if (token.color === 'red')    expectedStartCellGridIndex = (6 * BOARD_GRID_SIZE + 1);
            else if (token.color === 'green')  expectedStartCellGridIndex = (1 * BOARD_GRID_SIZE + 8);
            else if (token.color === 'yellow') expectedStartCellGridIndex = (8 * BOARD_GRID_SIZE + 13);
            else if (token.color === 'blue')   expectedStartCellGridIndex = (13 * BOARD_GRID_SIZE + 6);
            
            if (cellIndex === expectedStartCellGridIndex) {
                tokensOnCell.push(token);
            }
        }
      });
    });
    return tokensOnCell;
  };


  const getCellBackgroundColor = (cellIndex: number): string => {
    const row = Math.floor(cellIndex / BOARD_GRID_SIZE);
    const col = cellIndex % BOARD_GRID_SIZE;

    if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return PLAYER_CONFIG.red.baseClass + "/70";
    if (row >= 0 && row <= 5 && col >= 9 && col <= 14) return PLAYER_CONFIG.green.baseClass + "/70";
    if (row >= 9 && row <= 14 && col >= 0 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/70";
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return PLAYER_CONFIG.yellow.baseClass + "/70";
    
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return "bg-primary/30";

    if (col === 7 && row >= 1 && row <= 5) return PLAYER_CONFIG.red.baseClass + "/40";
    if (row === 7 && col >= 9 && col <= 13) return PLAYER_CONFIG.green.baseClass + "/40";
    if (col === 7 && row >= 9 && row <= 13) return PLAYER_CONFIG.yellow.baseClass + "/40";
    if (row === 7 && col >= 1 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/40";

    const isPathRowCol = (r: number, c: number): boolean => {
        if ((r === 6 || r === 8) && (c >=0 && c <=14)) return true;
        if (r === 7 && ((c >=0 && c<=5) || (c>=9 && c<=14))) return true;
        if ((c === 6 || c === 8) && (r >=0 && r <=14)) return true;
        if (c === 7 && ((r >=0 && r<=5) || (r>=9 && r<=14))) return true;
        return false;
    }

    if (isPathRowCol(row,col) && 
        !(row >= 6 && row <= 8 && col >= 6 && col <= 8) && 
        !((row >= 0 && row <= 5 && col >= 0 && col <= 5) || 
          (row >= 0 && row <= 5 && col >= 9 && col <= 14) || 
          (row >= 9 && row <= 14 && col >= 0 && col <= 5) || 
          (row >= 9 && row <= 14 && col >= 9 && col <= 14) || 
          (col === 7 && row >= 1 && row <= 5) || 
          (row === 7 && col >= 9 && col <= 13) || 
          (col === 7 && row >= 9 && row <= 13) || 
          (row === 7 && col >= 1 && col <= 5) 
         )
       ) {
        return "bg-slate-50";
    }

    if (row === 6 && col === 1) return PLAYER_CONFIG.red.baseClass + "/90";
    if (row === 1 && col === 8) return PLAYER_CONFIG.green.baseClass + "/90";
    if (row === 8 && col === 13) return PLAYER_CONFIG.yellow.baseClass + "/90";
    if (row === 13 && col === 6) return PLAYER_CONFIG.blue.baseClass + "/90";
    
    return (row + col) % 2 === 0 ? "bg-slate-100/70" : "bg-slate-200/70";
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
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <title>Ludo Game | Shravya Playhouse</title>
      <meta name="description" content="Play the classic game of Ludo online." />
      <Card className="w-full max-w-6xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-center text-primary">Ludo King</CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80 pt-1">
            {gameState === 'gameOver' ? "Game Over!" : "Roll the dice, move your tokens, and race to home!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 flex flex-col lg:flex-row items-start gap-x-6 gap-y-8">
          {/* Board Area */}
          <div className="w-full lg:flex-1 flex flex-col items-center order-1 lg:order-1">
            <div
              className="grid gap-0.5 border-2 border-neutral-700 rounded overflow-hidden shadow-lg bg-neutral-300 w-full max-w-xl aspect-square"
              style={{ gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))` }}
              aria-label="Ludo board"
            >
              {boardCells.map((_, cellIndex) => {
                const tokensOnThisCell = getTokenForCell(cellIndex);
                const cellBg = getCellBackgroundColor(cellIndex);
                
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
                            onClick={() => currentPlayer && !currentPlayer.isAI && diceValue && handleTokenClick(PLAYER_COLORS.indexOf(token.color), token.id)}
                            disabled={
                                !currentPlayer || 
                                PLAYER_COLORS.indexOf(token.color) !== currentPlayerIndex || 
                                isRolling || 
                                !diceValue || 
                                currentPlayer.isAI || 
                                gameState === 'gameOver' ||
                                (token.position === -1 && diceValue !==6) ||
                                token.position >=200 ||
                                (diceValue && !getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id && mt.color === token.color)) ||
                                (diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1) && token.position !== -1)

                            }
                            className={cn(
                                "w-3/4 h-3/4 rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1 absolute shadow-md",
                                PLAYER_CONFIG[token.color].baseClass,
                                (currentPlayer && PLAYER_COLORS.indexOf(token.color) === currentPlayerIndex && diceValue && !currentPlayer.isAI && 
                                 getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id) &&
                                 !(diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1) && token.position !== -1)
                                ) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default",
                                "text-white font-bold text-base z-10",
                                `token-pos-${idx}`
                            )}
                            style={{ 
                                transform: tokensOnThisCell.length > 1 ? (idx === 0 ? 'translateX(-15%) translateY(-15%)' : 'translateX(15%) translateY(15%)') : 'none',
                                width: tokensOnThisCell.length > 1 ? '60%' : '75%',
                                height: tokensOnThisCell.length > 1 ? '60%' : '75%',
                            }}
                            aria-label={`Token ${token.color} ${token.id + 1} at ${token.position === -1 ? 'base' : 'position ' + token.position }`}
                            >
                        </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Full token path rendering on the grid is a future enhancement.
            </p>
          </div>

          {/* Controls/Info Area */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6 order-2 lg:order-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className={cn("text-xl text-center", currentPlayer ? PLAYER_CONFIG[currentPlayer.color].textClass : "")}>
                  { gameState === 'gameOver' ? "Game Over!" : (currentPlayer ? `Turn: ${currentPlayer.name}` : "Loading...") }
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-foreground/90 min-h-[40px]">{gameMessage}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-center">Player Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {players.map((p, playerListIndex) => {
                  const isCurrentPlayer = currentPlayerIndex === playerListIndex;
                  
                  let PlayerDiceIconToRender = Dice6;
                  let diceIconClassName = "text-muted-foreground opacity-50";
                  let diceIsClickable = false;

                  if (isCurrentPlayer) {
                    if (isRolling && diceValue) {
                      PlayerDiceIconToRender = DICE_ICONS[diceValue - 1] || Dice6;
                      diceIconClassName = "text-muted-foreground animate-spin";
                    } else if (diceValue) {
                      PlayerDiceIconToRender = DICE_ICONS[diceValue - 1] || Dice6;
                      diceIconClassName = cn("animate-gentle-bounce", PLAYER_CONFIG[p.color].textClass);
                    } else { 
                      PlayerDiceIconToRender = Dice6;
                      diceIconClassName = cn("cursor-pointer hover:opacity-75", PLAYER_CONFIG[p.color].textClass);
                    }
                    // Determine clickability for current player's dice
                    if (!p.isAI && gameState !== 'gameOver' && !isRolling) {
                        if (diceValue === null || p.hasRolledSix) {
                            diceIsClickable = true;
                        }
                    }
                  } else { 
                     PlayerDiceIconToRender = Dice6;
                     diceIconClassName = "text-muted-foreground opacity-30";
                  }
                  
                  return (
                    <div key={p.color} className={cn("p-3 rounded-lg border-2", isCurrentPlayer ? "border-accent bg-accent/10 shadow-lg" : "border-muted")}>
                      <div className="flex items-center justify-between mb-2">
                          <span className={cn("font-semibold text-lg", PLAYER_CONFIG[p.color].textClass)}>{p.name}</span>
                          {p.isAI && <Cpu size={20} className="text-muted-foreground" />}
                      </div>
                      <div className="flex items-center justify-between">
                          <Button
                              variant="outline"
                              size="icon"
                              className={cn("h-14 w-14 border-2 border-dashed rounded-lg shadow-sm", 
                                diceIsClickable ? cn("cursor-pointer", PLAYER_CONFIG[p.color].baseClass + "/30", `hover:${PLAYER_CONFIG[p.color].baseClass}/50`) : "border-muted-foreground/30 cursor-not-allowed"
                              )}
                              onClick={() => { if(diceIsClickable) handleDiceRoll();}}
                              disabled={!diceIsClickable}
                              aria-label={`Roll dice for ${p.name}`}
                          >
                              <PlayerDiceIconToRender size={36} className={diceIconClassName} />
                          </Button>
                          <div className="flex gap-1.5">
                            {p.tokens.map(token => (
                              <Button
                                key={token.id}
                                variant="outline"
                                size="sm"
                                onClick={() => !p.isAI && diceValue && p.color === currentPlayer?.color && handleTokenClick(playerListIndex, token.id)}
                                disabled={ 
                                  !currentPlayer || p.color !== currentPlayer.color || isRolling || !diceValue || p.isAI || gameState === 'gameOver' ||
                                  (token.position === -1 && diceValue !== 6) || 
                                  token.position >= 200 || 
                                  (diceValue && !getMovableTokens(p, diceValue).some(mt => mt.id === token.id && mt.color === p.color)) ||
                                  (diceValue === 6 && p.tokens.some(t => t.position === -1) && token.position !== -1)
                                }
                                title={`Token ${token.id + 1}: ${getTokenDisplayInfo(token)}`}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 text-xs flex items-center justify-center font-bold shadow",
                                  PLAYER_CONFIG[token.color].baseClass, "text-white",
                                  token.position >= 200 ? 'opacity-60 line-through decoration-2 decoration-black' : '',
                                  (currentPlayer && p.color === currentPlayer.color && !p.isAI && diceValue &&
                                  getMovableTokens(p, diceValue).some(mt => mt.id === token.id) && 
                                  !(diceValue === 6 && p.tokens.some(t => t.position === -1) && token.position !== -1) 
                                  ) ? "ring-2 ring-offset-1 ring-black cursor-pointer" : "cursor-default"
                                )}>
                                {getTokenDisplayInfo(token)}
                              </Button>
                            ))}
                          </div>
                      </div>
                    </div>
                  );
                })}
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

