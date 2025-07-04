
import type { Player, Token, PlayerColor, GameMode } from './types';

export const MAIN_PATH_LENGTH = 52;
export const HOME_STRETCH_LENGTH = 6;
export const NUM_TOKENS_PER_PLAYER = 4;

// Correct player configurations: start points, and home entry points
// The visual coordinates have been removed and are now handled by the LudoBoard component.
export const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number; tokenImageUrl: string; }> = {
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 1,   homeEntryPathIndex: 51, tokenImageUrl: '/images/ludo/token-green.png' },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 14,  homeEntryPathIndex: 12, tokenImageUrl: '/images/ludo/token-yellow.png' },
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 27,  homeEntryPathIndex: 25, tokenImageUrl: '/images/ludo/token-blue.png' },
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 40,  homeEntryPathIndex: 38, tokenImageUrl: '/images/ludo/token-red.png' },
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
     activePlayerColors = ['red', 'yellow']; 
  } else {
    // Fallback for offline if colors somehow aren't provided, or other modes.
    activePlayerColors = (['red', 'green', 'yellow', 'blue'] as PlayerColor[]).slice(0, numPlayersToCreate);
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
      // Cannot move a token that is already home
      if (token.position >= 200) return false;

      // Can move from base only on a 6
      if (token.position === -1) return roll === 6;

      // Check if move is valid within home stretch
      if (token.position >= 100) {
        const stretchPos = token.position % 100;
        return (stretchPos + roll) < HOME_STRETCH_LENGTH; // Cannot overshoot the end
      }

      // Any other token on the board is movable
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

  // Move from base
  if (tokenToMove.position === -1 && roll === 6) {
    tokenToMove.position = playerConfig.pathStartIndex;
  } 
  // Move on the main path or enter home stretch
  else if (tokenToMove.position >= 0 && tokenToMove.position < MAIN_PATH_LENGTH) {
    let newPosition = tokenToMove.position;
    
    // Logic to handle passing the home entry point
    const homeEntry = playerConfig.homeEntryPathIndex;
    const start = playerConfig.pathStartIndex;
    
    // Check if the move will cross the home entry point
    let movedPastEntry = false;
    if (start > homeEntry) { // Loop around case (e.g., green player)
        for(let i=1; i<=roll; i++) {
            if ((newPosition + i -1) % MAIN_PATH_LENGTH === homeEntry) {
                movedPastEntry = true;
                const stepsIntoHome = roll - i;
                if (stepsIntoHome < HOME_STRETCH_LENGTH) {
                    tokenToMove.position = 100 + stepsIntoHome;
                }
                break;
            }
        }
    } else { // Normal case
        if (tokenToMove.position <= homeEntry && (tokenToMove.position + roll) > homeEntry) {
            movedPastEntry = true;
            const stepsIntoHome = tokenToMove.position + roll - homeEntry - 1;
            if (stepsIntoHome < HOME_STRETCH_LENGTH) {
                tokenToMove.position = 100 + stepsIntoHome;
            }
        }
    }

    if (!movedPastEntry) {
        tokenToMove.position = (tokenToMove.position + roll) % MAIN_PATH_LENGTH;
    }
  } 
  // Move in the home stretch
  else if (tokenToMove.position >= 100 && tokenToMove.position < 200) {
    const currentStretchPos = tokenToMove.position % 100;
    const newStretchPos = currentStretchPos + roll;
    
    if (newStretchPos < HOME_STRETCH_LENGTH) {
        tokenToMove.position = 100 + newStretchPos;
    } else {
        // In a strict game, this move would be invalid. We assume getMovableTokens prevents this.
        // If it reaches home exactly, we can mark it.
        if (newStretchPos === HOME_STRETCH_LENGTH -1) {
             tokenToMove.position = 200 + tokenToMove.id; // Reached home
        }
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
