
"use client";

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Home, Users, Cpu, Info, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'] as const;
type PlayerColor = typeof PLAYER_COLORS[number];

const MAIN_PATH_LENGTH = 52;
const HOME_STRETCH_LENGTH = 6; // Each home stretch has 5 steps + 1 final home spot
const NUM_TOKENS_PER_PLAYER = 4;
const BOARD_GRID_SIZE = 15;


const MAIN_PATH_COORDINATES: { row: number; col: number }[] = [
  // Red arm (clockwise)
  { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
  { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
  // Green arm (entry at top-left of its block)
  { row: 0, col: 8 }, // Path index 12 (Green's 13th square from its perspective)
  { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 },
  { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 },
  // Yellow arm
  { row: 8, col: 14 }, // Path index 25 (Yellow's 26th square)
  { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 },
  { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 },
  // Blue arm
  { row: 14, col: 6 }, // Path index 38 (Blue's 39th square)
  { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 },
  { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
  { row: 6, col: 0 } // Path index 51, connects back to red's arm. Red's start {row:6, col:1} is index 0.
];

const HOME_STRETCH_COORDINATES: Record<PlayerColor, { row: number; col: number }[]> = {
  red:    [ { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, {row: 7, col: 6} ], // Last one is home
  green:  [ { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 }, {row: 6, col: 7} ],
  yellow: [ { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }, {row: 7, col: 8} ],
  blue:   [ { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 }, {row: 8, col: 7} ],
};


const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number; cornerPosition: string; houseCoords: {row: number, col: number}[], startCell: {row: number, col: number} }> = {
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 0,  homeEntryPathIndex: 50, cornerPosition: "bottom-4 left-4", houseCoords: [{row:1,col:1},{row:1,col:4},{row:4,col:1},{row:4,col:4}], startCell: MAIN_PATH_COORDINATES[0] },
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 13, homeEntryPathIndex: 11, cornerPosition: "top-4 left-4", houseCoords: [{row:1,col:10},{row:1,col:13},{row:4,col:10},{row:4,col:13}], startCell: MAIN_PATH_COORDINATES[13]},
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24, cornerPosition: "top-4 right-4", houseCoords: [{row:10,col:10},{row:10,col:13},{row:13,col:10},{row:13,col:13}], startCell: MAIN_PATH_COORDINATES[26]},
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 39, homeEntryPathIndex: 37, cornerPosition: "bottom-4 right-4", houseCoords: [{row:10,col:1},{row:10,col:4},{row:13,col:1},{row:13,col:4}], startCell: MAIN_PATH_COORDINATES[39]},
};

const SAFE_SQUARE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];


const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1: base, 0-51: main path, 100-105: home stretch (100 = first step, 105 = last step before home), 200+: finished
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

const initialPlayerState = (
    numPlayersToCreate: number,
    mode: GameMode,
    humanName?: string,
    offlineNames?: string[],
    offlinePlayerColors?: PlayerColor[]
): Player[] => {
  let activePlayerColors: PlayerColor[];

  if (mode === 'offline' && offlinePlayerColors && offlinePlayerColors.length === numPlayersToCreate && offlinePlayerColors.every(c => c !== null)) {
    activePlayerColors = offlinePlayerColors;
  } else if (numPlayersToCreate === 2) {
     activePlayerColors = ['red', 'green']; 
  } else {
    activePlayerColors = PLAYER_COLORS.slice(0, numPlayersToCreate);
  }


  return activePlayerColors.map((color, index) => {
    const isAIPlayer = mode === 'ai' && index > 0;
    let playerName = PLAYER_CONFIG[color].name;

    if (mode === 'ai') {
      playerName = (index === 0) ? (humanName || "Human Player") : `Shravya AI (${PLAYER_CONFIG[color].name})`;
    } else if (mode === 'offline') {
      playerName = (offlineNames && offlineNames[index]) ? offlineNames[index] : `Player ${index + 1} (${PLAYER_CONFIG[color].name})`;
    }
    
    return {
      color,
      name: playerName,
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


const boardCells = Array(BOARD_GRID_SIZE * BOARD_GRID_SIZE).fill(null).map((_, i) => i);

export default function LudoPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const [selectedNumPlayers, setSelectedNumPlayers] = useState<number | null>(null);
  
  const [humanPlayerName, setHumanPlayerName] = useState<string>("Human Player");
  const [offlinePlayerNames, setOfflinePlayerNames] = useState<string[]>([]);

  const [selectedOfflineColors, setSelectedOfflineColors] = useState<(PlayerColor | null)[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [gameMessage, setGameMessage] = useState("Welcome to Ludo! Set up your game.");
  const { toast } = useToast();

  const currentPlayer = players[currentPlayerIndex];

  useEffect(() => {
    if (selectedMode === 'offline' && selectedNumPlayers) {
      setOfflinePlayerNames(Array(selectedNumPlayers).fill('').map((_, i) => `Player ${i + 1}`));
      setSelectedOfflineColors(Array(selectedNumPlayers).fill(null));
    } else {
      setOfflinePlayerNames([]);
      setSelectedOfflineColors([]);
    }
  }, [selectedNumPlayers, selectedMode]);

 const handleColorChange = (index: number, color: PlayerColor) => {
    setSelectedOfflineColors(prevColors => prevColors.map((c, i) => (i === index ? color : c)));
 };

  const handleOfflinePlayerNameChange = (index: number, name: string) => {
    const newNames = [...offlinePlayerNames];
    newNames[index] = name;
    setOfflinePlayerNames(newNames);
  };

  const resetGame = useCallback(() => {
    setGameState('setup');
    setSelectedMode(null);
    setSelectedNumPlayers(null);
    setHumanPlayerName("Human Player");
    setOfflinePlayerNames([]);
    setPlayers([]);
    setSelectedOfflineColors([]);
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
    if (selectedMode === 'ai' && humanPlayerName.trim() === "") {
      toast({ variant: "destructive", title: "Name Required", description: "Please enter your name." });
      return;
    }
    if (selectedMode === 'offline' && offlinePlayerNames.some(name => name.trim() === "")) {
      toast({ variant: "destructive", title: "Names Required", description: "Please enter names for all players." });
      return;
    }
    const validSelectedColors = selectedOfflineColors.slice(0, selectedNumPlayers).filter(c => c !== null) as PlayerColor[];
    if (selectedMode === 'offline' && (validSelectedColors.length !== selectedNumPlayers || new Set(validSelectedColors).size !== validSelectedColors.length) ) {
        toast({ variant: "destructive", title: "Color Selection Incomplete", description: "Please select a unique color for each offline player." });
        return;
    }

    const newPlayers = initialPlayerState(
        selectedNumPlayers, 
        selectedMode, 
        humanPlayerName, 
        offlinePlayerNames, 
        selectedMode === 'offline' ? validSelectedColors : undefined
    );
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setGameState('playing');
    setGameMessage(`${newPlayers[0].name}'s turn. Click your dice to roll!`);
    if (newPlayers[0].isAI) {
        setGameMessage(`${newPlayers[0].name} is thinking...`);
    }
  };

  const handleDiceRoll = useCallback(() => {
    if (isRolling || !currentPlayer || (currentPlayer.isAI && diceValue !== null)) return; 
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
  }, [isRolling, currentPlayer, diceValue, players, currentPlayerIndex]);

  const getMovableTokens = (player: Player, roll: number): Token[] => {
    if (!player) return [];
    
    return player.tokens.filter(token => {
      if (token.position === -1) return roll === 6; 
      if (token.position >= 200) return false; 

      if (token.position >= 100) { 
        const stretchPos = token.position % 100; 
        return (stretchPos + roll) <= HOME_STRETCH_LENGTH -1; 
      }
      return true;
    });
  };

  const processDiceRoll = (roll: number) => {
    if (!currentPlayer) return;
    let currentMessage = `${currentPlayer.name} rolled a ${roll}.`;

    let currentP = players[currentPlayerIndex];

    if (roll === 6) {
      const updatedPlayer = { ...currentP, hasRolledSix: true, sixStreak: currentP.sixStreak + 1 };
      setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? updatedPlayer : p));
      currentP = updatedPlayer; 

      if (updatedPlayer.sixStreak === 3) {
        currentMessage += ` Three 6s in a row! Turn forfeited.`;
        setGameMessage(currentMessage);
        setTimeout(() => passTurn(true, true), 1500); 
        return;
      }
    }

    const movableTokens = getMovableTokens(currentP, roll);
    const hasTokensInBase = currentP.tokens.some(t => t.position === -1);

    if (movableTokens.length === 0) {
       currentMessage += ` No valid moves. Passing turn.`;
       setGameMessage(currentMessage);
       setTimeout(() => passTurn(roll !== 6), 1500);
       return;
    }
    
    setGameMessage(currentMessage + (currentP.isAI ? ` AI thinking...` : ` Select a token to move.`));

    if (currentP.isAI) {
      setTimeout(() => {
        let tokenToMoveAI: Token | undefined;
        if (roll === 6 && hasTokensInBase) {
          tokenToMoveAI = movableTokens.find(t => t.position === -1);
        } 
        if (!tokenToMoveAI) { 
          const sortedMovable = [...movableTokens].sort((a,b) => b.position - a.position); 
          tokenToMoveAI = sortedMovable[0];
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
    }
  };

 useEffect(() => {
    if (gameState === 'playing' && players.length > 0 && currentPlayer?.isAI && !diceValue && !isRolling) {
        if (currentPlayer.sixStreak < 3) { 
            setTimeout(() => handleDiceRoll(), 1500); 
        }
    }
}, [currentPlayerIndex, players, gameState, diceValue, isRolling, currentPlayer, handleDiceRoll]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !currentPlayer || currentPlayer.isAI) return;

    const token = players[playerIndex].tokens.find(t=>t.id === tokenId);
    if(!token) return;
        
    const movableTokens = getMovableTokens(currentPlayer, diceValue);
    if (!movableTokens.some(mt => mt.id === tokenId && mt.color === currentPlayer.color)) {
        toast({ variant: "destructive", title: "Cannot Move Token", description: "This token cannot make the attempted move or you must move from base." });
        return;
    }
    const baseTokensAreMovable = movableTokens.some(t => t.position === -1);
    if (diceValue === 6 && baseTokensAreMovable && token.position !== -1) {
        toast({ variant: "default", title: "Move From Base", description: "You rolled a 6! Please select a token from your base to move out." });
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
      const originalPositionDisplay = tokenToMove.position === -1 ? "base" : 
                                   tokenToMove.position >= 100 ? `S${tokenToMove.position % 100}` :
                                   `${tokenToMove.position}`;

      if (tokenToMove.position === -1 && roll === 6) { 
        tokenToMove.position = playerConfig.pathStartIndex;
        setGameMessage(`${playerToMove.name} brought token ${tokenId + 1} out to square ${MAIN_PATH_COORDINATES[tokenToMove.position].row},${MAIN_PATH_COORDINATES[tokenToMove.position].col}.`);
        moveSuccessful = true;
      } else if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH) { 
        let currentPosOnGlobalTrack = tokenToMove.position;
        const homeEntry = playerConfig.homeEntryPathIndex;
        const start = playerConfig.pathStartIndex;
        
        let stepsToHomeEntry;
        if (currentPosOnGlobalTrack >= start) { 
            stepsToHomeEntry = (homeEntry - currentPosOnGlobalTrack + MAIN_PATH_LENGTH) % MAIN_PATH_LENGTH;
        } else { 
            stepsToHomeEntry = homeEntry - currentPosOnGlobalTrack;
        }
        if (currentPosOnGlobalTrack === homeEntry || roll > stepsToHomeEntry) {
            const stepsIntoHomeStretch = roll - stepsToHomeEntry -1; 
            if (stepsIntoHomeStretch < HOME_STRETCH_LENGTH) {
                tokenToMove.position = 100 + stepsIntoHomeStretch; 
                 if (tokenToMove.position === 100 + HOME_STRETCH_LENGTH - 1) { 
                    tokenToMove.position = 200 + tokenToMove.id; 
                    setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
                 } else {
                    setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} into home stretch to S${stepsIntoHomeStretch}.`);
                 }
                 moveSuccessful = true;
            } else { 
                 tokenToMove.position = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;
                 setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} from ${originalPositionDisplay} to ${tokenToMove.position}. Overshot home.`);
                 moveSuccessful = true;
            }
        } else { 
            tokenToMove.position = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;
            setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} from ${originalPositionDisplay} to square ${tokenToMove.position}.`);
            moveSuccessful = true; 
        }
      } else if (tokenToMove.position >= 100 && tokenToMove.position < 200) { 
        const currentHomeStretchPos = tokenToMove.position % 100; 
        let newHomeStretchPos = currentHomeStretchPos + roll;
        if (newHomeStretchPos === HOME_STRETCH_LENGTH -1) { 
          tokenToMove.position = 200 + tokenToMove.id;
          setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
          moveSuccessful = true;
        } else if (newHomeStretchPos < HOME_STRETCH_LENGTH -1 ) { 
          tokenToMove.position = 100 + newHomeStretchPos;
          setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} in home stretch to S${newHomeStretchPos}.`);
          moveSuccessful = true;
        } else { 
          setGameMessage(`${playerToMove.name} cannot move token ${tokenId+1}: overshot final home spot. No move.`);
          moveSuccessful = false; 
        }
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
          newPlayers[playerIdx].hasRolledSix = true; 
          setGameMessage(prev => prev + ` ${playerToMove.name} rolled a 6 and gets another turn.`);
          setDiceValue(null); 
        } else {
          passTurn(true); 
        }
      } else {
        if (roll === 6) { 
            newPlayers[playerIdx].hasRolledSix = true; 
            setGameMessage(prev => prev + ` No valid move available with 6. ${playerToMove.name} rolls again.`);
            setDiceValue(null);
        } else {
            passTurn(true); 
        }
      }
      return newPlayers;
    });
  };

  const getTokenDisplayInfo = (token: Token): { text: string; onPath: boolean; pathIndex?: number } => {
    if (token.position === -1) return { text: 'B', onPath: false };
    if (token.position >= 200) return { text: 'H', onPath: false };
    if (token.position >= 100 && token.position < 200) return { text: `S${token.position % 100}`, onPath: true, pathIndex: token.position };
    return { text: `${token.position}`, onPath: true, pathIndex: token.position };
  };

  const getTokenForCell = (rowIndex: number, colIndex: number): Token[] => {
    const tokensOnThisCell: Token[] = [];
    if (!players || players.length === 0 || gameState !== 'playing') return tokensOnThisCell;

    players.forEach(player => {
      const playerSpecificConfig = PLAYER_CONFIG[player.color];
      player.tokens.forEach(token => {
        if (token.position === -1) { 
            const baseSpot = playerSpecificConfig.houseCoords[token.id];
            if (baseSpot && baseSpot.row === rowIndex && baseSpot.col === colIndex) {
                tokensOnThisCell.push(token);
            }
        } else if (token.position >= 0 && token.position < MAIN_PATH_LENGTH) { 
            const mainPathCell = MAIN_PATH_COORDINATES[token.position];
            if (mainPathCell && mainPathCell.row === rowIndex && mainPathCell.col === colIndex) {
                tokensOnThisCell.push(token);
            }
        } else if (token.position >= 100 && token.position < 200) { 
            const homeStretchStep = token.position % 100; 
            const homeStretchCell = HOME_STRETCH_COORDINATES[player.color][homeStretchStep];
            if (homeStretchCell && homeStretchCell.row === rowIndex && homeStretchCell.col === colIndex) {
                tokensOnThisCell.push(token);
            }
        }
      });
    });
    return tokensOnThisCell;
  };

  const getCellBackgroundColor = (rowIndex: number, colIndex: number): string => {
    if ((rowIndex >= 0 && rowIndex <= 5 && colIndex >= 0 && colIndex <= 5) && !(rowIndex >=2 && rowIndex <=3 && colIndex >=2 && colIndex <=3 )) { 
      if (PLAYER_CONFIG.red.houseCoords.some(hc => hc.row === rowIndex && hc.col === colIndex) || (rowIndex >=0 && rowIndex <=5 && colIndex >=0 && colIndex <=5 && !(rowIndex >=2 && rowIndex <=3 && colIndex >=2 && colIndex <=3) && (rowIndex <1 || rowIndex >4 || colIndex <1 || colIndex >4) )) {
        return PLAYER_CONFIG.red.baseClass + "/60";
      }
    }
    if ((rowIndex >= 0 && rowIndex <= 5 && colIndex >= 9 && colIndex <= 14) && !(rowIndex >=2 && rowIndex <=3 && colIndex >=11 && colIndex <=12 )) { 
       if (PLAYER_CONFIG.green.houseCoords.some(hc => hc.row === rowIndex && hc.col === colIndex) || (rowIndex >=0 && rowIndex <=5 && colIndex >=9 && colIndex <=14 && !(rowIndex >=2 && rowIndex <=3 && colIndex >=11 && colIndex <=12 ) && (rowIndex <1 || rowIndex >4 || colIndex <10 || colIndex >13))) {
        return PLAYER_CONFIG.green.baseClass + "/60";
      }
    }
    if ((rowIndex >= 9 && rowIndex <= 14 && colIndex >= 0 && colIndex <= 5) && !(rowIndex >=11 && rowIndex <=12 && colIndex >=2 && colIndex <=3 ) ) { 
       if (PLAYER_CONFIG.blue.houseCoords.some(hc => hc.row === rowIndex && hc.col === colIndex) || (rowIndex >=9 && rowIndex <=14 && colIndex >=0 && colIndex <=5 && !(rowIndex >=11 && rowIndex <=12 && colIndex >=2 && colIndex <=3 ) && (rowIndex <10 || rowIndex >13 || colIndex <1 || colIndex >4))) {
        return PLAYER_CONFIG.blue.baseClass + "/60";
      }
    }
    if ((rowIndex >= 9 && rowIndex <= 14 && colIndex >= 9 && colIndex <= 14) && !(rowIndex >=11 && rowIndex <=12 && colIndex >=11 && colIndex <=12 ) ) { 
       if (PLAYER_CONFIG.yellow.houseCoords.some(hc => hc.row === rowIndex && hc.col === colIndex) || (rowIndex >=9 && rowIndex <=14 && colIndex >=9 && colIndex <=14 && !(rowIndex >=11 && rowIndex <=12 && colIndex >=11 && colIndex <=12 ) && (rowIndex <10 || rowIndex >13 || colIndex <10 || colIndex >13))) {
        return PLAYER_CONFIG.yellow.baseClass + "/60";
      }
    }
    
    if (rowIndex >= 6 && rowIndex <= 8 && colIndex >= 6 && colIndex <= 8) {
      if (HOME_STRETCH_COORDINATES.red[HOME_STRETCH_LENGTH-1].row === rowIndex && HOME_STRETCH_COORDINATES.red[HOME_STRETCH_LENGTH-1].col === colIndex) return PLAYER_CONFIG.red.baseClass + "/90";
      if (HOME_STRETCH_COORDINATES.green[HOME_STRETCH_LENGTH-1].row === rowIndex && HOME_STRETCH_COORDINATES.green[HOME_STRETCH_LENGTH-1].col === colIndex) return PLAYER_CONFIG.green.baseClass + "/90";
      if (HOME_STRETCH_COORDINATES.yellow[HOME_STRETCH_LENGTH-1].row === rowIndex && HOME_STRETCH_COORDINATES.yellow[HOME_STRETCH_LENGTH-1].col === colIndex) return PLAYER_CONFIG.yellow.baseClass + "/90";
      if (HOME_STRETCH_COORDINATES.blue[HOME_STRETCH_LENGTH-1].row === rowIndex && HOME_STRETCH_COORDINATES.blue[HOME_STRETCH_LENGTH-1].col === colIndex) return PLAYER_CONFIG.blue.baseClass + "/90";
      return "bg-primary/30"; 
    }

    for (const color of PLAYER_COLORS) {
        for (let i = 0; i < HOME_STRETCH_LENGTH -1; i++) { 
            const cell = HOME_STRETCH_COORDINATES[color][i];
            if (cell.row === rowIndex && cell.col === colIndex) return PLAYER_CONFIG[color].baseClass + "/40";
        }
    }
    
    if (MAIN_PATH_COORDINATES.some(p => p.row === rowIndex && p.col === colIndex)) {
        return "bg-slate-50"; 
    }

    return (rowIndex + colIndex) % 2 === 0 ? "bg-slate-100/70" : "bg-slate-200/70"; 
  };


  if (gameState === 'setup') {
    return (
      <>
        <title>Setup Ludo Game | Shravya Playhouse</title>
        <meta name="description" content="Set up your Ludo game: choose mode and number of players." />
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/30 to-background">
          <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
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
                      Play with Shravya AI
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {selectedMode && (
                <div>
                  <Label className="text-lg font-medium">Number of Players {selectedMode === 'ai' ? '(includes you)' : ''}</Label>
                  <RadioGroup 
                      value={selectedNumPlayers?.toString() || ""} 
                      onValueChange={(value) => setSelectedNumPlayers(parseInt(value))} 
                      className="mt-2 grid grid-cols-3 gap-4"
                  >
                    {(selectedMode === 'offline' ? [2, 3, 4] : [2, 4]).map(num => ( 
                      <div key={num}>
                        <RadioGroupItem value={num.toString()} id={`${selectedMode}-${num}`} className="peer sr-only" />
                        <Label htmlFor={`${selectedMode}-${num}`} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                          <span className="text-lg">{num}</span>
                          {selectedMode === 'ai' && (
                            <span className="text-xs text-center">{num === 2 ? "(You vs 1 Shravya AI)" : `(You vs ${num-1} Shravya AI)`}</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {selectedMode === 'ai' && selectedNumPlayers && (
                  <div className="space-y-2">
                      <Label htmlFor="humanPlayerName" className="text-lg font-medium">Your Name</Label>
                      <Input 
                          id="humanPlayerName" 
                          value={humanPlayerName} 
                          onChange={(e) => setHumanPlayerName(e.target.value)}
                          placeholder="Enter your name"
                      />
                  </div>
              )}

              {selectedMode === 'offline' && selectedNumPlayers && offlinePlayerNames.length > 0 && (
                  <div className="space-y-4">
                      <Label className="text-lg font-medium">Player Details</Label>
                      {Array.from({ length: selectedNumPlayers }).map((_, index) => (
                          <div key={index} className="flex items-end space-x-2 sm:space-x-4">
                              <div className="space-y-1 flex-grow">
                                  <Label htmlFor={`offlinePlayerName-${index}`}>Player {index + 1} Name</Label>
                                  <Input
                                      id={`offlinePlayerName-${index}`}
                                      value={offlinePlayerNames[index] || ''}
                                      onChange={(e) => handleOfflinePlayerNameChange(index, e.target.value)}
                                      placeholder={`Name for Player ${index + 1}`}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <Label htmlFor={`offlinePlayerColor-${index}`}>Color</Label>
                                   <Select value={selectedOfflineColors[index] || ''} onValueChange={(value) => handleColorChange(index, value as PlayerColor)}>
                                      <SelectTrigger id={`offlinePlayerColor-${index}`} className="w-[100px] sm:w-[130px]">
                                          <SelectValue placeholder="Color" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {PLAYER_COLORS.map((color) => (
                                              <SelectItem 
                                                key={color} 
                                                value={color} 
                                                disabled={selectedOfflineColors.includes(color) && selectedOfflineColors[index] !== color}
                                              >
                                                {PLAYER_CONFIG[color].name}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
              <Button 
                onClick={handleStartGame} 
                disabled={!selectedMode || !selectedNumPlayers || 
                    (selectedMode === 'ai' && humanPlayerName.trim() === "") || 
                    (selectedMode === 'offline' && (
                        offlinePlayerNames.slice(0,selectedNumPlayers).some(name => name.trim() === "") || 
                        selectedOfflineColors.slice(0,selectedNumPlayers).some(c => c === null) ||
                        new Set(selectedOfflineColors.slice(0,selectedNumPlayers).filter(c=>c!==null)).size !== selectedOfflineColors.slice(0,selectedNumPlayers).filter(c=>c!==null).length
                    ))
                } 
                className="w-full text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground"
               >
                Start Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Ludo Game | Shravya Playhouse</title>
      <meta name="description" content="Play the classic game of Ludo online." />
      <div className="relative flex flex-col items-center justify-start min-h-screen w-full p-2 sm:p-4 bg-gradient-to-br from-primary/30 to-background overflow-x-hidden">
        
        {players.map((p, idx) => {
          const playerSpecificConfig = PLAYER_CONFIG[p.color];
          let panelPositionClass = playerSpecificConfig.cornerPosition;

          if (players.length === 2) {
            // For 2 players, place them diagonally.
            // Player 1 (human or first offline) uses Red's default position.
            // Player 2 (AI or second offline) uses Yellow's default position for visual balance.
            if (idx === 0) panelPositionClass = PLAYER_CONFIG.red.cornerPosition; 
            if (idx === 1) panelPositionClass = PLAYER_CONFIG.yellow.cornerPosition; // Uses Yellow's corner for Player 2
          }
          
          const isCurrentPlayerTurn = currentPlayerIndex === idx;
          let DiceIconToRender = Dice6; 
          let diceButtonStyling = "text-muted-foreground opacity-50";
          let isDiceButtonClickable = false;

          if (isCurrentPlayerTurn && currentPlayer) {
            if (isRolling && diceValue) { 
              DiceIconToRender = DICE_ICONS[diceValue - 1] || Dice6;
              diceButtonStyling = "text-muted-foreground animate-spin";
            } else if (diceValue) { 
              DiceIconToRender = DICE_ICONS[diceValue - 1] || Dice6;
              diceButtonStyling = cn("animate-gentle-bounce", playerSpecificConfig.textClass);
            } else { 
              DiceIconToRender = Dice6;
              diceButtonStyling = cn("cursor-pointer hover:opacity-75", playerSpecificConfig.textClass);
            }
            if (!currentPlayer.isAI && gameState !== 'gameOver' && !isRolling && (diceValue === null || currentPlayer.hasRolledSix)) {
              isDiceButtonClickable = true;
            }
          } else { 
             DiceIconToRender = Dice6; 
             diceButtonStyling = "text-muted-foreground opacity-30";
          }

          return (
            <div key={p.color} className={cn(
              "absolute p-2 sm:p-3 rounded-lg shadow-xl border-2 border-primary/50 backdrop-blur-sm bg-card/80 w-32 sm:w-40 z-10",
              panelPositionClass
            )}>
              <p className={cn("text-xs sm:text-sm font-semibold truncate text-center mb-1 sm:mb-2", playerSpecificConfig.textClass)} title={p.name}>
                {p.name} {p.isAI && <Cpu size={14} className="inline ml-1"/>}
              </p>
              <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "border-2 border-dashed rounded-lg shadow-sm mx-auto flex items-center justify-center",
                    isCurrentPlayerTurn && !p.isAI ? "h-10 w-10 sm:h-12 sm:w-12" : "h-8 w-8 sm:h-10 sm:w-10",
                    isDiceButtonClickable 
                        ? cn("cursor-pointer", playerSpecificConfig.baseClass + "/30", `hover:${playerSpecificConfig.baseClass}/50`) 
                        : "border-muted-foreground/30 cursor-not-allowed opacity-70"
                  )}
                  onClick={() => { 
                    if(isDiceButtonClickable) handleDiceRoll();
                  }}
                  disabled={!isDiceButtonClickable || gameState === 'gameOver'}
                  aria-label={`Roll dice for ${p.name}`}
              >
                  <DiceIconToRender size={isCurrentPlayerTurn && !p.isAI ? 28 : 20} className={diceButtonStyling} />
              </Button>
            </div>
          );
        })}

        <div className="flex flex-col items-center justify-center z-0 mt-16 sm:mt-20 md:mt-24 mb-10 w-full">
            <div className="mb-2 sm:mb-4 p-2 sm:p-3 rounded-lg shadow-md bg-card/90 backdrop-blur-sm max-w-md text-center">
                <h2 className="text-lg sm:text-xl font-semibold text-primary">
                    {gameState === 'gameOver' ? "Game Over!" : (currentPlayer ? `Turn: ${currentPlayer.name}` : "Loading...")}
                </h2>
                <p className="text-xs sm:text-sm text-foreground/90 min-h-[2em]">{gameMessage}</p>
            </div>

            <div
              className="grid gap-px border-2 border-neutral-700 rounded overflow-hidden shadow-lg bg-neutral-300 w-full max-w-[300px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[540px] aspect-square"
              style={{ gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))` }}
              aria-label="Ludo board"
            >
              {boardCells.map((_, cellFlatIndex) => {
                const rowIndex = Math.floor(cellFlatIndex / BOARD_GRID_SIZE);
                const colIndex = cellFlatIndex % BOARD_GRID_SIZE;
                const tokensOnThisCell = getTokenForCell(rowIndex, colIndex);
                const cellBg = getCellBackgroundColor(rowIndex, colIndex);
                const pathIndex = MAIN_PATH_COORDINATES.findIndex(p => p.row === rowIndex && p.col === colIndex);
                const isSafe = SAFE_SQUARE_INDICES.includes(pathIndex);
                const isStart = Object.values(PLAYER_CONFIG).some(pc => pc.pathStartIndex === pathIndex);
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "aspect-square flex items-center justify-center text-xs relative",
                       cellBg,
                      "border border-neutral-400/30" 
                    )}
                  >
                    {isSafe && !isStart && <Star size={12} className="absolute text-yellow-500/70 opacity-70 z-0"/>}
                    {isStart && <Star size={16} className={cn("absolute z-0 opacity-80", PLAYER_CONFIG[PLAYER_COLORS.find(c => PLAYER_CONFIG[c].pathStartIndex === pathIndex)!].textClass)}/>}

                    {tokensOnThisCell.slice(0, 2).map((token, idx) => (
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
                                !getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id && mt.color === token.color) ||
                                (diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1 && getMovableTokens(currentPlayer, diceValue).some(m_t => m_t.position === -1)) && token.position !== -1 )

                            }
                            className={cn(
                                "rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1 absolute shadow-md",
                                PLAYER_CONFIG[token.color].baseClass, 
                                (currentPlayer && PLAYER_COLORS.indexOf(token.color) === currentPlayerIndex && diceValue && !currentPlayer.isAI && 
                                 getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id && mt.color === token.color) &&
                                  !(diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1 && getMovableTokens(currentPlayer, diceValue).some(m_t => m_t.position === -1)) && token.position !== -1 )
                                ) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default", 
                                "text-white font-bold text-[calc(min(1.5vw,0.8rem))] z-10" 
                            )}
                            style={{ 
                                transform: tokensOnThisCell.length > 1 ? (idx === 0 ? 'translateX(-20%) translateY(-20%) scale(0.75)' : 'translateX(20%) translateY(20%) scale(0.75)') : 'scale(0.85)',
                                width: tokensOnThisCell.length > 1 ? '65%' : '75%',
                                height: tokensOnThisCell.length > 1 ? '65%' : '75%',
                            }}
                            aria-label={`Token ${token.color} ${token.id + 1} at ${getTokenDisplayInfo(token).text}`}
                            >
                        </button>
                    ))}
                    {tokensOnThisCell.length > 2 && (
                        <span className="absolute bottom-0 right-0 text-xs bg-black/50 text-white px-1 rounded-tl-md z-20">
                            +{tokensOnThisCell.length -2}
                        </span>
                    )}
                  </div>
                );
              })}
            </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
             <Button onClick={resetGame} variant="outline" className="shadow-lg bg-card/80 hover:bg-card">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
            </Button>
        </div>

      </div>
    </>
  );
}

