
"use client";

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Home, Users, Cpu, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'] as const;
type PlayerColor = typeof PLAYER_COLORS[number];

const MAIN_PATH_LENGTH = 52;
const HOME_STRETCH_LENGTH = 6;
const NUM_TOKENS_PER_PLAYER = 4;

const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number; cornerPosition: string; houseCoords: {row: number, col: number}[], startCell: {row: number, col: number} }> = {
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 0,  homeEntryPathIndex: 50, cornerPosition: "bottom-4 left-4", houseCoords: [{row:1,col:1},{row:1,col:4},{row:4,col:1},{row:4,col:4}], startCell: {row: 6, col: 1} },
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 13, homeEntryPathIndex: 11, cornerPosition: "top-4 left-4", houseCoords: [{row:1,col:10},{row:1,col:13},{row:4,col:10},{row:4,col:13}], startCell: {row:1, col:6}},
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24, cornerPosition: "top-4 right-4", houseCoords: [{row:10,col:10},{row:10,col:13},{row:13,col:10},{row:13,col:13}], startCell: {row:8, col:13}},
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 39, homeEntryPathIndex: 37, cornerPosition: "bottom-4 right-4", houseCoords: [{row:10,col:1},{row:10,col:4},{row:13,col:1},{row:13,col:4}], startCell: {row:13, col:8}},
};

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1: base, 0-51: main path, 100-105+ (color specific for home stretch), 200+: finished
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
    offlineNames?: string[]
): Player[] => {
  const activePlayerColors = PLAYER_COLORS.slice(0, numPlayersToCreate);
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

const BOARD_GRID_SIZE = 15;
const boardCells = Array(BOARD_GRID_SIZE * BOARD_GRID_SIZE).fill(null).map((_, i) => i);

export default function LudoPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const [selectedNumPlayers, setSelectedNumPlayers] = useState<number | null>(null);
  
  const [humanPlayerName, setHumanPlayerName] = useState<string>("Human Player");
  const [offlinePlayerNames, setOfflinePlayerNames] = useState<string[]>([]);

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
    } else {
      setOfflinePlayerNames([]);
    }
  }, [selectedNumPlayers, selectedMode]);

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

    const newPlayers = initialPlayerState(selectedNumPlayers, selectedMode, humanPlayerName, offlinePlayerNames);
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
    const hasTokensInBase = player.tokens.some(t => t.position === -1);

    if (!player.isAI && roll === 6 && hasTokensInBase) {
        return player.tokens.filter(token => token.position === -1);
    }

    return player.tokens.filter(token => {
      if (token.position === -1 && roll === 6) return true; 
      if (token.position >= 0 && token.position < 200) { 
        const playerConfig = PLAYER_CONFIG[player.color];
        const currentPos = token.position;
        
        if (currentPos >= 100) { 
             const stretchPos = currentPos % 100;
             return (stretchPos + roll) < HOME_STRETCH_LENGTH;
        }
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
    }

    const movableTokens = getMovableTokens(currentP, roll);
    const hasTokensInBase = currentP.tokens.some(t => t.position === -1);

    if (hasTokensInBase && roll !== 6 && movableTokens.filter(t => t.position !== -1).length === 0) {
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
        if (roll === 6 && hasTokensInBase) {
          tokenToMoveAI = movableTokens.find(t => t.position === -1);
        } else {
          const onBoardTokens = movableTokens.filter(t => t.position !== -1);
          if (onBoardTokens.length > 0) tokenToMoveAI = onBoardTokens[0];
          else tokenToMoveAI = movableTokens[0]; // fallback to base token if only option
        }

        if (tokenToMoveAI) {
          attemptMoveToken(currentPlayerIndex, tokenToMoveAI.id, roll);
        } else {
          passTurn(roll !== 6); // Pass turn if AI somehow has no movable token (should not happen with above logic)
        }
      }, 1000); 
    } else {
      setGameMessage(prev => prev + ` Select a token to move.`);
      if (roll === 6 && hasTokensInBase && movableTokens.some(t => t.position === -1)) {
          setGameMessage(prev => prev + ` You must move a token from base.`);
      }
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
    } else {
        resetGame();
    }
  };

 useEffect(() => {
    if (gameState === 'playing' && players.length > 0 && currentPlayer?.isAI && !diceValue && !isRolling) {
        if (currentPlayer.sixStreak < 3) { 
            setGameMessage(`${currentPlayer.name} is thinking...`);
            setTimeout(() => handleDiceRoll(), 1500); 
        }
    }
}, [currentPlayerIndex, players, gameState, diceValue, isRolling, currentPlayer, handleDiceRoll]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !currentPlayer || currentPlayer.isAI) return;

    const token = players[playerIndex].tokens.find(t=>t.id === tokenId);
    if(!token) return;
    
    const hasTokensInBase = currentPlayer.tokens.some(t => t.position === -1);
    const canMoveFromBase = currentPlayer.tokens.some(t => t.position === -1); // check if any token is in base

    if (diceValue === 6 && canMoveFromBase && token.position !== -1) {
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
    
    const movableTokens = getMovableTokens(currentPlayer, diceValue);
    if (!movableTokens.some(mt => mt.id === tokenId && mt.color === currentPlayer.color)) {
        toast({ variant: "destructive", title: "Cannot Move Token", description: "This token cannot make the attempted move." });
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
        
        const homeEntry = playerConfig.homeEntryPathIndex;
        const start = playerConfig.pathStartIndex;
        let stepsToHomeEntry;

        if (start <= homeEntry) { 
            if (currentPosOnGlobalTrack >= start && currentPosOnGlobalTrack <= homeEntry) {
                stepsToHomeEntry = homeEntry - currentPosOnGlobalTrack;
            } else { 
                stepsToHomeEntry = MAIN_PATH_LENGTH; // effectively means it won't enter home stretch this turn
            }
        } else { // Path wraps around (e.g. red player)
            if (currentPosOnGlobalTrack >= start || currentPosOnGlobalTrack <= homeEntry) {
                 stepsToHomeEntry = (homeEntry - currentPosOnGlobalTrack + MAIN_PATH_LENGTH) % MAIN_PATH_LENGTH;
            } else {
                stepsToHomeEntry = MAIN_PATH_LENGTH;
            }
        }

        if (roll > stepsToHomeEntry) { 
            const stepsIntoHomeStretch = roll - stepsToHomeEntry - 1; 
            if (stepsIntoHomeStretch < HOME_STRETCH_LENGTH) {
                tokenToMove.position = 100 + stepsIntoHomeStretch; // Mark as in home stretch
                 if (tokenToMove.position === 100 + HOME_STRETCH_LENGTH - 1) { // Exact land on finish
                    tokenToMove.position = 200 + tokenToMove.id; // Mark as finished
                    setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
                 } else {
                    setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} into home stretch to S${stepsIntoHomeStretch}.`);
                 }
                 moveSuccessful = true;
            } else { 
                setGameMessage(`${playerToMove.name} cannot move token ${tokenId+1}: overshot home stretch. Move stays on main path if possible.`);
                // If overshot, but can still move on main path, calculate new main path position
                tokenToMove.position = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;
                setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} from ${originalPosition === -1 ? "base" : originalPosition} to square ${tokenToMove.position}. Overshot home.`);
                moveSuccessful = true; // still a valid move on main path
            }
        } else { // Stays on main path or lands exactly on home entry
            tokenToMove.position = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;
            setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} from ${originalPosition === -1 ? "base" : originalPosition} to square ${tokenToMove.position}.`);
            moveSuccessful = true; 
        }
      } else if (tokenToMove.position >= 100 && tokenToMove.position < 200) { // Moving within home stretch
        const currentHomeStretchPos = tokenToMove.position % 100;
        let newHomeStretchPos = currentHomeStretchPos + roll;
        if (newHomeStretchPos === HOME_STRETCH_LENGTH -1) { // Exact land on finish
          tokenToMove.position = 200 + tokenToMove.id;
          setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
          moveSuccessful = true;
        } else if (newHomeStretchPos < HOME_STRETCH_LENGTH -1 ) { // Move within stretch
          tokenToMove.position = 100 + newHomeStretchPos;
          setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} in home stretch to S${newHomeStretchPos}.`);
          moveSuccessful = true;
        } else { // Overshot final spot
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
          newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true }; 
          setGameMessage(prev => prev + ` ${playerToMove.name} rolled a 6 and gets another turn.`);
          setDiceValue(null); 
        } else {
          newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: false, sixStreak: 0 };
          passTurn(true); 
        }
      } else {
        // If move wasn't successful but it was a 6, player should still get another roll.
        if (roll === 6) {
            newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true };
            setDiceValue(null); 
            setGameMessage(prev => prev + ` No valid move made with 6. ${playerToMove.name} gets to roll again.`);
        } else {
            // If not a 6 and no move, pass turn
             passTurn(true); 
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

 const getTokenForCell = (rowIndex: number, colIndex: number): Token[] => {
    const tokensOnThisCell: Token[] = [];
    if (!players || players.length === 0) return tokensOnThisCell;

    players.forEach(player => {
      const playerSpecificConfig = PLAYER_CONFIG[player.color];
      player.tokens.forEach(token => {
        if (token.position === -1) { // Token in base
            const baseSpot = playerSpecificConfig.houseCoords[token.id];
            if (baseSpot && baseSpot.row === rowIndex && baseSpot.col === colIndex) {
                tokensOnThisCell.push(token);
            }
        } else if (token.position === playerSpecificConfig.pathStartIndex) { // Token on start cell
            if (playerSpecificConfig.startCell.row === rowIndex && playerSpecificConfig.startCell.col === colIndex) {
                tokensOnThisCell.push(token);
            }
        }
        // Add more logic here to map token.position (0-51 and 100-105) to specific (rowIndex, colIndex)
        // This is the complex part for full board rendering.
      });
    });
    return tokensOnThisCell;
  };

  const getCellBackgroundColor = (rowIndex: number, colIndex: number): string => {
    // Red House
    if (rowIndex >= 0 && rowIndex <= 5 && colIndex >= 0 && colIndex <= 5) return PLAYER_CONFIG.red.baseClass + "/70";
    // Green House
    if (rowIndex >= 0 && rowIndex <= 5 && colIndex >= 9 && colIndex <= 14) return PLAYER_CONFIG.green.baseClass + "/70";
    // Blue House
    if (rowIndex >= 9 && rowIndex <= 5 && colIndex >= 0 && colIndex <= 5) return PLAYER_CONFIG.blue.baseClass + "/70"; // Typo fixed: rowIndex >= 9 && rowIndex <= 14
    if (rowIndex >= 9 && rowIndex <= 14 && colIndex >= 0 && colIndex <= 5) return PLAYER_CONFIG.blue.baseClass + "/70";
    // Yellow House
    if (rowIndex >= 9 && rowIndex <= 14 && colIndex >= 9 && colIndex <= 14) return PLAYER_CONFIG.yellow.baseClass + "/70";
    
    // Center Home Area (Triangle)
    if (rowIndex >= 6 && rowIndex <= 8 && colIndex >= 6 && colIndex <= 8) {
      if (rowIndex === 7 && colIndex === 7) return "bg-primary/50"; // Center of home
      if ((rowIndex === 6 && colIndex === 7) || (rowIndex === 7 && colIndex === 6) || (rowIndex === 8 && colIndex === 7) || (rowIndex === 7 && colIndex === 8 )) { // Arms of home
        if (rowIndex === 6 && colIndex === 7) return PLAYER_CONFIG.green.baseClass + "/60"; // Green entry to home triangle
        if (rowIndex === 7 && colIndex === 6) return PLAYER_CONFIG.red.baseClass + "/60";   // Red entry
        if (rowIndex === 8 && colIndex === 7) return PLAYER_CONFIG.blue.baseClass + "/60";  // Blue entry
        if (rowIndex === 7 && colIndex === 8) return PLAYER_CONFIG.yellow.baseClass + "/60"; // Yellow entry
      }
      return "bg-slate-300"; // Other parts of home triangle
    }

    // Home Stretch Paths
    // Red Home Stretch (Vertical column 7, rows 1-5)
    if (colIndex === 7 && rowIndex >= 1 && rowIndex <= 5) return PLAYER_CONFIG.red.baseClass + "/40";
    // Green Home Stretch (Horizontal row 7, cols 9-13)
    if (rowIndex === 7 && colIndex >= 9 && colIndex <= 13) return PLAYER_CONFIG.green.baseClass + "/40";
    // Yellow Home Stretch (Vertical column 7, rows 9-13)
    if (colIndex === 7 && rowIndex >= 9 && rowIndex <= 13) return PLAYER_CONFIG.yellow.baseClass + "/40";
    // Blue Home Stretch (Horizontal row 7, cols 1-5)
    if (rowIndex === 7 && colIndex >= 1 && colIndex <= 5) return PLAYER_CONFIG.blue.baseClass + "/40";

    // Main Path Start Squares (adjacent to houses)
    if (rowIndex === 6 && colIndex === 1) return PLAYER_CONFIG.red.baseClass + "/90";    // Red Start
    if (rowIndex === 1 && colIndex === 8) return PLAYER_CONFIG.green.baseClass + "/90";  // Green Start (corrected from col 6 to 8)
    if (rowIndex === 1 && colIndex === 6) return PLAYER_CONFIG.green.baseClass + "/90"; // Green Start actual
    if (rowIndex === 8 && colIndex === 13) return PLAYER_CONFIG.yellow.baseClass + "/90"; // Yellow Start
    if (rowIndex === 13 && colIndex === 8) return PLAYER_CONFIG.blue.baseClass + "/90";   // Blue Start (corrected from col 6 to 8)
    if (rowIndex === 13 && colIndex === 6) return PLAYER_CONFIG.blue.baseClass + "/90"; // Blue Start actual


    // Main path squares (outer 3 rows/cols, excluding corners and home stretches)
    const isOuterPath = (
      (rowIndex >= 0 && rowIndex <=5 && (colIndex === 6 || colIndex === 7 || colIndex === 8)) || // Top block columns
      (rowIndex >= 9 && rowIndex <=14 && (colIndex === 6 || colIndex === 7 || colIndex === 8)) || // Bottom block columns
      (colIndex >= 0 && colIndex <=5 && (rowIndex === 6 || rowIndex === 7 || rowIndex === 8)) || // Left block rows
      (colIndex >= 9 && colIndex <=14 && (rowIndex === 6 || rowIndex === 7 || rowIndex === 8))    // Right block rows
    );

    if(isOuterPath) return "bg-slate-50";

    return (rowIndex + colIndex) % 2 === 0 ? "bg-slate-100/70" : "bg-slate-200/70"; // Default for unused cells
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
                      <Label className="text-lg font-medium">Player Names</Label>
                      {offlinePlayerNames.slice(0, selectedNumPlayers).map((name, index) => (
                          <div key={index} className="space-y-1">
                              <Label htmlFor={`offlinePlayerName-${index}`}>Player {index + 1} Name ({PLAYER_CONFIG[PLAYER_COLORS[index]].name})</Label>
                              <Input 
                                  id={`offlinePlayerName-${index}`}
                                  value={name}
                                  onChange={(e) => handleOfflinePlayerNameChange(index, e.target.value)}
                                  placeholder={`Enter name for Player ${index + 1}`}
                              />
                          </div>
                      ))}
                  </div>
              )}
              <Button onClick={handleStartGame} disabled={!selectedMode || !selectedNumPlayers || (selectedMode === 'ai' && humanPlayerName.trim() === "") || (selectedMode === 'offline' && offlinePlayerNames.slice(0,selectedNumPlayers).some(name => name.trim() === ""))} className="w-full text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground">
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
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full p-2 sm:p-4 bg-gradient-to-br from-primary/30 to-background overflow-hidden">
        
        {/* Player Info Panels - Absolutely Positioned */}
        {players.map((p, idx) => {
          const playerSpecificConfig = PLAYER_CONFIG[p.color];
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
            if (!currentPlayer.isAI && gameState !== 'gameOver' && !isRolling) {
              if (diceValue === null || currentPlayer.hasRolledSix) {
                isDiceButtonClickable = true;
              }
            }
          } else {
             DiceIconToRender = Dice6; 
             diceButtonStyling = "text-muted-foreground opacity-30";
          }

          return (
            <div key={p.color} className={cn("absolute p-2 sm:p-3 rounded-lg shadow-xl border-2 border-primary/50 backdrop-blur-sm bg-card/80 w-32 sm:w-40", playerSpecificConfig.cornerPosition)}>
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

        {/* Central Game Area */}
        <div className="flex flex-col items-center justify-center z-0">
            <div className="mb-2 sm:mb-4 p-2 sm:p-3 rounded-lg shadow-md bg-card/90 backdrop-blur-sm max-w-md text-center">
                <h2 className="text-lg sm:text-xl font-semibold text-primary">
                    {gameState === 'gameOver' ? "Game Over!" : (currentPlayer ? `Turn: ${currentPlayer.name}` : "Loading...")}
                </h2>
                <p className="text-xs sm:text-sm text-foreground/90 min-h-[2em]">{gameMessage}</p>
            </div>

            <div
              className="grid gap-px border-2 border-neutral-700 rounded overflow-hidden shadow-lg bg-neutral-300 w-[calc(100vw-4rem)] sm:w-[calc(100vw-8rem)] md:w-auto max-w-[600px] max-h-[600px] aspect-square"
              style={{ gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))` }}
              aria-label="Ludo board"
            >
              {boardCells.map((_, cellFlatIndex) => {
                const rowIndex = Math.floor(cellFlatIndex / BOARD_GRID_SIZE);
                const colIndex = cellFlatIndex % BOARD_GRID_SIZE;
                const tokensOnThisCell = getTokenForCell(rowIndex, colIndex);
                const cellBg = getCellBackgroundColor(rowIndex, colIndex);
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "aspect-square flex items-center justify-center text-xs relative",
                       cellBg,
                      "border-px border-neutral-400/30" 
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
                                 getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id && mt.color === token.color) && 
                                 !(diceValue === 6 && currentPlayer.tokens.some(t => t.position === -1) && token.position !== -1) 
                                ) ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default", 
                                "text-white font-bold text-[calc(min(2vw,1rem))] z-10" // Responsive text size
                            )}
                            style={{ 
                                transform: tokensOnThisCell.length > 1 ? (idx === 0 ? 'translateX(-15%) translateY(-15%) scale(0.8)' : 'translateX(15%) translateY(15%) scale(0.8)') : 'scale(0.9)',
                                width: tokensOnThisCell.length > 1 ? '60%' : '70%',
                                height: tokensOnThisCell.length > 1 ? '60%' : '70%',
                            }}
                            aria-label={`Token ${token.color} ${token.id + 1} at ${getTokenDisplayInfo(token)}`}
                            >
                            {/* Display token ID or a small icon if preferred over blank circles */}
                            {/* {token.id + 1}  */}
                        </button>
                    ))}
                  </div>
                );
              })}
            </div>
             <p className="mt-2 text-center text-xs text-muted-foreground max-w-md">
              Note: Full token path rendering on the grid is a future enhancement. Current visual is simplified (shows base & start positions). Click tokens on board to move if eligible.
            </p>
        </div>

        {/* Reset Button - Example Positioning */}
        <div className="absolute bottom-4 right-1/2 translate-x-1/2 sm:right-4 sm:translate-x-0 z-20">
             <Button onClick={resetGame} variant="outline" className="shadow-lg bg-card/80 hover:bg-card">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
            </Button>
        </div>

      </div>
    </>
  );
}

