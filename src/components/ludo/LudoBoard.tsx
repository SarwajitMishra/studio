
"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Cpu, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Player, Token, PlayerColor, GameView } from '@/lib/ludo/types';
import { PLAYER_CONFIG } from '@/lib/ludo/engine';

interface LudoBoardProps {
  players: Player[];
  onTokenClick: (playerIndex: number, tokenId: number) => void;
  currentPlayerIndex: number;
  diceValue: number | null;
  movableTokens: Token[];
  isRolling: boolean;
  gameView: GameView;
}

const GRID_SIZE = 15;

const pathCoords: { row: number, col: number }[] = [
    { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
    { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
    { row: 0, col: 7 }, { row: 0, col: 8 },
    { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 },
    { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 },
    { row: 7, col: 14 }, { row: 8, col: 14 },
    { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 },
    { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 },
    { row: 14, col: 7 }, { row: 14, col: 6 },
    { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 },
    { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
    { row: 7, col: 0 },
];

const homeStretchCoords: Record<PlayerColor, { row: number, col: number }[]> = {
  red:    [ { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, {row: 7, col: 6} ],
  green:  [ { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 }, {row: 6, col: 7} ],
  yellow: [ { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }, {row: 7, col: 8} ],
  blue:   [ { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 }, {row: 8, col: 7} ],
};

const baseCoords: Record<PlayerColor, { row: number, col: number }[]> = {
  red:    [{row:1,col:1},{row:1,col:4},{row:4,col:1},{row:4,col:4}],
  green:  [{row:1,col:10},{row:1,col:13},{row:4,col:10},{row:4,col:13}],
  blue:   [{row:10,col:10},{row:10,col:13},{row:13,col:10},{row:13,col:13}],
  yellow: [{row:10,col:1},{row:10,col:4},{row:13,col:1},{row:13,col:4}],
};

const homeBaseCoords: Record<PlayerColor, { row: number, col: number }> = {
  red:    {row: 7, col: 7},
  green:  {row: 7, col: 7},
  blue:   {row: 7, col: 7},
  yellow: {row: 7, col: 7},
};


const getTokenPositionStyle = (token: Token): React.CSSProperties => {
  let coord: { row: number, col: number } | undefined;

  if (token.position === -1) {
    coord = baseCoords[token.color][token.id];
  } else if (token.position >= 0 && token.position < 100) {
    coord = pathCoords[token.position];
  } else if (token.position >= 100 && token.position < 200) {
    const stretchIndex = token.position % 100;
    coord = homeStretchCoords[token.color][stretchIndex];
  } else {
    coord = homeBaseCoords[token.color];
  }

  if (coord) {
    return {
      gridRowStart: coord.row + 1,
      gridColumnStart: coord.col + 1,
    };
  }
  return { display: 'none' };
};


export const LudoBoard: React.FC<LudoBoardProps> = (props) => {
  const { players, onTokenClick, currentPlayerIndex, movableTokens, isRolling, gameView } = props;
  const currentPlayer = players[currentPlayerIndex];

  const tokensByPosition: Record<string, Token[]> = {};
  players.forEach(player => {
    player.tokens.forEach(token => {
      const style = getTokenPositionStyle(token);
      const key = `${style.gridRowStart}-${style.gridColumnStart}`;
      if (!tokensByPosition[key]) {
        tokensByPosition[key] = [];
      }
      tokensByPosition[key].push(token);
    });
  });

  return (
    <div
      className="relative grid bg-cover bg-center rounded-lg border-2 border-neutral-700 shadow-xl"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        backgroundImage: "url('/images/ludo/board.png')",
        width: "clamp(320px, 90vw, 600px)",
        aspectRatio: "1 / 1",
      }}
      aria-label="Ludo board"
    >
      {/* Player name labels in corners */}
      {players.map((p, index) => {
        const config = PLAYER_CONFIG[p.color];
        const isCurrent = index === currentPlayerIndex;
        let positionClass = '';
        switch(p.color) {
            case 'red': positionClass = 'top-2 left-2'; break;
            case 'green': positionClass = 'top-2 right-2'; break;
            case 'yellow': positionClass = 'bottom-2 left-2'; break;
            case 'blue': positionClass = 'bottom-2 right-2'; break;
        }
        return (
            <div key={p.color} className={cn(
                'absolute p-2 rounded-lg bg-card/70 backdrop-blur-sm shadow-md transition-all duration-300',
                positionClass,
                isCurrent ? 'ring-2 ring-accent scale-105' : 'ring-1 ring-black/10'
            )}>
                <p className="text-sm font-semibold truncate text-center text-foreground drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" title={p.name}>
                    {p.name} {p.isAI && <Cpu size={14} className="inline ml-1"/>}
                </p>
            </div>
        )
      })}
      
      {/* Render All Tokens */}
      {players.flatMap((player, playerIndex) => {
         return player.tokens.map(token => {
            const isMovable = movableTokens.some(mt => mt.id === token.id && mt.color === token.color);
            const style = getTokenPositionStyle(token);
            const positionKey = `${style.gridRowStart}-${style.gridColumnStart}`;
            const tokensOnThisCell = tokensByPosition[positionKey] || [];
            const cellIndex = tokensOnThisCell.findIndex(t => t.id === token.id && t.color === token.color);

            let transform = 'translate(0, 0)';
            if (tokensOnThisCell.length > 1) {
                const angle = (cellIndex / tokensOnThisCell.length) * 2 * Math.PI;
                const x = Math.cos(angle) * 20;
                const y = Math.sin(angle) * 20;
                transform = `translate(${x}%, ${y}%)`;
            }

            return (
              <button
                key={`${token.color}-${token.id}`}
                style={{ ...style, transform }}
                onClick={() => onTokenClick(playerIndex, token.id)}
                disabled={!currentPlayer || playerIndex !== currentPlayerIndex || isRolling || !isMovable || gameView !== 'playing' || player.isAI}
                className={cn(
                  "absolute rounded-full flex items-center justify-center border-2 md:border-4 border-white/90 transition-all duration-200 w-[6.66%] h-[6.66%]",
                  isMovable && currentPlayerIndex === playerIndex && !player.isAI ? "cursor-pointer ring-4 ring-yellow-400 z-30 animate-gentle-bounce" : "cursor-default z-10",
                  'p-0 bg-transparent'
                )}
                aria-label={`Token ${token.color} ${token.id + 1}`}
              >
                <Image
                  src={PLAYER_CONFIG[token.color].tokenImageUrl}
                  alt={`${token.color} token`}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  data-ai-hint={`${token.color} ludo token`}
                />
                <div className="absolute inset-0 rounded-full shadow-inner"/>
              </button>
            )
        })
      })}
    </div>
  );
};
