
"use client";

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Home, Users, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'] as const;
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
  position: number; // -1: base, 0-51: main path, 100-105+ (color specific for home stretch), 200+: finished (200 + tokenId)
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
    humanName?: string, // Name for the primary human player in AI mode
    offlineNames?: string[] // Array of names for offline players
): Player[] => {
  const activePlayerColors = PLAYER_COLORS.slice(0, numPlayersToCreate);
  return activePlayerColors.map((color, index) => {
    const isAIPlayer = mode === 'ai' && index > 0; 
    let playerName = PLAYER_CONFIG[color].name;

    if (mode === 'ai') {
      if (index === 0) { // Human player in AI mode
        playerName = humanName || "Human Player";
      } else { // AI player in AI mode
        playerName = `Shravya AI (${PLAYER_CONFIG[color].name})`;
      }
    } else if (mode === 'offline') { // Offline mode
      playerName = (offlineNames && offlineNames[index]) ? offlineNames[index] : `Player ${index + 1}`;
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

    const newPlayers = initialPlayerState(
        selectedNumPlayers, 
        selectedMode,
        selectedMode === 'ai' ? humanPlayerName : undefined,
        selectedMode === 'offline' ? offlinePlayerNames : undefined
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
      if (roll === 6 && hasTokensInBase) {
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
    
    const movableTokens = getMovableTokens(currentPlayer, diceValue);
    if (!movableTokens.some(mt => mt.id === tokenId && mt.color === currentPlayer.color)) {
        toast({ variant: "destructive", title: "Cannot Move Token", description: "This token cannot make the attempted move or is not the best option." });
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
                stepsToHomeEntry = MAIN_PATH_LENGTH;
            }
        } else { 
            if (currentPosOnGlobalTrack >= start || currentPosOnGlobalTrack <= homeEntry) {
                 stepsToHomeEntry = (homeEntry - currentPosOnGlobalTrack + MAIN_PATH_LENGTH) % MAIN_PATH_LENGTH;
            } else {
                stepsToHomeEntry = MAIN_PATH_LENGTH;
            }
        }

        if (roll > stepsToHomeEntry) { 
            const stepsIntoHomeStretch = roll - stepsToHomeEntry - 1; 
            if (stepsIntoHomeStretch < HOME_STRETCH_LENGTH) {
                tokenToMove.position = 100 + stepsIntoHomeStretch;
                 if (tokenToMove.position === 100 + HOME_STRETCH_LENGTH - 1) { 
                    tokenToMove.position = 200 + tokenToMove.id; 
                    setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} home!`);
                 } else {
                    setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} into home stretch to S${stepsIntoHomeStretch}.`);
                 }
            } else { 
                setGameMessage(`${playerToMove.name} cannot move token ${tokenId+1}: overshot home stretch.`);
                // moveSuccessful = false; // This was commented out, should it be?
            }
        } else { 
            tokenToMove.position = (currentPosOnGlobalTrack + roll) % MAIN_PATH_LENGTH;
            setGameMessage(`${playerToMove.name} moved token ${tokenId + 1} from ${originalPosition === -1 ? "base" : originalPosition} to square ${tokenToMove.position}.`);
        }
        moveSuccessful = true; 
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
          setGameMessage(`${playerToMove.name} cannot move token ${tokenId+1}: overshot final home spot.`);
          // moveSuccessful = false; // This was commented out
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
        if (! (tokenToMove.position === -1 && roll !== 6) && tokenToMove.position < 200) {
           toast({ variant: "destructive", title: "Cannot Move Token", description: "This token cannot make the attempted move or its logic is pending." });
        }
        if (roll !== 6) {
            passTurn(true); 
        } else {
            newPlayers[playerIdx] = { ...playerToMove, tokens: newPlayers[playerIdx].tokens, hasRolledSix: true };
            setDiceValue(null); 
            setGameMessage(prev => prev + ` No valid move made with 6. ${playerToMove.name} gets to roll again.`);
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
    const tokensOnThisCell: Token[] = [];
    if (!players || players.length === 0) return tokensOnThisCell;

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
                tokensOnThisCell.push(token);
            }
        } else if (token.position === playerStartConfig.pathStartIndex) {
            let expectedStartCellGridIndex = -1;
            if (token.color === 'red')    expectedStartCellGridIndex = (6 * BOARD_GRID_SIZE + 1); 
            else if (token.color === 'green')  expectedStartCellGridIndex = (1 * BOARD_GRID_SIZE + 8);  
            else if (token.color === 'yellow') expectedStartCellGridIndex = (8 * BOARD_GRID_SIZE + 13); 
            else if (token.color === 'blue')   expectedStartCellGridIndex = (13 * BOARD_GRID_SIZE + 6); 
            
            if (cellIndex === expectedStartCellGridIndex) {
                tokensOnThisCell.push(token);
            }
        }
      });
    });
    return tokensOnThisCell;
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
        if ((c === 6 || c === 8) && (r >=0 && r <=14)) return true; 
        
        if (r >= 0 && r <= 5 && (c === 6 || c === 7 || c === 8)) return true; 
        if (r >= 9 && r <= 14 && (c === 6 || c === 7 || c === 8)) return true; 
        if (c >= 0 && c <= 5 && (r === 6 || r === 7 || r === 8)) return true; 
        if (c >= 9 && c <= 14 && (r === 6 || r === 7 || r === 8)) return true; 
        return false;
    }

    if (row === 6 && col === 1) return PLAYER_CONFIG.red.baseClass + "/90";    
    if (row === 1 && col === 8) return PLAYER_CONFIG.green.baseClass + "/90";  
    if (row === 8 && col === 13) return PLAYER_CONFIG.yellow.baseClass + "/90"; 
    if (row === 13 && col === 6) return PLAYER_CONFIG.blue.baseClass + "/90";   
    
    if (isPathRowCol(row,col) && 
        !(row >= 6 && row <= 8 && col >= 6 && col <= 8) && 
        !((row >= 0 && row <= 5 && col >= 0 && col <= 5) || 
          (row >= 0 && row <= 5 && col >= 9 && col <= 14) || 
          (row >= 9 && row <= 14 && col >= 0 && col <= 5) || 
          (row >= 9 && row <= 14 && col >= 9 && col <= 14)) &&
        !((col === 7 && row >= 1 && row <= 5) || 
          (row === 7 && col >= 9 && col <= 13) || 
          (col === 7 && row >= 9 && row <= 13) || 
          (row === 7 && col >= 1 && col <= 5))  &&
        !((row === 6 && col === 1) || (row === 1 && col === 8) || (row === 8 && col === 13) || (row === 13 && col === 6))
       ) {
        return "bg-slate-50"; 
    }
    return (row + col) % 2 === 0 ? "bg-slate-100/70" : "bg-slate-200/70";
  };


  if (gameState === 'setup') {
    return (
      <>
        <title>Setup Ludo Game | Shravya Playhouse</title>
        <meta name="description" content="Set up your Ludo game: choose mode and number of players." />
        <Card className="w-full max-w-lg mx-auto shadow-xl">
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
                    {offlinePlayerNames.map((name, index) => (
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
                                 getMovableTokens(currentPlayer,diceValue).some(mt => mt.id === token.id && mt.color === token.color) && 
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
                  const isCurrentPlayerTurn = currentPlayerIndex === playerListIndex;
                  const playerSpecificConfig = PLAYER_CONFIG[p.color];
                  
                  let DiceIconToRender = Dice6; 
                  let diceButtonStyling = "text-muted-foreground opacity-50"; 
                  let isDiceButtonClickable = false;

                  if (isCurrentPlayerTurn) {
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
                    
                    if (!p.isAI && gameState !== 'gameOver' && !isRolling) {
                        if (diceValue === null || p.hasRolledSix) { 
                            isDiceButtonClickable = true;
                        }
                    }
                  } else { 
                     DiceIconToRender = Dice6; 
                     diceButtonStyling = "text-muted-foreground opacity-30";
                  }
                  
                  return (
                    <div key={p.color} className={cn("p-3 rounded-lg border-2", isCurrentPlayerTurn ? "border-accent bg-accent/10 shadow-lg" : "border-muted")}>
                      <div className="flex items-center justify-between mb-2">
                          <span className={cn("font-semibold text-lg", playerSpecificConfig.textClass)}>{p.name}</span>
                          {p.isAI && <Cpu size={20} className="text-muted-foreground" title="Shravya AI Player"/>}
                      </div>
                      <div className="flex items-center justify-between">
                          <Button
                              variant="outline"
                              size="icon"
                              className={cn(
                                "border-2 border-dashed rounded-lg shadow-sm",
                                isCurrentPlayerTurn && !p.isAI ? "h-14 w-14" : "h-10 w-10",
                                isDiceButtonClickable 
                                    ? cn("cursor-pointer", playerSpecificConfig.baseClass + "/30", `hover:${playerSpecificConfig.baseClass}/50`) 
                                    : "border-muted-foreground/30 cursor-not-allowed opacity-70"
                              )}
                              onClick={() => { 
                                if(isDiceButtonClickable) handleDiceRoll();
                              }}
                              disabled={!isDiceButtonClickable}
                              aria-label={`Roll dice for ${p.name}`}
                          >
                              <DiceIconToRender size={isCurrentPlayerTurn && !p.isAI ? 36 : 24} className={diceButtonStyling} />
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
                                  playerSpecificConfig.baseClass, "text-white",
                                  token.position >= 200 ? 'opacity-60 line-through decoration-2 decoration-black' : '', 
                                  (currentPlayer && p.color === currentPlayer.color && !p.isAI && diceValue &&
                                  getMovableTokens(p, diceValue).some(mt => mt.id === token.id && mt.color === p.color) && 
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
