
"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Player, GameView } from '@/lib/ludo/types';
import { PLAYER_CONFIG } from '@/lib/ludo/engine';

interface PlayerInfoCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  diceValue: number | null;
  isRolling: boolean;
  onDiceRoll: () => void;
  gameView: GameView;
}

export const PlayerInfoCard: React.FC<PlayerInfoCardProps> = ({ player, isCurrentPlayer, diceValue, isRolling, onDiceRoll, gameView }) => {
  const playerSpecificConfig = PLAYER_CONFIG[player.color];
  
  const DICE_IMAGE_URLS: Record<number, string> = {
    1: '/images/ludo/dice-1.png',
    2: '/images/ludo/dice-2.png',
    3: '/images/ludo/dice-3.png',
    4: '/images/ludo/dice-4.png',
    5: '/images/ludo/dice-5.png',
    6: '/images/ludo/dice-6.png',
  };
  
  let diceImageUrlToShow = DICE_IMAGE_URLS[6];
  if (isCurrentPlayer && player) {
    if (diceValue) {
      diceImageUrlToShow = DICE_IMAGE_URLS[diceValue] || DICE_IMAGE_URLS[6];
    }
  }

  let isDiceButtonClickable = false;
  if (isCurrentPlayer && player) {
    if (!player.isAI && gameView === 'playing' && !isRolling && (diceValue === null || player.hasRolledSix)) {
      isDiceButtonClickable = true;
    }
  }

  const panelClasses = cn(
    "absolute flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 w-24 h-24 sm:w-28 sm:h-28",
    isCurrentPlayer ? "animate-pulse" : "",
    {
        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2': player.color === 'green',
        'top-1/2 right-1/2 -translate-y-1/2 translate-x-1/2': player.color === 'yellow',
        'bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2': player.color === 'red',
        'bottom-1/2 right-1/2 translate-y-1/2 translate-x-1/2': player.color === 'blue',
    }
  );
  
  const nameClasses = cn(
    "text-xs sm:text-sm font-semibold truncate mb-1 text-center text-white", 
    "drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
  );

  return (
    <div className="relative w-full h-full">
        <div className={panelClasses}>
            <p className={nameClasses} title={player.name}>
                {player.name} {player.isAI && <Cpu size={14} className="inline ml-1"/>}
            </p>
            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "border-2 border-dashed rounded-lg shadow-sm flex items-center justify-center p-0",
                    "h-8 w-8 sm:h-10 sm:w-10",
                    isDiceButtonClickable ? "cursor-pointer bg-white/30 hover:bg-white/50" : "border-muted-foreground/30 cursor-not-allowed opacity-70",
                )}
                onClick={() => {
                if (isDiceButtonClickable) onDiceRoll();
                }}
                disabled={!isDiceButtonClickable || gameView === 'gameOver'}
                aria-label={`Roll dice for ${player.name}`}
            >
                <Image
                    src={diceImageUrlToShow}
                    alt={`Dice showing ${diceValue || 'face'}`}
                    width={32}
                    height={32}
                    className={cn("w-5 h-5 sm:w-6 sm:h-6", isRolling ? "animate-spin" : "")}
                    data-ai-hint={`dice ${diceValue || 'six'}`}
                />
            </Button>
        </div>
    </div>
  );
};
