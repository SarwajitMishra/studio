
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
  red: { name: "Red", baseClass: "bg-red-500", textClass: "text-red-700", pathStartIndex: 0, homeEntryPathIndex: 50 },
  green: { name: "Green", baseClass: "bg-green-500", textClass: "text-green-700", pathStartIndex: 13, homeEntryPathIndex: 11 },
  blue: { name: "Blue", baseClass: "bg-blue-500", textClass: "text-blue-700", pathStartIndex: 39, homeEntryPathIndex: 37 },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24 },
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
    if (newPlayers[0].isAI) { // If first player is AI (e.g. testing all AI game)
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
      currentP = updatedPlayer; // Use the updated player state for subsequent logic
      
      if (updatedPlayer.sixStreak === 3) {
        setGameMessage(`${currentP.name} rolled three 6s in a row! Turn forfeited.`);
        setTimeout(() => passTurn(true, true), 1500); 
        return;
      }
      setGameMessage(prev => prev + " Gets another turn!");
    } else {
      const updatedPlayer = { ...currentP, hasRolledSix: false, sixStreak: 0 }; // Reset six streak if not a 6
      setPlayers(players.map((p, idx) => idx === currentPlayerIndex ? updatedPlayer : p));
      currentP = updatedPlayer;
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
        if (roll === 6) {
          tokenToMoveAI = movableTokens.find(t => t.position === -1);
        }
        if (!tokenToMoveAI) {
          tokenToMoveAI = movableTokens[0]; 
        }

        if (tokenToMoveAI) {
          attemptMoveToken(currentPlayerIndex, tokenToMoveAI.id, roll);
        } else {
          passTurn(roll !== 6);
        }
      }, 1000);
    }
  };
  
  const passTurn = (isTurnEnding = true, turnForfeited = false) => {
    if (players.length === 0 || gameState !== 'playing') return;

    let nextPlayerIdx = currentPlayerIndex;
    const currentP = players[currentPlayerIndex]; // Get the latest version of currentPlayer

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
        setGameMessage(`${nextPlayer.name}'s turn. Roll the dice!`);
        if (nextPlayer.isAI && gameState === 'playing') { // Ensure AI rolls only if game is still playing
            setGameMessage(`${nextPlayer.name} (AI) is thinking...`);
            setTimeout(() => handleDiceRoll(), 1500); 
        }
    } else {
        resetGame(); 
    }
  };

 useEffect(() => {
    if (gameState === 'playing' && players.length > 0 && currentPlayer?.isAI && !diceValue && !isRolling) {
        // Check if the current player has already rolled three sixes (handled by passTurn forfeit)
        // This effect is primarily for initiating AI's turn if it becomes their turn and dice is not yet rolled.
        // The re-roll after a 6 for AI is handled within passTurn -> attemptMoveToken -> passTurn(false)
        if (currentPlayer.sixStreak < 3) { 
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
    if (token.position >= 200) { 
      toast({ variant: "destructive", title: "Invalid Move", description: "This token is already home." });
      return;
    }
    attemptMoveToken(playerIndex, tokenId, diceValue);
  };

  const attemptMoveToken = (playerIdx: number, tokenId: number, roll: number) => {
    setPlayers(prevPlayers => {
      const newPlayers = prevPlayers.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) }));
      let playerToMove = newPlayers[playerIdx]; // Use let to re-assign after map
      if (!playerToMove) return prevPlayers; 
      const tokenToMove = playerToMove.tokens.find(t => t.id === tokenId);
      if (!tokenToMove) return prevPlayers; 

      const playerConfig = PLAYER_CONFIG[playerToMove.color];
      let moveSuccessful = false;

      if (tokenToMove.position === -1 && roll === 6) { 
        tokenToMove.position = playerConfig.pathStartIndex;
        setGameMessage(`${playerToMove.name} brought token ${tokenId + 1} out to ${tokenToMove.position}!`);
        moveSuccessful = true;
      } else if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH) { 
        let currentPosOnGlobalTrack = tokenToMove.position;
        let newPosOnGlobalTrack = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;
        
        const oldPos = tokenToMove.position;
        
        const distanceToHomeEntry = (playerConfig.homeEntryPathIndex - oldPos + MAIN_PATH_LENGTH) % MAIN_PATH_LENGTH;
        const movesPastStartAgain = (oldPos < playerConfig.pathStartIndex && newPosOnGlobalTrack >= playerConfig.pathStartIndex && oldPos + roll >= MAIN_PATH_LENGTH);
        const directlyToOrPastHomeEntry = (oldPos <= playerConfig.homeEntryPathIndex && (oldPos + roll) >= playerConfig.homeEntryPathIndex) || 
                                          (oldPos > playerConfig.homeEntryPathIndex && (oldPos + roll) % MAIN_PATH_LENGTH >= playerConfig.homeEntryPathIndex && (oldPos + roll) >= MAIN_PATH_LENGTH); // complex wrap check

        // Extremely simplified home: if it makes a significant jump towards its start after being far away (not true Ludo)
        // Or if it lands on/passes its homeEntryPathIndex from a position before it, and has completed roughly a lap.
        // This is still a placeholder. A token is "home" if position becomes 200+.
        // For now, let's allow moving past homeEntry to trigger "home" state IF it's a valid step towards it.
        // This logic is tricky without full path simulation.

        // Simplified logic: if it reaches its home entry point or lands on it after being on the path.
        // A more robust (but still simplified) check:
        let hasReachedOrPassedHomeEntry = false;
        if (playerConfig.pathStartIndex > playerConfig.homeEntryPathIndex) { // Wraps around 0
            if ((oldPos <= playerConfig.homeEntryPathIndex && oldPos + roll >= playerConfig.homeEntryPathIndex) || // directly reaches/passes entry
                (oldPos > playerConfig.homeEntryPathIndex && ( (oldPos + roll) % MAIN_PATH_LENGTH <= playerConfig.homeEntryPathIndex || (oldPos + roll) >= MAIN_PATH_LENGTH ) )) { // passes 0 and reaches/passes entry
                 if (oldPos + roll >= playerConfig.homeEntryPathIndex && oldPos + roll < playerConfig.homeEntryPathIndex + HOME_STRETCH_LENGTH + 5 ) { // Heuristic
                    // This check implies it's moving towards its home entry.
                    // The '5' is a buffer. True home logic is more complex.
                    // hasReachedOrPassedHomeEntry = true; // Temporarily disable for simpler path movement
                 }
            }
        } else { // Normal progression
            if (oldPos <= playerConfig.homeEntryPathIndex && oldPos + roll >= playerConfig.homeEntryPathIndex) {
                 if (oldPos + roll < playerConfig.homeEntryPathIndex + HOME_STRETCH_LENGTH + 5 ) {
                    // hasReachedOrPassedHomeEntry = true; // Temporarily disable
                 }
            }
        }
        
        // For now, just move on the circular path. Home logic is too complex for this step.
        tokenToMove.position = newPosOnGlobalTrack;
        setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} from ${oldPos} to square ${newPosOnGlobalTrack}.`);
        moveSuccessful = true;


        // Placeholder for future capture logic:
        // Check if newPosOnGlobalTrack is occupied by opponent tokens.
        // If so, send opponent token back to base. (Not implemented)

      } else if (tokenToMove.position >= 100 && tokenToMove.position < 200) { 
        setGameMessage(`${playerToMove.name} token ${tokenId + 1} is in home stretch (movement not fully implemented).`);
        moveSuccessful = false; 
      }


      if (moveSuccessful) {
        playerToMove = newPlayers[playerIdx]; // re-fetch player after potential token updates
        const playerTokens = playerToMove.tokens;
        // Check for win condition (all tokens are "home" - simplified to >=200)
        if (playerTokens.every(t => t.position >= 200 && t.position < 300 )) { 
             setGameMessage(`${playerToMove.name} has won the game! Congratulations!`);
             setGameState('gameOver');
             toast({ title: "Game Over!", description: `${playerToMove.name} wins!` });
             return newPlayers; 
        }


        if (roll === 6) {
          setGameMessage(prev => prev + ` ${playerToMove.name} gets another turn (rolled 6).`);
           // Ensure the player's hasRolledSix state is correctly managed for the next roll
          newPlayers[playerIdx] = { ...playerToMove, hasRolledSix: true }; // Explicitly keep hasRolledSix

          if (playerToMove.isAI) {
            setDiceValue(null); // For AI, dice value should be null to trigger re-roll in useEffect
            passTurn(false); // AI gets to roll again immediately
          } else {
            setDiceValue(null); // Human can choose to roll again. Their hasRolledSix is true.
          }
        } else {
          // If not a 6, turn definitely ends. hasRolledSix should be false for next turn.
          newPlayers[playerIdx] = { ...playerToMove, hasRolledSix: false, sixStreak: 0 };
          passTurn(true); 
        }
      } else {
        if (tokenToMove.position !== -1 && !(tokenToMove.position === -1 && roll === 6) ) { 
            toast({ variant: "destructive", title: "Cannot Move", description: "This token cannot make that move or logic is pending." });
        }
        return prevPlayers; 
      }
      return newPlayers;
    });
  };

  const getTokenDisplayInfo = (token: Token): string => {
    if (token.position === -1) return 'B'; 
    if (token.position >= 200 && token.position < 300) return 'H'; 
    if (token.position >= 100 && token.position < 200) return `S${token.position % 10}`; 
    return `${token.position}`; 
  };

 const getTokenForCell = (cellIndex: number): Token[] => {
    const tokensOnCell: Token[] = [];
    if (!players || players.length === 0) return tokensOnCell;

    players.forEach(player => {
      player.tokens.forEach(token => {
        const playerStartConfig = PLAYER_CONFIG[token.color];

        if (token.position === -1) { // Token in base
            const baseGridPositions: Record<PlayerColor, number[]> = { 
                red:    [1*BOARD_GRID_SIZE + 1, 1*BOARD_GRID_SIZE + 2, 2*BOARD_GRID_SIZE + 1, 2*BOARD_GRID_SIZE + 2],
                green:  [1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), 1*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2), 2*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), 2*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2)],
                blue:   [(BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + 1, (BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + 2, (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + 1, (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + 2],
                yellow: [(BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), (BOARD_GRID_SIZE - 3)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2), (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 3), (BOARD_GRID_SIZE - 2)*BOARD_GRID_SIZE + (BOARD_GRID_SIZE - 2)],
            };
            if (baseGridPositions[token.color] && baseGridPositions[token.color][token.id] === cellIndex) {
                tokensOnCell.push(token);
            }
        } else if (token.position === playerStartConfig.pathStartIndex) { // Token at its specific start cell on the path
            let expectedStartCellGridIndex = -1;
            if (token.color === 'red')    expectedStartCellGridIndex = (6 * BOARD_GRID_SIZE + 1);
            else if (token.color === 'green')  expectedStartCellGridIndex = (1 * BOARD_GRID_SIZE + 8);
            else if (token.color === 'yellow') expectedStartCellGridIndex = (8 * BOARD_GRID_SIZE + 13);
            else if (token.color === 'blue')   expectedStartCellGridIndex = (13 * BOARD_GRID_SIZE + 6);
            
            if (cellIndex === expectedStartCellGridIndex) {
                tokensOnCell.push(token);
            }
        }
        // Future: else if (token.position >= 0 && token.position < MAIN_PATH_LENGTH) {
        // Map token.position to specific cellIndex for rendering on path
        // This will require a Ludo path to grid cell mapping array.
        // }
      });
    });
    return tokensOnCell;
  };


  const getCellBackgroundColor = (cellIndex: number): string => {
    const row = Math.floor(cellIndex / BOARD_GRID_SIZE);
    const col = cellIndex % BOARD_GRID_SIZE;

    // Player Bases (corners)
    if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return PLAYER_CONFIG.red.baseClass + "/70"; 
    if (row >= 0 && row <= 5 && col >= 9 && col <= 14) return PLAYER_CONFIG.green.baseClass + "/70"; 
    if (row >= 9 && row <= 14 && col >= 0 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/70"; 
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return PLAYER_CONFIG.yellow.baseClass + "/70"; 
    
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return "bg-primary/30";

    if (col === 7 && row >= 1 && row <= 5) return PLAYER_CONFIG.red.baseClass + "/40"; 
    if (row === 7 && col >= 9 && col <= 13) return PLAYER_CONFIG.green.baseClass + "/40"; 
    if (col === 7 && row >= 9 && row <= 13) return PLAYER_CONFIG.yellow.baseClass + "/40"; 
    if (row === 7 && col >= 1 && col <= 5) return PLAYER_CONFIG.blue.baseClass + "/40"; 

    const pathCells = [
      // Red's arm leading to start
      ...Array(5).fill(null).map((_, i) => (6 * BOARD_GRID_SIZE + (1+i))), // (6,1) to (6,5)
       (5 * BOARD_GRID_SIZE + 6), (4 * BOARD_GRID_SIZE + 6), (3 * BOARD_GRID_SIZE + 6), (2 * BOARD_GRID_SIZE + 6), (1 * BOARD_GRID_SIZE + 6), // (5,6) down to (1,6)
       (0 * BOARD_GRID_SIZE + 6), // (0,6) Top-left turn cell
      // Green's arm leading to start
      ...Array(5).fill(null).map((_, i) => ( (0 * BOARD_GRID_SIZE + 7) + i )), // (0,7) to (0,11) (no, 0,8 is start, path is 1,8 to 5,8)
        // Path is (1,8), (2,8)...(5,8), then (6,9)...
       ...Array(5).fill(null).map((_, i) => ( (1+i) * BOARD_GRID_SIZE + 8)), // (1,8) to (5,8)
       (6 * BOARD_GRID_SIZE + 9), (6 * BOARD_GRID_SIZE + 10), (6 * BOARD_GRID_SIZE + 11), (6 * BOARD_GRID_SIZE + 12), (6 * BOARD_GRID_SIZE + 13), // (6,9) to (6,13)
       (6 * BOARD_GRID_SIZE + 14), // (6,14) Top-right turn cell
      // Yellow's arm
       ...Array(5).fill(null).map((_, i) => ( (8 * BOARD_GRID_SIZE + 13) - i)), // (8,13) to (8,9)
       (9 * BOARD_GRID_SIZE + 8), (10 * BOARD_GRID_SIZE + 8), (11 * BOARD_GRID_SIZE + 8), (12 * BOARD_GRID_SIZE + 8), (13 * BOARD_GRID_SIZE + 8), // (9,8) down to (13,8)
       (14 * BOARD_GRID_SIZE + 8), // (14,8) Bottom-right turn cell
      // Blue's arm
       ...Array(5).fill(null).map((_, i) => ( (14 * BOARD_GRID_SIZE + 7) -i )), // (14,7) to (14,3)
       (13 * BOARD_GRID_SIZE + 6), (12*BOARD_GRID_SIZE+6), (11*BOARD_GRID_SIZE+6), (10*BOARD_GRID_SIZE+6), (9*BOARD_GRID_SIZE+6), // (13,6) up to (9,6)
       (8 * BOARD_GRID_SIZE + 0) // (8,0) Bottom-left turn cell. This seems off. (8,6) is blue's start indicator.
                                 // Blue path: (13,6) up to (9,6), then (8,5) left to (8,1)
    ];
    // The above pathCells is very complex and error-prone. A predefined list is better.
    // For now, simple path cell coloring:
    const isPathRowCol = (r: number, c: number): boolean => {
        // Horizontal parts of the cross
        if ((r === 6 || r === 7 || r === 8) && (c >=0 && c <=14)) return true;
        // Vertical parts of the cross
        if ((c === 6 || c === 7 || c === 8) && (r >=0 && r <=14)) return true;
        return false;
    }

    if (isPathRowCol(row,col) && !(row >= 6 && row <= 8 && col >= 6 && col <= 8) && // not center
        !((row >= 0 && row <= 5 && col >= 0 && col <= 5) || // not red base
          (row >= 0 && row <= 5 && col >= 9 && col <= 14) || // not green base
          (row >= 9 && row <= 14 && col >= 0 && col <= 5) || // not blue base
          (row >= 9 && row <= 14 && col >= 9 && col <= 14) || // not yellow base
          (col === 7 && row >= 1 && row <= 5) || // not red home
          (row === 7 && col >= 9 && col <= 13) || // not green home
          (col === 7 && row >= 9 && row <= 13) || // not yellow home
          (row === 7 && col >= 1 && col <= 5) // not blue home
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
                            disabled={!currentPlayer || PLAYER_COLORS.indexOf(token.color) !== currentPlayerIndex || isRolling || !diceValue || currentPlayer.isAI || gameState === 'gameOver' || (token.position === -1 && diceValue !==6) || token.position >=200 }
                            className={cn(
                                "w-3/4 h-3/4 rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1 absolute shadow-md",
                                PLAYER_CONFIG[token.color].baseClass,
                                (currentPlayer && PLAYER_COLORS.indexOf(token.color) === currentPlayerIndex && diceValue && !currentPlayer.isAI && getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id)) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default",
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
                            {/* {token.id + 1} // Can display token ID visually if needed */}
                        </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Board rendering is visual. Full token path logic on grid is a future enhancement.
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
                  disabled={
                    isRolling || 
                    gameState === 'gameOver' || 
                    !currentPlayer || 
                    currentPlayer.isAI || 
                    (!!diceValue && diceValue !== 6 && !currentPlayer.hasRolledSix && getMovableTokens(currentPlayer, diceValue).length > 0) ||
                    (!!diceValue && diceValue === 6 && currentPlayer.tokens.every(t => t.position === -1) && !getMovableTokens(currentPlayer,diceValue).some(t => t.position ===-1)) // Must move from base if possible
                  }
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 shadow-lg"
                >
                  {isRolling ? "Rolling..." :
                    (diceValue && !currentPlayer?.isAI && (diceValue !== 6 || (diceValue === 6 && !currentPlayer.hasRolledSix)) && getMovableTokens(currentPlayer, diceValue).length > 0 ? `Rolled ${diceValue}! Select Token` :
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
                          disabled={!currentPlayer || p.color !== currentPlayer.color || isRolling || !diceValue || currentPlayer.isAI || gameState === 'gameOver' || (token.position === -1 && diceValue !== 6) || token.position >= 200 || (diceValue && !getMovableTokens(p,diceValue).some(mt => mt.id === token.id && mt.color === p.color))}
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

