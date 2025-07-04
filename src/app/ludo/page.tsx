
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RotateCcw, Copy, Users, Cpu, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { db, auth, type User } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

import { PLAYER_COLORS, type Player, type Token, type GameView, type GameMode, type PlayerColor } from '@/lib/ludo/types';
import { initialPlayerState, getMovableTokens, isWinner, moveToken as moveTokenEngine, PLAYER_CONFIG } from '@/lib/ludo/engine';
import { getAIMove } from '@/lib/ludo/ai';
import { LudoBoard } from '@/components/ludo/LudoBoard';

export default function LudoPage() {
  const [gameView, setGameView] = useState<GameView>('setup');
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

  const [user, setUser] = useState<User | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [joinGameId, setJoinGameId] = useState("");
  const [onlineGameData, setOnlineGameData] = useState<any>(null);

  const currentPlayer = players[currentPlayerIndex];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, 'ludo-games', gameId);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOnlineGameData(data);
        setPlayers(data.players);
        setCurrentPlayerIndex(data.currentPlayerIndex);
        setDiceValue(data.diceValue);
        setGameMessage(data.gameMessage);
        
        if (data.status === 'playing') setGameView('playing');
        else if (data.status === 'gameOver') setGameView('gameOver');

      } else {
        toast({ title: "Game not found", description: "The game session has ended or could not be found.", variant: "destructive" });
        setGameId(null);
        setGameView('setup');
      }
    });

    return () => unsubscribe();
  }, [gameId, toast]);

  const passTurn = useCallback((isTurnEnding: boolean, turnForfeited = false) => {
      const currentPlayer = players[currentPlayerIndex];
      let nextIndex = currentPlayerIndex;

      if (turnForfeited || isTurnEnding || !currentPlayer?.hasRolledSix) {
          nextIndex = (currentPlayerIndex + 1) % players.length;
      }

      setPlayers(currentPlayers => currentPlayers.map((p, idx) => {
          if (idx === currentPlayerIndex) return { ...p, sixStreak: 0, hasRolledSix: false };
          return p;
      }));
      setDiceValue(null);

      if (nextIndex !== currentPlayerIndex) {
          const nextPlayer = players[nextIndex];
          if (nextPlayer) setGameMessage(`${nextPlayer.name}'s turn. ${nextPlayer.isAI ? 'AI is thinking...' : 'Click your dice to roll!'}`);
      } else {
          const nextPlayer = players[nextIndex];
          if (nextPlayer) setGameMessage(`${nextPlayer.name} rolled a 6 and gets another turn.`);
      }
      
      setCurrentPlayerIndex(nextIndex);
  }, [players, currentPlayerIndex]);

  const handleTokenMove = useCallback((playerIndex: number, tokenId: number, roll: number) => {
    const { newPlayers, captured } = moveTokenEngine(players, playerIndex, tokenId, roll);
    setPlayers(newPlayers);
    
    if (captured) {
      toast({ title: "Capture!", description: "An opponent's token was sent back to base!" });
    }
    
    const potentiallyWinningPlayer = newPlayers[playerIndex];
    if (isWinner(potentiallyWinningPlayer)) {
      setGameMessage(`${potentiallyWinningPlayer.name} has won the game! Congratulations!`);
      setGameView('gameOver');
      toast({ title: "Game Over!", description: `${potentiallyWinningPlayer.name} wins!` });
      return;
    }
    
    passTurn(roll !== 6);

  }, [players, passTurn, toast]);

  const processDiceRoll = useCallback((roll: number) => {
      const player = players[currentPlayerIndex];
      if (!player) return;

      let currentMessage = `${player.name} rolled a ${roll}.`;
      let updatedPlayers = [...players];
      let sixStreak = player.sixStreak;

      if (roll === 6) {
          sixStreak += 1;
          updatedPlayers = updatedPlayers.map((p, idx) => idx === currentPlayerIndex ? { ...p, hasRolledSix: true, sixStreak } : p);

          if (sixStreak === 3) {
              currentMessage += ` Three 6s in a row! Turn forfeited.`;
              setGameMessage(currentMessage);
              setTimeout(() => passTurn(true, true), 1500);
              setPlayers(updatedPlayers.map((p,idx) => idx === currentPlayerIndex ? {...p, sixStreak: 0, hasRolledSix: false} : p));
              return;
          }
      }
      
      const playerWithUpdatedSixRoll = updatedPlayers[currentPlayerIndex];
      const movableTokens = getMovableTokens(playerWithUpdatedSixRoll, roll);
      
      if (movableTokens.length === 0) {
          currentMessage += ` No valid moves. Passing turn.`;
          setGameMessage(currentMessage);
          setTimeout(() => passTurn(roll !== 6), 1500);
      } else {
          setGameMessage(currentMessage + (playerWithUpdatedSixRoll.isAI ? ` AI thinking...` : ` Select a token to move.`));
      }
      setPlayers(updatedPlayers);
  }, [players, currentPlayerIndex, passTurn]);

  const handleDiceRoll = useCallback(() => {
    if (isRolling) return;
    
    const player = players[currentPlayerIndex];
    if (!player || (player.isAI && diceValue !== null)) return;
    if (!player.isAI && diceValue !== null && !player.hasRolledSix) return;
    
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
  }, [isRolling, players, currentPlayerIndex, diceValue, processDiceRoll]);

  useEffect(() => {
    if (gameView === 'playing' && currentPlayer?.isAI) {
      if (diceValue === null && !isRolling) {
          setTimeout(() => handleDiceRoll(), 1500);
      } else if (diceValue !== null) {
          setTimeout(() => {
            const tokenId = getAIMove(players, currentPlayerIndex, diceValue);
            if (tokenId !== null) {
              handleTokenMove(currentPlayerIndex, tokenId, diceValue);
            } else {
              passTurn(diceValue !== 6);
            }
          }, 1500);
      }
    }
  }, [gameView, currentPlayer, diceValue, isRolling, players, currentPlayerIndex, passTurn, handleDiceRoll, handleTokenMove]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    const player = players[playerIndex];
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !player || player.isAI) return;

    const movable = getMovableTokens(player, diceValue);
    if (!movable.some(t => t.id === tokenId)) {
        toast({ variant: "destructive", title: "Invalid Move", description: "This token cannot make that move." });
        return;
    }
    handleTokenMove(playerIndex, tokenId, diceValue);
  };
  
  useEffect(() => {
    if (selectedMode === 'offline' && selectedNumPlayers) {
      setOfflinePlayerNames(Array(selectedNumPlayers).fill('').map((_, i) => `Player ${i + 1}`));
      setSelectedOfflineColors(Array(selectedNumPlayers).fill(null));
    } else {
      setOfflinePlayerNames([]);
      setSelectedOfflineColors([]);
    }
  }, [selectedNumPlayers, selectedMode]);

  const handleModeChange = (newMode: GameMode) => {
    setSelectedMode(newMode);
    if (newMode === 'ai') {
        setSelectedNumPlayers(2);
    } else {
        setSelectedNumPlayers(null);
    }
  };
  
  const handleStartGame = () => {
    if (!selectedMode || !selectedNumPlayers) {
      toast({ variant: "destructive", title: "Setup Incomplete", description: "Please select game mode and number of players." });
      return;
    }
    if (selectedMode === 'ai' && humanPlayerName.trim() === "") {
      toast({ variant: "destructive", title: "Name Required", description: "Please enter your name." });
      return;
    }
    if (selectedMode === 'offline') {
      if (offlinePlayerNames.some(name => name.trim() === '')) {
        toast({ variant: 'destructive', title: 'Setup Incomplete', description: 'Please enter a name for all players.' });
        return;
      }
      if (selectedOfflineColors.some(color => color === null)) {
        toast({ variant: 'destructive', title: 'Setup Incomplete', description: 'Please select a color for all players.' });
        return;
      }
      const uniqueColors = new Set(selectedOfflineColors);
      if (uniqueColors.size !== selectedNumPlayers) {
        toast({ variant: 'destructive', title: 'Invalid Colors', description: 'Each player must have a unique color.' });
        return;
      }
    }

    const newPlayers = initialPlayerState(selectedNumPlayers, selectedMode, humanPlayerName, offlinePlayerNames, selectedOfflineColors as PlayerColor[]);
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setGameView('playing');
    setGameMessage(`${newPlayers[0].name}'s turn. Click your dice to roll!`);
  };

  const resetGame = useCallback(() => {
    setGameView('setup');
    setSelectedMode(null);
    setSelectedNumPlayers(null);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setIsRolling(false);
    setGameMessage("Game Reset. Set up your new game!");
    toast({ title: "Game Reset", description: "Ludo game has been reset to setup." });
  }, [toast]);

  if (gameView === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/30 to-background">
          <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
            <CardHeader className="bg-primary/10">
              <CardTitle className="text-2xl font-bold text-center text-primary">Setup Ludo Game</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-lg font-medium">Game Mode</Label>
                <RadioGroup value={selectedMode || ""} onValueChange={handleModeChange} className="mt-2 grid grid-cols-3 gap-4">
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
                   <div>
                    <RadioGroupItem value="online" id="online" className="peer sr-only" disabled={true} />
                    <Label htmlFor="online" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4", "opacity-50 cursor-not-allowed")}>
                      <Globe className="mb-2 h-8 w-8" />
                      Online (Soon)
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
                        <Label htmlFor={`offline-${num}`} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                          <span className="text-lg">{num}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              
              {selectedMode === 'offline' && selectedNumPlayers && (
                <div className="pt-4 space-y-4">
                  <h3 className="text-lg font-medium text-center text-foreground/90">Player Details</h3>
                  {Array.from({ length: selectedNumPlayers }).map((_, index) => {
                    const availableColors = PLAYER_COLORS.filter(c => !selectedOfflineColors.includes(c) || selectedOfflineColors[index] === c);
                    return (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-center">
                        <Input
                          id={`offline-player-${index}`}
                          value={offlinePlayerNames[index] || ''}
                          onChange={(e) => {
                            const newNames = [...offlinePlayerNames];
                            newNames[index] = e.target.value;
                            setOfflinePlayerNames(newNames);
                          }}
                          placeholder={`Player ${index + 1} Name`}
                          className="flex-grow text-base"
                        />
                        <Select
                          value={selectedOfflineColors[index] || ''}
                          onValueChange={(value) => {
                            const newColors = [...selectedOfflineColors];
                            newColors[index] = value as PlayerColor;
                            setSelectedOfflineColors(newColors);
                          }}
                        >
                          <SelectTrigger className="w-full sm:w-[200px] text-base">
                            <SelectValue placeholder="Select a color" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColors.map(color => (
                              <SelectItem key={color} value={color} className="text-base">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-4 h-4 rounded-full border", PLAYER_CONFIG[color].baseClass)}></div>
                                  {PLAYER_CONFIG[color].name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}


              {selectedMode === 'ai' && (
                <div className="pt-4 space-y-2">
                    <p className="text-center text-muted-foreground">You (Red) vs. Shravya AI (Yellow)</p>
                    <div>
                        <Label htmlFor="humanPlayerName" className="text-lg font-medium">Your Name</Label>
                        <Input
                            id="humanPlayerName"
                            value={humanPlayerName}
                            onChange={(e) => setHumanPlayerName(e.target.value)}
                            className="mt-2 text-base"
                            placeholder="Enter your name"
                        />
                    </div>
                </div>
              )}

              <Button onClick={handleStartGame} disabled={!selectedMode || (selectedMode === 'offline' && !selectedNumPlayers)} className="w-full text-lg py-3 mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">Start Game</Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
    <>
      <title>Ludo Game | Shravya Playhouse</title>
      <meta name="description" content="Play the classic game of Ludo online." />
      <div className="flex flex-col items-center justify-start min-h-screen w-full p-1 sm:p-2 md:p-4 bg-gradient-to-br from-primary/30 to-background overflow-x-hidden">
        
        <div className="mb-2 sm:mb-3 p-2 rounded-lg shadow-md bg-card/90 backdrop-blur-sm max-w-md text-center">
            <h2 className="text-base sm:text-lg font-semibold text-primary">
                {gameView === 'gameOver' ? "Game Over!" : (currentPlayer ? `Turn: ${currentPlayer.name}` : "Loading...")}
            </h2>
            <p className="text-xs sm:text-sm text-foreground/90 min-h-[1.5em]">{gameMessage}</p>
        </div>
        
        <div className="w-full flex justify-center">
            <LudoBoard
                players={players}
                onTokenClick={handleTokenClick}
                currentPlayerIndex={currentPlayerIndex}
                diceValue={diceValue}
                movableTokens={currentPlayer && diceValue ? getMovableTokens(currentPlayer, diceValue) : []}
                isRolling={isRolling}
                gameView={gameView}
                onDiceRoll={handleDiceRoll}
            />
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
