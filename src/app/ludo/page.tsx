
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
const HOME_STRETCH_LENGTH = 6;
const NUM_TOKENS_PER_PLAYER = 4;

const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number }> = {
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 0,  homeEntryPathIndex: 50 },
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 13, homeEntryPathIndex: 11 },
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 39, homeEntryPathIndex: 37 }, // Corrected blue start from 26
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24 }, // Corrected yellow start from 39
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
  hasRolledSix: boolean; // True if current turn is due to a 6 or sequence of 6s
  sixStreak: number;    // Counts consecutive 6s in current turn sequence
  isAI?: boolean;
}

type GameState = 'setup' | 'playing' | 'gameOver';
type GameMode = 'offline' | 'ai' | null;

const initialPlayerState = (numPlayersToCreate: number, mode: GameMode): Player[] => {
  const activePlayerColors = PLAYER_COLORS.slice(0, numPlayersToCreate);
  return activePlayerColors.map((color, index) => {
    const isAIPlayer = mode === 'ai' && index > 0; // Player 0 (Red) is human in AI mode
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
    setGameMessage(`${newPlayers[0].name}'s turn. Roll the dice!`);
    if (newPlayers[0].isAI) {
        setGameMessage(`${newPlayers[0].name} (AI) is thinking...`);
        setTimeout(() => handleDiceRoll(), 1500);
    }
  };

  const handleDiceRoll = () => {
    if (isRolling || !currentPlayer || (currentPlayer.isAI && gameState === 'playing' && diceValue !== null) || (diceValue !== null && diceValue !== 6 && !currentPlayer.hasRolledSix)) return;

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
      if (token.position >= 0 && token.position < 200) { // Can move if on board (not home)
        // Add logic here if start square is blocked or home path is blocked
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
      currentP = updatedPlayer; // Use the updated player state for subsequent logic

      if (updatedPlayer.sixStreak === 3) {
        setGameMessage(`${currentP.name} rolled three 6s in a row! Turn forfeited.`);
        setTimeout(() => passTurn(true, true), 1500); // Pass turn, isTurnEnding=true, turnForfeited=true
        return;
      }
      setGameMessage(prev => prev + " Gets another turn!");
    } else {
      // If not a 6, this roll does not grant another turn on its own.
      // hasRolledSix is set to false for the player *after* this move, in attemptMoveToken or passTurn if no move.
      // sixStreak is reset in attemptMoveToken or passTurn.
    }

    const movableTokens = getMovableTokens(currentP, roll);

    if (currentP.tokens.every(t => t.position === -1) && roll !== 6) {
      setGameMessage(prev => prev + ` No valid moves (all tokens in base, need 6). Passing turn.`);
      setTimeout(() => passTurn(true), 1500);
      return;
    }

    if (movableTokens.length === 0) {
       setGameMessage(prev => prev + ` No valid moves. Passing turn.`);
       setTimeout(() => passTurn(roll !== 6), 1500); // Pass if not a 6, otherwise re-roll handled by player state
       return;
    }

    // AI Logic
    if (currentP.isAI) {
      setGameMessage(prev => prev + ` AI thinking...`);
      setTimeout(() => {
        let tokenToMoveAI: Token | undefined;
        const tokensInBase = movableTokens.filter(t => t.position === -1);
        
        if (roll === 6 && tokensInBase.length > 0) {
          tokenToMoveAI = tokensInBase[0]; // Prioritize moving from base
        } else {
          tokenToMoveAI = movableTokens[0]; // Else, move the first available valid token
        }

        if (tokenToMoveAI) {
          attemptMoveToken(currentPlayerIndex, tokenToMoveAI.id, roll);
        } else {
          // This case (AI has movable tokens list but can't select one) should be rare given above logic
          // Unless all movable tokens can't actually complete their move (e.g. blocked at home stretch)
          passTurn(roll !== 6);
        }
      }, 1000);
    } else {
      // Human player: they will click a token.
      // If roll is 6, hasRolledSix state is true for them.
      // If roll is not 6, hasRolledSix becomes false *after* this move or if turn passes.
      // No immediate action here, wait for token click.
    }
  };

  const passTurn = (isTurnEnding = true, turnForfeited = false) => {
    if (players.length === 0 || gameState !== 'playing') return;

    let nextPlayerIdx = currentPlayerIndex;
    const currentP = players[currentPlayerIndex];

    if (turnForfeited) {
        // Reset six streak and hasRolledSix for the forfeiting player
        setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, sixStreak: 0, hasRolledSix: false } : p));
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
    } else if (isTurnEnding || !currentP?.hasRolledSix) {
        // If the turn is definitively ending (not a 6, or player didn't have hasRolledSix from a previous 6)
        // Reset six streak and hasRolledSix for the current player before moving to next.
        setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, sixStreak: 0, hasRolledSix: false } : p));
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
    }
    // If isTurnEnding is false AND currentP.hasRolledSix is true, it means current player gets another roll.
    // In this case, nextPlayerIdx remains currentPlayerIndex, and their hasRolledSix & sixStreak remains.

    setCurrentPlayerIndex(nextPlayerIdx);
    setDiceValue(null);

    const nextPlayer = players[nextPlayerIdx];
    if (nextPlayer) {
        setGameMessage(`${nextPlayer.name}'s turn. Roll the dice!`);
        if (nextPlayer.isAI && gameState === 'playing') {
            setGameMessage(`${nextPlayer.name} (AI) is thinking...`);
            setTimeout(() => handleDiceRoll(), 1500);
        }
    } else {
        // Should not happen if players array is not empty
        resetGame();
    }
  };

 useEffect(() => {
    // This effect is mainly to trigger AI's first roll if it becomes their turn and dice is null.
    // Subsequent AI rolls (after a 6) are handled within attemptMoveToken -> passTurn(false) -> this effect.
    if (gameState === 'playing' && players.length > 0 && currentPlayer?.isAI && !diceValue && !isRolling) {
        if (currentPlayer.sixStreak < 3) { // Don't roll if turn was forfeited by 3 sixes
            setGameMessage(`${currentPlayer.name} (AI) is thinking...`);
            setTimeout(() => handleDiceRoll(), 1500);
        }
    }
}, [currentPlayerIndex, players, gameState, diceValue, isRolling, currentPlayer]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !currentPlayer || currentPlayer.isAI) return;

    const token = players[playerIndex].tokens[tokenId];
    const hasTokensInBase = currentPlayer.tokens.some(t => t.position === -1);

    // Standard Rule: If rolled a 6, has tokens in base, player MUST try to move a token from base.
    // (Assuming start square is not blocked by two of their own tokens - that logic is not yet implemented)
    if (diceValue === 6 && hasTokensInBase && token.position !== -1) {
      toast({ variant: "default", title: "Move From Base", description: "You rolled a 6! Please select a token from your base to move out." });
      return;
    }

    if (token.position === -1 && diceValue !== 6) {
      toast({ variant: "destructive", title: "Invalid Move", description: "You need to roll a 6 to bring a token out of base." });
      return;
    }
    if (token.position >= 200) { // Assuming 200+ is home
      toast({ variant: "default", title: "Token Home", description: "This token has already reached home." });
      return;
    }
    attemptMoveToken(playerIndex, tokenId, diceValue);
  };

  const attemptMoveToken = (playerIdx: number, tokenId: number, roll: number) => {
    setPlayers(prevPlayers => {
      const newPlayers = prevPlayers.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) })); // Deep copy
      let playerToMove = newPlayers[playerIdx];
      if (!playerToMove) return prevPlayers;
      const tokenToMove = playerToMove.tokens.find(t => t.id === tokenId);
      if (!tokenToMove) return prevPlayers;

      const playerConfig = PLAYER_CONFIG[playerToMove.color];
      let moveSuccessful = false;
      const originalPosition = tokenToMove.position; // For message

      if (tokenToMove.position === -1 && roll === 6) {
        // Moving out of base
        tokenToMove.position = playerConfig.pathStartIndex;
        setGameMessage(`${playerToMove.name} brought token ${tokenId + 1} out to square ${tokenToMove.position}!`);
        moveSuccessful = true;
      } else if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH) {
        // Moving on the main path
        let currentPosOnGlobalTrack = tokenToMove.position;
        let newPosOnGlobalTrack = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;

        // Simplified Home Entry Logic (Placeholder - needs proper home stretch path)
        // This logic is naive and doesn't handle the actual home stretch correctly.
        // It assumes if a move passes the entry point, it goes "towards home".
        const movesTowardsOrPastHomeEntry = () => {
            const homeEntry = playerConfig.homeEntryPathIndex;
            const start = playerConfig.pathStartIndex;
            
            if (start > homeEntry) { // Path wraps around 0 (e.g. Red player)
                return (currentPosOnGlobalTrack + roll >= MAIN_PATH_LENGTH && newPosOnGlobalTrack >= homeEntry) || // Wrapped past 0 and landed on/after entry
                       (currentPosOnGlobalTrack <= homeEntry && (currentPosOnGlobalTrack + roll) >= homeEntry) || // Directly landed on/past entry before wrap
                       (currentPosOnGlobalTrack > homeEntry && (currentPosOnGlobalTrack + roll) >= homeEntry && (currentPosOnGlobalTrack + roll) < MAIN_PATH_LENGTH + HOME_STRETCH_LENGTH ); // Moved past entry but not too far
            } else { // Path does not wrap around 0 before entry (e.g. Green, Yellow, Blue)
                return (currentPosOnGlobalTrack <= homeEntry && (currentPosOnGlobalTrack + roll) >= homeEntry);
            }
        };

        if (movesTowardsOrPastHomeEntry() && (currentPosOnGlobalTrack + roll) >= playerConfig.homeEntryPathIndex && (currentPosOnGlobalTrack + roll) < playerConfig.homeEntryPathIndex + HOME_STRETCH_LENGTH + 5 /*buffer for simplified logic*/) {
            // Extremely simplified: If move lands on/past home entry, consider it home.
            // This needs to be replaced with actual home stretch logic.
            tokenToMove.position = 200 + tokenToMove.id; // Mark as home (unique to avoid clashes if all go to 200)
            setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
             // Check for win after moving home
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
        // Placeholder for capture logic: check newPlayers at newPosOnGlobalTrack
      } else if (tokenToMove.position >= 100 && tokenToMove.position < 200) {
        // Placeholder for actual home stretch movement
        setGameMessage(`${playerToMove.name} token ${tokenId + 1} is in home stretch (movement not fully implemented). Move not processed.`);
        moveSuccessful = false; // For now, don't process these moves further
      }


      if (moveSuccessful) {
        // Check win condition again here, in case a non-home move made the player win (unlikely with current simple home)
        const potentiallyWinningPlayer = newPlayers[playerIdx];
        if (potentiallyWinningPlayer.tokens.every(t => t.position >= 200)) {
            setGameMessage(`${potentiallyWinningPlayer.name} has won the game! Congratulations!`);
            setGameState('gameOver');
            toast({ title: "Game Over!", description: `${potentiallyWinningPlayer.name} wins!` });
            return newPlayers;
        }

        if (roll === 6) {
          // Player gets another turn
          newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true }; // Keep sixStreak, hasRolledSix is true
          setGameMessage(prev => prev + ` ${playerToMove.name} rolled a 6 and gets another turn.`);
          setDiceValue(null); // Reset dice for the re-roll
          // AI will auto-roll via useEffect. Human player's "Roll Dice" button will be enabled.
          // passTurn(false) is implicitly handled by not changing player and AI useEffect.
           if (newPlayers[playerIdx].isAI) {
             // AI's re-roll is triggered by useEffect when diceValue becomes null for current AI player
           }
        } else {
          // Turn ends, reset hasRolledSix and sixStreak for current player
          newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: false, sixStreak: 0 };
          passTurn(true); // End turn, pass to next player
        }
      } else {
        // If move was not successful but a roll happened (e.g. trying to move from home stretch, invalid)
        if (tokenToMove.position !== -1 && !(tokenToMove.position === -1 && roll === 6)) {
          // Only toast if it wasn't the "need 6 from base" scenario (already handled by handleTokenClick)
          // or trying to move an already home token
           if(tokenToMove.position < 200 ) { // Don't toast for already home tokens
             toast({ variant: "destructive", title: "Cannot Move Token", description: "This token cannot make the attempted move or its logic is pending." });
           }
        }
        // If a move wasn't successful, and it wasn't a 6, the turn should still pass.
        // If it was a 6, the player should still get to re-roll if they couldn't make a move.
        // This part needs careful consideration: if no move is possible on a 6, do you re-roll or lose turn?
        // Standard: if you roll a 6 and CANNOT make any valid move with it (e.g. all pieces blocked), you still get to re-roll.
        // If you roll NOT a 6 and CANNOT make any valid move, turn passes.
        if (roll !== 6) {
            passTurn(true);
        } else {
            // Rolled a 6 but no move was made. Player should get to re-roll.
            newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true };
            setDiceValue(null); // Allow re-roll
            setGameMessage(prev => prev + ` No move made with 6. ${playerToMove.name} gets to roll again.`);
        }
        // Return current players state if no move was made, or the dice needs to be re-rolled by same player
        // return prevPlayers; // This would revert token state. We want to keep player state (like sixStreak) but just not move.
        // The newPlayers state includes updated sixStreak/hasRolledSix even if move itself failed.
      }
      return newPlayers;
    });
  };

  const getTokenDisplayInfo = (token: Token): string => {
    if (token.position === -1) return 'B'; // Base
    if (token.position >= 200) return 'H'; // Home (finished)
    if (token.position >= 100 && token.position < 200) return `S${token.position % 100}`; // Home Stretch (simplified)
    return `${token.position}`; // On main path
  };

 const getTokenForCell = (cellIndex: number): Token[] => {
    const tokensOnCell: Token[] = [];
    if (!players || players.length === 0) return tokensOnCell;

    players.forEach(player => {
      player.tokens.forEach(token => {
        const playerStartConfig = PLAYER_CONFIG[token.color];

        if (token.position === -1) { // Token in base
            const baseGridPositions: Record<PlayerColor, number[]> = { // Example mapping to 2x2 area in each corner
                red:    [1*BOARD_GRID_SIZE + 1, 1*BOARD_GRID_SIZE + 2, 2*BOARD_GRID_SIZE + 1, 2*BOARD_GRID_SIZE + 2],
                green:  [1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), 1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2), 2*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), 2*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2)],
                blue:   [(BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + 1, (BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + 2, (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + 1, (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + 2],
                yellow: [(BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), (BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2), (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2)],
            };
            // Ensure token.id is within bounds for baseGridPositions
            if (baseGridPositions[token.color] && token.id < baseGridPositions[token.color].length && baseGridPositions[token.color][token.id] === cellIndex) {
                tokensOnCell.push(token);
            }
        } else if (token.position === playerStartConfig.pathStartIndex) { // Token at its specific start cell on the path
            // Define the grid cell index for each player's start square on the visual board
            let expectedStartCellGridIndex = -1;
            if (token.color === 'red')    expectedStartCellGridIndex = (6 * BOARD_GRID_SIZE + 1);  // Row 6, Col 1
            else if (token.color === 'green')  expectedStartCellGridIndex = (1 * BOARD_GRID_SIZE + 8);  // Row 1, Col 8
            else if (token.color === 'yellow') expectedStartCellGridIndex = (8 * BOARD_GRID_SIZE + 13); // Row 8, Col 13
            else if (token.color === 'blue')   expectedStartCellGridIndex = (13 * BOARD_GRID_SIZE + 6); // Row 13, Col 6
            
            if (cellIndex === expectedStartCellGridIndex) {
                tokensOnCell.push(token);
            }
        }
        // TODO: else if (token.position >= 0 && token.position < MAIN_PATH_LENGTH) {
        // This is where you'd map token.position (0-51) to a specific cellIndex for rendering on the path.
        // This requires a Ludo path to grid cell mapping array/logic.
        // For now, tokens on path (other than start) won't be visually rendered on the grid.
        // }
      });
    });
    return tokensOnCell;
  };


  const getCellBackgroundColor = (cellIndex: number): string => {
    const row = Math.floor(cellIndex / BOARD_GRID_SIZE);
    const col = cellIndex % BOARD_GRID_SIZE;

    // Player Bases (larger 6x6 corner areas)
    if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return PLAYER_CONFIG.red.baseClass + "/70"; // Red Base
    if (row >= 0 && row <= 5 && col >= 9 && col <= 14) return PLAYER_CONFIG.green.baseClass + "/70"; // Green Base
    if (row >= 9 && row <= 14 && col >= 0 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/70"; // Blue Base
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return PLAYER_CONFIG.yellow.baseClass + "/70"; // Yellow Base
    
    // Center Home Area (3x3)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return "bg-primary/30"; // Center triangle area

    // Home Stretches (arms leading to center)
    // Red home stretch (vertical path in column 7, rows 1 to 5)
    if (col === 7 && row >= 1 && row <= 5) return PLAYER_CONFIG.red.baseClass + "/40";
    // Green home stretch (horizontal path in row 7, columns 9 to 13)
    if (row === 7 && col >= 9 && col <= 13) return PLAYER_CONFIG.green.baseClass + "/40";
    // Yellow home stretch (vertical path in column 7, rows 9 to 13)
    if (col === 7 && row >= 9 && row <= 13) return PLAYER_CONFIG.yellow.baseClass + "/40";
    // Blue home stretch (horizontal path in row 7, columns 1 to 5)
    if (row === 7 && col >= 1 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/40";

    // Main Path Cells (the cross shape, excluding bases, home stretches, and center)
    // This is a simplified coloring. A precise path definition is needed for exact path squares.
    const isPathRowCol = (r: number, c: number): boolean => {
        // Horizontal parts of the cross (rows 6, 7, 8)
        if ((r === 6 || r === 8) && (c >=0 && c <=14)) return true; // Top and bottom arms of cross
        if (r === 7 && ((c >=0 && c<=5) || (c>=9 && c<=14))) return true; // Middle parts of horizontal arm
        // Vertical parts of the cross (columns 6, 7, 8)
        if ((c === 6 || c === 8) && (r >=0 && r <=14)) return true; // Left and right arms of cross
        if (c === 7 && ((r >=0 && r<=5) || (r>=9 && r<=14))) return true; // Middle parts of vertical arm
        return false;
    }

    if (isPathRowCol(row,col) && 
        !(row >= 6 && row <= 8 && col >= 6 && col <= 8) && // not center
        !((row >= 0 && row <= 5 && col >= 0 && col <= 5) || // not red base
          (row >= 0 && row <= 5 && col >= 9 && col <= 14) || // not green base
          (row >= 9 && row <= 14 && col >= 0 && col <= 5) || // not blue base
          (row >= 9 && row <= 14 && col >= 9 && col <= 14) || // not yellow base
          (col === 7 && row >= 1 && row <= 5) || // not red home stretch
          (row === 7 && col >= 9 && col <= 13) || // not green home stretch
          (col === 7 && row >= 9 && row <= 13) || // not yellow home stretch
          (row === 7 && col >= 1 && col <= 5) // not blue home stretch
         )
       ) {
        return "bg-slate-50"; // General path color
    }

    // Player Start Squares (specific single squares on the path outside base)
    if (row === 6 && col === 1) return PLAYER_CONFIG.red.baseClass + "/90"; // Red Start
    if (row === 1 && col === 8) return PLAYER_CONFIG.green.baseClass + "/90"; // Green Start
    if (row === 8 && col === 13) return PLAYER_CONFIG.yellow.baseClass + "/90"; // Yellow Start
    if (row === 13 && col === 6) return PLAYER_CONFIG.blue.baseClass + "/90"; // Blue Start
    
    // Default for unused cells or inner base cells not covered by 2x2 token rendering
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
                  {[2, 4].map(num => ( // Only 2 or 4 players for AI mode (1 human + 1 AI, or 1 human + 3 AI)
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

  const DiceIconComponent = diceValue ? DICE_ICONS[diceValue - 1] : Dice6;

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
                      "border border-neutral-400/50" // Cell border
                    )}
                  >
                    {tokensOnThisCell.map((token, idx) => (
                         <button
                            key={token.color + token.id}
                            onClick={() => currentPlayer && !currentPlayer.isAI && diceValue && handleTokenClick(PLAYER_COLORS.indexOf(token.color), token.id)}
                            // Disable if not current player, AI turn, no dice, game over, or invalid move for this token
                            disabled={
                                !currentPlayer || 
                                PLAYER_COLORS.indexOf(token.color) !== currentPlayerIndex || 
                                isRolling || 
                                !diceValue || 
                                currentPlayer.isAI || 
                                gameState === 'gameOver' ||
                                (token.position === -1 && diceValue !==6) || // Cannot click base token without a 6
                                token.position >=200 || // Cannot click home token
                                // Cannot click if this specific token is not in the list of movable tokens for the current roll
                                (diceValue && !getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id && mt.color === token.color)) ||
                                // If rolled 6, has tokens in base, but this token is NOT a base token
                                (diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1) && token.position !== -1)

                            }
                            className={cn(
                                "w-3/4 h-3/4 rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1 absolute shadow-md",
                                PLAYER_CONFIG[token.color].baseClass,
                                (currentPlayer && PLAYER_COLORS.indexOf(token.color) === currentPlayerIndex && diceValue && !currentPlayer.isAI && 
                                 getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id) &&
                                 !(diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1) && token.position !== -1) // Not highlighted if forced to move from base
                                ) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default",
                                "text-white font-bold text-base z-10",
                                `token-pos-${idx}` // For potential stacking adjustments
                            )}
                            style={{ // Basic stacking visual
                                transform: tokensOnThisCell.length > 1 ? (idx === 0 ? 'translateX(-15%) translateY(-15%)' : 'translateX(15%) translateY(15%)') : 'none',
                                width: tokensOnThisCell.length > 1 ? '60%' : '75%',
                                height: tokensOnThisCell.length > 1 ? '60%' : '75%',
                            }}
                            aria-label={`Token ${token.color} ${token.id + 1} at ${token.position === -1 ? 'base' : 'position ' + token.position }`}
                            >
                            {/* {token.id + 1} // Display token ID number if needed */}
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
                <div className="flex justify-center items-center h-20 w-20 mx-auto border-4 border-dashed border-accent rounded-lg bg-background shadow-inner">
                  {isRolling && diceValue ? (
                    <DiceIconComponent size={60} className="text-muted-foreground animate-spin" />
                  ) : !isRolling && diceValue ? (
                    <DiceIconComponent size={60} className={cn("text-accent animate-gentle-bounce", currentPlayer ? PLAYER_CONFIG[currentPlayer.color].textClass: "text-accent")} />
                  ) : (
                    <Dice6 size={60} className="text-muted-foreground opacity-50" />
                  )}
                </div>
                <Button
                  onClick={handleDiceRoll}
                  disabled={
                    isRolling ||
                    gameState === 'gameOver' ||
                    !currentPlayer ||
                    currentPlayer.isAI ||
                    // Disable if dice already rolled and human player must make a move (unless it's a re-roll from a 6)
                    (!!diceValue && !currentPlayer.isAI && !currentPlayer.hasRolledSix && getMovableTokens(currentPlayer, diceValue).length > 0)
                  }
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 shadow-lg"
                >
                  {isRolling ? "Rolling..." :
                    (diceValue && !currentPlayer?.isAI && !currentPlayer.hasRolledSix && getMovableTokens(currentPlayer, diceValue).length > 0 ? `Rolled ${diceValue}! Select Token` :
                    (diceValue && !currentPlayer?.isAI && currentPlayer.hasRolledSix ? `Rolled ${diceValue}! Roll Again / Move` :
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
                {players.map((p, playerListIndex) => (
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
                          onClick={() => currentPlayer && !currentPlayer.isAI && diceValue && p.color === currentPlayer.color && handleTokenClick(playerListIndex, token.id)}
                          disabled={ // More specific disabling for token buttons
                            !currentPlayer || p.color !== currentPlayer.color || isRolling || !diceValue || currentPlayer.isAI || gameState === 'gameOver' ||
                            (token.position === -1 && diceValue !== 6) || // Cannot click base token without a 6
                            token.position >= 200 || // Cannot click home token
                            // Disable if this token is not in the list of strictly movable tokens for the current roll AND current game situation
                            (diceValue && !getMovableTokens(p, diceValue).some(mt => mt.id === token.id && mt.color === p.color)) ||
                            // Specifically disable on-board tokens if player rolled 6 and has tokens in base (must move from base)
                            (diceValue === 6 && p.tokens.some(t => t.position === -1) && token.position !== -1)
                          }
                          title={`Token ${token.id + 1}: ${getTokenDisplayInfo(token)}`}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 text-xs flex items-center justify-center font-bold shadow",
                            PLAYER_CONFIG[token.color].baseClass, "text-white",
                            token.position >= 200 ? 'opacity-60 line-through decoration-2 decoration-black' : '',
                            // Highlight if it's a valid clickable token
                            (currentPlayer && p.color === currentPlayer.color && !currentPlayer.isAI && diceValue &&
                             getMovableTokens(p, diceValue).some(mt => mt.id === token.id) && // Is generally movable
                             !(diceValue === 6 && p.tokens.some(t => t.position === -1) && token.position !== -1) // And not an on-board token when forced to move from base
                            ) ? "ring-2 ring-offset-1 ring-black cursor-pointer" : "cursor-default"
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
