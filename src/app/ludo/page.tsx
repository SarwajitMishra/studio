
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

import type { Player, Token, GameView, GameMode, PlayerColor } from '@/lib/ludo/types';
import { initialPlayerState, getMovableTokens, isWinner, moveToken as moveTokenEngine, PLAYER_CONFIG, PLAYER_COLORS } from '@/lib/ludo/engine';
import { getAIMove } from '@/lib/ludo/ai';
import { LudoBoard } from '@/components/ludo/LudoBoard';
import { PlayerInfoCard } from '@/components/ludo/PlayerInfoCard';

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

  // Pass Turn Logic
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

  // AI Turn Trigger
  useEffect(() => {
    if (gameView === 'playing' && currentPlayer?.isAI) {
      if (diceValue === null && !isRolling) {
          // AI needs to roll
          setTimeout(() => handleDiceRoll(), 1500);
      } else if (diceValue !== null) {
          // AI has rolled, needs to move
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
  }, [gameView, currentPlayer, diceValue, isRolling, players, currentPlayerIndex]);


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
  
  // Game setup related logic
  useEffect(() => {
    if (selectedMode === 'offline' && selectedNumPlayers) {
      setOfflinePlayerNames(Array(selectedNumPlayers).fill('').map((_, i) => `Player ${i + 1}`));
      setSelectedOfflineColors(Array(selectedNumPlayers).fill(null));
    } else {
      setOfflinePlayerNames([]);
      setSelectedOfflineColors([]);
    }
  }, [selectedNumPlayers, selectedMode]);
  
  const handleStartGame = () => {
    if (!selectedMode || !selectedNumPlayers) {
      toast({ variant: "destructive", title: "Setup Incomplete", description: "Please select game mode and number of players." });
      return;
    }
    if (selectedMode === 'ai' && humanPlayerName.trim() === "") {
      toast({ variant: "destructive", title: "Name Required", description: "Please enter your name." });
      return;
    }
    const newPlayers = initialPlayerState(selectedNumPlayers, selectedMode, humanPlayerName, offlinePlayerNames, selectedOfflineColors.filter(c => c) as PlayerColor[]);
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setGameView('playing');
    setGameMessage(`${newPlayers[0].name}'s turn. Click your dice to roll!`);
  };

  const player1 = players.find(p => p.color === 'red');
  const player2 = players.find(p => p.color === 'green');
  const player3 = players.find(p => p.color === 'yellow');
  const player4 = players.find(p => p.color === 'blue');

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
                <RadioGroup value={selectedMode || ""} onValueChange={(value) => setSelectedMode(value as GameMode)} className="mt-2 grid grid-cols-3 gap-4">
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

              {selectedMode && selectedMode !== 'online' && (
                <div>
                  <Label className="text-lg font-medium">Number of Players {selectedMode === 'ai' ? '(includes you)' : ''}</Label>
                  <RadioGroup value={selectedNumPlayers?.toString() || ""} onValueChange={(value) => setSelectedNumPlayers(parseInt(value))} className="mt-2 grid grid-cols-3 gap-4">
                    {(selectedMode === 'offline' ? [2, 3, 4] : [2, 4]).map(num => (
                      <div key={num}>
                        <RadioGroupItem value={num.toString()} id={`${selectedMode}-${num}`} className="peer sr-only" />
                        <Label htmlFor={`${selectedMode}-${num}`} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                          <span className="text-lg">{num}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              <Button onClick={handleStartGame} disabled={!selectedMode || !selectedNumPlayers} className="w-full text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground">Start Game</Button>
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

        <div className="flex w-full max-w-5xl items-center justify-center gap-2 sm:gap-4">
            {player1 && <PlayerInfoCard player={player1} isCurrentPlayer={currentPlayer?.color === player1.color} diceValue={diceValue} isRolling={isRolling} onDiceRoll={handleDiceRoll} gameView={gameView} />}
            {player3 && <PlayerInfoCard player={player3} isCurrentPlayer={currentPlayer?.color === player3.color} diceValue={diceValue} isRolling={isRolling} onDiceRoll={handleDiceRoll} gameView={gameView} />}
            
            <LudoBoard players={players} onTokenClick={handleTokenClick} currentPlayerIndex={currentPlayerIndex} diceValue={diceValue} movableTokens={currentPlayer && diceValue ? getMovableTokens(currentPlayer, diceValue) : []} isRolling={isRolling} gameView={gameView} />
            
            {player2 && <PlayerInfoCard player={player2} isCurrentPlayer={currentPlayer?.color === player2.color} diceValue={diceValue} isRolling={isRolling} onDiceRoll={handleDiceRoll} gameView={gameView} />}
            {player4 && <PlayerInfoCard player={player4} isCurrentPlayer={currentPlayer?.color === player4.color} diceValue={diceValue} isRolling={isRolling} onDiceRoll={handleDiceRoll} gameView={gameView} />}
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
