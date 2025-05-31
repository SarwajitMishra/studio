"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, User, Shield, Home, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const PLAYER_COLORS = ['red', 'green', 'blue', 'yellow'] as const;
type PlayerColor = typeof PLAYER_COLORS[number];

const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number }> = {
  red: { name: "Red", baseClass: "bg-red-500", textClass: "text-red-700", pathStartIndex: 0, homeEntryPathIndex: 50 },
  green: { name: "Green", baseClass: "bg-green-500", textClass: "text-green-700", pathStartIndex: 13, homeEntryPathIndex: 11 },
  blue: { name: "Blue", baseClass: "bg-blue-500", textClass: "text-blue-700", pathStartIndex: 39, homeEntryPathIndex: 37 },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 26, homeEntryPathIndex: 24 },
};

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
const NUM_TOKENS_PER_PLAYER = 4;
const MAIN_PATH_LENGTH = 52;
const HOME_STRETCH_LENGTH = 6; // 5 steps + 1 final home

interface Token {
  id: number; // 0-3 within a player
  color: PlayerColor;
  /**
   * Position:
   * -1: In base
   * 0-51: On the main shared track (global index)
   * 100-105: In player's own home column (100 is first step, 105 is last step before home)
   * 200: Reached final home
   */
  position: number; 
}

interface Player {
  color: PlayerColor;
  tokens: Token[];
  hasRolledSix: boolean; // For 3 consecutive sixes rule
  sixStreak: number;
}

const initialPlayerState = (): Player[] =>
  PLAYER_COLORS.map(color => ({
    color,
    tokens: Array(NUM_TOKENS_PER_PLAYER).fill(null).map((_, i) => ({
      id: i,
      color,
      position: -1, // Start in base
    })),
    hasRolledSix: false,
    sixStreak: 0,
  }));

// Simple placeholder for board cells. Detailed mapping will come later.
const BOARD_GRID_SIZE = 15;
const boardCells = Array(BOARD_GRID_SIZE * BOARD_GRID_SIZE).fill(null).map((_, i) => i);

export default function LudoPage() {
  const [players, setPlayers] = useState<Player[]>(initialPlayerState());
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedToken, setSelectedToken] = useState<{ playerIndex: number; tokenId: number } | null>(null);
  const [gameMessage, setGameMessage] = useState("Player Red's turn. Roll the dice!");
  const { toast } = useToast();

  const currentPlayer = players[currentPlayerIndex];
  const currentPlayerConfig = PLAYER_CONFIG[currentPlayer.color];

  const resetGame = useCallback(() => {
    setPlayers(initialPlayerState());
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setIsRolling(false);
    setSelectedToken(null);
    setGameMessage("Player Red's turn. Roll the dice!");
    toast({ title: "Game Reset", description: "Ludo game has been reset." });
  }, [toast]);

  const handleDiceRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setSelectedToken(null); // Deselect token on new roll

    let rollAttempts = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollAttempts++;
      if (rollAttempts > 10) { // Animate for ~1 second
        clearInterval(rollInterval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        processDiceRoll(finalRoll);
      }
    }, 100);
  };

  const processDiceRoll = (roll: number) => {
    setGameMessage(`${currentPlayerConfig.name} rolled a ${roll}.`);

    // Basic logic (to be expanded significantly):
    // If roll is 6, can bring a token out or move.
    // For now, just set message and allow token selection.
    // If no tokens can move, pass turn (needs more logic).
    
    // Example: Check if any token can move
    const movableTokens = currentPlayer.tokens.filter(token => {
        if (token.position === -1 && roll === 6) return true; // Can come out of base
        if (token.position >= 0 && token.position < 200) return true; // Can move on board or home stretch
        return false;
    });

    if (movableTokens.length === 0 && roll !== 6) {
        setGameMessage(`${currentPlayerConfig.name} rolled a ${roll}. No valid moves. Passing turn.`);
        setTimeout(() => passTurn(), 1500);
        return;
    }
    if (movableTokens.length === 1 && movableTokens[0].position === -1 && roll !== 6){
        setGameMessage(`${currentPlayerConfig.name} rolled a ${roll}. No valid moves (token in base, need 6). Passing turn.`);
        setTimeout(() => passTurn(), 1500);
        return;
    }

    // If player rolled a 6, they get another turn (unless it's 3rd six)
    // This logic will be refined. For now, just a placeholder.
    if (roll === 6) {
      // currentPlayer.sixStreak++;
      setGameMessage(prev => prev + " Gets another turn!");
      // if (currentPlayer.sixStreak === 3) passTurn and reset streak
    } else {
      // currentPlayer.sixStreak = 0;
      // passTurn(); // Placeholder: pass turn after non-6 if no token selected/moved
    }
  };
  
  const passTurn = () => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % PLAYER_COLORS.length);
    setDiceValue(null);
    setSelectedToken(null);
    // The useEffect below will update the game message for the new player's turn
  };

  useEffect(() => {
    setGameMessage(`Player ${PLAYER_CONFIG[players[currentPlayerIndex].color].name}'s turn. Roll the dice!`);
  }, [currentPlayerIndex, players]);


  const handleTokenClick = (playerIndex: number, tokenId: number) => {
    if (isRolling || playerIndex !== currentPlayerIndex || !diceValue) return;

    const token = players[playerIndex].tokens[tokenId];
    
    // Basic validation: can only select if token can move with current dice roll
    if (token.position === -1 && diceValue !== 6) {
        toast({ variant: "destructive", title: "Invalid Move", description: "You need a 6 to bring a token out of base."});
        return;
    }
    if (token.position === 200) { // Already home
        toast({ variant: "destructive", title: "Invalid Move", description: "This token is already home."});
        return;
    }

    // setSelectedToken({ playerIndex, tokenId });
    // For now, let's attempt a simplified move directly
    attemptMoveToken(playerIndex, tokenId, diceValue);
  };

  const attemptMoveToken = (playerIndex: number, tokenId: number, roll: number) => {
    // THIS IS HIGHLY SIMPLIFIED - WILL BE REPLACED WITH ACTUAL LUDO PATH LOGIC
    setPlayers(prevPlayers => {
        const newPlayers = prevPlayers.map(p => ({ ...p, tokens: p.tokens.map(t => ({...t})) }));
        const tokenToMove = newPlayers[playerIndex].tokens[tokenId];

        if (tokenToMove.position === -1 && roll === 6) {
            tokenToMove.position = 0; // Move to start (placeholder global index 0)
            setGameMessage(`${currentPlayerConfig.name} brought a token out! Still ${currentPlayerConfig.name}'s turn (rolled 6).`);
            // Don't pass turn, player gets another roll due to 6
        } else if (tokenToMove.position >= 0 && tokenToMove.position < 200) {
            // Simple move forward, no path checking yet
            const newPos = tokenToMove.position + roll;
            if (newPos < MAIN_PATH_LENGTH) { // Stay on main path (simplified)
                 tokenToMove.position = newPos;
            } else {
                // Placeholder for entering home stretch or reaching home
                tokenToMove.position = 200; // Reached home (oversimplified)
                 setGameMessage(`${currentPlayerConfig.name} token reached home!`);
            }
           
            if (roll !== 6) {
                setGameMessage(`${currentPlayerConfig.name} moved token. Passing turn.`);
                setTimeout(() => passTurn(), 1000);
            } else {
                 setGameMessage(`${currentPlayerConfig.name} moved token! Still ${currentPlayerConfig.name}'s turn (rolled 6).`);
                // Don't pass turn, player gets another roll due to 6
            }
        } else {
            // Cannot move this token with this roll (e.g. in base, not a 6)
            toast({variant: "destructive", title: "Cannot Move", description: "This token cannot make that move."});
            return prevPlayers; // No change
        }
        return newPlayers;
    });
    // setDiceValue(null); // Consume dice roll if not a 6
    // if (roll !== 6) passTurn();
  };

  // Placeholder function to get token display on the 15x15 grid
  // This will become very complex with actual Ludo paths.
  const getTokenForCell = (cellIndex: number): Token | null => {
    // Extremely simplified: just to show some tokens
    for (const player of players) {
      for (const token of player.tokens) {
        // Example: if token position matches cellIndex (very naive for Ludo)
        // Base positions (crude placeholder)
        if (token.position === -1) {
            const playerIdx = PLAYER_COLORS.indexOf(player.color);
            // Crude base assignment for visual testing
            if (playerIdx === 0 && cellIndex === 0 + token.id) return token; // Red base area TL
            if (playerIdx === 1 && cellIndex === (BOARD_GRID_SIZE - 4) + token.id) return token; // Green base area TR
            if (playerIdx === 2 && cellIndex === (BOARD_GRID_SIZE * (BOARD_GRID_SIZE-1) - 4) + token.id) return token; // Blue base area BL
            if (playerIdx === 3 && cellIndex === (BOARD_GRID_SIZE * BOARD_GRID_SIZE - 4) + token.id ) return token; // Yellow base area BR
        }
        // On-board position (even cruder placeholder)
        // This needs a real mapping from token.position to a cellIndex based on Ludo paths
        // For now, let's say if token.position is 10, it appears on cell 10 (top-left area)
        if (token.position !== -1 && token.position !== 200 && token.position === cellIndex) {
            return token;
        }
      }
    }
    return null;
  };
  
  // This function will determine the color of a square on the board.
  // It's a placeholder and will need to be significantly expanded for a real Ludo board.
  const getCellBackgroundColor = (cellIndex: number): string => {
    // Example: Color start squares or home areas. This is highly simplified.
    // (row * BOARD_GRID_SIZE + col) can give cellIndex
    const row = Math.floor(cellIndex / BOARD_GRID_SIZE);
    const col = cellIndex % BOARD_GRID_SIZE;

    // Placeholder for player "arms" of the Ludo board cross
    // Red arm top (simplified)
    if ((col === 6 && row >=1 && row <=5) || (row === 6 && col >=1 && col <=5)) return PLAYER_CONFIG.red.baseClass + "/30";
    // Green arm right (simplified)
    if ((row === 6 && col >=9 && col <=13) || (col === 8 && row >=1 && row <=5)) return PLAYER_CONFIG.green.baseClass + "/30";
    // Yellow arm bottom (simplified)
    if ((col === 8 && row >=9 && row <=13) || (row === 8 && col >=9 && col <=13)) return PLAYER_CONFIG.yellow.baseClass + "/30";
    // Blue arm left (simplified)
    if ((row === 8 && col >=1 && col <=5) || (col === 6 && row >=9 && row <=13)) return PLAYER_CONFIG.blue.baseClass + "/30";

    // Center home area (simplified)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return "bg-gray-300";
    
    // Base areas (very simplified corners for now)
    if (row < 2 && col < 2) return PLAYER_CONFIG.red.baseClass; // Red base (TL)
    if (row < 2 && col > BOARD_GRID_SIZE - 3) return PLAYER_CONFIG.green.baseClass; // Green base (TR)
    if (row > BOARD_GRID_SIZE - 3 && col < 2) return PLAYER_CONFIG.blue.baseClass; // Blue base (BL)
    if (row > BOARD_GRID_SIZE - 3 && col > BOARD_GRID_SIZE - 3) return PLAYER_CONFIG.yellow.baseClass; // Yellow base (BR)

    return (row + col) % 2 === 0 ? "bg-slate-100" : "bg-slate-200"; // Default checkerboard
  };


  return (
    <>
      <title>Ludo Game | Shravya Playhouse</title>
      <meta name="description" content="Play the classic game of Ludo online." />
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-center text-primary">Ludo King</CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80 pt-1">
            Roll the dice, move your tokens, and race to home!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 flex flex-col lg:flex-row items-start gap-6">
          {/* Game Board Area */}
          <div className="w-full lg:w-2/3 flex flex-col items-center">
            <div
                className="grid gap-0.5 border-2 border-neutral-700 rounded overflow-hidden shadow-lg"
                style={{ gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))` }}
                aria-label="Ludo board"
            >
                {boardCells.map((_, cellIndex) => {
                const tokenOnCell = getTokenForCell(cellIndex);
                const cellBg = getCellBackgroundColor(cellIndex);
                return (
                    <div
                    key={cellIndex}
                    className={cn(
                        "aspect-square flex items-center justify-center text-xs sm:text-sm",
                        cellBg,
                        "border border-neutral-400/50" // Add subtle border to each cell
                    )}
                    // onClick={() => console.log(`Cell ${cellIndex} clicked`)} // For debugging path
                    >
                    {tokenOnCell ? (
                        <button
                        onClick={() => handleTokenClick(PLAYER_COLORS.indexOf(tokenOnCell.color), tokenOnCell.id)}
                        disabled={PLAYER_COLORS.indexOf(tokenOnCell.color) !== currentPlayerIndex || isRolling || !diceValue}
                        className={cn(
                            "w-3/4 h-3/4 rounded-full flex items-center justify-center border-2 hover:ring-2 hover:ring-offset-1",
                            PLAYER_CONFIG[tokenOnCell.color].baseClass,
                            PLAYER_COLORS.indexOf(tokenOnCell.color) === currentPlayerIndex && diceValue ? "cursor-pointer ring-2 ring-offset-1 ring-black" : "cursor-default",
                            selectedToken?.playerIndex === PLAYER_COLORS.indexOf(tokenOnCell.color) && selectedToken.tokenId === tokenOnCell.id ? "ring-4 ring-purple-500" : "",
                             "text-white font-bold"
                        )}
                        aria-label={`Token ${tokenOnCell.color} ${tokenOnCell.id + 1}`}
                        >
                        {tokenOnCell.id + 1}
                        </button>
                    ) : (
                        <span className="opacity-50"></span> // Placeholder for empty cell content like stars for safe spots
                    )}
                    </div>
                );
                })}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
                Board rendering and token paths are highly simplified for this initial version. Full Ludo paths coming soon!
            </p>
          </div>

          {/* Game Controls and Info Area */}
          <div className="w-full lg:w-1/3 space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className={cn("text-xl text-center", currentPlayerConfig.textClass)}>
                  Current Turn: {PLAYER_CONFIG[currentPlayer.color].name} Player
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-center items-center h-20 w-20 mx-auto border-4 border-dashed border-accent rounded-lg bg-background shadow-inner">
                  {diceValue && !isRolling ? (
                    React.createElement(DICE_ICONS[diceValue - 1], { size: 60, className: "text-accent animate-bounce" })
                  ) : isRolling ? (
                     React.createElement(DICE_ICONS[Math.floor(Math.random()*6)], { size: 60, className: "text-muted-foreground animate-spin" })
                  ) : (
                    <Dice6 size={60} className="text-muted-foreground opacity-50" />
                  )}
                </div>
                <Button
                  onClick={handleDiceRoll}
                  disabled={isRolling || (!!diceValue && diceValue !== 6)} // Disable if dice already rolled and not a 6 allowing another roll
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 shadow-lg"
                >
                  {isRolling ? "Rolling..." : (diceValue ? `Rolled ${diceValue}! Select Token` : "Roll Dice")}
                </Button>
                <p className="text-sm text-foreground/90 min-h-[40px]">{gameMessage}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg text-center">Player Tokens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {players.map((p, pIndex) => (
                        <div key={p.color} className="flex items-center justify-between p-2 rounded border">
                            <span className={cn("font-semibold", PLAYER_CONFIG[p.color].textClass)}>{PLAYER_CONFIG[p.color].name}:</span>
                            <div className="flex gap-1">
                                {p.tokens.map(token => (
                                    <div key={token.id} 
                                         title={`Token ${token.id+1}: ${token.position === -1 ? 'Base' : (token.position === 200 ? 'Home' : `Pos ${token.position}`)}`}
                                         className={cn(
                                        "w-5 h-5 rounded-full border text-xs flex items-center justify-center text-white", 
                                        PLAYER_CONFIG[token.color].baseClass,
                                        token.position === 200 ? 'opacity-50' : ''
                                    )}>
                                        {token.position === -1 ? 'B' : (token.position === 200 ? <Home size={12}/> : token.id+1)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <Button onClick={resetGame} variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// CSS for simple dice roll animation (can be moved to globals.css or a style tag if preferred)
// Add to globals.css or ensure Tailwind JIT picks up 'animate-bounce' and 'animate-spin'
// @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
// .animate-bounce { animation: bounce 0.5s ease-in-out; }
// @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
// .animate-spin { animation: spin 1s linear infinite; }

