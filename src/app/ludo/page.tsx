
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RotateCcw, Users, Cpu, Globe, User as UserIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

import { PLAYER_COLORS, type Player, type GameView, type GameMode, type PlayerColor } from '@/lib/ludo/types';
import { initialPlayerState, getMovableTokens, isWinner, moveToken as moveTokenEngine, PLAYER_CONFIG } from '@/lib/ludo/engine';
import { getAIMove } from '@/lib/ludo/ai';
import { LudoBoard } from '@/components/ludo/LudoBoard';

const DICE_IMAGE_URLS: Record<number, string> = {
    1: '/images/ludo/dice-1.png', 2: '/images/ludo/dice-2.png', 3: '/images/ludo/dice-3.png',
    4: '/images/ludo/dice-4.png', 5: '/images/ludo/dice-5.png', 6: '/images/ludo/dice-6.png',
};

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

  const currentPlayer = players[currentPlayerIndex];

  const passTurn = useCallback((isTurnEnding: boolean, turnForfeited = false) => {
      const activePlayers = players.filter(p => p.tokens.some(t => t.position < 200));
      if (activePlayers.length <= 1) {
        setGameView('gameOver');
        setGameMessage(`${activePlayers[0]?.name || 'Winner'} wins the game!`);
        return;
      }
      
      let nextIndex = (currentPlayerIndex + 1) % players.length;
      while(isWinner(players[nextIndex])) {
        nextIndex = (nextIndex + 1) % players.length;
      }

      if (turnForfeited || isTurnEnding || !players[currentPlayerIndex]?.hasRolledSix) {
          setCurrentPlayerIndex(nextIndex);
      } else {
        // Player rolled a 6 and gets another turn, no index change needed.
      }
      
      setPlayers(currentPlayers => currentPlayers.map((p, idx) => {
          if (idx === currentPlayerIndex) return { ...p, sixStreak: 0, hasRolledSix: false };
          return p;
      }));
      setDiceValue(null);

      const nextPlayer = players[nextIndex];
      const currentPlayerGetsAnotherTurn = !isTurnEnding && players[currentPlayerIndex]?.hasRolledSix;

      if (currentPlayerGetsAnotherTurn) {
        setGameMessage(`${players[currentPlayerIndex].name} rolled a 6 and gets another turn.`);
      } else if (nextPlayer) {
        setGameMessage(`${nextPlayer.name}'s turn. ${nextPlayer.isAI ? 'AI is thinking...' : 'Click your dice to roll!'}`);
      }
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
      } else {
         updatedPlayers = updatedPlayers.map((p, idx) => idx === currentPlayerIndex ? { ...p, hasRolledSix: false, sixStreak: 0 } : p);
      }
      
      const playerWithUpdatedSixRoll = updatedPlayers[currentPlayerIndex];
      const movableTokens = getMovableTokens(playerWithUpdatedSixRoll, roll);
      
      if (movableTokens.length === 0) {
          currentMessage += ` No valid moves. Passing turn.`;
          setGameMessage(currentMessage);
          setTimeout(() => passTurn(true), 1500); // Always pass turn if no moves
      } else {
          setGameMessage(currentMessage + (playerWithUpdatedSixRoll.isAI ? ` AI thinking...` : ` Select a token to move.`));
      }
      setPlayers(updatedPlayers);
  }, [players, currentPlayerIndex, passTurn]);

  const handleDiceRoll = useCallback(() => {
    if (isRolling || gameView !== 'playing') return;
    
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
    }, 70);
  }, [isRolling, players, currentPlayerIndex, diceValue, processDiceRoll, gameView]);

  useEffect(() => {
    if (gameView === 'playing' && currentPlayer?.isAI && !isRolling) {
      if (diceValue === null) {
          setTimeout(() => handleDiceRoll(), 1500);
      } else {
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
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue || !player || player.isAI || gameView !== 'playing') return;

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
    setGameMessage(`${newPlayers[0].name}'s turn. Click the dice to roll!`);
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
  
  const isDiceButtonClickable = currentPlayer && !currentPlayer.isAI && gameView === 'playing' && !isRolling && (diceValue === null || currentPlayer.hasRolledSix);

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
                    <p className="text-center text-muted-foreground">You (Blue) vs. Shravya AI (Yellow)</p>
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
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start justify-center p-2 md:p-4 bg-gradient-to-br from-primary/20 to-background overflow-hidden">
        
        <div className="w-full max-w-[600px] lg:max-w-none lg:w-auto lg:flex-1 flex justify-center">
            <LudoBoard
                players={players}
                onTokenClick={handleTokenClick}
                currentPlayerIndex={currentPlayerIndex}
                diceValue={diceValue}
                movableTokens={currentPlayer && diceValue ? getMovableTokens(currentPlayer, diceValue) : []}
                isRolling={isRolling}
                gameView={gameView}
            />
        </div>
        
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
             <CardHeader className="text-center">
                <UserIcon className="h-16 w-16 mx-auto p-2 rounded-full bg-primary/20 text-primary border-2 border-primary/50" />
                <CardTitle className="text-xl pt-2">Game Host</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <div className="p-3 min-h-[60px] bg-muted rounded-md shadow-inner text-center flex items-center justify-center">
                  <p className="text-foreground/90 font-semibold">{gameMessage}</p>
                </div>
                 
                <div className="flex justify-center py-4">
                  <Image
                      src={DICE_IMAGE_URLS[diceValue || 1]}
                      alt={`Dice showing ${diceValue || 'face'}`}
                      width={100} height={100}
                      className={cn("transition-transform duration-300", isRolling ? "animate-dice-roll" : "")}
                      data-ai-hint={`dice ${diceValue || 'one'}`}
                  />
                </div>

                <Button 
                  onClick={handleDiceRoll} 
                  disabled={!isDiceButtonClickable}
                  className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
                >
                  Roll Dice
                </Button>
                
                <Button onClick={resetGame} variant="outline" className="w-full shadow-md">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
