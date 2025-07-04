
import type { Player, Token, PlayerColor, GameMode } from './types';

export const MAIN_PATH_LENGTH = 51;
export const HOME_STRETCH_LENGTH = 6;
export const NUM_TOKENS_PER_PLAYER = 4;

export const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number; tokenImageUrl: string; }> = {
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 0,   homeEntryPathIndex: 50, tokenImageUrl: '/images/ludo/token-red.png' },
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 13,  homeEntryPathIndex: 11, tokenImageUrl: '/images/ludo/token-green.png' },
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 26,  homeEntryPathIndex: 24, tokenImageUrl: '/images/ludo/token-blue.png' },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 39,  homeEntryPathIndex: 37, tokenImageUrl: '/images/ludo/token-yellow.png' },
};

// Safe squares are based on their path index. The stars on the board.
export const SAFE_SQUARE_INDICES = [8, 21, 34, 47];


export const initialPlayerState = (
    numPlayersToCreate: number,
    mode: GameMode,
    humanName?: string,
    offlineNames?: string[],
    offlinePlayerColors?: PlayerColor[]
): Player[] => {
  let activePlayerColors: PlayerColor[];

  if (mode === 'offline' && offlinePlayerColors && offlinePlayerColors.length === numPlayersToCreate) {
    activePlayerColors = offlinePlayerColors;
  } else if (mode === 'ai') {
     activePlayerColors = ['blue', 'yellow']; 
  } else {
    // Default order: Red (TL), Green (TR), Blue (BR), Yellow (BL)
    activePlayerColors = (['red', 'green', 'blue', 'yellow'] as PlayerColor[]).slice(0, numPlayersToCreate);
  }

  return activePlayerColors.map((color, index) => {
    const isAIPlayer = mode === 'ai' && index > 0;
    let playerName = PLAYER_CONFIG[color].name; // Default name

    if (mode === 'ai') {
      playerName = (index === 0) ? (humanName || "Human Player") : "Shravya AI";
    } else if (mode === 'offline' && offlineNames && offlineNames[index]) {
      playerName = offlineNames[index];
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

export const getMovableTokens = (player: Player, roll: number): Token[] => {
    if (!player) return [];
    
    return player.tokens.filter(token => {
      // Cannot move a finished token
      if (token.position >= 200) return false; 
      
      // Can only move from base with a 6
      if (token.position === -1) return roll === 6;

      // Check if a token in the home stretch can move
      if (token.position >= 100) {
        const stretchPos = token.position % 100;
        return (stretchPos + roll) < HOME_STRETCH_LENGTH;
      }
      
      // All other tokens on the main path are movable
      return true;
    });
};

export const moveToken = (
  players: readonly Player[],
  playerIndex: number,
  tokenId: number,
  roll: number
): { newPlayers: Player[], captured: boolean } => {
  
  const newPlayers = players.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) }));
  const playerToMove = newPlayers[playerIndex];
  if (!playerToMove) return { newPlayers, captured: false };
  const tokenToMove = playerToMove.tokens.find(t => t.id === tokenId);
  if (!tokenToMove) return { newPlayers, captured: false };

  const playerConfig = PLAYER_CONFIG[playerToMove.color];
  let captured = false;

  // Moving from base
  if (tokenToMove.position === -1 && roll === 6) {
    tokenToMove.position = playerConfig.pathStartIndex;
  } 
  // Moving on the main path or into home stretch
  else if (tokenToMove.position >= 0 && tokenToMove.position < 100) {
    const currentPos = tokenToMove.position;
    const homeEntry = playerConfig.homeEntryPathIndex;
    
    let tempPos = currentPos;
    let stepsToHomeEntry = 0;
    let passedHomeEntry = false;
    
    // Calculate distance to home entry
    if (currentPos > homeEntry) { // e.g. red player at pos 50, home entry is 50
        stepsToHomeEntry = (MAIN_PATH_LENGTH - currentPos) + homeEntry + 1;
    } else {
        stepsToHomeEntry = homeEntry - currentPos;
    }

    if (roll > stepsToHomeEntry) {
      const stepsIntoStretch = roll - stepsToHomeEntry - 1;
      if (stepsIntoStretch < HOME_STRETCH_LENGTH) {
        tokenToMove.position = 100 + stepsIntoStretch;
      }
    } else {
      tokenToMove.position = (currentPos + roll) % (MAIN_PATH_LENGTH + 1);
    }
  } 
  // Moving within the home stretch
  else if (tokenToMove.position >= 100 && tokenToMove.position < 200) {
    const currentStretchPos = tokenToMove.position % 100;
    const newStretchPos = currentStretchPos + roll;
    
    if (newStretchPos < HOME_STRETCH_LENGTH) {
        tokenToMove.position = 100 + newStretchPos;
    }
  }
  
  // Check for captures if the token landed on the main path
  const finalPos = tokenToMove.position;
  const isSafeSquare = SAFE_SQUARE_INDICES.includes(finalPos);
  
  if (finalPos >= 0 && finalPos < 100 && !isSafeSquare) {
    newPlayers.forEach((p, p_idx) => {
      // Don't capture own tokens or tokens on the same start square
      if(p_idx === playerIndex || finalPos === PLAYER_CONFIG[p.color].pathStartIndex) return;

      p.tokens.forEach(t => {
        // Only capture single tokens
        const tokensOnSquare = newPlayers.flatMap(pl => pl.tokens).filter(tok => tok.position === finalPos);
        if (t.position === finalPos && tokensOnSquare.length === 1) {
          t.position = -1; // Send back to base
          captured = true;
        }
      })
    })
  }

  // Handle reaching home (final square of home stretch)
  if (tokenToMove.position >= 100) {
      const stretchPos = tokenToMove.position % 100;
      if (stretchPos === HOME_STRETCH_LENGTH - 1) { 
          tokenToMove.position = 200 + tokenToMove.id; // Mark as finished
      }
  }

  return { newPlayers, captured };
};

export const isWinner = (player: Player): boolean => {
    return player.tokens.every(t => t.position >= 200);
}
