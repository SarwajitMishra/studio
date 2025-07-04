
import type { Player, Token, PlayerColor, GameMode } from './types';

export const MAIN_PATH_LENGTH = 52;
export const HOME_STRETCH_LENGTH = 6;
export const NUM_TOKENS_PER_PLAYER = 4;

export const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number; tokenImageUrl: string; }> = {
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",    pathStartIndex: 0,   homeEntryPathIndex: 51, tokenImageUrl: '/images/ludo/token-red.png' },
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 13,  homeEntryPathIndex: 11, tokenImageUrl: '/images/ludo/token-green.png' },
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 26,  homeEntryPathIndex: 24, tokenImageUrl: '/images/ludo/token-blue.png' },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 39,  homeEntryPathIndex: 37, tokenImageUrl: '/images/ludo/token-yellow.png' },
};

export const SAFE_SQUARE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];


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
    activePlayerColors = (['red', 'green', 'blue', 'yellow'] as PlayerColor[]).slice(0, numPlayersToCreate);
  }

  return activePlayerColors.map((color, index) => {
    const isAIPlayer = mode === 'ai' && color === 'yellow';
    let playerName = PLAYER_CONFIG[color].name;

    if (mode === 'ai') {
      playerName = (color === 'blue') ? (humanName || "Human Player") : "Shravya AI";
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
  else if (tokenToMove.position >= 0 && tokenToMove.position < 100) {
    const currentPos = tokenToMove.position;
    const homeEntry = playerConfig.homeEntryPathIndex;
    
    let passesHomeEntry = false;
    const startPos = playerConfig.pathStartIndex;
    
    // Logic to check if the token passes its entry point. This is tricky due to path wrap-around.
    if (startPos > homeEntry) { // Red player case
      if (currentPos > homeEntry && (currentPos + roll) % MAIN_PATH_LENGTH <= homeEntry) {
        passesHomeEntry = true;
      } else if (currentPos <= homeEntry && currentPos + roll > homeEntry) {
         // This condition is not for Red, but for others. Let's make it generic.
      }
    } else { // Green, Blue, Yellow
       if (currentPos <= homeEntry && currentPos + roll > homeEntry) {
        passesHomeEntry = true;
       }
    }
    
    if (passesHomeEntry) {
      const stepsPastEntry = (currentPos + roll) - homeEntry - 1;
      if (stepsPastEntry < HOME_STRETCH_LENGTH) {
        tokenToMove.position = 100 + stepsPastEntry;
      } else {
        tokenToMove.position = (currentPos + roll) % MAIN_PATH_LENGTH;
      }
    } else {
      tokenToMove.position = (currentPos + roll) % MAIN_PATH_LENGTH;
    }
  } 
  else if (tokenToMove.position >= 100 && tokenToMove.position < 200) {
    const currentStretchPos = tokenToMove.position % 100;
    const newStretchPos = currentStretchPos + roll;
    
    if (newStretchPos < HOME_STRETCH_LENGTH) {
        tokenToMove.position = 100 + newStretchPos;
    }
  }
  
  const finalPos = tokenToMove.position;
  if (finalPos >= 0 && finalPos < 100) {
    const isSafeSquare = SAFE_SQUARE_INDICES.includes(finalPos);
    
    if (!isSafeSquare) {
      newPlayers.forEach((otherPlayer) => {
        if (otherPlayer.color === playerToMove.color) return;
        otherPlayer.tokens.forEach(otherToken => {
          if (otherToken.position === finalPos) {
            otherToken.position = -1;
            captured = true;
          }
        });
      });
    }
  }

  if (tokenToMove.position >= 100) {
      const stretchPos = tokenToMove.position % 100;
      if (stretchPos === HOME_STRETCH_LENGTH - 1) { 
          tokenToMove.position = 200 + tokenToMove.id;
      }
  }

  return { newPlayers, captured };
};

export const isWinner = (player: Player): boolean => {
    return player.tokens.every(t => t.position >= 200);
}
