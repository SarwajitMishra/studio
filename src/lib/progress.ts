
'use client';

// Import all game definitions
import { GAMES, MATH_PUZZLE_TYPES, ENGLISH_PUZZLE_TYPES } from './constants';
import { applyRewards } from './rewards';

export const LOCAL_STORAGE_GAME_STATS_KEY = 'shravyaPlayhouse_gameStats';

export interface GameStat {
  gameId: string;
  gamesPlayed: number;
  wins: number;
  highScore: number;
}

// Combine all games into a single source of truth for stats.
const ALL_GAME_DEFINITIONS = [
    // Main games, excluding the container categories
    ...GAMES.filter(g => g.id !== 'number-puzzles' && g.id !== 'easy-english'),
    // Sub-games from math puzzles
    ...MATH_PUZZLE_TYPES,
    // Sub-games from english puzzles
    ...ENGLISH_PUZZLE_TYPES
];

export const getGameStats = (): GameStat[] => {
    if (typeof window === 'undefined') {
        // Return default structure during server-side rendering
        return ALL_GAME_DEFINITIONS.map(game => ({ gameId: game.id, gamesPlayed: 0, wins: 0, highScore: 0 }));
    }
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_GAME_STATS_KEY);
        const stats = stored ? JSON.parse(stored) : [];
        
        // Ensure all games from constants are present in stats, and handle malformed data
        const allGameStats = ALL_GAME_DEFINITIONS.map(game => {
            const foundStat = stats.find((s: any) => s && s.gameId === game.id);
            return {
                gameId: game.id,
                gamesPlayed: (foundStat && typeof foundStat.gamesPlayed === 'number') ? foundStat.gamesPlayed : 0,
                wins: (foundStat && typeof foundStat.wins === 'number') ? foundStat.wins : 0,
                highScore: (foundStat && typeof foundStat.highScore === 'number') ? foundStat.highScore : 0
            };
        });
        return allGameStats;
    } catch (e) {
        console.error("Error reading game stats from localStorage", e);
        return ALL_GAME_DEFINITIONS.map(game => ({ gameId: game.id, gamesPlayed: 0, wins: 0, highScore: 0 }));
    }
};

const setGameStats = (stats: GameStat[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LOCAL_STORAGE_GAME_STATS_KEY, JSON.stringify(stats));
        // Dispatch unified event so other components can update
        window.dispatchEvent(new CustomEvent('storageUpdated'));
    } catch (e) {
        console.error("Error writing game stats to localStorage", e);
    }
}

interface UpdateStatsPayload {
    gameId: string;
    didWin: boolean;
    score?: number; 
}

export const updateGameStats = (payload: UpdateStatsPayload) => {
    if (typeof window === 'undefined') return;
    const stats = getGameStats();
    
    // Check for the "First Game Completed" milestone before updating stats.
    const totalGamesPlayedBefore = stats.reduce((total, s) => total + s.gamesPlayed, 0);

    const statIndex = stats.findIndex(s => s.gameId === payload.gameId);

    if (statIndex !== -1) {
        const statToUpdate = stats[statIndex];
        statToUpdate.gamesPlayed += 1;
        if (payload.didWin) {
            statToUpdate.wins += 1;
        }
        if (payload.score !== undefined && payload.score > statToUpdate.highScore) {
            statToUpdate.highScore = payload.score;
        }
        stats[statIndex] = statToUpdate;
    } else {
        // This case should be handled by getGameStats, but as a fallback:
        stats.push({
            gameId: payload.gameId,
            gamesPlayed: 1,
            wins: payload.didWin ? 1 : 0,
            highScore: payload.score || 0,
        });
    }

    setGameStats(stats);
    
    // If this was the very first game played, apply the milestone reward.
    if (totalGamesPlayedBefore === 0) {
        console.log("First game milestone reached! Applying special reward.");
        applyRewards(100, 10, "First Game Completed!");
    }
}
