
import type { Player } from './types';
import { getMovableTokens, moveToken as moveTokenEngine } from './engine';

export const getAIMove = (players: Player[], playerIndex: number, roll: number): number | null => {
    const player = players[playerIndex];
    if (!player) return null;

    const movableTokens = getMovableTokens(player, roll);
    if (movableTokens.length === 0) return null;

    // AI Logic:
    // 1. Prioritize a move that captures an opponent's token
    for (const token of movableTokens) {
        const { captured } = moveTokenEngine(players, playerIndex, token.id, roll);
        if (captured) {
            return token.id;
        }
    }
    
    // 2. If roll is 6 and a token is in base, prioritize moving it out.
    const baseToken = movableTokens.find(t => t.position === -1);
    if (roll === 6 && baseToken) {
        return baseToken.id;
    }
    
    // 3. Prioritize moving the most advanced token that is not in the home stretch.
    const sortedMovableOnPath = [...movableTokens]
        .filter(t => t.position >= 0 && t.position < 100)
        .sort((a,b) => b.position - a.position);

    if (sortedMovableOnPath.length > 0) {
        return sortedMovableOnPath[0].id;
    }

    // 4. If all movable tokens are in home stretch or base, move the most advanced one in the home stretch.
    const sortedMovableInStretch = [...movableTokens]
        .filter(t => t.position >= 100)
        .sort((a,b) => b.position - a.position);

    if (sortedMovableInStretch.length > 0) {
      return sortedMovableInStretch[0].id;
    }
    
    // 5. Fallback: just move the first available token
    if (movableTokens.length > 0) {
      return movableTokens[0].id;
    }

    return null;
}
