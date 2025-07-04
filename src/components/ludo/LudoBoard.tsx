
"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Player, Token, PlayerColor } from '@/lib/ludo/types';
import { 
    BOARD_GRID_SIZE, 
    MAIN_PATH_COORDINATES, 
    HOME_STRETCH_COORDINATES, 
    PLAYER_CONFIG, 
    SAFE_SQUARE_INDICES,
    HOME_STRETCH_LENGTH
} from '@/lib/ludo/engine';
import { Star } from 'lucide-react';

interface LudoBoardProps {
  players: Player[];
  onTokenClick: (playerIndex: number, tokenId: number) => void;
  currentPlayerIndex: number;
  diceValue: number | null;
  movableTokens: Token[];
  isRolling: boolean;
  gameView: string;
}

const getTokenForCell = (players: Player[], rowIndex: number, colIndex: number): Token[] => {
    const tokensOnThisCell: Token[] = [];
    if (!players || players.length === 0) return tokensOnThisCell;

    players.forEach(player => {
      const playerSpecificConfig = PLAYER_CONFIG[player.color];
      player.tokens.forEach(token => {
        if (token.position === -1) {
            const baseSpot = playerSpecificConfig.houseCoords[token.id];
            if (baseSpot && baseSpot.row === rowIndex && baseSpot.col === colIndex) {
                tokensOnThisCell.push(token);
            }
        } else if (token.position >= 0 && token.position < MAIN_PATH_COORDINATES.length) {
            const mainPathCell = MAIN_PATH_COORDINATES[token.position];
            if (mainPathCell && mainPathCell.row === rowIndex && mainPathCell.col === colIndex) {
                tokensOnThisCell.push(token);
            }
        } else if (token.position >= 100 && token.position < 200) {
            const homeStretchStep = token.position % 100;
            const homeStretchCell = HOME_STRETCH_COORDINATES[player.color][homeStretchStep];
            if (homeStretchCell && homeStretchCell.row === rowIndex && homeStretchCell.col === colIndex) {
                tokensOnThisCell.push(token);
            }
        }
      });
    });
    return tokensOnThisCell;
};

const getCellBackgroundColor = (rowIndex: number, colIndex: number): string => {
    const playerColors = Object.keys(PLAYER_CONFIG) as (keyof typeof PLAYER_CONFIG)[];
    
    for (const color of playerColors) {
        const config = PLAYER_CONFIG[color];
        if (config.houseCoords.some(c => c.row === rowIndex && c.col === colIndex)) {
            return `${config.baseClass}/30`;
        }
        if (HOME_STRETCH_COORDINATES[color].some(c => c.row === rowIndex && c.col === colIndex)) {
            return `${config.baseClass}/40`;
        }
    }
    
    if (rowIndex >= 6 && rowIndex <= 8 && colIndex >= 6 && colIndex <= 8) {
        if(rowIndex === 7 && colIndex === 7) return "bg-primary/30";
        if (HOME_STRETCH_COORDINATES.red[HOME_STRETCH_LENGTH-1].row === rowIndex && HOME_STRETCH_COORDINATES.red[HOME_STRETCH_LENGTH-1].col === colIndex) return PLAYER_CONFIG.red.baseClass + "/90";
        if (HOME_STRETCH_COORDINATES.green[HOME_STRETCH_LENGTH-1].row === rowIndex && HOME_STRETCH_COORDINATES.green[HOME_STRETCH_LENGTH-1].col === colIndex) return PLAYER_CONFIG.green.baseClass + "/90";
        if (HOME_STRETCH_COORDINATES.yellow[HOME_STRETCH_LENGTH-1].row === rowIndex && HOME_STRETCH_COORDINATES.yellow[HOME_STRETCH_LENGTH-1].col === colIndex) return PLAYER_CONFIG.yellow.baseClass + "/90";
        if (HOME_STRETCH_COORDINATES.blue[HOME_STRETCH_LENGTH-1].row === rowIndex && HOME_STRETCH_COORDINATES.blue[HOME_STRETCH_LENGTH-1].col === colIndex) return PLAYER_CONFIG.blue.baseClass + "/90";
        return "bg-primary/30";
    }

    if (MAIN_PATH_COORDINATES.some(p => p.row === rowIndex && p.col === colIndex)) {
      return "bg-slate-50";
    }
    
    return "bg-background";
};

export const LudoBoard: React.FC<LudoBoardProps> = ({ players, onTokenClick, currentPlayerIndex, movableTokens, isRolling, gameView }) => {
  const boardCells = Array(BOARD_GRID_SIZE * BOARD_GRID_SIZE).fill(null).map((_, i) => i);
  const currentPlayer = players[currentPlayerIndex];

  return (
    <div
      className="grid gap-px border-2 border-neutral-700 rounded overflow-hidden shadow-lg bg-neutral-300 w-full max-w-[300px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[540px] aspect-square"
      style={{ gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))` }}
      aria-label="Ludo board"
    >
      {boardCells.map((_, cellFlatIndex) => {
        const rowIndex = Math.floor(cellFlatIndex / BOARD_GRID_SIZE);
        const colIndex = cellFlatIndex % BOARD_GRID_SIZE;
        const tokensOnThisCell = getTokenForCell(players, rowIndex, colIndex);
        const cellBg = getCellBackgroundColor(rowIndex, colIndex);
        const pathIndex = MAIN_PATH_COORDINATES.findIndex(p => p.row === rowIndex && p.col === colIndex);
        const isSafe = SAFE_SQUARE_INDICES.includes(pathIndex);

        const startColor = (Object.keys(PLAYER_CONFIG) as PlayerColor[]).find(
          (color) => PLAYER_CONFIG[color].pathStartIndex === pathIndex
        );
        
        const isStart = !!(startColor && players.some(p => p.color === startColor));

        return (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={cn("aspect-square flex items-center justify-center text-xs relative", cellBg, "border border-neutral-400/30")}
          >
            {isSafe && !isStart && <Star size={12} className="absolute text-yellow-500/70 opacity-70 z-0"/>}
            {isStart && <Star size={16} className={cn("absolute z-0 opacity-80", PLAYER_CONFIG[startColor].textClass)}/>}

            {tokensOnThisCell.map((token, idx) => {
                 const playerOfToken = players.find(p => p.color === token.color);
                 const playerIndexOfToken = players.findIndex(p => p.color === token.color);
                 const isMovable = movableTokens.some(mt => mt.id === token.id && mt.color === token.color);
                 
                 return (
                 <button
                    key={token.color + token.id}
                    onClick={() => onTokenClick(playerIndexOfToken, token.id)}
                    disabled={
                        !currentPlayer || 
                        playerIndexOfToken !== currentPlayerIndex || 
                        isRolling || 
                        !isMovable ||
                        gameView !== 'playing' ||
                        (playerOfToken?.isAI)
                    }
                    className={cn(
                        "rounded-full flex items-center justify-center border-2 md:border-4 border-white/90 hover:ring-2 hover:ring-offset-1 absolute shadow-xl transition-transform duration-200",
                        isMovable && currentPlayerIndex === playerIndexOfToken && !playerOfToken?.isAI ? "cursor-pointer ring-4 ring-yellow-400 ring-offset-2 animate-gentle-bounce" : "cursor-default",
                        "z-10",
                        tokensOnThisCell.length > 1 ? 'w-[75%] h-[75%]' : 'w-[85%] h-[85%]',
                        'bg-transparent p-0'
                    )}
                     style={{
                        transform: tokensOnThisCell.length === 2 ? (idx === 0 ? 'translateX(-20%)' : 'translateX(20%)') :
                                   tokensOnThisCell.length === 3 ? (idx === 0 ? 'translateX(-20%) translateY(-15%)' : idx === 1 ? 'translateX(20%) translateY(-15%)' : 'translateY(15%)') :
                                   tokensOnThisCell.length === 4 ? (idx === 0 ? 'translate(-20%, -20%)' : idx === 1 ? 'translate(20%, -20%)' : idx === 2 ? 'translate(-20%, 20%)' : 'translate(20%, 20%)') : 'translate(0,0)',
                        zIndex: 10 + idx
                    }}
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
            )})}
          </div>
        );
      })}
    </div>
  );
};
