
import type { Player, Token } from './types';
import { getMovableTokens, moveToken } from './engine';

export const getAIMove = (players: Player[], playerIndex: number, roll: number): number | null => {
    const player = players[playerIndex];
    if (!player) return null;

    const movableTokens = getMovableTokens(player, roll);
    if (movableTokens.length === 0) return null;

    // AI Logic:
    // 1. Prioritize a move that captures an opponent's token
    for (const token of movableTokens) {
        const { captured } = moveToken(players, playerIndex, token.id, roll);
        if (captured) {
            return token.id;
        }
    }
    
    // 2. If roll is 6 and a token is in base, move it out.
    const baseToken = movableTokens.find(t => t.position === -1);
    if (roll === 6 && baseToken) {
        return baseToken.id;
    }
    
    // 3. Prioritize moving a token that is not in the home stretch yet, and is most advanced.
    const sortedMovable = [...movableTokens]
        .filter(t => t.position < 100) // Not in home stretch
        .sort((a,b) => b.position - a.position);

    if (sortedMovable.length > 0) {
        return sortedMovable[0].id;
    }

    // 4. If all movable tokens are in home stretch, move the most advanced one.
    if (movableTokens.length > 0) {
        return movableTokens.sort((a,b) => b.position - a.position)[0].id;
    }
    
    return null;
}
