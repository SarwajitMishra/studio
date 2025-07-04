
"use client";

import React from 'react';
import Image from 'next/image';
import { Cpu } from 'lucide-react';
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
  handleDiceRoll: () => void;
  isDiceButtonClickable: boolean;
}

const GRID_SIZE = 15;

// The full 52-square path, 0-indexed, manually mapped for correctness.
const pathCoords: { row: number, col: number }[] = [
    // Path from Red's area to Green's
    { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 }, // 0-4
    { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, // 5-9
    { row: 0, col: 6 }, { row: 0, col: 7 }, { row: 0, col: 8 }, // 10-12
    // Path from Green's area to Blue's
    { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, // 13-17
    { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, // 18-22
    { row: 6, col: 14 }, { row: 7, col: 14 }, { row: 8, col: 14 }, // 23-25
    // Path from Blue's area to Yellow's
    { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 }, // 26-30
    { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, // 31-35
    { row: 14, col: 8 }, { row: 14, col: 7 }, { row: 14, col: 6 }, // 36-38
    // Path from Yellow's area to Red's
    { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, // 39-43
    { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, // 44-48
    { row: 7, col: 0 }, { row: 6, col: 0 }, // 49-50 (Path has 51 squares, 0-50)
];


const homeStretchCoords: Record<PlayerColor, { row: number, col: number }[]> = {
  red:    [ { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 } ],
  green:  [ { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 }, { row: 6, col: 7 } ],
  blue:   [ { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 }, { row: 8, col: 7 } ],
  yellow: [ { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }, { row: 7, col: 8 } ]
};

// Coordinates are 0-indexed for a 15x15 grid.
// These are designed to center tokens inside the 2x2 quadrants of each 6x6 home area.
const baseCoords: Record<PlayerColor, { row: number, col: number }[]> = {
  red:    [{row:1, col:1}, {row:1, col:4}, {row:4, col:1}, {row:4, col:4}],
  green:  [{row:1, col:10}, {row:1, col:13}, {row:4, col:10}, {row:4, col:13}],
  yellow: [{row:10, col:1}, {row:10, col:4}, {row:13, col:1}, {row:13, col:4}],
  blue:   [{row:10, col:10}, {row:10, col:13}, {row:13, col:10}, {row:13, col:13}],
};


// Where finished tokens are placed (center of the board).
const homeBaseCoords: { row: number, col: number } = {row: 7, col: 7};

const getTokenPositionStyle = (token: Token): React.CSSProperties => {
  let coord: { row: number, col: number } | undefined;

  if (token.position === -1) { // In base
    coord = baseCoords[token.color][token.id];
  } else if (token.position >= 0 && token.position < 100) { // On path
    coord = pathCoords[token.position];
  } else if (token.position >= 100 && token.position < 200) { // Home stretch
    const stretchIndex = token.position % 100;
    coord = homeStretchCoords[token.color][stretchIndex];
  } else { // Finished
    coord = homeBaseCoords;
  }

  if (coord) {
    return {
      gridRowStart: coord.row + 1,
      gridColumnStart: coord.col + 1,
    };
  }
  return { display: 'none' };
};

const PlayerArea = ({ player, isCurrentPlayer, diceValue, isRolling, onDiceRoll, isDiceButtonClickable }: {
    player: Player;
    isCurrentPlayer: boolean;
    diceValue: number | null;
    isRolling: boolean;
    onDiceRoll: () => void;
    isDiceButtonClickable: boolean;
}) => {
    const DICE_IMAGE_URLS: Record<number, string> = {
        1: '/images/ludo/dice-1.png', 2: '/images/ludo/dice-2.png', 3: '/images/ludo/dice-3.png',
        4: '/images/ludo/dice-4.png', 5: '/images/ludo/dice-5.png', 6: '/images/ludo/dice-6.png',
    };
    const areaStyles: Record<PlayerColor, string> = {
        red: '1 / 1 / span 6 / span 6',
        green: '1 / 10 / span 6 / span 6',
        yellow: '10 / 1 / span 6 / span 6',
        blue: '10 / 10 / span 6 / span 6',
    };

    return (
        <div style={{ gridArea: areaStyles[player.color] }} className={cn("relative flex items-center justify-center", isCurrentPlayer ? "animate-pulse" : "")}>
            <div className="absolute flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 w-24 h-24 sm:w-28 sm:h-28">
                <p className="text-xs sm:text-sm font-semibold truncate mb-1 text-center text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" title={player.name}>
                    {player.name} {player.isAI && <Cpu size={14} className="inline ml-1" />}
                </p>
                {isCurrentPlayer && (
                    <button onClick={onDiceRoll} disabled={!isDiceButtonClickable} className="w-12 h-12 sm:w-16 sm:h-16">
                        <Image
                            src={DICE_IMAGE_URLS[diceValue || 1]}
                            alt={`Dice showing ${diceValue || 'face'}`}
                            width={64} height={64}
                            className={cn("transition-transform duration-300 hover:scale-110", isRolling ? "animate-dice-roll" : "")}
                            data-ai-hint={`dice ${diceValue || 'one'}`}
                        />
                    </button>
                )}
            </div>
        </div>
    );
}

export const LudoBoard: React.FC<LudoBoardProps> = (props) => {
  const { players, onTokenClick, currentPlayerIndex, movableTokens, isRolling, gameView, diceValue, handleDiceRoll, isDiceButtonClickable } = props;
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
      {/* Player areas in corners */}
      {players.map((p, index) => (
        <PlayerArea 
            key={p.color} 
            player={p} 
            isCurrentPlayer={index === currentPlayerIndex} 
            diceValue={diceValue} 
            isRolling={isRolling}
            onDiceRoll={handleDiceRoll}
            isDiceButtonClickable={isDiceButtonClickable}
        />
      ))}
      
      {/* Render All Tokens */}
      {players.flatMap((player, playerIndex) => {
         return player.tokens.map(token => {
            const isMovable = movableTokens.some(mt => mt.id === token.id && mt.color === token.color);
            const style = getTokenPositionStyle(token);
            const positionKey = `${style.gridRowStart}-${style.gridColumnStart}`;
            const tokensOnThisCell = tokensByPosition[positionKey] || [];
            const cellIndex = tokensOnThisCell.findIndex(t => t.id === token.id && t.color === token.color);

            let transform = 'translate(-50%, -50%)'; // Center tokens by default
            if (tokensOnThisCell.length > 1) {
                const angle = (cellIndex / tokensOnThisCell.length) * 2 * Math.PI;
                const x = Math.cos(angle) * 20; // 20% offset
                const y = Math.sin(angle) * 20;
                transform = `translate(calc(-50% + ${x}%), calc(-50% + ${y}%))`;
            }

            return (
              <button
                key={`${token.color}-${token.id}`}
                style={{ 
                  ...style, 
                  transform, 
                  top: `calc(${(style.gridRowStart! - 0.5) * (100 / GRID_SIZE)}%)`,
                  left: `calc(${(style.gridColumnStart! - 0.5) * (100 / GRID_SIZE)}%)`
                }}
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
