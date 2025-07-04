
import type { Player, Token, PlayerColor, GameMode } from './types';

export const MAIN_PATH_LENGTH = 52;
export const HOME_STRETCH_LENGTH = 6;
export const NUM_TOKENS_PER_PLAYER = 4;
export const BOARD_GRID_SIZE = 15;

// This is an accurate, ground-up mapping of the 52 squares on the main path.
export const MAIN_PATH_COORDINATES = [
    { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 }, // 0-4
    { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, // 5-9
    { row: 0, col: 6 }, { row: 0, col: 7 }, { row: 0, col: 8 }, // 10-12
    { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, // 13-17
    { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, // 18-22
    { row: 6, col: 14 }, { row: 7, col: 14 }, { row: 8, col: 14 }, // 23-25
    { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 }, // 26-30
    { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, // 31-35
    { row: 14, col: 8 }, { row: 14, col: 7 }, { row: 14, col: 6 }, // 36-38
    { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, // 39-43
    { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, // 44-48
    { row: 8, col: 0 }, { row: 7, col: 0 }, { row: 6, col: 0 }, // 49-51
];

// Correct home stretch paths for each player
export const HOME_STRETCH_COORDINATES: Record<PlayerColor, { row: number; col: number }[]> = {
  green:  [ { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, {row: 7, col: 6} ],
  yellow: [ { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 }, {row: 6, col: 7} ],
  blue:   [ { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }, {row: 7, col: 8} ],
  red:    [ { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 }, {row: 8, col: 7} ],
};

// Correct player configurations: house locations, start points, and home entry points
export const PLAYER_CONFIG: Record<PlayerColor, { name: string; baseClass: string; textClass: string; pathStartIndex: number; homeEntryPathIndex: number; houseCoords: {row: number, col: number}[]; tokenImageUrl: string; }> = {
  green:  { name: "Green",  baseClass: "bg-green-500",  textClass: "text-green-700",  pathStartIndex: 0,  homeEntryPathIndex: 51, houseCoords: [{row:1,col:1},{row:1,col:4},{row:4,col:1},{row:4,col:4}], tokenImageUrl: '/images/ludo/token-green.png' },
  yellow: { name: "Yellow", baseClass: "bg-yellow-400", textClass: "text-yellow-700", pathStartIndex: 13, homeEntryPathIndex: 12, houseCoords: [{row:1,col:10},{row:1,col:13},{row:4,col:10},{row:4,col:13}], tokenImageUrl: '/images/ludo/token-yellow.png' },
  blue:   { name: "Blue",   baseClass: "bg-blue-500",   textClass: "text-blue-700",   pathStartIndex: 26, homeEntryPathIndex: 25, houseCoords: [{row:10,col:10},{row:10,col:13},{row:13,col:10},{row:13,col:13}], tokenImageUrl: '/images/ludo/token-blue.png' },
  red:    { name: "Red",    baseClass: "bg-red-500",    textClass: "text-red-700",   pathStartIndex: 39, homeEntryPathIndex: 38, houseCoords: [{row:10,col:1},{row:10,col:4},{row:13,col:1},{row:13,col:4}], tokenImageUrl: '/images/ludo/token-red.png' },
};

// Corrected safe square indices based on the new path
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
        return (stretchPos + roll) <= HOME_STRETCH_LENGTH; // Can land exactly on the goal
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
    const stepsFromStart = (tokenToMove.position - playerConfig.pathStartIndex + MAIN_PATH_LENGTH) % MAIN_PATH_LENGTH;
    const totalStepsAfterMove = stepsFromStart + roll;

    // A player completes the circle and is ready to enter the home stretch after 50 steps from their start.
    // Step 51 is the first square of the home stretch.
    if (totalStepsAfterMove > 50) { 
        const stepsIntoHomeStretch = totalStepsAfterMove - 50;
        if (stepsIntoHomeStretch <= HOME_STRETCH_LENGTH) {
            tokenToMove.position = 100 + stepsIntoHomeStretch -1; // -1 because home stretch is 0-indexed (0-5)
        }
    } else {
        tokenToMove.position = (tokenToMove.position + roll) % MAIN_PATH_LENGTH;
    }
  } 
  // Move in the home stretch
  else if (tokenToMove.position >= 100 && tokenToMove.position < 200) {
    const currentStretchPos = tokenToMove.position % 100;
    const newStretchPos = currentStretchPos + roll;
    
    if (newStretchPos === HOME_STRETCH_LENGTH) {
      tokenToMove.position = 200 + tokenToMove.id; // Reached home
    } else {
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

  return { newPlayers, captured };
};

export const isWinner = (player: Player): boolean => {
    return player.tokens.every(t => t.position >= 200);
}
