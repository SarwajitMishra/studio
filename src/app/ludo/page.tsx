
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
    const isAIPlayer = mode === 'ai' && index > 0; // In AI mode, player 0 is human, others are AI
    return {
      color,
      name: isAIPlayer ? `Shravya AI (${PLAYER_CONFIG[color].name})` : PLAYER_CONFIG[color].name,
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
        setGameMessage(`${newPlayers[0].name} is thinking...`);
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
      if (token.position === -1 && roll === 6) return true; // Can move from base if 6 is rolled
      if (token.position >= 0 && token.position < 200) { // Can move if on board and not home
        // Basic check: assumes token can always move forward by `roll` steps for now.
        // More complex logic would check if the home stretch path is blocked or if exact roll is needed.
        // For simplification, if token is in home stretch (e.g., 100-105), it's considered movable if not at 105.
        if (token.position >= 100 && token.position < (100 + HOME_STRETCH_LENGTH -1) ) return true;
        if (token.position >= 0 && token.position < MAIN_PATH_LENGTH) return true;
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
      currentP = updatedPlayer; // Use the updated player for subsequent logic in this function

      if (updatedPlayer.sixStreak === 3) {
        setGameMessage(`${currentP.name} rolled three 6s in a row! Turn forfeited.`);
        setTimeout(() => passTurn(true, true), 1500); // Pass turn and forfeit
        return;
      }
      // Don't add "Gets another turn!" here yet, it's added after a successful move or if no move possible
    }

    const movableTokens = getMovableTokens(currentP, roll);

    // Scenario: All tokens in base, and not a 6
    if (currentP.tokens.every(t => t.position === -1) && roll !== 6) {
      setGameMessage(prev => prev + ` No valid moves (all tokens in base, need 6). Passing turn.`);
      setTimeout(() => passTurn(true), 1500); // Pass turn, not a forfeit
      return;
    }

    // Scenario: No movable tokens (e.g., all on board but blocked, or in base and not a 6)
    if (movableTokens.length === 0) {
       setGameMessage(prev => prev + ` No valid moves. Passing turn.`);
       // If a 6 was rolled, they still get another turn. Otherwise, pass turn.
       setTimeout(() => passTurn(roll !== 6), 1500);
       return;
    }

    // If it's an AI player's turn
    if (currentP.isAI) {
      setGameMessage(prev => prev + ` AI thinking...`);
      setTimeout(() => {
        let tokenToMoveAI: Token | undefined;
        const tokensInBase = movableTokens.filter(t => t.position === -1);
        
        // Prioritize moving from base if 6 is rolled and tokens are in base
        if (roll === 6 && tokensInBase.length > 0) {
          tokenToMoveAI = tokensInBase[0]; // AI picks the first available token from base
        } else {
          // Otherwise, AI picks the first movable token (can be improved with strategy)
          tokenToMoveAI = movableTokens[0];
        }

        if (tokenToMoveAI) {
          attemptMoveToken(currentPlayerIndex, tokenToMoveAI.id, roll);
        } else {
          // Should not happen if movableTokens.length > 0, but as a fallback:
          passTurn(roll !== 6);
        }
      }, 1000); // AI "thinking" time
    } else {
      // Human player's turn
      setGameMessage(prev => prev + ` Select a token to move.`);
      // If it was a 6 and player has tokens in base, remind them
      if (roll === 6 && currentP.tokens.some(t => t.position === -1)) {
          setGameMessage(prev => prev + ` You must move a token from base if possible.`);
      }
    }
  };

  const passTurn = (isTurnEnding = true, turnForfeited = false) => {
    if (players.length === 0 || gameState !== 'playing') return;

    let nextPlayerIdx = currentPlayerIndex;
    const currentP = players[currentPlayerIndex];

    if (turnForfeited) {
        // Reset six streak and hasRolledSix for the current player as their turn is forfeited
        setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, sixStreak: 0, hasRolledSix: false } : p));
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
    } else if (isTurnEnding || !currentP?.hasRolledSix) {
        // If turn is ending (e.g. not a 6, or move made after 6) OR if it wasn't a 6 to begin with
        setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, sixStreak: 0, hasRolledSix: false } : p));
        nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
    }
    // If it was a 6 and hasRolledSix is true, and isTurnEnding is false (meaning they get another turn),
    // currentPlayerIndex remains the same, and their hasRolledSix and sixStreak are preserved.

    setCurrentPlayerIndex(nextPlayerIdx);
    setDiceValue(null); // Reset dice for the next player or for the re-roll

    const nextPlayer = players[nextPlayerIdx];
    if (nextPlayer) {
        setGameMessage(`${nextPlayer.name}'s turn. ${nextPlayer.isAI ? 'AI is thinking...' : 'Click your dice to roll!'}`);
        if (nextPlayer.isAI && gameState === 'playing') {
            // AI's turn is triggered by useEffect watching currentPlayerIndex if it's AI
        }
    } else {
        // Should not happen if players array is not empty
        console.error("Next player not found, resetting game.");
        resetGame();
    }
  };

 // useEffect to handle AI's turn initiation
 useEffect(() => {
    if (gameState === 'playing' && players.length > 0 && currentPlayer?.isAI && !diceValue && !isRolling) {
        // Check if AI can actually roll (e.g. not forfeited by 3 sixes, which should be handled by processDiceRoll)
        // This effect essentially triggers the AI's first roll or subsequent rolls after a 6.
        if (currentPlayer.sixStreak < 3) { // Ensure AI hasn't forfeited turn
            setGameMessage(`${currentPlayer.name} is thinking...`);
            setTimeout(() => handleDiceRoll(), 1500); // AI "thinking" time before roll
        }
    }
// Ensure all dependencies that could trigger an AI turn are listed.
// Specifically, when currentPlayerIndex changes to an AI, or when diceValue is reset for an AI's re-roll.
}, [currentPlayerIndex, players, gameState, diceValue, isRolling, currentPlayer, handleDiceRoll]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !currentPlayer || currentPlayer.isAI) return;

    const token = players[playerIndex].tokens[tokenId];
    const hasTokensInBase = currentPlayer.tokens.some(t => t.position === -1);

    // Rule: If rolled a 6 and has tokens in base, must try to move a token from base.
    if (diceValue === 6 && hasTokensInBase && token.position !== -1) {
      toast({ variant: "default", title: "Move From Base", description: "You rolled a 6! Please select a token from your base to move out." });
      return;
    }

    if (token.position === -1 && diceValue !== 6) {
      toast({ variant: "destructive", title: "Invalid Move", description: "You need to roll a 6 to bring a token out of base." });
      return;
    }
    if (token.position >= 200) { // Token is already home
      toast({ variant: "default", title: "Token Home", description: "This token has already reached home." });
      return;
    }
    attemptMoveToken(playerIndex, tokenId, diceValue);
  };

  const attemptMoveToken = (playerIdx: number, tokenId: number, roll: number) => {
    setPlayers(prevPlayers => {
      const newPlayers = prevPlayers.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) })); // Deep copy
      let playerToMove = newPlayers[playerIdx];
      if (!playerToMove) return prevPlayers; // Should not happen
      const tokenToMove = playerToMove.tokens.find(t => t.id === tokenId);
      if (!tokenToMove) return prevPlayers; // Should not happen

      const playerConfig = PLAYER_CONFIG[playerToMove.color];
      let moveSuccessful = false;
      const originalPosition = tokenToMove.position;

      if (tokenToMove.position === -1 && roll === 6) { // Moving from base
        tokenToMove.position = playerConfig.pathStartIndex;
        setGameMessage(`${playerToMove.name} brought token ${tokenId + 1} out to square ${tokenToMove.position}!`);
        moveSuccessful = true;
      } else if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH) { // Moving on the main path
        let currentPosOnGlobalTrack = tokenToMove.position;
        let newPosOnGlobalTrack = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;

        // Simplified: Check if the move crosses or lands on the player's home entry point
        // This needs to account for the circular path and player-specific home entry.
        const homeEntry = playerConfig.homeEntryPathIndex;
        const start = playerConfig.pathStartIndex;
        let stepsToHomeEntry;

        if (currentPosOnGlobalTrack >= start) { // Token is on or after its start on the current lap
            stepsToHomeEntry = homeEntry >= currentPosOnGlobalTrack ? homeEntry - currentPosOnGlobalTrack : (MAIN_PATH_LENGTH - currentPosOnGlobalTrack) + homeEntry;
        } else { // Token has lapped and is before its start square on the current lap
            stepsToHomeEntry = homeEntry - currentPosOnGlobalTrack;
        }
        
        if (roll > stepsToHomeEntry && stepsToHomeEntry < HOME_STRETCH_LENGTH) { 
            // Simplification: If roll overshoots home entry but within home stretch length, consider it home.
            // Proper logic: move into home stretch by (roll - stepsToHomeEntry) squares.
            // For now, just mark as home.
            const posInHomeStretch = roll - stepsToHomeEntry -1; // 0-indexed
            if (posInHomeStretch === HOME_STRETCH_LENGTH -1) { // Exact land on last home spot
                 tokenToMove.position = 200 + tokenToMove.id; // Unique home position
                 setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
            } else if (posInHomeStretch < HOME_STRETCH_LENGTH -1) {
                // Placeholder for home stretch movement - for now, we'll just say it reached home
                // to simplify winning. Real logic: tokenToMove.position = 100 + posInHomeStretch;
                tokenToMove.position = 200 + tokenToMove.id; // Mark as home for now
                setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} into home stretch (marked as home).`);
            } else {
                // Overshot home stretch (e.g. needs 2, rolled 5) - cannot move this token
                setGameMessage(`${playerToMove.name} cannot move token ${tokenId + 1} - overshot home stretch.`);
                moveSuccessful = false; // This line was missing, important!
            }
        } else if (roll === stepsToHomeEntry && stepsToHomeEntry < HOME_STRETCH_LENGTH) { // Exact land on home entry
             tokenToMove.position = 200 + tokenToMove.id; // Mark as home
             setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
        } else {
            tokenToMove.position = newPosOnGlobalTrack;
            setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} from ${originalPosition === -1 ? "base" : originalPosition} to square ${newPosOnGlobalTrack}.`);
        }
        moveSuccessful = true; // Assume move is successful if not explicitly set to false above
      } else if (tokenToMove.position >= 100 && tokenToMove.position < 200) { // Moving within home stretch (very simplified)
        // const currentHomeStretchPos = tokenToMove.position % 100;
        // let newHomeStretchPos = currentHomeStretchPos + roll;
        // if (newHomeStretchPos === HOME_STRETCH_LENGTH -1) { // Landed on final spot
        //   tokenToMove.position = 200 + tokenToMove.id;
        //   setGameMessage(... moved home);
        // } else if (newHomeStretchPos < HOME_STRETCH_LENGTH -1 ) {
        //   tokenToMove.position = 100 + newHomeStretchPos;
        //   setGameMessage(... moved in home stretch);
        // } else {
        //   setGameMessage(... overshot);
        //   moveSuccessful = false;
        // }
        // For now, extremely simplified:
        setGameMessage(`${playerToMove.name} token ${tokenId + 1} is in home stretch. Full movement logic here is pending. Move not fully processed for home stretch.`);
        moveSuccessful = false; // Mark as not successful to prevent unintended win/pass turn.
      }


      if (moveSuccessful) {
        // Check for win condition
        const potentiallyWinningPlayer = newPlayers[playerIdx];
        if (potentiallyWinningPlayer.tokens.every(t => t.position >= 200)) {
            setGameMessage(`${potentiallyWinningPlayer.name} has won the game! Congratulations!`);
            setGameState('gameOver');
            toast({ title: "Game Over!", description: `${potentiallyWinningPlayer.name} wins!` });
            // No turn passing needed if game over
            return newPlayers; // Return early
        }

        // Handle turn passing or re-roll
        if (roll === 6) {
          // Player rolled a 6, gets another turn. sixStreak is already updated.
          newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true }; // Ensure hasRolledSix is true
          setGameMessage(prev => prev + ` ${playerToMove.name} rolled a 6 and gets another turn. Click your dice!`);
          setDiceValue(null); // Reset dice for re-roll
           if (newPlayers[playerIdx].isAI) {
            // AI's re-roll is triggered by useEffect watching currentPlayer (specifically diceValue becoming null for current AI player)
           }
        } else {
          // Roll was not a 6, turn ends. Reset hasRolledSix and sixStreak.
          newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: false, sixStreak: 0 };
          passTurn(true); // Pass turn, it's ending
        }
      } else {
        // Move was not successful (e.g. overshot home, or other invalid move not caught earlier)
        if (tokenToMove.position !== -1 && !(tokenToMove.position === -1 && roll === 6)) { // if not trying to move from base without 6
           if(tokenToMove.position < 200 ) { // only toast if token is not already home
             toast({ variant: "destructive", title: "Cannot Move Token", description: "This token cannot make the attempted move or its logic is pending." });
           }
        }
        // If the move failed, but it was a 6, player still gets another roll.
        if (roll !== 6) {
            passTurn(true); // Pass turn, it's ending
        } else {
            // It was a 6, move failed, but they still get another roll.
            newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true }; // Ensure hasRolledSix for re-roll
            setDiceValue(null); // Reset dice for re-roll
            setGameMessage(prev => prev + ` No valid move made with 6. ${playerToMove.name} gets to roll again. Click your dice!`);
        }
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

 // getTokenForCell: Renders tokens on the board grid.
 // This function needs to be significantly enhanced to show tokens along their actual paths.
 // For now, it mainly shows tokens in base and on their start squares.
 const getTokenForCell = (cellIndex: number): Token[] => {
    const tokensOnCell: Token[] = [];
    if (!players || players.length === 0) return tokensOnCell;

    players.forEach(player => {
      player.tokens.forEach(token => {
        const playerStartConfig = PLAYER_CONFIG[token.color];

        // Render tokens in base
        if (token.position === -1) {
            // Define 2x2 base cells for each player color (adjust token.id for more than 4 tokens)
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
            // Render tokens on their starting squares
            let expectedStartCellGridIndex = -1;
            // These are the visual grid indices for start squares
            if (token.color === 'red')    expectedStartCellGridIndex = (6 * BOARD_GRID_SIZE + 1);  // Row 6, Col 1
            else if (token.color === 'green')  expectedStartCellGridIndex = (1 * BOARD_GRID_SIZE + 8);  // Row 1, Col 8
            else if (token.color === 'yellow') expectedStartCellGridIndex = (8 * BOARD_GRID_SIZE + 13); // Row 8, Col 13
            else if (token.color === 'blue')   expectedStartCellGridIndex = (13 * BOARD_GRID_SIZE + 6); // Row 13, Col 6
            
            if (cellIndex === expectedStartCellGridIndex) {
                tokensOnCell.push(token);
            }
        }
        // TODO: Add logic to render tokens on other path squares and home stretches
        // This requires a mapping from token.position (0-51, 100-105) to cellIndex.
      });
    });
    return tokensOnCell;
  };


  // getCellBackgroundColor: Defines the Ludo board's visual appearance.
  const getCellBackgroundColor = (cellIndex: number): string => {
    const row = Math.floor(cellIndex / BOARD_GRID_SIZE);
    const col = cellIndex % BOARD_GRID_SIZE;

    // Player Base Areas (Houses)
    if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return PLAYER_CONFIG.red.baseClass + "/70"; // Red Base
    if (row >= 0 && row <= 5 && col >= 9 && col <= 14) return PLAYER_CONFIG.green.baseClass + "/70"; // Green Base
    if (row >= 9 && row <= 14 && col >= 0 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/70"; // Blue Base
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return PLAYER_CONFIG.yellow.baseClass + "/70"; // Yellow Base
    
    // Center Home Area (Triangle target)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return "bg-primary/30"; 

    // Home Stretches (colored paths leading to center)
    if (col === 7 && row >= 1 && row <= 5) return PLAYER_CONFIG.red.baseClass + "/40";      // Red Home Stretch (vertical)
    if (row === 7 && col >= 9 && col <= 13) return PLAYER_CONFIG.green.baseClass + "/40";    // Green Home Stretch (horizontal)
    if (col === 7 && row >= 9 && row <= 13) return PLAYER_CONFIG.yellow.baseClass + "/40";   // Yellow Home Stretch (vertical)
    if (row === 7 && col >= 1 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/40";     // Blue Home Stretch (horizontal)

    // Main Path Cells - This needs careful definition based on standard Ludo board layout
    // For simplicity, this currently just colors a border region and some cross paths.
    const isPathRowCol = (r: number, c: number): boolean => {
        // Outer border paths (usually 6 squares long on each side of the cross arms)
        if ((r === 6 || r === 8) && (c >=0 && c <=14)) return true; // Horizontal arms of the cross
        if ((c === 6 || c === 8) && (r >=0 && r <=14)) return true; // Vertical arms of the cross
        
        // More specific path definition for the 6x2 blocks forming the outer path
        if (r >= 0 && r <= 5 && (c === 6 || c === 7 || c === 8)) return true; // Top arm path cells
        if (r >= 9 && r <= 14 && (c === 6 || c === 7 || c === 8)) return true; // Bottom arm path cells
        if (c >= 0 && c <= 5 && (r === 6 || r === 7 || r === 8)) return true; // Left arm path cells
        if (c >= 9 && c <= 14 && (r === 6 || r === 7 || r === 8)) return true; // Right arm path cells
        return false;
    }

    // Starting squares (should be uniquely colored)
    if (row === 6 && col === 1) return PLAYER_CONFIG.red.baseClass + "/90";    // Red Start
    if (row === 1 && col === 8) return PLAYER_CONFIG.green.baseClass + "/90";  // Green Start
    if (row === 8 && col === 13) return PLAYER_CONFIG.yellow.baseClass + "/90"; // Yellow Start
    if (row === 13 && col === 6) return PLAYER_CONFIG.blue.baseClass + "/90";   // Blue Start
    
    // Coloring the general path - this needs to exclude bases, home stretches, and center
    if (isPathRowCol(row,col) && 
        !(row >= 6 && row <= 8 && col >= 6 && col <= 8) && // Exclude center
        // Exclude Base Areas
        !((row >= 0 && row <= 5 && col >= 0 && col <= 5) || 
          (row >= 0 && row <= 5 && col >= 9 && col <= 14) || 
          (row >= 9 && row <= 14 && col >= 0 && col <= 5) || 
          (row >= 9 && row <= 14 && col >= 9 && col <= 14)) &&
        // Exclude Home Stretches
        !((col === 7 && row >= 1 && row <= 5) || 
          (row === 7 && col >= 9 && col <= 13) || 
          (col === 7 && row >= 9 && row <= 13) || 
          (row === 7 && col >= 1 && col <= 5))  &&
        // Exclude Start Squares (already handled)
        !((row === 6 && col === 1) || (row === 1 && col === 8) || (row === 8 && col === 13) || (row === 13 && col === 6))
       ) {
        return "bg-slate-50"; // Generic path color
    }

    // Default for other cells (e.g. inner squares of base yards not used for tokens)
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
                        <span className="text-xs">{num === 2 ? "(You vs Shravya AI)" : `(You vs ${num-1} Shravya AI)`}</span>
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
                      "border border-neutral-400/50" // Cell border
                    )}
                  >
                    {/* Render tokens on this cell */}
                    {tokensOnThisCell.map((token, idx) => (
                         <button
                            key={token.color + token.id}
                            onClick={() => currentPlayer && !currentPlayer.isAI && diceValue && handleTokenClick(PLAYER_COLORS.indexOf(token.color), token.id)}
                            disabled={ // More precise disabling logic
                                !currentPlayer || 
                                PLAYER_COLORS.indexOf(token.color) !== currentPlayerIndex || // Not current player's token
                                isRolling || 
                                !diceValue || // No dice value to use
                                currentPlayer.isAI || // AI controls its tokens
                                gameState === 'gameOver' ||
                                (token.position === -1 && diceValue !==6) || // In base, not a 6
                                token.position >=200 || // Already home
                                (diceValue && !getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id && mt.color === token.color)) || // This token is not in the list of movable tokens for the current roll
                                (diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1) && token.position !== -1) // Rolled 6, has tokens in base, but trying to move one on board
                            }
                            className={cn(
                                "w-3/4 h-3/4 rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1 absolute shadow-md",
                                PLAYER_CONFIG[token.color].baseClass, // Token color
                                (currentPlayer && PLAYER_COLORS.indexOf(token.color) === currentPlayerIndex && diceValue && !currentPlayer.isAI && 
                                 getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id && mt.color === token.color) && // Check if this specific token is movable
                                 !(diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1) && token.position !== -1) // Not trying to move on-board piece when must move from base
                                ) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default", // Highlight if clickable
                                "text-white font-bold text-base z-10", // Token text (if any)
                                `token-pos-${idx}` // For stacking multiple tokens on one cell
                            )}
                            style={{ 
                                // Basic stacking display: slightly offset if multiple tokens are on the same cell.
                                transform: tokensOnThisCell.length > 1 ? (idx === 0 ? 'translateX(-15%) translateY(-15%)' : 'translateX(15%) translateY(15%)') : 'none',
                                width: tokensOnThisCell.length > 1 ? '60%' : '75%',
                                height: tokensOnThisCell.length > 1 ? '60%' : '75%',
                            }}
                            aria-label={`Token ${token.color} ${token.id + 1} at ${token.position === -1 ? 'base' : 'position ' + token.position }`}
                            >
                            {/* Optionally display token ID or symbol inside */}
                        </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Full token path rendering on the grid is a future enhancement. Current display is simplified.
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
                  
                  // Determine Dice Icon and its state
                  let PlayerDiceIconToRender = Dice6; // Default
                  let diceIconClassName = "text-muted-foreground opacity-50";
                  let diceIsClickable = false;

                  if (isCurrentPlayer) {
                    if (isRolling && diceValue) { // Current player is rolling
                      PlayerDiceIconToRender = DICE_ICONS[diceValue - 1] || Dice6;
                      diceIconClassName = "text-muted-foreground animate-spin";
                    } else if (diceValue) { // Current player has rolled, dice value is set
                      PlayerDiceIconToRender = DICE_ICONS[diceValue - 1] || Dice6;
                      diceIconClassName = cn("animate-gentle-bounce", PLAYER_CONFIG[p.color].textClass);
                    } else { // Current player's turn, waiting to roll
                      PlayerDiceIconToRender = Dice6; // Show a default dice
                      diceIconClassName = cn("cursor-pointer hover:opacity-75", PLAYER_CONFIG[p.color].textClass);
                    }
                    // Determine clickability for current player's dice
                    if (!p.isAI && gameState !== 'gameOver' && !isRolling) { // Human player, game on, not currently rolling
                        if (diceValue === null || p.hasRolledSix) { // Can roll if dice is not set OR they rolled a 6 (for another turn)
                            diceIsClickable = true;
                        }
                    }
                  } else { // Not the current player
                     PlayerDiceIconToRender = Dice6; // Show a default, inactive dice
                     diceIconClassName = "text-muted-foreground opacity-30";
                  }
                  
                  return (
                    <div key={p.color} className={cn("p-3 rounded-lg border-2", isCurrentPlayer ? "border-accent bg-accent/10 shadow-lg" : "border-muted")}>
                      <div className="flex items-center justify-between mb-2">
                          <span className={cn("font-semibold text-lg", PLAYER_CONFIG[p.color].textClass)}>{p.name}</span>
                          {p.isAI && <Cpu size={20} className="text-muted-foreground" title="AI Player"/>}
                      </div>
                      <div className="flex items-center justify-between">
                          {/* Player's Clickable Dice */}
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
                          {/* Player Tokens */}
                          <div className="flex gap-1.5">
                            {p.tokens.map(token => (
                              <Button
                                key={token.id}
                                variant="outline"
                                size="sm"
                                onClick={() => !p.isAI && diceValue && p.color === currentPlayer?.color && handleTokenClick(playerListIndex, token.id)}
                                disabled={ // Disable if not this player's turn, or AI, or no dice roll, or game over, or specific move invalid
                                  !currentPlayer || p.color !== currentPlayer.color || isRolling || !diceValue || p.isAI || gameState === 'gameOver' ||
                                  (token.position === -1 && diceValue !== 6) || // In base, not a 6
                                  token.position >= 200 || // Already home
                                  (diceValue && !getMovableTokens(p, diceValue).some(mt => mt.id === token.id && mt.color === p.color)) || // Token not movable with current roll
                                  (diceValue === 6 && p.tokens.some(t => t.position === -1) && token.position !== -1) // Rolled 6, has tokens in base, but trying to move one on board
                                }
                                title={`Token ${token.id + 1}: ${getTokenDisplayInfo(token)}`}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 text-xs flex items-center justify-center font-bold shadow",
                                  PLAYER_CONFIG[token.color].baseClass, "text-white",
                                  token.position >= 200 ? 'opacity-60 line-through decoration-2 decoration-black' : '', // Style if home
                                  (currentPlayer && p.color === currentPlayer.color && !p.isAI && diceValue &&
                                  getMovableTokens(p, diceValue).some(mt => mt.id === token.id && mt.color === p.color) && // Is this token movable?
                                  !(diceValue === 6 && p.tokens.some(t => t.position === -1) && token.position !== -1) // Not violating "must move from base" rule
                                  ) ? "ring-2 ring-offset-1 ring-black cursor-pointer" : "cursor-default" // Highlight if clickable
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


    