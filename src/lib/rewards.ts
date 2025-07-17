
'use client';
// src/lib/rewards.ts
import { LOCAL_STORAGE_S_POINTS_KEY, LOCAL_STORAGE_S_COINS_KEY, LOCAL_STORAGE_REWARD_HISTORY_KEY } from "@/lib/constants";
import { calculateRewards as calculateRewardsFlow, type RewardCalculationInput } from '@/ai/flows/calculate-rewards-flow';

const S_POINTS_TO_S_COIN_CONVERSION_THRESHOLD = 500;
const DAILY_S_COIN_CAP = 100;
const LOCAL_STORAGE_S_COIN_TALLY_KEY = 'shravyaPlaylab_sCoinTally';

export interface RewardEvent {
  id: string;
  description: string;
  points: number;
  coins: number;
  timestamp: string; // ISO string
}

interface DailyTally {
  date: string; // YYYY-MM-DD
  total: number;
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
 * @param pointsToAdd The number of S-Points to add (can be negative).
 * @param coinsFromGame The number of S-Coins earned directly from the game (can be negative).
 * @param description A description of how the reward was earned for the history log.
 * @returns The total number of points and coins earned in this transaction (including conversions and caps).
 */
export function applyRewards(pointsToAdd: number, coinsFromGame: number, description: string = "Reward Earned"): { points: number; coins: number } {
  if (typeof window === 'undefined') return { points: pointsToAdd, coins: coinsFromGame };

  // Get current values
  const currentPoints = getStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY);
  const currentCoins = getStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY);

  let newPoints = currentPoints + pointsToAdd;
  let coinsAfterConversion = 0;

  // Handle S-Point to S-Coin conversion (only for positive point additions)
  if (pointsToAdd > 0 && newPoints >= S_POINTS_TO_S_COIN_CONVERSION_THRESHOLD) {
      const conversions = Math.floor(newPoints / S_POINTS_TO_S_COIN_CONVERSION_THRESHOLD);
      coinsAfterConversion = conversions;
      newPoints %= S_POINTS_TO_S_COIN_CONVERSION_THRESHOLD;
  }

  // Handle debits directly without applying daily cap logic
  if (coinsFromGame < 0) {
    const newCoins = currentCoins + coinsFromGame;
    setStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY, newCoins);
    setStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY, newPoints); // Save points too
    addRewardToHistory({ description, points: pointsToAdd, coins: coinsFromGame });
    window.dispatchEvent(new CustomEvent('storageUpdated'));
    return { points: pointsToAdd, coins: coinsFromGame };
  }

  const totalPotentialCoins = coinsFromGame + coinsAfterConversion;
  let finalCoinsToAdd = totalPotentialCoins;

  // --- Daily S-Coin Cap Logic for CREDITS only ---
  const today = new Date().toISOString().split('T')[0]; // Get 'YYYY-MM-DD'
  let coinTally: DailyTally = { date: today, total: 0 };
  
  try {
    const storedTally = localStorage.getItem(LOCAL_STORAGE_S_COIN_TALLY_KEY);
    if (storedTally) {
      const parsedTally = JSON.parse(storedTally);
      if (parsedTally.date === today) {
        coinTally = parsedTally;
      }
    }
  } catch (e) {
    console.error("Error reading S-Coin tally from localStorage", e);
  }

  if (coinTally.total >= DAILY_S_COIN_CAP) {
    console.log("Daily S-Coin cap reached. No more S-Coins will be awarded today.");
    finalCoinsToAdd = 0;
  } else if (coinTally.total + totalPotentialCoins > DAILY_S_COIN_CAP) {
    finalCoinsToAdd = DAILY_S_COIN_CAP - coinTally.total;
    console.log(`Daily S-Coin cap will be reached. Awarding ${finalCoinsToAdd} instead of ${totalPotentialCoins}.`);
  }
  // --- End Daily Cap Logic ---
  
  // Save new values
  const newCoins = currentCoins + finalCoinsToAdd;
  setStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY, newPoints);
  setStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY, newCoins);

  // Update and save the daily tally for credits
  if (finalCoinsToAdd > 0) {
    coinTally.total += finalCoinsToAdd;
    try {
        localStorage.setItem(LOCAL_STORAGE_S_COIN_TALLY_KEY, JSON.stringify(coinTally));
    } catch (e) {
        console.error("Error writing S-Coin tally to localStorage", e);
    }
  }

  // Log the event to history if there was any change
  if(pointsToAdd !== 0 || finalCoinsToAdd !== 0) {
      addRewardToHistory({
          description,
          points: pointsToAdd,
          coins: finalCoinsToAdd
      });
  }

  // Dispatch a custom event to notify other parts of the app
  window.dispatchEvent(new CustomEvent('storageUpdated'));
  
  console.log(`Rewards applied. Points: +${pointsToAdd}, Coins: +${finalCoinsToAdd}. Daily tally: ${coinTally.total}/${DAILY_S_COIN_CAP}.`);

  return { points: pointsToAdd, coins: finalCoinsToAdd };
}


/**
 * A server action that calls the AI flow to determine rewards.
 * This can be safely called from client components.
 */
export async function calculateRewards(input: RewardCalculationInput): Promise<{ sPoints: number; sCoins: number; }> {
    return await calculateRewardsFlow(input);
}
