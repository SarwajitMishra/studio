
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

const MAIN_PATH_LENGTH = 52;
const HOME_STRETCH_LENGTH = 6; // For future use with exact home logic
const NUM_TOKENS_PER_PLAYER = 4;

const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number }> = {
  red: { name: "Red", baseClass: "bg-red-500", textClass: "text-red-700", pathStartIndex: 0, homeEntryPathIndex: 50 }, // Red starts at 0, home entry before 51
  green: { name: "Green", baseClass: "bg-green-500", textClass: "text-green-700", pathStartIndex: 13, homeEntryPathIndex: 11 }, // Green starts at 13, home entry before 12
  blue: { name: "Blue", baseClass: "bg-blue-500", textClass: "text-blue-700", pathStartIndex: 39, homeEntryPathIndex: 37 }, // Blue starts at 39, home entry before 38
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24 }, // Yellow starts at 26, home entry before 25
};


const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1: base, 0-51: main path, 100-105 (red), 110-115 (green) etc for home stretch (future), 200: finished
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
        position: -1, // All tokens start in base
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
    setGameMessage(`${newPlayers[0].name}'s turn. Roll the dice!`);
  };

  const handleDiceRoll = () => {
    if (isRolling || !currentPlayer || (currentPlayer.isAI && gameState === 'playing') || (diceValue !== null && diceValue !== 6 && !currentPlayer.hasRolledSix)) return;

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
      if (token.position === -1 && roll === 6) return true; // Can move out of base
      if (token.position >= 0 && token.position < 200) { // On board or home stretch (future), not yet finished
        // Simplified: any token on board can attempt a move. Real logic would check if move is possible.
        return true;
      }
      return false;
    });
  };

  const processDiceRoll = (roll: number) => {
    if (!currentPlayer) return;
    setGameMessage(`${currentPlayer.name} rolled a ${roll}.`);

    const currentP = players[currentPlayerIndex]; // Ensure we use the latest player state

    if (roll === 6) {
      const updatedPlayer = { ...currentP, hasRolledSix: true, sixStreak: currentP.sixStreak + 1 };
      const updatedPlayers = players.map((p, idx) => idx === currentPlayerIndex ? updatedPlayer : p);
      setPlayers(updatedPlayers);
      
      if (updatedPlayer.sixStreak === 3) {
        setGameMessage(`${currentP.name} rolled three 6s in a row! Turn forfeited.`);
        setTimeout(() => passTurn(true, true), 1500); // Pass turn, forfeit
        return;
      }
      setGameMessage(prev => prev + " Gets another turn!");
    } else {
      const updatedPlayer = { ...currentP, hasRolledSix: false, sixStreak: 0 };
      setPlayers(players.map((p, idx) => idx === currentPlayerIndex ? updatedPlayer : p));
    }
    
    const movableTokens = getMovableTokens(currentP, roll);

    if (currentP.tokens.every(t => t.position === -1) && roll !== 6) { // All in base, not a 6
      setGameMessage(prev => prev + ` No valid moves (all tokens in base, need 6). Passing turn.`);
      setTimeout(() => passTurn(true), 1500);
      return;
    }
    
    if (movableTokens.length === 0) {
       setGameMessage(prev => prev + ` No valid moves. Passing turn.`);
       setTimeout(() => passTurn(roll !== 6), 1500); // Pass if not 6, else player gets another roll
       return;
    }

    // AI Logic
    if (currentP.isAI) {
      setGameMessage(prev => prev + ` AI thinking...`);
      setTimeout(() => {
        let tokenToMoveAI: Token | undefined;
        // AI strategy: if 6 rolled and token in base, prioritize moving out.
        if (roll === 6) {
          tokenToMoveAI = movableTokens.find(t => t.position === -1);
        }
        if (!tokenToMoveAI) {
          tokenToMoveAI = movableTokens[0]; // Move first available token otherwise
        }

        if (tokenToMoveAI) {
          attemptMoveToken(currentPlayerIndex, tokenToMoveAI.id, roll);
        } else {
          // Should not happen if movableTokens.length > 0, but as fallback:
          passTurn(roll !== 6);
        }
      }, 1000);
    }
    // For human player, they will click a token or roll again if diceValue is 6
  };
  
  const passTurn = (isTurnEnding = true, turnForfeited = false) => {
    if (players.length === 0 || gameState !== 'playing') return;

    let nextPlayerIdx = currentPlayerIndex;
    const currentP = players[currentPlayerIndex];

    if (turnForfeited) {
        setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, sixStreak: 0, hasRolledSix: false } : p));
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
    } else if (isTurnEnding || !currentP?.hasRolledSix) { // End turn if not a 6, or if it was a 6 but no more moves / player chose not to re-roll
        setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, sixStreak: 0, hasRolledSix: false } : p));
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
    }
    // If it's not turnEnding and player hasRolledSix, current player remains, diceValue will be null for re-roll.

    setCurrentPlayerIndex(nextPlayerIdx);
    setDiceValue(null); // Reset dice for next player or next roll
    
    if (players[nextPlayerIdx]) {
        setGameMessage(`${players[nextPlayerIdx].name}'s turn. Roll the dice!`);
        if (players[nextPlayerIdx].isAI) {
            setGameMessage(`${players[nextPlayerIdx].name} (AI) is thinking...`);
            setTimeout(() => handleDiceRoll(), 1500); // AI auto-rolls
        }
    } else {
        // This case should ideally not be reached if players array is managed well
        resetGame(); // Fallback to reset if something is wrong with player state
    }
  };

  useEffect(() => {
    // This useEffect handles the AI's first turn if player 0 is AI, or subsequent AI turns after a human player.
    // The passTurn function now also handles AI's next roll directly.
    if (gameState === 'playing' && players.length > 0 && currentPlayer?.isAI && !diceValue && !isRolling) {
      if (gameState === 'playing') { // Double check game state as it might change rapidly
        setGameMessage(`${currentPlayer.name} (AI) is thinking...`);
        setTimeout(() => handleDiceRoll(), 1500);
      }
    }
  }, [currentPlayerIndex, players, gameState, diceValue, isRolling, currentPlayer]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !currentPlayer || currentPlayer.isAI) return;

    const token = players[playerIndex].tokens[tokenId];

    if (token.position === -1 && diceValue !== 6) {
      toast({ variant: "destructive", title: "Invalid Move", description: "You need a 6 to bring a token out of base." });
      return;
    }
    if (token.position >= 200) { // Check for finished tokens (e.g. position 200 for red, 201 for green etc.)
      toast({ variant: "destructive", title: "Invalid Move", description: "This token is already home." });
      return;
    }
    attemptMoveToken(playerIndex, tokenId, diceValue);
  };

  const attemptMoveToken = (playerIdx: number, tokenId: number, roll: number) => {
    setPlayers(prevPlayers => {
      const newPlayers = prevPlayers.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) }));
      const playerToMove = newPlayers[playerIdx];
      if (!playerToMove) return prevPlayers; // Should not happen
      const tokenToMove = playerToMove.tokens.find(t => t.id === tokenId);
      if (!tokenToMove) return prevPlayers; // Should not happen

      const playerConfig = PLAYER_CONFIG[playerToMove.color];
      let moveSuccessful = false;

      if (tokenToMove.position === -1 && roll === 6) { // Moving out of base
        tokenToMove.position = playerConfig.pathStartIndex;
        setGameMessage(`${playerToMove.name} brought token ${tokenId + 1} out!`);
        moveSuccessful = true;
      } else if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH) { // Moving on the main path
        let currentPosOnGlobalTrack = tokenToMove.position;
        let newPosOnGlobalTrack = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;

        // Simplified Home Logic: If it passes its home entry point, mark as home.
        // This needs to be relative to player's path.
        // A token moves from pathStartIndex towards (pathStartIndex - 1 + MAIN_PATH_LENGTH) % MAIN_PATH_LENGTH.
        // Home entry is at homeEntryPathIndex.
        const playerMovesClockwise = true; // Standard Ludo
        
        let madeItHome = false;
        // Crude check: if it lands on or passes its home entry, and roll is enough to enter.
        // Example: Red (start 0, home entry 50). If at 48, rolls 3 -> lands on 51 (which is (48+3)%52).
        // If at 50, rolls 1 -> lands on 0.
        // This simplified logic does not use the homeEntryPathIndex effectively yet for precise home entry.
        // Let's just move along the circular path for now.
        
        // Super simplified "home" logic: if a token reaches its specific home entry point by exact roll (not implemented) or passes it.
        // For this iteration, we'll just move on the main path.
        // A token is "home" if it conceptually completes its journey.
        // Let's consider a token "home" if it moves to or beyond its start index after completing a full lap.
        // This is still not real Ludo home stretch.
        const oldPos = tokenToMove.position;
        tokenToMove.position = newPosOnGlobalTrack;
        
        // Placeholder: If a token, after moving, lands near its starting point again (having completed a lap notionally)
        // AND the original position was far from start, mark as home. This is very rough.
        const distanceToHomeEntry = (playerConfig.homeEntryPathIndex - oldPos + MAIN_PATH_LENGTH) % MAIN_PATH_LENGTH;
        if (roll > distanceToHomeEntry && oldPos !== playerConfig.pathStartIndex) { // Simplistic "passed home entry"
             // This logic is flawed for general circular path.
             // A better temporary simplification:
             // If a player has few tokens left, and a high roll, maybe one token reached home.
             // For now, just move on the path. We'll mark as home IF it reaches position 200 (arbitrary)
             // No, use 200 + color index as a marker for 'finished'.
        }
        
        // Extremely simplified home logic: if it moves "enough" it's home.
        // This will be replaced by proper home stretch logic.
        // For now, let's assume if a token is at its homeEntryPathIndex and rolls exactly to enter home (e.g. 1), it's home.
        // Or if it would pass its starting point after a full lap. This is too complex for a quick fix here.
        // Let's just move it along the circular path. The "200" state will be for a win.

        // If newPosOnGlobalTrack is the player's original start, and it wasn't there before (moved a lot) - crude home.
        // if (newPosOnGlobalTrack === playerConfig.pathStartIndex && oldPos !== playerConfig.pathStartIndex && roll > MAIN_PATH_LENGTH / 2) {
        // tokenToMove.position = 200 + PLAYER_COLORS.indexOf(playerToMove.color);
        // setGameMessage(`${playerToMove.name} token ${tokenId + 1} reached home (simplified)!`);
        // } else {
        tokenToMove.position = newPosOnGlobalTrack;
        setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} to square ${newPosOnGlobalTrack}.`);
        // }
        moveSuccessful = true;

      } else if (tokenToMove.position >= 100 && tokenToMove.position < 200) { // Moving in home stretch (future)
        // Logic for home stretch movement - not yet implemented
        // For now, if in this range, it's stuck until proper logic is added
        setGameMessage(`${playerToMove.name} token ${tokenId + 1} is in home stretch (movement not fully implemented).`);
        moveSuccessful = false; // Or true if partial movement is okay
      }


      if (moveSuccessful) {
        // Check for win condition
        const winner = newPlayers.find(p => p.tokens.every(t => t.position >= 200 || (t.position >= 100 && t.position < 200 && (t.position %10 === HOME_STRETCH_LENGTH)) )); // Crude win check
        if (newPlayers[playerIdx].tokens.every(t => t.position >= 200 || (t.color === playerToMove.color && t.position === (200 + PLAYER_COLORS.indexOf(playerToMove.color))))) {
           // This win condition is not right yet. Needs to be specific to color.
           // A player wins if all their 4 tokens are >= 200 (or a color-specific home marker)
        }
        // Let's use a simpler win condition for now: all tokens have position value 200+
        const playerTokens = newPlayers[playerIdx].tokens;
        if (playerTokens.every(t => t.position >= 200 && t.position < 300 )) { // Using 200-299 for finished state
             setGameMessage(`${playerToMove.name} has won the game! Congratulations!`);
             setGameState('gameOver');
             toast({ title: "Game Over!", description: `${playerToMove.name} wins!` });
             return newPlayers; // Early exit for win
        }


        if (roll === 6) {
          setGameMessage(prev => prev + ` ${playerToMove.name} gets another turn (rolled 6).`);
          if (playerToMove.isAI) {
            passTurn(false); // AI gets to roll again immediately
          } else {
            setDiceValue(null); // Human can choose to roll again or move another token.
          }
        } else {
          passTurn(true); // Pass turn to next player
        }
      } else {
        if (tokenToMove.position !== -1) { // Only show toast if not failing to move from base (already handled by button)
            toast({ variant: "destructive", title: "Cannot Move", description: "This token cannot make that move or logic is pending." });
        }
        return prevPlayers; // Return original state if move is invalid/not successful
      }
      return newPlayers;
    });
  };

  const getTokenDisplayInfo = (token: Token): string => {
    if (token.position === -1) return 'B'; // Base
    if (token.position >= 200 && token.position < 300) return 'H'; // Home (finished)
    if (token.position >= 100 && token.position < 200) return `S${token.position % 10}`; // Home Stretch (future)
    return `${token.position}`; // Position on main path
  };

  const getTokenForCell = (cellIndex: number): Token[] => {
    const tokensOnCell: Token[] = [];
    if (!players || players.length === 0) return tokensOnCell;

    players.forEach(player => {
      player.tokens.forEach(token => {
        // Render tokens on main path
        if (token.position >= 0 && token.position < MAIN_PATH_LENGTH) {
          // This requires a mapping from Ludo path squares to grid cellIndex.
          // This is complex. For now, we'll display tokens under player info, not directly on cells.
          // If you want to show on cell, you need a boardLayout array defining cellIndex for each path point.
        }
        // Base tokens (simplified rendering as before)
        if (token.position === -1) {
            const playerDetails = PLAYER_CONFIG[token.color];
            let baseAreaCell = -1;
            const baseGridPositions = { // cellIndex for token ID 0,1,2,3 in base
                red:    [1*BOARD_GRID_SIZE + 1, 1*BOARD_GRID_SIZE + 2, 2*BOARD_GRID_SIZE + 1, 2*BOARD_GRID_SIZE + 2],
                green:  [1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), 1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2), 2*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), 2*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2)],
                blue:   [(BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + 1, (BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + 2, (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + 1, (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + 2],
                yellow: [(BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), (BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2), (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2)],
            }
            if (baseGridPositions[token.color] && baseGridPositions[token.color][token.id] === cellIndex) {
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

    // Player Bases (corners)
    if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return PLAYER_CONFIG.red.baseClass + "/70"; // Red base area
    if (row >= 0 && row <= 5 && col >= 9 && col <= 14) return PLAYER_CONFIG.green.baseClass + "/70"; // Green base area
    if (row >= 9 && row <= 14 && col >= 0 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/70"; // Blue base area
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return PLAYER_CONFIG.yellow.baseClass + "/70"; // Yellow base area
    
    // Center Home Area
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return "bg-primary/30";

    // Home Stretches (Paths leading to center)
    if (col === 7 && row >= 1 && row <= 5) return PLAYER_CONFIG.red.baseClass + "/40"; // Red home stretch
    if (row === 7 && col >= 9 && col <= 13) return PLAYER_CONFIG.green.baseClass + "/40"; // Green home stretch
    if (col === 7 && row >= 9 && row <= 13) return PLAYER_CONFIG.yellow.baseClass + "/40"; // Yellow home stretch (corrected from blue)
    if (row === 7 && col >= 1 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/40"; // Blue home stretch

    // Main Path Cells (Outer border and cross shape)
    // Top horizontal arm (excluding Green base connection)
    if (row === 6 && (col >= 0 && col <= 5)) return "bg-slate-50";
    // Bottom horizontal arm (excluding Blue base connection)
    if (row === 8 && (col >= 0 && col <= 5)) return "bg-slate-50";
    // Left vertical arm (excluding Red base connection)
    if (col === 6 && (row >= 0 && row <= 5)) return "bg-slate-50";
    // Right vertical arm (excluding Yellow base connection)
    if (col === 8 && (row >= 0 && row <= 5)) return "bg-slate-50";

    // Other arms of the cross
    if (row === 6 && (col >= 9 && col <= 14)) return "bg-slate-50"; // Top horizontal to Green
    if (row === 8 && (col >= 9 && col <= 14)) return "bg-slate-50"; // Bottom horizontal to Yellow
    if (col === 6 && (row >= 9 && row <= 14)) return "bg-slate-50"; // Left vertical to Blue
    if (col === 8 && (row >= 9 && row <= 14)) return "bg-slate-50"; // Right vertical to Red (oops, Yellow side)

    // Start cells coloration
    if (row === 6 && col === 1) return PLAYER_CONFIG.red.baseClass + "/90"; // Red start indicator
    if (row === 1 && col === 8) return PLAYER_CONFIG.green.baseClass + "/90"; // Green start indicator
    if (row === 8 && col === 13) return PLAYER_CONFIG.yellow.baseClass + "/90"; // Yellow start indicator
    if (row === 13 && col === 6) return PLAYER_CONFIG.blue.baseClass + "/90"; // Blue start indicator
    
    // Default for other cells (should be minimal if above covers all path/base)
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
                      "border border-neutral-400/50" // Softer border for cells
                    )}
                  >
                    {tokensOnThisCell.map((token, idx) => (
                         <button
                            key={token.color + token.id}
                            onClick={() => currentPlayer && !currentPlayer.isAI && diceValue && handleTokenClick(PLAYER_COLORS.indexOf(token.color), token.id)}
                            disabled={!currentPlayer || PLAYER_COLORS.indexOf(token.color) !== currentPlayerIndex || isRolling || !diceValue || currentPlayer.isAI || gameState === 'gameOver'}
                            className={cn(
                                "w-3/4 h-3/4 rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1 absolute shadow-md",
                                PLAYER_CONFIG[token.color].baseClass,
                                (currentPlayer && PLAYER_COLORS.indexOf(token.color) === currentPlayerIndex && diceValue && !currentPlayer.isAI) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default",
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
                            {/* Display token ID or icon here - visual representation of tokens on path cells is still TODO */}
                        </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Board rendering is visual. Token path logic on grid is TODO. Movement happens in state.
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
                  disabled={isRolling || gameState === 'gameOver' || !currentPlayer || currentPlayer.isAI || (!!diceValue && diceValue !== 6 && !currentPlayer.hasRolledSix && getMovableTokens(currentPlayer, diceValue).length > 0) || (!!diceValue && currentPlayer.hasRolledSix && getMovableTokens(currentPlayer, diceValue).length === 0 && currentPlayer.tokens.some(t=>t.position === -1))}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 shadow-lg"
                >
                  {isRolling ? "Rolling..." :
                    (diceValue && !currentPlayer?.isAI && (diceValue !== 6 || !currentPlayer.hasRolledSix) && getMovableTokens(currentPlayer, diceValue).length > 0 ? `Rolled ${diceValue}! Select Token` :
                      (diceValue && !currentPlayer?.isAI && diceValue === 6 && currentPlayer.hasRolledSix ? `Rolled ${diceValue}! Roll Again / Move` :
                        (currentPlayer?.isAI ? `${currentPlayer.name} (AI) rolling...` : "Roll Dice")))}
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
                        <Button
                          key={token.id}
                          variant="outline"
                          size="sm"
                          onClick={() => currentPlayer && !currentPlayer.isAI && diceValue && p.color === currentPlayer.color && handleTokenClick(PLAYER_COLORS.indexOf(p.color), token.id)}
                          disabled={!currentPlayer || p.color !== currentPlayer.color || isRolling || !diceValue || currentPlayer.isAI || gameState === 'gameOver' || (token.position === -1 && diceValue !== 6) || token.position >= 200}
                          title={`Token ${token.id + 1}: ${getTokenDisplayInfo(token)}`}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 text-xs flex items-center justify-center font-bold shadow",
                            PLAYER_CONFIG[token.color].baseClass, "text-white",
                            token.position >= 200 ? 'opacity-60 line-through decoration-2 decoration-black' : '',
                            (currentPlayer && p.color === currentPlayer.color && !currentPlayer.isAI && diceValue && getMovableTokens(p, diceValue).some(mt => mt.id === token.id)) ? "ring-2 ring-offset-1 ring-black cursor-pointer" : "cursor-default"
                          )}>
                          {getTokenDisplayInfo(token)}
                        </Button>
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

