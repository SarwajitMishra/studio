
'use client';
// src/lib/rewards.ts
import { LOCAL_STORAGE_S_POINTS_KEY, LOCAL_STORAGE_S_COINS_KEY, LOCAL_STORAGE_REWARD_HISTORY_KEY } from "@/lib/constants";
import { calculateRewards as calculateRewardsFlow, type RewardCalculationInput } from '@/ai/flows/calculate-rewards-flow';

const S_POINTS_TO_S_COIN_CONVERSION_THRESHOLD = 500;

export interface RewardEvent {
  id: string;
  description: string;
  points: number;
  coins: number;
  timestamp: string; // ISO string
}

const getStoredGameCurrency = (key: string): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  } catch (e) {
    console.error("Error reading from localStorage", e);
    return 0;
  }
};

const setStoredGameCurrency = (key: string, value: number): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value.toString());
    } catch (e) {
      console.error("Error writing to localStorage", e);
    }
  }
};

export const getRewardHistory = (): RewardEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_REWARD_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error reading reward history from localStorage", e);
    return [];
  }
};

const addRewardToHistory = (event: Omit<RewardEvent, 'id' | 'timestamp'>) => {
    if (typeof window === 'undefined') return;
    const history = getRewardHistory();
    const newEvent: RewardEvent = {
        ...event,
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    // Keep history to a reasonable size, e.g., last 50 events
    const updatedHistory = [newEvent, ...history].slice(0, 50);
    try {
        localStorage.setItem(LOCAL_STORAGE_REWARD_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
        console.error("Error writing reward history to localStorage", e);
    }
};

/**
 * Applies the given S-Points and S-Coins to the user's balance, handles S-Point to S-Coin conversion,
 * and notifies the app of the update. This function should only be called on the client.
 * @param pointsToAdd The number of S-Points to add.
 * @param coinsToAdd The number of S-Coins to add.
 * @param description A description of how the reward was earned for the history log.
 * @returns The total number of points and coins earned in this transaction (including conversions).
 */
export function applyRewards(pointsToAdd: number, coinsToAdd: number, description: string = "Reward Earned"): { points: number; coins: number } {
  if (typeof window === 'undefined') return { points: pointsToAdd, coins: coinsToAdd };

  // Get current values
  const currentPoints = getStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY);
  const currentCoins = getStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY);

  let newPoints = currentPoints + pointsToAdd;
  let newCoins = currentCoins + coinsToAdd;
  let convertedCoins = 0;

  // Handle S-Point to S-Coin conversion
  if (newPoints >= S_POINTS_TO_S_COIN_CONVERSION_THRESHOLD) {
      const conversions = Math.floor(newPoints / S_POINTS_TO_S_COIN_CONVERSION_THRESHOLD);
      convertedCoins = conversions;
      newCoins += conversions;
      newPoints %= S_POINTS_TO_S_COIN_CONVERSION_THRESHOLD;
  }
  
  // Save new values
  setStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY, newPoints);
  setStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY, newCoins);

  const totalCoinsEarned = coinsToAdd + convertedCoins;

  // Log the event to history
  if(pointsToAdd > 0 || totalCoinsEarned > 0) {
      addRewardToHistory({
          description,
          points: pointsToAdd,
          coins: totalCoinsEarned
      });
  }

  // Dispatch a custom event to notify other parts of the app (like the profile page)
  window.dispatchEvent(new CustomEvent('storageUpdated'));
  
  console.log(`Rewards applied. Points: +${pointsToAdd}, Coins: +${coinsToAdd}. Converted Coins: ${convertedCoins}. New Total Points: ${newPoints}, New Total Coins: ${newCoins}`);

  return { points: pointsToAdd, coins: totalCoinsEarned };
}


/**
 * A server action that calls the AI flow to determine rewards.
 * This can be safely called from client components.
 */
export async function calculateRewards(input: RewardCalculationInput): Promise<{ sPoints: number; sCoins: number; }> {
    return await calculateRewardsFlow(input);
}
