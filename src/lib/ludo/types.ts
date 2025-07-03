
export const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'] as const;
export type PlayerColor = typeof PLAYER_COLORS[number];

export type GameView = 'setup' | 'playing' | 'gameOver' | 'waitingForPlayers';
export type GameMode = 'offline' | 'ai' | 'online' | null;

export interface Token {
  id: number;
  color: PlayerColor;
  /**
   * Position:
   * - -1: In the base
   * - 0-51: On the main path
   * - 100-105: On the home stretch
   * - 200+: Finished/home
   */
  position: number;
}

export interface Player {
  color: PlayerColor;
  name: string;
  tokens: Token[];
  hasRolledSix: boolean;
  sixStreak: number;
  isAI?: boolean;
  uid?: string; // For online players
}
