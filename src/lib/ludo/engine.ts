
import type { Player, Token, PlayerColor, GameMode } from './types';

export const MAIN_PATH_LENGTH = 52;
export const HOME_STRETCH_LENGTH = 6;
export const NUM_TOKENS_PER_PLAYER = 4;

// The PLAYER_CONFIG now correctly maps player colors to their visual layout on the board.
// Green (Top-Left), Red (Top-Right), Blue (Bottom-Right), Yellow (Bottom-Left)
export const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number; tokenImageUrl: string; }> = {
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 1,   homeEntryPathIndex: 51, tokenImageUrl: '/images/ludo/token-green.png' },
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 14,  homeEntryPathIndex: 12, tokenImageUrl: '/images/ludo/token-red.png' },
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 27,  homeEntryPathIndex: 25, tokenImageUrl: '/images/ludo/token-blue.png' },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 40,  homeEntryPathIndex: 38, tokenImageUrl: '/images/ludo/token-yellow.png' },
};

// Safe squares are based on their path index.
export const SAFE_SQUARE_INDICES = [1, 9, 14, 22, 27, 35, 40, 48];


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
    // Default order matches the new visual layout if not otherwise specified
    activePlayerColors = (['green', 'red', 'blue', 'yellow'] as PlayerColor[]).slice(0, numPlayersToCreate);
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
      if (token.position >= 200) return false;
      if (token.position === -1) return roll === 6;
      if (token.position >= 100) {
        const stretchPos = token.position % 100;
        return (stretchPos + roll) < HOME_STRETCH_LENGTH;
      }
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

  if (tokenToMove.position === -1 && roll === 6) {
    tokenToMove.position = playerConfig.pathStartIndex;
  } 
  else if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH) {
    let newPosition = tokenToMove.position;
    const homeEntry = playerConfig.homeEntryPathIndex;
    
    let movedPastEntry = false;
    // Check if the move will cross or land on the home entry point
    // This logic handles the wrap-around path for Green player correctly
    let effectiveEndPos = (newPosition + roll);
    if ((newPosition < homeEntry && effectiveEndPos >= homeEntry) || // Standard crossing
        (newPosition > homeEntry && (effectiveEndPos % MAIN_PATH_LENGTH) < newPosition && (effectiveEndPos % MAIN_PATH_LENGTH) >= homeEntry) // Wrap-around crossing for Green
    ) {
       let stepsAfterEntry = 0;
       if (newPosition < homeEntry) {
           stepsAfterEntry = effectiveEndPos - homeEntry;
       } else {
           stepsAfterEntry = (effectiveEndPos % MAIN_PATH_LENGTH) - homeEntry;
           if(stepsAfterEntry < 0) stepsAfterEntry += MAIN_PATH_LENGTH;
       }

       if (stepsAfterEntry < HOME_STRETCH_LENGTH) {
            tokenToMove.position = 100 + stepsAfterEntry;
            movedPastEntry = true;
       }
    }

    if (!movedPastEntry) {
        tokenToMove.position = (tokenToMove.position + roll) % MAIN_PATH_LENGTH;
    }
  } 
  else if (tokenToMove.position >= 100 && tokenToMove.position < 200) {
    const currentStretchPos = tokenToMove.position % 100;
    const newStretchPos = currentStretchPos + roll;
    
    if (newStretchPos < HOME_STRETCH_LENGTH) {
        tokenToMove.position = 100 + newStretchPos;
    }
  }
  
  // Check for captures if the token landed on the main path
  if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH && !SAFE_SQUARE_INDICES.includes(tokenToMove.position)) {
    newPlayers.forEach((p, p_idx) => {
      if(p_idx === playerIndex) return;
      p.tokens.forEach(t => {
        if (t.position === tokenToMove.position) {
          t.position = -1; // Send back to base
          captured = true;
        }
      })
    })
  }

  // Handle reaching home
  if (tokenToMove.position >= 100) {
      const stretchPos = tokenToMove.position % 100;
      if (stretchPos === HOME_STRETCH_LENGTH - 1) { // Final home square
          tokenToMove.position = 200 + tokenToMove.id;
      }
  }

  return { newPlayers, captured };
};

export const isWinner = (player: Player): boolean => {
    return player.tokens.every(t => t.position >= 200);
}
