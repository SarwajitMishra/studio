
'use client';

import {
  LOCAL_STORAGE_S_POINTS_KEY,
  LOCAL_STORAGE_S_COINS_KEY,
  LOCAL_STORAGE_REWARD_HISTORY_KEY,
} from '@/lib/constants';
import { LOCAL_STORAGE_GAME_STATS_KEY, type GameStat } from '@/lib/progress';
import { type RewardEvent } from '@/lib/rewards';

export interface GuestData {
  sPoints: number;
  sCoins: number;
  rewardHistory: RewardEvent[];
  gameStats: GameStat[];
}

export function getGuestData(): GuestData | null {
  if (typeof window === 'undefined') return null;

  const sPoints = parseInt(localStorage.getItem(LOCAL_STORAGE_S_POINTS_KEY) || '0', 10);
  const sCoins = parseInt(localStorage.getItem(LOCAL_STORAGE_S_COINS_KEY) || '0', 10);
  const rewardHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_REWARD_HISTORY_KEY) || '[]');
  const gameStats = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GAME_STATS_KEY) || '[]');

  // If there's no meaningful progress, don't consider it as having guest data.
  const totalGamesPlayed = gameStats.reduce((acc: number, stat: GameStat) => acc + stat.gamesPlayed, 0);
  if (sPoints === 0 && sCoins === 0 && rewardHistory.length === 0 && totalGamesPlayed === 0) {
    return null;
  }

  return { sPoints, sCoins, rewardHistory, gameStats };
}

export function clearGuestData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(LOCAL_STORAGE_S_POINTS_KEY);
  localStorage.removeItem(LOCAL_STORAGE_S_COINS_KEY);
  localStorage.removeItem(LOCAL_STORAGE_REWARD_HISTORY_KEY);
  localStorage.removeItem(LOCAL_STORAGE_GAME_STATS_KEY);
  // Also clear user-specific things that might be left over from guest mode
  localStorage.removeItem('shravyaPlayhouse_userName');
  localStorage.removeItem('shravyaPlayhouse_avatar');

  // Notify other components of the change
  window.dispatchEvent(new CustomEvent('storageUpdated'));
}
