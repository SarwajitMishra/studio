
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
const HOME_STRETCH_LENGTH = 6;
const NUM_TOKENS_PER_PLAYER = 4;
const BOARD_GRID_SIZE = 15;


const MAIN_PATH_COORDINATES: { row: number; col: number }[] = [
  { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
  { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
  { row: 0, col: 8 },
  { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 },
  { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 },
  { row: 8, col: 14 },
  { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 },
  { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 },
  { row: 14, col: 6 },
  { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 },
  { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
  { row: 6, col: 0 }
];

const HOME_STRETCH_COORDINATES: Record<PlayerColor, { row: number; col: number }[]> = {
  red:    [ { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, {row: 7, col: 6} ],
  green:  [ { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 }, {row: 6, col: 7} ],
  yellow: [ { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }, {row: 7, col: 8} ],
  blue:   [ { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 }, {row: 8, col: 7} ],
};


const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number; houseCoords: {row: number, col: number}[], startCell: {row: number, col: number} }> = {
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 0,  homeEntryPathIndex: 50, houseCoords: [{row:1,col:1},{row:1,col:4},{row:4,col:1},{row:4,col:4}], startCell: MAIN_PATH_COORDINATES[0] },
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 13, homeEntryPathIndex: 11, houseCoords: [{row:1,col:10},{row:1,col:13},{row:4,col:10},{row:4,col:13}], startCell: MAIN_PATH_COORDINATES[13]},
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24, houseCoords: [{row:10,col:10},{row:10,col:13},{row:13,col:10},{row:13,col:13}], startCell: MAIN_PATH_COORDINATES[26]},
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 39, homeEntryPathIndex: 37, houseCoords: [{row:10,col:1},{row:10,col:4},{row:13,col:1},{row:13,col:4}], startCell: MAIN_PATH_COORDINATES[39]},
};

const SAFE_SQUARE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47]; // Example safe squares

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface Token {
  id: number;
  color: PlayerColor;
  position: number;
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
     activePlayerColors = ['red', 'yellow']; 
  } else {
    activePlayerColors = PLAYER_COLORS.slice(0, numPlayersToCreate);
  }

  return activePlayerColors.map((color, index) => {
    const isAIPlayer = mode === 'ai' && index > 0;
    let playerName = PLAYER_CONFIG[color].name;

    if (mode === 'ai') {
      // In AI mode, Player 0 (Red) is Human, Player 1 (Yellow) is AI
      if (index === 0) playerName = humanName || "Human Player";
      else playerName = "Shravya AI";
    } else if (mode === 'offline') {
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

const boardCells = Array(BOARD_GRID_SIZE * BOARD_GRID_SIZE).fill(null).map((_, i) => i);

const PlayerInfoCard: React.FC<{ // Renamed from PlayerPanel
  player: Player;
  isCurrentPlayer: boolean;
  diceValue: number | null;
  isRolling: boolean;
  onDiceRoll: () => void;
  gameState: GameState;
}> = ({ player, isCurrentPlayer, diceValue, isRolling, onDiceRoll, gameState }) => {
  const playerSpecificConfig = PLAYER_CONFIG[player.color];
  let DiceIconToRender = Dice6;
  let diceButtonStyling = "text-muted-foreground opacity-50";
  let isDiceButtonClickable = false;

  if (isCurrentPlayer && player) {
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
    if (!player.isAI && gameState === 'playing' && !isRolling && (diceValue === null || player.hasRolledSix)) {
      isDiceButtonClickable = true;
    }
  } else {
    DiceIconToRender = Dice6;
    diceButtonStyling = "text-muted-foreground opacity-30";
  }

  const panelClasses = cn(
    "flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg shadow-md border border-primary/30 bg-card/90 backdrop-blur-sm",
    playerSpecificConfig.baseClass + "/20",
    "w-36 sm:w-48 h-auto" // Adjusted width, height auto
  );
  
  const nameClasses = cn(
    "text-sm sm:text-base font-semibold truncate mb-2 text-center", 
    playerSpecificConfig.textClass
  );

  return (
    <div className={panelClasses}>
      <p className={nameClasses} title={player.name}>
        {player.name} {player.isAI && <Cpu size={14} className="inline ml-1"/>}
      </p>
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "border-2 border-dashed rounded-lg shadow-sm flex items-center justify-center",
          "h-10 w-10 sm:h-12 sm:w-12", // Consistent dice button size
          isDiceButtonClickable
            ? cn("cursor-pointer", playerSpecificConfig.baseClass + "/30", `hover:${playerSpecificConfig.baseClass}/50`)
            : "border-muted-foreground/30 cursor-not-allowed opacity-70"
        )}
        onClick={() => {
          if (isDiceButtonClickable) onDiceRoll();
        }}
        disabled={!isDiceButtonClickable || gameState === 'gameOver'}
        aria-label={`Roll dice for ${player.name}`}
      >
        <DiceIconToRender size={24} className={diceButtonStyling} />
      </Button>
    </div>
  );
};


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

    // For AI mode with 2 players, explicitly set Human as Red, AI as Yellow to match visual layout intentions.
    let playerSetupColors: PlayerColor[] | undefined = undefined;
    if (selectedMode === 'ai' && selectedNumPlayers === 2) {
        playerSetupColors = ['red', 'yellow']; // Human (Red), AI (Yellow)
    } else if (selectedMode === 'offline') {
        playerSetupColors = validSelectedColors;
    }


    const newPlayers = initialPlayerState(
        selectedNumPlayers, 
        selectedMode, 
        humanPlayerName, 
        offlinePlayerNames, 
        playerSetupColors
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

  const processDiceRoll = useCallback((roll: number) => {
    const player = players[currentPlayerIndex];
    if (!player) return;
    
    let currentMessage = `${player.name} rolled a ${roll}.`;
    let currentP = { ...player };

    if (roll === 6) {
      currentP.hasRolledSix = true;
      currentP.sixStreak += 1;
      setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? currentP : p));

      if (currentP.sixStreak === 3) {
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
  }, [players, currentPlayerIndex]);

  const handleDiceRoll = useCallback(() => {
    const player = players[currentPlayerIndex];
    if (isRolling || !player || (player.isAI && diceValue !== null)) return;
    if (!player.isAI && diceValue !== null && !player.hasRolledSix) return;

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
  }, [isRolling, diceValue, players, currentPlayerIndex, processDiceRoll]);

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
    const player = players[currentPlayerIndex];
    if (gameState === 'playing' && player?.isAI && !diceValue && !isRolling) {
        if (player.sixStreak < 3) {
            setTimeout(() => handleDiceRoll(), 1500);
        }
    }
}, [gameState, players, currentPlayerIndex, diceValue, isRolling, handleDiceRoll]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    const player = players[playerIndex];
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !player || player.isAI) return;

    const token = player.tokens.find(t=>t.id === tokenId);
    if(!token) return;
        
    const movableTokens = getMovableTokens(player, diceValue);
    if (!movableTokens.some(mt => mt.id === tokenId && mt.color === player.color)) {
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
  
  const player1 = players.length > 0 ? players[0] : null; // Typically Red (Human in AI mode)
  const player2 = players.length > 1 ? players[1] : null; // Typically Yellow (AI in AI mode)
  // For 3-4 players, we would need to extend this or revert to the grid layout.
  // This refactor primarily focuses on the 2-player layout shown in the image.
  const isTwoPlayerGame = players.length === 2;


  return (
    <>
      <title>Ludo Game | Shravya Playhouse</title>
      <meta name="description" content="Play the classic game of Ludo online." />
      <div className="flex flex-col items-center justify-start min-h-screen w-full p-1 sm:p-2 md:p-4 bg-gradient-to-br from-primary/30 to-background overflow-x-hidden">
        
        <div className="mb-2 sm:mb-3 p-2 rounded-lg shadow-md bg-card/90 backdrop-blur-sm max-w-md text-center">
            <h2 className="text-base sm:text-lg font-semibold text-primary">
                {gameState === 'gameOver' ? "Game Over!" : (currentPlayer ? `Turn: ${currentPlayer.name}` : "Loading...")}
            </h2>
            <p className="text-xs sm:text-sm text-foreground/90 min-h-[1.5em]">{gameMessage}</p>
        </div>

        {/* Main Game Area: Panels and Board */}
        <div className={cn(
            "flex w-full items-center justify-center gap-2 sm:gap-4",
            isTwoPlayerGame ? "flex-row" : "flex-col" // Fallback for >2 players, though image shows 2
        )}>
            {isTwoPlayerGame && player1 && (
                 <PlayerInfoCard 
                    player={player1}
                    isCurrentPlayer={currentPlayer?.color === player1.color}
                    diceValue={diceValue}
                    isRolling={isRolling}
                    onDiceRoll={handleDiceRoll}
                    gameState={gameState}
                  />
            )}

            {/* Board - Centered */}
            <div
              className="grid gap-px border-2 border-neutral-700 rounded overflow-hidden shadow-lg bg-neutral-300 w-full max-w-[300px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[540px] aspect-square"
              style={{ 
                gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))` 
              }}
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

            {isTwoPlayerGame && player2 && (
                 <PlayerInfoCard
                    player={player2}
                    isCurrentPlayer={currentPlayer?.color === player2.color}
                    diceValue={diceValue}
                    isRolling={isRolling}
                    onDiceRoll={handleDiceRoll}
                    gameState={gameState}
                  />
            )}

            {/* Fallback for 3-4 players (or adapt this area for a 4-player grid layout if needed) */}
            {!isTwoPlayerGame && players.map(p => (
                p && <PlayerInfoCard 
                        key={p.color}
                        player={p}
                        isCurrentPlayer={currentPlayer?.color === p.color}
                        diceValue={diceValue}
                        isRolling={isRolling}
                        onDiceRoll={handleDiceRoll}
                        gameState={gameState}
                      />
            ))}
        </div>

        <div className="mt-3 sm:mt-4">
             <Button onClick={resetGame} variant="outline" className="shadow-lg bg-card/80 hover:bg-card">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
            </Button>
        </div>

      </div>
    </>
  );
}
